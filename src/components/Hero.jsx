import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowRight, CaretLeft, CaretRight, Pause, Play } from "@phosphor-icons/react";
import { formatDate, itemDate, localize, primaryLink } from "../content";
import { ExternalLink, ProjectImage, T } from "./Shared";

const REEL_AUTOPLAY_QUERY = "(min-width: 901px) and (min-height: 840px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";
const REEL_SCROLL_DURATION = 500;

function SignalReel({ hero, news, language }) {
  const content = hero.signalReel || {};
  const trackId = useId();
  const trackRef = useRef(null);
  const timerRef = useRef(0);
  const animationRef = useRef(0);
  const pauseReasonsRef = useRef(new Set());
  const restartAutoplayRef = useRef(() => {});
  const [userPaused, setUserPaused] = useState(false);
  const latest = useMemo(
    () => [...news]
      .sort((a, b) => itemDate(b).value.localeCompare(itemDate(a).value))
      .slice(0, 6),
    [news],
  );

  const cancelReelAnimation = () => {
    window.cancelAnimationFrame(animationRef.current);
    animationRef.current = 0;
    trackRef.current?.classList.remove("is-animating");
  };

  const setPaused = (reason, paused) => {
    if (paused) {
      pauseReasonsRef.current.add(reason);
      cancelReelAnimation();
    } else {
      const removed = pauseReasonsRef.current.delete(reason);
      if (removed && pauseReasonsRef.current.size === 0) restartAutoplayRef.current();
    }
  };

  const toggleAutoplay = () => {
    setUserPaused((current) => {
      const next = !current;
      setPaused("user", next);
      return next;
    });
  };

  const captureDrag = (event) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setPaused("drag", true);
  };

  const releaseDrag = (event) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setPaused("drag", false);
  };

  const scrollToCard = (index, animate = true) => {
    const track = trackRef.current;
    const cards = track ? [...track.querySelectorAll(".signal-card")] : [];
    const card = cards[index];
    if (!track || !card) return;

    cancelReelAnimation();
    const startLeft = track.scrollLeft;
    const maxLeft = Math.max(0, track.scrollWidth - track.clientWidth);
    const targetLeft = Math.min(maxLeft, Math.max(0, card.offsetLeft));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!animate || reducedMotion || Math.abs(targetLeft - startLeft) < 1) {
      track.scrollLeft = targetLeft;
      return;
    }

    const startedAt = window.performance.now();
    const distance = targetLeft - startLeft;
    track.classList.add("is-animating");
    const animateFrame = (now) => {
      const progress = Math.min(1, (now - startedAt) / REEL_SCROLL_DURATION);
      const eased = 1 - ((1 - progress) ** 3);
      track.scrollLeft = startLeft + (distance * eased);
      if (progress < 1) {
        animationRef.current = window.requestAnimationFrame(animateFrame);
      } else {
        track.scrollLeft = targetLeft;
        track.classList.remove("is-animating");
        animationRef.current = 0;
      }
    };
    animationRef.current = window.requestAnimationFrame(animateFrame);
  };

  const moveReel = (direction) => {
    const track = trackRef.current;
    const cards = track ? [...track.querySelectorAll(".signal-card")] : [];
    if (!track || cards.length === 0) return;

    const maxLeft = Math.max(0, track.scrollWidth - track.clientWidth);
    if (direction > 0 && track.scrollLeft >= maxLeft - 2) {
      scrollToCard(0);
      return;
    }
    if (direction < 0 && track.scrollLeft <= 2) {
      scrollToCard(cards.length - 1);
      return;
    }

    const currentIndex = cards.reduce((closest, card, index) => (
      Math.abs(card.offsetLeft - track.scrollLeft) < Math.abs(cards[closest].offsetLeft - track.scrollLeft)
        ? index
        : closest
    ), 0);
    const nextIndex = Math.max(0, Math.min(cards.length - 1, currentIndex + direction));
    scrollToCard(nextIndex);
  };

  useEffect(() => {
    const autoplayQuery = window.matchMedia(REEL_AUTOPLAY_QUERY);
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const clearTimer = () => window.clearTimeout(timerRef.current);
    const schedule = (delay) => {
      clearTimer();
      if (!autoplayQuery.matches || reducedMotionQuery.matches || document.hidden) return;
      timerRef.current = window.setTimeout(() => {
        if (
          autoplayQuery.matches
          && !reducedMotionQuery.matches
          && !document.hidden
          && pauseReasonsRef.current.size === 0
        ) {
          moveReel(1);
        }
        schedule(5000);
      }, delay);
    };
    const handleEligibilityChange = () => {
      if (!autoplayQuery.matches) {
        clearTimer();
        cancelReelAnimation();
      } else {
        schedule(2500);
      }
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseReasonsRef.current.add("visibility");
        clearTimer();
        cancelReelAnimation();
      } else {
        pauseReasonsRef.current.delete("visibility");
        schedule(2500);
      }
    };
    const handleReducedMotionChange = () => {
      if (reducedMotionQuery.matches) {
        pauseReasonsRef.current.add("reduced-motion");
        clearTimer();
        cancelReelAnimation();
      } else {
        pauseReasonsRef.current.delete("reduced-motion");
        schedule(2500);
      }
    };

    restartAutoplayRef.current = () => schedule(2500);
    if (document.hidden) pauseReasonsRef.current.add("visibility");
    if (reducedMotionQuery.matches) pauseReasonsRef.current.add("reduced-motion");

    autoplayQuery.addEventListener("change", handleEligibilityChange);
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    schedule(2500);

    return () => {
      clearTimer();
      cancelReelAnimation();
      restartAutoplayRef.current = () => {};
      autoplayQuery.removeEventListener("change", handleEligibilityChange);
      reducedMotionQuery.removeEventListener("change", handleReducedMotionChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [latest.length, language]);

  if (latest.length === 0) return null;

  return (
    <section
      className="signal-reel"
      aria-label={localize(content.label, language)}
      onMouseEnter={() => setPaused("hover", true)}
      onMouseLeave={() => setPaused("hover", false)}
      onFocusCapture={() => setPaused("focus", true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused("focus", false);
      }}
    >
      <div className="signal-reel__header">
        <div className="signal-reel__heading">
          <span><T value={content.label} language={language} /></span>
          <small><T value={content.hint} language={language} /></small>
        </div>
        <div className="signal-reel__controls">
          <button
            type="button"
            aria-controls={trackId}
            aria-label={localize(content.previousLabel, language)}
            onClick={() => moveReel(-1)}
          >
            <CaretLeft aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-controls={trackId}
            aria-label={localize(content.nextLabel, language)}
            onClick={() => moveReel(1)}
          >
            <CaretRight aria-hidden="true" />
          </button>
          <button
            type="button"
            className="signal-reel__autoplay"
            aria-pressed={userPaused}
            aria-label={localize(userPaused ? content.playLabel : content.pauseLabel, language)}
            onClick={toggleAutoplay}
          >
            {userPaused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
            <span><T value={userPaused ? content.playText : content.pauseText} language={language} /></span>
          </button>
        </div>
      </div>

      <div
        className="signal-reel__track"
        id={trackId}
        ref={trackRef}
        tabIndex="0"
        aria-label={localize(content.trackLabel, language)}
        onPointerDown={captureDrag}
        onPointerUp={releaseDrag}
        onPointerCancel={releaseDrag}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            moveReel(event.key === "ArrowRight" ? 1 : -1);
          }
        }}
      >
        {latest.map((item) => {
          const date = itemDate(item);
          return (
            <ExternalLink
              className="signal-card"
              href={primaryLink(item.links)}
              label={localize(item.title, language)}
              key={item.id}
            >
              <span data-signal-news-id={item.id} className="signal-card__content">
                <ProjectImage project={item} language={language} className="signal-card__media" />
                <span className="signal-card__body">
                  <span className="signal-card__meta">
                    <time dateTime={date.value}>{formatDate(date.value, date.precision, language)}</time>
                    <span><T value={item.category} language={language} /></span>
                  </span>
                  <strong><T value={item.title} language={language} /></strong>
                  <small><T value={item.summary} language={language} /></small>
                </span>
              </span>
            </ExternalLink>
          );
        })}
      </div>
    </section>
  );
}

function Worldline({ hero, pillars, projectCount, releaseCount, language }) {
  return (
    <div className="worldline" aria-label={localize(hero.researchSystemLabel, language)}>
      <svg className="worldline__map" viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden="true">
        <path className="worldline__base" d="M18 116 C188 116 192 46 360 46 S558 132 716 102 S930 24 1182 56" pathLength="1" />
        <path className="worldline__draw" d="M18 116 C188 116 192 46 360 46 S558 132 716 102 S930 24 1182 56" pathLength="1" />
        <path className="worldline__signal" d="M18 116 C188 116 192 46 360 46 S558 132 716 102 S930 24 1182 56" pathLength="1" />
      </svg>

      <div className="worldline__stages">
        {(pillars || []).slice(0, 3).map((pillar, index) => (
          <a className="worldline-stage" href="#research" key={pillar.id} data-step={index + 1}>
            <span className="worldline-stage__node" aria-hidden="true" />
            <span className="worldline-stage__number">{pillar.number}</span>
            <strong><T value={pillar.title} language={language} /></strong>
            <small><T value={pillar.description} language={language} /></small>
          </a>
        ))}
      </div>

      <div className="worldline__index">
        <span><strong>{String(projectCount).padStart(2, "0")}</strong> <T value={hero.projectsLabel} language={language} /></span>
        <span><strong>{String(releaseCount).padStart(2, "0")}</strong> <T value={hero.releasesLabel} language={language} /></span>
        <a href={hero.worldlineAction?.href || "#abot-stack"}>
          <T value={hero.worldlineAction?.label} language={language} /> <ArrowRight aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

export function Hero({ site, about, projects, news, language }) {
  const hero = site.hero || {};
  const heroRef = useRef(null);
  const frameRef = useRef(0);

  useEffect(() => () => window.cancelAnimationFrame(frameRef.current), []);

  const moveEarth = (event) => {
    if (!window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    const element = heroRef.current;
    if (!element) return;
    const bounds = element.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 12;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 12;

    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = window.requestAnimationFrame(() => {
      element.style.setProperty("--earth-x", `${x.toFixed(2)}px`);
      element.style.setProperty("--earth-y", `${y.toFixed(2)}px`);
    });
  };

  const resetEarth = () => {
    const element = heroRef.current;
    if (!element) return;
    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = window.requestAnimationFrame(() => {
      element.style.setProperty("--earth-x", "0px");
      element.style.setProperty("--earth-y", "0px");
    });
  };

  return (
    <section className="hero" id="top" ref={heroRef} onPointerMove={moveEarth} onPointerLeave={resetEarth}>
      <div className="hero__earth" aria-hidden="true">
        <span className="hero__orbit hero__orbit--one" />
        <span className="hero__orbit hero__orbit--two" />
      </div>

      <div className="hero__content page-shell">
        <div className="hero__intro">
          <div className="hero__brandline">
            <span><T value={hero.brandLabel || site.brand?.name} language={language} /></span>
          </div>
          <p className="eyebrow"><T value={hero.eyebrow} language={language} /></p>
          <h1>
            {(hero.titleLines || [hero.title]).map((line, index) => (
              <span className="hero__title-line" key={`${language}-${index}`}>
                <span><T value={line} language={language} /></span>
              </span>
            ))}
          </h1>
          <div className="hero__lede">
            <p><T value={hero.description} language={language} /></p>
            <div className="hero-actions">
              <a className="button button--primary" href={hero.primaryAction?.href}>
                <T value={hero.primaryAction?.label} language={language} /> <ArrowRight aria-hidden="true" />
              </a>
              <a className="button button--quiet" href={hero.secondaryAction?.href}>
                <T value={hero.secondaryAction?.label} language={language} /> <ArrowRight aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        <SignalReel hero={hero} news={news} language={language} />

        <Worldline
          hero={hero}
          pillars={about.pillars}
          projectCount={hero.worksCount ?? projects.length}
          releaseCount={news.length}
          language={language}
        />
      </div>
    </section>
  );
}
