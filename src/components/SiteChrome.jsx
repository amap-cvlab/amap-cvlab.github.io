import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  GithubLogo,
  List,
  X,
} from "@phosphor-icons/react";
import { localize } from "../content";
import { ExternalLink, T } from "./Shared";

const fallbackUi = {
  homeLabel: { en: "AMAP CV Lab home", zh: "高德视觉技术中心首页" },
  primaryNavigationLabel: { en: "Primary navigation", zh: "主导航" },
  githubLabel: { en: "AMAP CV Lab on GitHub", zh: "高德视觉技术中心 GitHub 主页" },
  githubShortLabel: { en: "GitHub", zh: "GitHub" },
  languageToggleLabel: { en: "Switch language", zh: "切换语言" },
  englishLabel: { en: "EN", zh: "EN" },
  chineseLabel: { en: "中文", zh: "中文" },
  openMenuLabel: { en: "Open navigation", zh: "打开导航" },
  closeMenuLabel: { en: "Close navigation", zh: "关闭导航" },
};

export function LoadingView() {
  return (
    <main className="state-view" aria-busy="true" aria-label="AMAP CV Lab">
      <img src="/assets/brand/amap-cvlab-logo.png" alt="" />
      <span className="loading-line" aria-hidden="true" />
    </main>
  );
}

export function ErrorView({ retry, language }) {
  const copy = language === "zh"
    ? { eyebrow: "AMAP CV LAB", title: "内容暂时无法加载。", retry: "重新加载" }
    : { eyebrow: "AMAP CV LAB", title: "Content is temporarily unavailable.", retry: "Try again" };

  return (
    <main className="state-view state-view--error" aria-live="polite">
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1>{copy.title}</h1>
      <button type="button" className="button button--primary" onClick={retry}>
        {copy.retry} <ArrowRight aria-hidden="true" />
      </button>
    </main>
  );
}

export function Header({ site, language, setLanguage, isWorksPage = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuButtonRef = useRef(null);
  const navigationRef = useRef(null);
  const navigation = site.navigation ?? [];
  const brand = site.brand || {};
  const ui = site.ui || {};
  const homeHref = isWorksPage ? `/?lang=${language}` : "#top";
  const resolveNavigationHref = (href) => {
    if (typeof href !== "string") return href;
    if (href === "/works/") return `/works/?lang=${language}`;
    if (isWorksPage && href.startsWith("#")) return `/?lang=${language}${href}`;
    return href;
  };

  useEffect(() => {
    const closeOnResize = () => setMenuOpen(false);
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen((current) => {
          if (current) window.requestAnimationFrame(() => menuButtonRef.current?.focus());
          return false;
        });
      }
    };

    window.addEventListener("resize", closeOnResize);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("resize", closeOnResize);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const frame = window.requestAnimationFrame(() => {
      navigationRef.current?.querySelector("a[href]")?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [menuOpen]);

  const chooseLanguage = () => {
    setLanguage((current) => (current === "en" ? "zh" : "en"));
    setMenuOpen(false);
  };

  return (
    <header className="site-header">
      <a className="brand" href={homeHref} aria-label={localize(ui.homeLabel || fallbackUi.homeLabel, language)}>
        <img src={brand.logo || "/assets/brand/amap-cvlab-logo.png"} alt="" />
        <span><T value={brand.shortName || brand.name} language={language} /></span>
      </a>

      <nav
        ref={navigationRef}
        id={menuId}
        className={menuOpen ? "main-nav is-open" : "main-nav"}
        aria-label={localize(ui.primaryNavigationLabel || fallbackUi.primaryNavigationLabel, language)}
        aria-hidden={!menuOpen ? undefined : false}
      >
        {navigation.map((item) => (
          <a key={item.id} href={resolveNavigationHref(item.href)} onClick={() => setMenuOpen(false)}>
            <T value={item.label} language={language} />
          </a>
        ))}
      </nav>

      <div className="header-actions">
        <ExternalLink
          href={brand.organizationUrl}
          className="github-link"
          label={localize(ui.githubLabel || fallbackUi.githubLabel, language)}
        >
          <GithubLogo weight="fill" aria-hidden="true" />
          <span><T value={ui.githubShortLabel || fallbackUi.githubShortLabel} language={language} /></span>
          <ArrowUpRight aria-hidden="true" />
        </ExternalLink>
        <button
          type="button"
          className="language-toggle"
          onClick={chooseLanguage}
          aria-label={localize(ui.languageToggleLabel || fallbackUi.languageToggleLabel, language)}
        >
          <span className={language === "en" ? "is-active" : ""}><T value={ui.englishLabel || fallbackUi.englishLabel} language={language} /></span>
          <span aria-hidden="true">/</span>
          <span className={language === "zh" ? "is-active" : ""}><T value={ui.chineseLabel || fallbackUi.chineseLabel} language={language} /></span>
        </button>
        <button
          ref={menuButtonRef}
          type="button"
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={localize(
            menuOpen
              ? (ui.closeMenuLabel || fallbackUi.closeMenuLabel)
              : (ui.openMenuLabel || fallbackUi.openMenuLabel),
            language,
          )}
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <List aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}

export function Footer({ site, language }) {
  const brand = site.brand || {};

  return (
    <footer className="site-footer">
      <div className="page-shell footer-layout">
        <div className="brand brand--footer">
          <img src={brand.logo || "/assets/brand/amap-cvlab-logo.png"} alt="" />
          <span><T value={brand.shortName || brand.name} language={language} /></span>
        </div>
        <p><T value={site.footer?.statement} language={language} /></p>
        <div className="footer-meta">
          <span><T value={site.footer?.copyright} language={language} /></span>
          <div className="footer-links">
            {(site.footer?.links || []).map((link) => (
              <ExternalLink href={link.url} key={link.id}>
                <T value={link.label} language={language} /> <ArrowUpRight aria-hidden="true" />
              </ExternalLink>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
