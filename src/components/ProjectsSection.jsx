import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import {
  formatDate,
  itemDate,
  localize,
  normalizeLinks,
  primaryLink,
} from "../content";
import { ExternalLink, ProjectImage, SectionHeading, T } from "./Shared";

function ProjectMeta({ project, ui, language }) {
  const date = itemDate(project);
  const lab = (project.categoryIds || []).includes("abot") ? ui.abotLabel : ui.labLabel;

  return (
    <div className="project-meta">
      <span><T value={lab} language={language} /></span>
      {date.value && <time dateTime={date.value}>{formatDate(date.value, date.precision, language)}</time>}
    </div>
  );
}

function ProjectLinks({ project, language, limit = 3 }) {
  const links = normalizeLinks(project.links).slice(0, limit);
  return (
    <div className="project-links">
      {links.map((link) => (
        <ExternalLink href={link.url} key={`${project.id}-${link.type}-${link.url}`}>
          <T value={link.label} language={language} /> <ArrowUpRight aria-hidden="true" />
        </ExternalLink>
      ))}
    </div>
  );
}

function ReleaseLine({ project, language }) {
  const state = project.releaseStatus?.state || project.releaseStatus || "research-preview";
  const label = project.releaseStatus?.label;
  return (
    <span className={`release-line release-line--${state}`}>
      <span aria-hidden="true" /> <T value={label} language={language} />
    </span>
  );
}

function ProjectCard({ project, ui, language, variant = "standard" }) {
  return (
    <article className={`project-card project-card--${variant}`}>
      <ExternalLink
        href={primaryLink(project.links)}
        className="project-card__media"
        label={localize(project.name, language)}
      >
        <ProjectImage project={project} language={language} />
      </ExternalLink>
      <div className="project-card__body">
        <ProjectMeta project={project} ui={ui} language={language} />
        <ReleaseLine project={project} language={language} />
        <h3><T value={project.name} language={language} /></h3>
        <p><T value={project.summary || project.tagline} language={language} /></p>
        <ProjectLinks project={project} language={language} />
      </div>
    </article>
  );
}

export function ProjectsSection({ content, language }) {
  const ui = content.ui || {};
  const selected = [...(content.projects || [])]
    .filter((project) => project.featuredOnHome)
    .sort((a, b) => a.homeRank - b.homeRank);

  return (
    <section className="section section--projects" id="projects">
      <div className="page-shell">
        <SectionHeading
          section={content.section}
          title={content.title}
          description={content.description}
          language={language}
        />
        <div className="project-mosaic project-mosaic--selected">
          {selected.map((project) => (
            <ProjectCard project={project} ui={ui} language={language} variant="editorial" key={project.id} />
          ))}
        </div>
        <a className="projects-all-action button button--primary" href={content.section?.action?.href}>
          <T value={content.section?.action?.label} language={language} /> <ArrowRight aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
