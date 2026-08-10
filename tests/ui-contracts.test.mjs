import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (file) => JSON.parse(await readFile(path.join(root, "public", "data", file), "utf8"));
const occurrences = (source, pattern) => [...source.matchAll(pattern)].map((match) => match[1]);

let vite;
let ResearchSection;
let NewsSection;
let Hero;
let ProjectsSection;
let mergeWorks;
let filterWorks;
let groupWorks;
let content;

before(async () => {
  [content, vite] = await Promise.all([
    Promise.all([
      readJson("about.json"),
      readJson("research-areas.json"),
      readJson("abot-stack.json"),
      readJson("news.json"),
      readJson("projects.json"),
      readJson("site.json"),
      readJson("publications.json"),
      readJson("works.json"),
    ]),
    createServer({
      root,
      appType: "custom",
      logLevel: "silent",
      server: { middlewareMode: true },
    }),
  ]);

  ({ ResearchSection } = await vite.ssrLoadModule("/src/components/ResearchSection.jsx"));
  ({ NewsSection } = await vite.ssrLoadModule("/src/components/NewsSection.jsx"));
  ({ Hero } = await vite.ssrLoadModule("/src/components/Hero.jsx"));
  ({ ProjectsSection } = await vite.ssrLoadModule("/src/components/ProjectsSection.jsx"));
  ({ mergeWorks, filterWorks, groupWorks } = await vite.ssrLoadModule("/src/works/worksModel.js"));
});

after(async () => {
  await vite?.close();
});

test("research topology follows the unique JSON order and renders every area once", async () => {
  const [about, research, stack] = content;
  const html = renderToStaticMarkup(
    React.createElement(ResearchSection, { research, about, stack, language: "en" }),
  );
  const renderedIds = occurrences(html, /data-research-id="([^"]+)"/g);
  const expectedAreas = [...research.areas].sort((a, b) => a.order - b.order);
  const expectedIds = expectedAreas.map((area) => area.id);
  const orders = research.areas.map((area) => area.order);
  const renderedOrders = occurrences(html, /style="--topic-order:([0-9]+)"/g).map(Number);
  const source = await readFile(path.join(root, "src", "components", "ResearchSection.jsx"), "utf8");

  assert.equal(renderedIds.length, 6);
  assert.equal(new Set(renderedIds).size, 6);
  assert.equal(new Set(orders).size, research.areas.length);
  assert.deepEqual([...orders].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(renderedIds, expectedIds);
  assert.deepEqual(renderedOrders, expectedAreas.map((area) => area.order));
  assert.match(source, /style=\{\{ "--topic-order": area\.order \}\}/);
  assert.match(source, /sort\(\(a, b\) => a\.order - b\.order\)/);
  assert.doesNotMatch(source, /topicLayout|topicSpanById\[[^\]]+\].*order/);
});

test("news renders three highlights plus the complete unique archive", () => {
  const news = content[3];
  const html = renderToStaticMarkup(React.createElement(NewsSection, { content: news, language: "en" }));
  const renderedIds = occurrences(html, /data-news-id="([^"]+)"/g);

  assert.equal((html.match(/class="news-feature news-feature--/g) || []).length, 3);
  assert.equal((html.match(/class="news-row"/g) || []).length, news.news.length - 3);
  assert.equal(renderedIds.length, news.news.length);
  assert.equal(new Set(renderedIds).size, news.news.length);
  assert.deepEqual([...renderedIds].sort(), news.news.map((item) => item.id).sort());
  assert.doesNotMatch(news.section.archiveDescription.en, /17|14/);
});

test("hero signal reel renders the six newest releases once and removes the legacy rail", () => {
  const [about, , , news, projects, site] = content;
  const html = renderToStaticMarkup(React.createElement(Hero, {
    site,
    about,
    projects: projects.projects,
    news: news.news,
    language: "en",
  }));
  const renderedIds = occurrences(html, /data-signal-news-id="([^"]+)"/g);
  const expectedIds = [...news.news]
    .sort((a, b) => b.date.value.localeCompare(a.date.value))
    .slice(0, 6)
    .map((item) => item.id);

  assert.equal(renderedIds.length, 6);
  assert.equal(new Set(renderedIds).size, 6);
  assert.deepEqual(renderedIds, expectedIds);
  assert.doesNotMatch(html, /latest-rail/);
  assert.match(html, new RegExp(site.hero.signalReel.previousLabel.en));
  assert.match(html, new RegExp(site.hero.signalReel.nextLabel.en));
});

test("reduced motion declares visible terminal states for the complete hero", async () => {
  const css = await readFile(path.join(root, "src", "styles", "foundation.css"), "utf8");
  const marker = "@media (prefers-reduced-motion: reduce)";
  const reduced = css.slice(css.indexOf(marker));

  assert.notEqual(css.indexOf(marker), -1);
  for (const selector of [
    ".hero__earth",
    ".hero .eyebrow",
    ".hero__title-line > span",
    ".hero__lede",
    ".worldline-stage__node",
    ".worldline__signal",
    ".signal-reel",
  ]) {
    assert.ok(reduced.includes(selector), `missing reduced-motion terminal selector: ${selector}`);
  }
  assert.match(reduced, /opacity:\s*1\s*!important/);
  assert.match(reduced, /transform:\s*none\s*!important/);
  assert.match(reduced, /stroke-dashoffset:\s*0\s*!important/);
  assert.match(reduced, /scroll-behavior:\s*auto\s*!important/);
});

test("editorial labels remain bilingual and render in Chinese", () => {
  const news = content[3];
  const projects = content[4];
  const site = content[5];
  const works = content[7];
  assert.deepEqual(Object.keys(projects.section.action.label).sort(), ["en", "zh"]);
  assert.deepEqual(Object.keys(news.section.archiveLabel).sort(), ["en", "zh"]);
  assert.deepEqual(Object.keys(works.page.title).sort(), ["en", "zh"]);
  for (const value of Object.values(site.hero.signalReel)) {
    assert.deepEqual(Object.keys(value).sort(), ["en", "zh"]);
  }

  assert.deepEqual(site.hero.brandLabel, {
    en: "ALIBABA · AMAP CV LAB",
    zh: "阿里巴巴 · 高德视觉技术中心",
  });
  assert.deepEqual(site.hero.signalReel.label, {
    en: "Latest from the lab",
    zh: "最新实验室动态",
  });
  assert.deepEqual(site.hero.signalReel.hint, {
    en: "Latest updates",
    zh: "最新动态",
  });
  assert.equal(content[2].section.eyebrow.en, "From foundations to execution");
  assert.equal(content[1].section.eyebrow.en, "Connected research areas");
  assert.equal(works.page.eyebrow.en, "Complete works index");
  assert.equal(works.page.eyebrow.zh, "项目与论文完整索引");

  const countCoupledControls = [
    projects.section.action.label,
    ...works.filters.typeOptions.map((option) => option.label),
    site.hero.signalReel.hint,
    site.hero.signalReel.trackLabel,
  ];
  const countPattern = /\d|\b(?:one|two|three|four|five|six|seven|eight|nine|ten)\b|[一二三四五六七八九十]+(?:项|条|个|篇)/i;
  for (const label of countCoupledControls) {
    assert.doesNotMatch(label.en, countPattern);
    assert.doesNotMatch(label.zh, countPattern);
  }

  const html = renderToStaticMarkup(React.createElement(NewsSection, { content: news, language: "zh" }));
  assert.ok(html.includes(news.section.archiveLabel.zh));
});

test("every project and news media frame uses the shared 16:10 contract", async () => {
  const css = await readFile(path.join(root, "src", "styles", "sections.css"), "utf8");
  for (const selector of [
    ".stack-project__image",
    ".project-card__media",
    ".project-index-row__media",
    ".news-feature__media",
  ]) {
    const start = css.indexOf(selector);
    const block = css.slice(start, css.indexOf("}", start) + 1);
    assert.notEqual(start, -1, `missing media selector: ${selector}`);
    assert.match(block, /aspect-ratio:\s*16\s*\/\s*10/, `${selector} must be 16:10`);
  }
  assert.doesNotMatch(css, /\.news-feature__media\s*\{[^}]*min-height:\s*100%/s);

  const heroCss = await readFile(path.join(root, "src", "styles", "hero.css"), "utf8");
  const reelMediaStart = heroCss.indexOf(".signal-card__media");
  const reelMediaBlock = heroCss.slice(reelMediaStart, heroCss.indexOf("}", reelMediaStart) + 1);
  assert.notEqual(reelMediaStart, -1);
  assert.match(reelMediaBlock, /aspect-ratio:\s*16\s*\/\s*10/);
});

test("worldline and reel motion keep a single gated continuous source", async () => {
  const [heroCss, heroSource] = await Promise.all([
    readFile(path.join(root, "src", "styles", "hero.css"), "utf8"),
    readFile(path.join(root, "src", "components", "Hero.jsx"), "utf8"),
  ]);
  const indexStart = heroCss.indexOf(".worldline__index {");
  const indexBlock = heroCss.slice(indexStart, heroCss.indexOf("}", indexStart) + 1);

  assert.doesNotMatch(heroCss, /latest-rail/);
  assert.match(heroCss, /animation:\s*worldline-signal[^;]*forwards/);
  assert.doesNotMatch(heroCss, /animation:\s*worldline-signal[^;]*infinite/);
  assert.match(indexBlock, /position:\s*static/);
  assert.doesNotMatch(indexBlock, /position:\s*absolute/);
  assert.doesNotMatch(indexBlock, /linear-gradient/);
  assert.match(heroSource, /\(min-width: 901px\) and \(min-height: 840px\) and \(hover: hover\) and \(pointer: fine\) and \(prefers-reduced-motion: no-preference\)/);
  assert.match(heroSource, /!document\.hidden/);
  assert.match(heroSource, /pauseReasonsRef\.current\.size === 0/);
  assert.match(heroSource, /schedule\(2500\)/);
  assert.match(heroSource, /schedule\(5000\)/);
  assert.match(heroSource, /REEL_SCROLL_DURATION = 500/);
  assert.match(heroSource, /className="signal-reel__track"[\s\S]{0,120}ref=\{trackRef\}/);
  const compactStart = heroCss.indexOf("@media (min-width: 901px) and (max-height: 839px)");
  const compactEnd = heroCss.indexOf("@media (min-width: 901px) and (min-height: 740px)", compactStart);
  const compactCss = heroCss.slice(compactStart, compactEnd);
  assert.match(compactCss, /grid-template-rows:\s*auto 142px minmax\(110px, 1fr\)/);
  assert.match(compactCss, /\.signal-reel\s*\{[\s\S]*?display:\s*grid/);
  assert.doesNotMatch(compactCss, /\.signal-reel\s*\{[^}]*display:\s*none/s);

  const midStart = heroCss.indexOf("@media (min-width: 901px) and (min-height: 840px) and (max-height: 999px)");
  const tallStart = heroCss.indexOf("@media (min-width: 901px) and (min-height: 1000px)");
  const ultraStart = heroCss.indexOf("@media (min-width: 1500px) and (min-height: 1400px)");
  const midCss = heroCss.slice(midStart, tallStart);
  const tallCss = heroCss.slice(tallStart, ultraStart);
  const ultraCss = heroCss.slice(ultraStart, heroCss.indexOf("@media (max-width: 1200px)", ultraStart));
  assert.match(midCss, /grid-template-rows:\s*auto 300px 147px/);
  assert.match(midCss, /flex-basis:\s*274px/);
  assert.match(tallCss, /grid-template-rows:\s*auto 374px 216px/);
  assert.match(tallCss, /flex-basis:\s*342px/);
  assert.match(ultraCss, /grid-template-rows:\s*auto 468px 240px/);
  assert.match(ultraCss, /flex-basis:\s*442px/);
  assert.doesNotMatch(`${midCss}\n${tallCss}\n${ultraCss}`, /align-content:\s*space-between/);
});

test("reel interaction gates cancel motion and preserve touch scrolling", async () => {
  const [heroCss, heroSource, siteSource] = await Promise.all([
    readFile(path.join(root, "src", "styles", "hero.css"), "utf8"),
    readFile(path.join(root, "src", "components", "Hero.jsx"), "utf8"),
    readFile(path.join(root, "public", "data", "site.json"), "utf8"),
  ]);

  assert.match(heroSource, /setPointerCapture\?\.\(event\.pointerId\)/);
  assert.match(heroSource, /releasePointerCapture\(event\.pointerId\)/);
  assert.doesNotMatch(heroSource, /onPointerLeave=\{\(\) => setPaused\("drag", false\)\}/);
  assert.match(heroSource, /if \(document\.hidden\) \{[\s\S]*?clearTimer\(\);[\s\S]*?cancelReelAnimation\(\)/);
  assert.match(heroSource, /if \(reducedMotionQuery\.matches\) \{[\s\S]*?clearTimer\(\);[\s\S]*?cancelReelAnimation\(\)/);
  assert.match(heroCss, /touch-action:\s*pan-x pan-y pinch-zoom/);
  assert.match(heroCss, /@media \(min-width: 901px\) and \(min-height: 840px\) and \(hover: hover\) and \(pointer: fine\) and \(prefers-reduced-motion: no-preference\)[\s\S]*?signal-reel__autoplay[\s\S]*?display:\s*inline-flex/);
  assert.doesNotMatch(heroCss, /@media \(min-width: 901px\) and \(min-height: 840px\)\s*\{[\s\S]*?signal-reel__autoplay[\s\S]*?display:\s*inline-flex/);
  assert.doesNotMatch(heroCss, /@media \(min-width: 901px\) and \(min-height: 840px\) and \(prefers-reduced-motion: no-preference\)[\s\S]*?signal-reel__autoplay[\s\S]*?display:\s*inline-flex/);
  assert.doesNotMatch(heroSource, /hero__coordinates/);
  assert.doesNotMatch(heroCss, /hero__coordinates/);
  assert.doesNotMatch(siteSource, /30\.000|120\.000|coordinates/i);
  assert.doesNotMatch(siteSource, /"(?:en|zh)":\s*"[^"]*(?:Signal Reel|Worldline|Orbit|System 001)/i);
});

test("AgentOS uses the reusable framework cover everywhere it is visible", async () => {
  const sources = await Promise.all([
    readFile(path.join(root, "public", "data", "abot-stack.json"), "utf8"),
    readFile(path.join(root, "public", "data", "news.json"), "utf8"),
    readFile(path.join(root, "public", "data", "projects.json"), "utf8"),
  ]);
  const combined = sources.join("\n");
  assert.doesNotMatch(combined, /abot-agentos-cover\.webp/);
  assert.match(combined, /abot-agentos-framework\.webp/);
});

test("skip navigation targets the focusable main landmark", async () => {
  const app = await readFile(path.join(root, "src", "App.jsx"), "utf8");
  assert.match(app, /className="skip-link" href="#main-content"/);
  assert.match(app, /<main id="main-content" tabIndex="-1">/);
});

test("mobile navigation moves focus into the opened menu and restores it on Escape", async () => {
  const [source, css] = await Promise.all([
    readFile(path.join(root, "src", "components", "SiteChrome.jsx"), "utf8"),
    readFile(path.join(root, "src", "styles", "chrome.css"), "utf8"),
  ]);

  assert.match(source, /const navigationRef = useRef\(null\)/);
  assert.match(source, /if \(!menuOpen\) return undefined;[\s\S]*?navigationRef\.current\?\.querySelector\("a\[href\]"\)\?\.focus\(\)/);
  assert.match(source, /<nav\s+[\s\S]*?ref=\{navigationRef\}/);
  assert.match(source, /if \(current\) window\.requestAnimationFrame\(\(\) => menuButtonRef\.current\?\.focus\(\)\)/);
  assert.match(source, /ref=\{menuButtonRef\}[\s\S]*?aria-expanded=\{menuOpen\}/);
  assert.match(css, /@media \(max-width: 1060px\)[\s\S]*?\.main-nav\s*\{[\s\S]*?visibility:\s*hidden;[\s\S]*?pointer-events:\s*none/);
  assert.match(css, /\.main-nav\.is-open\s*\{[\s\S]*?visibility:\s*visible;[\s\S]*?pointer-events:\s*auto/);
});

test("works merge uses explicit canonical ids and produces the frozen 48/40/47 ledger", async () => {
  const projects = content[4];
  const publications = content[6];
  const merged = mergeWorks(projects.projects, publications.publications);
  const source = await readFile(path.join(root, "src", "works", "worksModel.js"), "utf8");

  assert.equal(projects.projects.length, 40);
  assert.equal(publications.publications.length, 47);
  assert.equal(merged.length, 48);
  assert.equal(new Set(merged.map((work) => work.id)).size, 48);
  assert.equal(merged.filter((work) => work.hasProject).length, 40);
  assert.equal(merged.filter((work) => work.hasPublication).length, 47);
  assert.deepEqual(merged.filter((work) => work.hasProject && !work.hasPublication).map((work) => work.id), ["abot-er-preview"]);
  assert.deepEqual(
    merged.filter((work) => !work.hasProject && work.hasPublication).map((work) => work.id).sort(),
    ["asyncshield", "dpose", "g3pt", "navforesee", "scmt", "seeing-space-motion", "seq-grow-graph", "synthetic-speech"],
  );
  assert.ok(projects.projects.every((project) => project.canonicalWorkId === project.id));
  assert.equal(new Set(projects.projects.map((project) => project.canonicalWorkId)).size, 40);
  assert.equal(new Set(publications.publications.map((publication) => publication.canonicalWorkId)).size, 47);
  assert.match(source, /project\.canonicalWorkId/);
  assert.match(source, /publication\.canonicalWorkId/);
  assert.doesNotMatch(source, /title.*(?:match|includes)|(?:match|includes).*title/i);
});

test("legacy technology, Fantasy, and official research-area ledgers remain complete", () => {
  const research = content[1];
  const projects = content[4];
  const publications = content[6];
  const legacy = publications.publications.filter((item) => item.legacyTech);
  const expectedLegacyCounts = [7, 6, 5, 2, 5, 4];
  const officialTitles = [
    ["Map & Autonomous Driving", "地图与自动驾驶"],
    ["Human-Centric AI", "数字人"],
    ["Embodied AI", "具身智能"],
    ["World Modeling", "世界模型"],
    ["3D Generation & Reconstruction", "3D生成与重建"],
    ["General Deep Learning", "通用深度学习"],
  ];

  assert.equal(legacy.length, 29);
  assert.deepEqual(
    research.areas.map((area) => legacy.filter((item) => item.primaryResearchAreaId === area.id).length),
    expectedLegacyCounts,
  );
  assert.deepEqual(research.areas.map((area) => [area.title.en, area.title.zh]), officialTitles);
  assert.equal(projects.projects.filter((project) => project.id.startsWith("fantasy-")).length, 7);
  assert.equal(new Set(research.areas.flatMap((area) => area.projectIds)).size, 40);
});

test("homepage renders exactly six ranked projects with one primary area each", () => {
  const research = content[1];
  const projects = content[4];
  const selected = projects.projects
    .filter((project) => project.featuredOnHome)
    .sort((a, b) => a.homeRank - b.homeRank);
  const html = renderToStaticMarkup(React.createElement(ProjectsSection, { content: projects, language: "en" }));

  assert.deepEqual(selected.map((project) => project.id), [
    "future-sight-drive",
    "fantasy-talking",
    "fantasy-vln",
    "fantasy-world",
    "clod-gs",
    "abot-ocr",
  ]);
  assert.equal(new Set(selected.map((project) => project.primaryResearchAreaId)).size, research.areas.length);
  assert.equal((html.match(/class="project-card project-card--editorial"/g) || []).length, 6);
  assert.match(html, /href="\/works\/"/);
  assert.match(html, /View all works/);
  assert.doesNotMatch(html, /class="filters"/);
  assert.doesNotMatch(html, /project-index-row/);
});

test("works filters keep hybrid entries unique across availability, area, year, search, and series", () => {
  const research = content[1];
  const projects = content[4];
  const publications = content[6];
  const merged = mergeWorks(projects.projects, publications.publications);
  const base = { query: "", type: "all", area: "all", year: "all", series: "" };

  assert.equal(filterWorks(merged, { ...base, type: "project" }, "en").length, 40);
  assert.equal(filterWorks(merged, { ...base, type: "publication" }, "en").length, 47);
  assert.equal(filterWorks(merged, { ...base, area: "research-map-autonomous-driving" }, "en").length, 8);
  assert.equal(filterWorks(merged, { ...base, year: "2022" }, "en").length, 2);
  assert.deepEqual(filterWorks(merged, { ...base, query: "FantasyWorld" }, "en").map((work) => work.id), ["fantasy-world"]);
  assert.equal(filterWorks(merged, { ...base, series: "abot" }, "en").length, 13);
  assert.equal(groupWorks(merged, research.areas).length, 6);
});

test("project release facts and date precision stay aligned with official resources", async () => {
  const projects = content[4].projects;
  const byId = new Map(projects.map((project) => [project.id, project]));
  const m0 = byId.get("abot-m0");
  const astraWorld = byId.get("astranav-world");
  const sat3dgen = byId.get("sat3dgen");
  const n0 = byId.get("abot-n0");
  const validator = await readFile(path.join(root, "scripts", "validate-content.mjs"), "utf8");
  const contentSource = await readFile(path.join(root, "src", "content.js"), "utf8");

  assert.equal(m0.releaseStatus.state, "open-source");
  assert.ok(["project", "repository", "paper", "inferenceCode", "trainingCode", "modelWeights", "data"]
    .every((artifact) => m0.releaseStatus.artifacts[artifact] === "released"));
  assert.equal(astraWorld.releaseStatus.state, "partial-release");
  assert.equal(astraWorld.releaseStatus.artifacts.inferenceCode, "released");
  assert.equal(astraWorld.releaseStatus.artifacts.modelWeights, "released");
  assert.equal(astraWorld.releaseStatus.artifacts.trainingCode, "preparing");
  assert.equal(astraWorld.releaseStatus.artifacts.diffusionPolicy, "preparing");
  assert.match(astraWorld.releaseStatus.note.en, /Only Action-Former inference/);
  assert.ok(["project", "repository", "paper", "trainingCode", "inferenceCode", "modelWeights", "data", "demo"]
    .every((artifact) => sat3dgen.releaseStatus.artifacts[artifact] === "released"));
  assert.equal(n0.links.find((link) => link.type === "github").url, "https://github.com/amap-cvlab/ABot-Navigation/tree/ABot-N0");
  for (const id of ["abot-claw", "abot-er-preview"]) {
    assert.deepEqual(byId.get(id).date, { value: "2026", precision: "year" });
  }
  assert.match(validator, /function validateProjectDate/);
  assert.match(validator, /day:\s*isFullDate,[\s\S]*?month:\s*isMonth,[\s\S]*?year:\s*isYear/);
  assert.match(contentSource, /if \(precision === "year"\) return value/);
});

test("homepage loader stays independent from the works-only content boundary", async () => {
  const source = await readFile(path.join(root, "src", "content.js"), "utf8");
  const homeBlock = source.slice(source.indexOf("const CONTENT_FILES"), source.indexOf("const WORKS_CONTENT_FILES"));
  const worksBlock = source.slice(source.indexOf("const WORKS_CONTENT_FILES"), source.indexOf("async function loadFiles"));

  assert.doesNotMatch(homeBlock, /publications\.json|works\.json/);
  assert.match(worksBlock, /publications\.json/);
  assert.match(worksBlock, /works\.json/);
  assert.match(source, /export async function loadWorksContent/);
  assert.match(source, /cache: "no-cache"/);
});

test("works media and responsive controls keep the signed layout contracts", async () => {
  const [css, app, viteConfig, worker] = await Promise.all([
    readFile(path.join(root, "src", "styles", "works.css"), "utf8"),
    readFile(path.join(root, "src", "works", "WorksApp.jsx"), "utf8"),
    readFile(path.join(root, "vite.config.mjs"), "utf8"),
    readFile(path.join(root, "worker", "index.js"), "utf8"),
  ]);
  const mediaStart = css.indexOf(".work-row__media {");
  const mediaBlock = css.slice(mediaStart, css.indexOf("}", mediaStart) + 1);

  assert.match(mediaBlock, /width:\s*168px/);
  assert.match(mediaBlock, /aspect-ratio:\s*16\s*\/\s*10/);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*?\.work-row__media\s*\{[\s\S]*?width:\s*104px/);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*?\.works-hero__layout\s*\{[\s\S]*?align-items:\s*stretch/);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*?\.works-hero__copy\s*\{[\s\S]*?width:\s*100%/);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*?\.work-row h3\s*\{[\s\S]*?overflow:\s*visible;[\s\S]*?-webkit-line-clamp:\s*unset/);
  assert.match(css, /\.works-filter-toggle\s*\{[\s\S]*?min-height:\s*44px/);
  assert.doesNotMatch(css, /animation:|@keyframes/);
  assert.match(app, /work\.links\.slice\(0, 3\)/);
  assert.match(app, /className="work-row__tile" aria-hidden="true"/);
  assert.match(viteConfig, /works:\s*path\.join\(root, "works", "index\.html"\)/);
  assert.match(worker, /"\/works\/index\.html"/);
});

test("news preserves all ten legacy homepage events and the seven-project ICLR relation", () => {
  const news = content[3];
  const ids = new Set(news.news.map((item) => item.id));
  const legacyIds = [
    "news-iclr-2026-seven-papers",
    "news-fantasy-vln-open-release",
    "news-fantasy-world-worldscore",
    "news-aaai-2026-five-papers",
    "news-futuresightdrive-neurips",
    "news-fantasy-talking-acmmm",
    "news-seqgrowgraph-iccv",
    "news-futuresightdrive-project",
    "news-g3pt-ijcai",
    "news-fantasy-code-weights",
  ];
  const iclr = news.news.find((item) => item.id === "news-iclr-2026-seven-papers");

  assert.ok(legacyIds.every((id) => ids.has(id)));
  assert.equal(iclr.projectIds.length, 7);
  assert.deepEqual(new Set(iclr.projectIds), new Set([
    "online-navigation-refinement",
    "janusvln",
    "ce-nav",
    "omninav",
    "fantasy-world",
    "sat3dgen",
    "clod-gs",
  ]));
});
