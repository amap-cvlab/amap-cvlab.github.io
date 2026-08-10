import { ArrowUpRight } from "@phosphor-icons/react";
import { localize } from "../content";

export function T({ value, language }) {
  return localize(value, language);
}

export function ExternalLink({ href, className, children, label }) {
  if (!href || typeof href !== "string") return null;
  const isExternal = href.startsWith("http");

  return (
    <a
      className={className}
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      aria-label={label}
    >
      {children}
    </a>
  );
}

export function ProjectImage({ project, language = "en", className = "", loading = "lazy" }) {
  const src = project?.media?.cover || project?.media?.poster || project?.media?.image;

  if (!src) {
    return (
      <span className={`project-image-fallback ${className}`} aria-hidden="true">
        <img src="/assets/brand/amap-cvlab-logo.png" alt="" />
      </span>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={localize(project.media.alt || project.name, language)}
      loading={loading}
      decoding="async"
    />
  );
}

export function SectionHeading({ section, title, description, language, action }) {
  return (
    <div className="section-heading">
      <div className="section-heading__meta">
        <span className="section-index">{section?.index}</span>
        <p className="eyebrow"><T value={section?.eyebrow} language={language} /></p>
      </div>
      <div className="section-heading__copy">
        <h2><T value={title} language={language} /></h2>
        {description && <p><T value={description} language={language} /></p>}
      </div>
      {action}
    </div>
  );
}

export function LinkArrow() {
  return <ArrowUpRight aria-hidden="true" />;
}
