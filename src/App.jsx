import { useEffect, useState } from "react";
import { getInitialLanguage, localize, persistLanguage } from "./content";
import { useContent } from "./hooks/useContent";
import { ABotStackSection } from "./components/ABotStackSection";
import { AboutSection } from "./components/AboutSection";
import { Hero } from "./components/Hero";
import { NewsSection } from "./components/NewsSection";
import { ProjectsSection } from "./components/ProjectsSection";
import { ResearchSection } from "./components/ResearchSection";
import { ErrorView, Footer, Header, LoadingView } from "./components/SiteChrome";

export function App() {
  const { status, data, retry } = useContent();
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    persistLanguage(language);
  }, [language]);

  if (status === "loading") return <LoadingView />;
  if (status === "error" || !data) return <ErrorView retry={retry} language={language} />;

  const projects = data.projects.projects || [];
  const news = data.news.news || [];

  return (
    <div className="site-canvas">
      <a className="skip-link" href="#main-content">
        {localize(
          data.site.ui?.skipToContentLabel || {
            en: "Skip to main content",
            zh: "跳转到主要内容",
          },
          language,
        )}
      </a>
      <Header site={data.site} language={language} setLanguage={setLanguage} />
      <main id="main-content" tabIndex="-1">
        <Hero
          site={data.site}
          about={data.about}
          projects={projects}
          news={news}
          language={language}
        />
        <ABotStackSection
          stack={data.stack}
          projects={projects}
          language={language}
        />
        <ResearchSection
          research={data.research}
          about={data.about}
          stack={data.stack}
          language={language}
        />
        <ProjectsSection content={data.projects} language={language} />
        <NewsSection content={data.news} language={language} />
        <AboutSection about={data.about} site={data.site} language={language} />
      </main>
      <Footer site={data.site} language={language} />
    </div>
  );
}
