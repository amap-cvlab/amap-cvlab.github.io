import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  MagnifyingGlass,
  SlidersHorizontal,
} from "@phosphor-icons/react";
import { getInitialLanguage, localize, persistLanguage } from "../content";
import { useWorksContent } from "../hooks/useContent";
import { ErrorView, Footer, Header, LoadingView } from "../components/SiteChrome";
import { T } from "../components/Shared";
import { filterWorks, groupWorks, mergeWorks } from "./worksModel";

function initialFilters() {
  const params = new URLSearchParams(window.location.search);
  const type = ["all", "project", "publication"].includes(params.get("type"))
    ? params.get("type")
    : "all";
  return {
    query: params.get("q") || "",
    type,
    area: params.get("area") || "all",
    year: params.get("year") || "all",
    series: params.get("series") || "",
  };
}

function WorksHero({ copy, stats, language }) {
  return (
    <section className="works-hero" aria-labelledby="works-title">
      <div className="page-shell works-hero__layout">
        <div className="works-hero__copy">
          <p className="eyebrow"><T value={copy.eyebrow} language={language} /></p>
          <h1 id="works-title"><T value={copy.title} language={language} /></h1>
          <p><T value={copy.description} language={language} /></p>
        </div>
        <dl className="works-stats">
          {stats.map((item) => (
            <div key={item.id}>
              <dt>{item.value}</dt>
              <dd><T value={item.label} language={language} /></dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function TypeFilters({ copy, value, setValue, language }) {
  return (
    <fieldset className="works-type-filter">
      <legend><T value={copy.typeLabel} language={language} /></legend>
      <div>
        {copy.typeOptions.map((option) => (
          <button
            type="button"
            className={value === option.value ? "is-active" : ""}
            aria-pressed={value === option.value}
            onClick={() => setValue(option.value)}
            key={option.id}
          >
            <T value={option.label} language={language} />
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function WorksToolbar({
  copy,
  filters,
  setFilter,
  areas,
  years,
  language,
  expanded,
  setExpanded,
  reset,
}) {
  return (
    <div className="works-toolbar" aria-label={localize(copy.regionLabel, language)}>
      <div className="page-shell works-toolbar__inner">
        <label className="works-search">
          <span className="visually-hidden"><T value={copy.searchLabel} language={language} /></span>
          <MagnifyingGlass aria-hidden="true" />
          <input
            type="search"
            value={filters.query}
            placeholder={localize(copy.searchPlaceholder, language)}
            onChange={(event) => setFilter("query", event.target.value)}
          />
        </label>
        <button
          type="button"
          className="works-filter-toggle"
          aria-expanded={expanded}
          aria-label={localize(expanded ? copy.closeLabel : copy.openLabel, language)}
          onClick={() => setExpanded((value) => !value)}
        >
          <SlidersHorizontal aria-hidden="true" />
          <span><T value={expanded ? copy.closeLabel : copy.openLabel} language={language} /></span>
        </button>
        <div className={`works-toolbar__filters${expanded ? " is-open" : ""}`}>
          <TypeFilters
            copy={copy}
            value={filters.type}
            setValue={(value) => setFilter("type", value)}
            language={language}
          />
          <label className="works-select">
            <span><T value={copy.areaLabel} language={language} /></span>
            <select value={filters.area} onChange={(event) => setFilter("area", event.target.value)}>
              <option value="all">{localize(copy.areaAll, language)}</option>
              {areas.map((area) => (
                <option value={area.id} key={area.id}>{localize(area.title, language)}</option>
              ))}
            </select>
          </label>
          <label className="works-select works-select--year">
            <span><T value={copy.yearLabel} language={language} /></span>
            <select value={filters.year} onChange={(event) => setFilter("year", event.target.value)}>
              <option value="all">{localize(copy.yearAll, language)}</option>
              {years.map((year) => <option value={year} key={year}>{year}</option>)}
            </select>
          </label>
          <button type="button" className="works-reset" onClick={reset}>
            <T value={copy.resetLabel} language={language} />
          </button>
          <p className="works-type-help"><T value={copy.typeHelp} language={language} /></p>
        </div>
      </div>
    </div>
  );
}

function AreaChips({ areas, filters, setFilter, allLabel, language }) {
  return (
    <div className="works-area-chips" aria-label={localize(allLabel, language)}>
      <button
        type="button"
        className={filters.area === "all" ? "is-active" : ""}
        aria-pressed={filters.area === "all"}
        onClick={() => setFilter("area", "all")}
      >
        <T value={allLabel} language={language} />
      </button>
      {areas.map((area) => (
        <button
          type="button"
          className={filters.area === area.id ? "is-active" : ""}
          aria-pressed={filters.area === area.id}
          onClick={() => setFilter("area", area.id)}
          key={area.id}
        >
          <T value={area.title} language={language} />
        </button>
      ))}
    </div>
  );
}

function WorkMedia({ work, language }) {
  const source = work.media?.cover || work.media?.image || work.media?.poster;
  if (source) {
    return (
      <img
        src={source}
        alt={localize(work.media.alt || work.title, language)}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <span className="work-row__tile" aria-hidden="true">
      <strong>{localize(work.venue, language) || work.series[0]}</strong>
      <span>{work.year}</span>
    </span>
  );
}

function WorkActions({ work, copy, language }) {
  const direct = work.links.slice(0, 3);
  const more = work.links.slice(3);
  return (
    <div className="work-row__actions">
      {direct.map((item) => (
        <a href={item.url} target="_blank" rel="noopener noreferrer" key={item.url}>
          <T value={item.label} language={language} /> <ArrowUpRight aria-hidden="true" />
        </a>
      ))}
      {more.length > 0 && (
        <details>
          <summary><T value={copy.moreLabel} language={language} /></summary>
          <div>
            {more.map((item) => (
              <a href={item.url} target="_blank" rel="noopener noreferrer" key={item.url}>
                <T value={item.label} language={language} /> <ArrowUpRight aria-hidden="true" />
              </a>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function WorkRow({ work, areasById, copy, language }) {
  const primaryArea = areasById.get(work.primaryResearchAreaId);
  const secondaryAreas = work.researchAreaIds
    .filter((id) => id !== work.primaryResearchAreaId)
    .map((id) => areasById.get(id))
    .filter(Boolean);
  return (
    <article className="work-row" data-work-id={work.id}>
      <div className="work-row__media"><WorkMedia work={work} language={language} /></div>
      <div className="work-row__content">
        <div className="work-row__meta">
          <span>{work.year}</span>
          {work.venue && <span><T value={work.venue} language={language} /></span>}
          <span><T value={primaryArea?.title} language={language} /></span>
        </div>
        <div className="work-row__badges">
          {work.hasProject && <span><T value={copy.projectBadge} language={language} /></span>}
          {work.hasPublication && <span><T value={copy.publicationBadge} language={language} /></span>}
        </div>
        <h3><T value={work.title} language={language} /></h3>
        {work.publicationTitle && (
          <p className="work-row__publication-title"><T value={work.publicationTitle} language={language} /></p>
        )}
        <p className="work-row__summary"><T value={work.summary} language={language} /></p>
        {secondaryAreas.length > 0 && (
          <p className="work-row__secondary">
            <T value={copy.secondaryAreaLabel} language={language} />: {secondaryAreas.map((area) => localize(area.title, language)).join(" · ")}
          </p>
        )}
      </div>
      <WorkActions work={work} copy={copy} language={language} />
    </article>
  );
}

function WorksGroup({ group, area, areasById, copy, language }) {
  return (
    <section className="works-group" aria-labelledby={`works-area-${area.id}`} data-area-id={area.id}>
      <div className="works-group__intro">
        <div>
          <h2 id={`works-area-${area.id}`}><T value={area.title} language={language} /></h2>
          <p><T value={area.description} language={language} /></p>
          <span>{group.items.length} <T value={copy.groupCountLabel} language={language} /></span>
        </div>
      </div>
      <div className="works-group__rows">
        {group.items.map((work) => (
          <WorkRow work={work} areasById={areasById} copy={copy} language={language} key={work.id} />
        ))}
      </div>
    </section>
  );
}

export function WorksApp() {
  const { status, data, retry } = useWorksContent();
  const [language, setLanguage] = useState(getInitialLanguage);
  const [filters, setFilters] = useState(initialFilters);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  useEffect(() => persistLanguage(language), [language]);

  useEffect(() => {
    if (!data) return;
    document.title = localize(data.works.page.documentTitle, language);
  }, [data, language]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const values = { q: filters.query, type: filters.type, area: filters.area, year: filters.year, series: filters.series };
    for (const [key, value] of Object.entries(values)) {
      if (!value || value === "all") url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    }
    window.history.replaceState({}, "", url);
  }, [filters]);

  if (status === "loading") return <LoadingView />;
  if (status === "error" || !data) return <ErrorView retry={retry} language={language} />;

  const areas = [...data.research.areas].sort((a, b) => a.order - b.order);
  const areasById = new Map(areas.map((area) => [area.id, area]));
  const merged = mergeWorks(data.projects.projects, data.publications.publications);
  const years = [...new Set(merged.flatMap((work) => work.years))].sort((a, b) => b - a);
  const filtered = filterWorks(merged, filters, language);
  const groups = groupWorks(filtered, areas);
  const stats = [
    { id: "works", value: merged.length, label: data.works.page.stats.works },
    { id: "areas", value: areas.length, label: data.works.page.stats.areas },
    { id: "projects", value: merged.filter((work) => work.hasProject).length, label: data.works.page.stats.projects },
    { id: "publications", value: merged.filter((work) => work.hasPublication).length, label: data.works.page.stats.publications },
  ];
  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const reset = () => {
    setFilters({ query: "", type: "all", area: "all", year: "all", series: "" });
    setFiltersExpanded(false);
  };

  return (
    <div className="site-canvas works-page">
      <a className="skip-link" href="#works-main"><T value={data.works.page.skipLabel} language={language} /></a>
      <Header site={data.site} language={language} setLanguage={setLanguage} isWorksPage />
      <main id="works-main" tabIndex="-1">
        <WorksHero copy={data.works.page} stats={stats} language={language} />
        <WorksToolbar
          copy={data.works.filters}
          filters={filters}
          setFilter={setFilter}
          areas={areas}
          years={years}
          language={language}
          expanded={filtersExpanded}
          setExpanded={setFiltersExpanded}
          reset={reset}
        />
        <div className="page-shell works-results">
          <AreaChips
            areas={areas}
            filters={filters}
            setFilter={setFilter}
            allLabel={data.works.filters.areaAll}
            language={language}
          />
          <div className="works-results__summary" aria-live="polite">
            <strong>{filtered.length}</strong> <T value={data.works.filters.resultsLabel} language={language} />
            {filters.series && <span className="works-results__series">{filters.series}</span>}
            <button type="button" onClick={reset}><T value={data.works.filters.resetLabel} language={language} /></button>
          </div>
          {groups.length > 0 ? groups.map((group) => (
            <WorksGroup
              group={group}
              area={areasById.get(group.areaId)}
              areasById={areasById}
              copy={data.works.list}
              language={language}
              key={group.areaId}
            />
          )) : (
            <div className="works-empty">
              <h2><T value={data.works.list.emptyTitle} language={language} /></h2>
              <p><T value={data.works.list.emptyDescription} language={language} /></p>
              <button type="button" className="button button--primary" onClick={reset}>
                <T value={data.works.filters.resetLabel} language={language} />
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer site={data.site} language={language} />
    </div>
  );
}
