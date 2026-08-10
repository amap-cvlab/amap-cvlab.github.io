import {
  BookOpen,
  CirclesThreePlus,
  Cpu,
  CubeFocus,
  Database,
  GlobeHemisphereWest,
  MapTrifold,
  PersonArmsSpread,
  Robot,
  Stack,
  ArrowRight,
} from "@phosphor-icons/react";
import { localize } from "../content";
import { SectionHeading, T } from "./Shared";

const iconMap = {
  earth: GlobeHemisphereWest,
  globe: GlobeHemisphereWest,
  map: MapTrifold,
  data: Database,
  database: Database,
  stack: Stack,
  model: Cpu,
  compute: Cpu,
  robot: Robot,
  agent: Robot,
  "map-trifold": MapTrifold,
  "globe-hemisphere-west": GlobeHemisphereWest,
  "person-arms-spread": PersonArmsSpread,
  "cube-focus": CubeFocus,
  "circles-three-plus": CirclesThreePlus,
};

// Presentation-only spans; content order remains owned by research-areas.json.
const topicSpanById = {
  "research-general-deep-learning": "three",
  "research-3d-generation-reconstruction": "two",
};

function ResearchAxes({ pillars, layersById, language }) {
  return (
    <div className="research-axes">
      {pillars.slice(0, 3).map((pillar) => (
        <div className="research-axis" key={pillar.id}>
          <span>{pillar.number}</span>
          <h3><T value={pillar.title} language={language} /></h3>
          <p><T value={pillar.description} language={language} /></p>
          <small><T value={layersById.get(pillar.stageId)?.title} language={language} /></small>
        </div>
      ))}
    </div>
  );
}

function ResearchTopic({ area, pillars, language }) {
  const Icon = iconMap[area.icon] || BookOpen;
  const span = topicSpanById[area.id] || "one";
  const activeStages = new Set(area.stageIds || []);
  const stageSummary = pillars
    .filter((pillar) => activeStages.has(pillar.stageId))
    .map((pillar) => localize(pillar.title, language))
    .join(" · ");

  return (
    <article
      className={`research-topic research-topic--span-${span}`}
      data-research-id={area.id}
      style={{ "--topic-order": area.order }}
    >
      <Icon aria-hidden="true" />
      <div className="research-topic__copy">
        <h4>
          <a href={`${area.worksHref}&lang=${language}`}>
            <T value={area.title} language={language} /> <ArrowRight aria-hidden="true" />
          </a>
        </h4>
        <p><T value={area.description} language={language} /></p>
      </div>
      <div className="research-topic__rail" aria-label={stageSummary}>
        {pillars.slice(0, 3).map((pillar) => (
          <span
            className={activeStages.has(pillar.stageId) ? "is-active" : ""}
            key={`${area.id}-${pillar.stageId}`}
          >
            <i aria-hidden="true" />
            <T value={pillar.title} language={language} />
          </span>
        ))}
      </div>
    </article>
  );
}

export function ResearchSection({ research, about, stack, language }) {
  const areas = research.areas || [];
  const pillars = about.pillars || [];
  const layersById = new Map((stack.layers || []).map((layer) => [layer.id, layer]));
  const orderedAreas = [...areas].sort((a, b) => a.order - b.order);

  return (
    <section className="section section--research" id="research">
      <div className="page-shell">
        <SectionHeading
          section={research.section}
          title={research.title}
          description={research.description}
          language={language}
        />
        <div className="research-topology">
          <ResearchAxes pillars={pillars} layersById={layersById} language={language} />
          <div className="research-topic-grid">
            {orderedAreas.map((area) => (
              <ResearchTopic area={area} pillars={pillars} language={language} key={area.id} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
