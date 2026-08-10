import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import { formatDate, itemDate, localize, primaryLink } from "../content";
import { ExternalLink, ProjectImage, SectionHeading, T } from "./Shared";

function NewsMeta({ item, language }) {
  const date = itemDate(item);
  return (
    <div className="news-meta">
      <time dateTime={date.value}>{formatDate(date.value, date.precision, language)}</time>
      <span><T value={item.categoryLabel || item.category} language={language} /></span>
    </div>
  );
}

function NewsFeature({ item, language, readLabel, variant }) {
  return (
    <article className={`news-feature news-feature--${variant}`} data-news-id={item.id}>
      <ExternalLink
        href={primaryLink(item.links)}
        className="news-feature__media"
        label={localize(item.title, language)}
      >
        <ProjectImage project={item} language={language} />
      </ExternalLink>
      <div className="news-feature__body">
        <NewsMeta item={item} language={language} />
        <h3><T value={item.title} language={language} /></h3>
        <p><T value={item.summary} language={language} /></p>
        <ExternalLink href={primaryLink(item.links)} className="news-feature__link">
          <T value={readLabel} language={language} /> <ArrowUpRight aria-hidden="true" />
        </ExternalLink>
      </div>
    </article>
  );
}

function NewsArchiveRow({ item, index, language }) {
  return (
    <article className="news-row" data-news-id={item.id}>
      <span className="news-row__number">{String(index + 1).padStart(2, "0")}</span>
      <NewsMeta item={item} language={language} />
      <div className="news-row__copy">
        <h3><T value={item.title} language={language} /></h3>
        <p><T value={item.summary} language={language} /></p>
      </div>
      <ExternalLink
        href={primaryLink(item.links)}
        className="news-row__link"
        label={localize(item.title, language)}
      >
        <ArrowRight aria-hidden="true" />
      </ExternalLink>
    </article>
  );
}

export function NewsSection({ content, language }) {
  const ordered = [...(content.news || [])].sort(
    (a, b) => itemDate(b).value.localeCompare(itemDate(a).value),
  );
  const highlights = ordered.slice(0, 3);
  const [lead, ...secondary] = highlights;
  const archive = ordered.slice(3);

  return (
    <section className="section section--news" id="releases">
      <div className="page-shell">
        <SectionHeading
          section={content.section}
          title={content.title}
          description={content.description}
          language={language}
        />

        {lead && (
          <div className="news-feature-layout">
            <NewsFeature
              item={lead}
              language={language}
              readLabel={content.section?.readLabel}
              variant="lead"
            />
            <div className="news-feature-layout__secondary">
              {secondary.map((item) => (
                <NewsFeature
                  item={item}
                  language={language}
                  readLabel={content.section?.readLabel}
                  variant="secondary"
                  key={item.id}
                />
              ))}
            </div>
          </div>
        )}

        <div className="news-archive-heading">
          <div>
            <span className="section-index"><T value={content.section?.archiveLabel} language={language} /></span>
            <h3><T value={content.section?.archiveTitle} language={language} /></h3>
          </div>
          <p><T value={content.section?.archiveDescription} language={language} /></p>
          <span className="news-archive-heading__count">
            {String(ordered.length).padStart(2, "0")} <T value={content.section?.entriesLabel} language={language} />
          </span>
        </div>
        <div className="news-timeline">
          {archive.map((item, index) => (
            <NewsArchiveRow item={item} index={index + 3} language={language} key={item.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
