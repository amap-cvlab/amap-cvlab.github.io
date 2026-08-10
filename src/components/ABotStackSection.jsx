import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import { localize, primaryLink } from "../content";
import { ExternalLink, ProjectImage, T } from "./Shared";

function mergeStackItem(entry, projectsById) {
  if (typeof entry === "string") return projectsById.get(entry);
  const reference = entry.projectRef || entry.projectId;
  const project = reference ? projectsById.get(reference) : null;
  if (!project) return entry;

  return {
    ...project,
    ...entry,
    media: entry.media || project.media,
    links: entry.links || project.links,
  };
}

function StackProject({ project, language }) {
  if (!project) return null;

  return (
    <ExternalLink
      href={primaryLink(project.links)}
      className="stack-project"
      label={localize(project.name, language)}
    >
      <ProjectImage project={project} language={language} className="stack-project__image" />
      <span className="stack-project__body">
        <strong><T value={project.shortName || project.name} language={language} /></strong>
        <span><T value={project.tagline || project.summary} language={language} /></span>
      </span>
      <span className="stack-project__arrow"><ArrowUpRight aria-hidden="true" /></span>
    </ExternalLink>
  );
}

function StackBand({ layer, projectsById, language }) {
  const items = (layer.items || layer.projectIds || layer.projects || [])
    .map((entry) => mergeStackItem(entry, projectsById))
    .filter(Boolean);

  return (
    <article className="stack-band">
      <div className="stack-band__intro">
        <span className="stack-band__number">{layer.number || String(layer.order).padStart(2, "0")}</span>
        <h3><T value={layer.title} language={language} /></h3>
        <p><T value={layer.description} language={language} /></p>
      </div>
      <div className="stack-band__projects">
        {items.map((project) => (
          <StackProject project={project} language={language} key={project.id || project.projectId} />
        ))}
      </div>
    </article>
  );
}

export function ABotStackSection({ stack, projects, language }) {
  const projectsById = new Map(projects.map((item) => [item.id, item]));
  const layers = [...(stack.layers || [])].sort(
    (a, b) => Number(a.number || a.order) - Number(b.number || b.order),
  );

  return (
    <section className="section section--stack" id="abot-stack" tabIndex="-1">
      <div className="page-shell">
        <div className="stack-heading">
          <div className="stack-heading__meta">
            <span className="section-index">{stack.section?.index}</span>
            <p className="eyebrow"><T value={stack.section?.eyebrow} language={language} /></p>
          </div>
          <h2><T value={stack.title} language={language} /></h2>
          <div className="stack-heading__body">
            <p><T value={stack.description} language={language} /></p>
            <a className="section-heading__action" href={stack.section?.action?.href || "#projects"}>
              <T value={stack.section?.action?.label} language={language} /> <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className="stack-bands">
          {layers.map((layer) => (
            <StackBand layer={layer} projectsById={projectsById} language={language} key={layer.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
