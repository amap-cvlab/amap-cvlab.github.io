import { ArrowUpRight, GithubLogo } from "@phosphor-icons/react";
import { ExternalLink, T } from "./Shared";

export function AboutSection({ about, site, language }) {
  return (
    <section className="section section--about" id="about">
      <div className="page-shell about-layout">
        <div className="about-heading">
          <span className="section-index">{about.section?.index}</span>
          <p className="eyebrow"><T value={about.section?.eyebrow || about.intro?.eyebrow} language={language} /></p>
          <h2><T value={about.intro?.title} language={language} /></h2>
        </div>
        <div className="about-copy">
          <p className="about-copy__lead"><T value={about.intro?.lead} language={language} /></p>
          <div className="about-copy__body">
            {(about.intro?.body || []).map((paragraph, index) => (
              <p key={index}><T value={paragraph} language={language} /></p>
            ))}
          </div>
          <ExternalLink href={site.brand?.organizationUrl} className="button button--light">
            <GithubLogo weight="fill" aria-hidden="true" />
            <T value={about.section?.action?.label} language={language} />
            <ArrowUpRight aria-hidden="true" />
          </ExternalLink>
        </div>
      </div>
    </section>
  );
}
