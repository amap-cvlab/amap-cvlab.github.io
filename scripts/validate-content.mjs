#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDirectory = path.join(root, "public", "data");

const modules = {
  "site.json": {
    required: [
      "schemaVersion",
      "updatedAt",
      "brand",
      "navigation",
      "hero",
      "ui",
      "footer",
      "sources",
    ],
    arrays: ["navigation", "footer.links", "sources"],
  },
  "about.json": {
    required: ["schemaVersion", "updatedAt", "section", "intro", "pillars", "sources"],
    arrays: ["intro.body", "pillars", "sources"],
  },
  "research-areas.json": {
    required: ["schemaVersion", "updatedAt", "section", "title", "description", "areas"],
    arrays: ["areas"],
  },
  "abot-stack.json": {
    required: ["schemaVersion", "updatedAt", "section", "title", "description", "layers"],
    arrays: ["layers"],
  },
  "projects.json": {
    required: [
      "schemaVersion",
      "updatedAt",
      "section",
      "ui",
      "title",
      "description",
      "projects",
    ],
    arrays: ["projects"],
  },
  "publications.json": {
    required: ["schemaVersion", "updatedAt", "publications"],
    arrays: ["publications"],
  },
  "works.json": {
    required: ["schemaVersion", "updatedAt", "page", "filters", "list"],
    arrays: ["filters.typeOptions"],
  },
  "news.json": {
    required: ["schemaVersion", "updatedAt", "section", "title", "description", "news"],
    arrays: ["news"],
  },
};

const bilingualFieldNames = new Set([
  "alt",
  "copyright",
  "description",
  "eyebrow",
  "label",
  "lead",
  "name",
  "note",
  "shortName",
  "statement",
  "summary",
  "tagline",
  "title",
]);

const projectReleaseStates = new Set([
  "open-source",
  "partial-release",
  "research-preview",
]);
const artifactReleaseStates = new Set([
  "released",
  "preparing",
  "announced",
  "not-announced",
]);
const newsReleaseStates = new Set([
  "released",
  "published",
  "accepted",
  "deployed",
  "demonstrated",
]);
const publicationTypes = new Set(["paper", "report"]);
const projectCategoryIds = new Set([
  "abot",
  "world-modeling",
  "embodied-ai",
  "spatial-foundations",
  "generative-ai",
]);
const expectedLegacyPublicationIds = new Set([
  "pub-online-navigation-refinement",
  "pub-future-sight-drive",
  "pub-unimapgen",
  "pub-prior-drive",
  "pub-pamr",
  "pub-seq-grow-graph",
  "pub-mapdr",
  "pub-fantasy-talking",
  "pub-fantasy-talking2",
  "pub-fantasy-hsi",
  "pub-fantasy-portrait",
  "pub-fantasy-id",
  "pub-humanrig",
  "pub-janusvln",
  "pub-ce-nav",
  "pub-omninav",
  "pub-fantasy-vln",
  "pub-seeing-space-motion",
  "pub-fantasy-world",
  "pub-world-env",
  "pub-sat3dgen",
  "pub-clod-gs",
  "pub-g3pt",
  "pub-gf-nerf",
  "pub-mvpainter",
  "pub-synthetic-speech",
  "pub-dfvt",
  "pub-scmt",
  "pub-dpose",
]);
const expectedLegacyAreaCounts = new Map([
  ["research-map-autonomous-driving", 7],
  ["research-human-centric-ai", 6],
  ["research-embodied-intelligence", 5],
  ["research-world-modeling", 2],
  ["research-3d-generation-reconstruction", 5],
  ["research-general-deep-learning", 4],
]);
const expectedFantasyProjectIds = new Set([
  "fantasy-talking",
  "fantasy-talking2",
  "fantasy-hsi",
  "fantasy-portrait",
  "fantasy-id",
  "fantasy-vln",
  "fantasy-world",
]);
const expectedHomeProjectIds = new Set([
  "future-sight-drive",
  "fantasy-talking",
  "fantasy-vln",
  "fantasy-world",
  "clod-gs",
  "abot-ocr",
]);
const expectedProjectIds = new Set([
  "online-navigation-refinement",
  "future-sight-drive",
  "unimapgen",
  "prior-drive",
  "pamr",
  "mapdr",
  "reasoning-over-space",
  "fantasy-talking",
  "fantasy-talking2",
  "fantasy-hsi",
  "fantasy-portrait",
  "fantasy-id",
  "humanrig",
  "janusvln",
  "ce-nav",
  "omninav",
  "fantasy-vln",
  "abot-n0",
  "abot-n1",
  "abot-m0",
  "abot-m05",
  "abot-agentos",
  "abot-explorer",
  "abot-claw",
  "abot-er-preview",
  "astranav-memory",
  "astranav-world",
  "socialnav",
  "fantasy-world",
  "world-env",
  "abot-world",
  "abot-3dworld",
  "abot-earth",
  "abot-physworld",
  "sat3dgen",
  "clod-gs",
  "gf-nerf",
  "mvpainter",
  "dfvt",
  "abot-ocr",
]);
const expectedPublicationOnlyWorkIds = new Set([
  "asyncshield",
  "dpose",
  "g3pt",
  "navforesee",
  "scmt",
  "seeing-space-motion",
  "seq-grow-graph",
  "synthetic-speech",
]);
const expectedCanonicalWorkIds = new Set([
  ...expectedProjectIds,
  ...expectedPublicationOnlyWorkIds,
]);

const errors = new Set();
const ids = new Map();
const parsedModules = new Map();
const localAssetReferences = [];

function report(file, location, message) {
  errors.add(`${file}:${location} ${message}`);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function getAtPath(value, location) {
  return location.split(".").reduce((current, key) => current?.[key], value);
}

function validateLocalized(value, file, location) {
  if (!isRecord(value)) {
    report(file, location, "must be a bilingual object with non-empty en and zh strings");
    return;
  }

  for (const locale of ["en", "zh"]) {
    if (typeof value[locale] !== "string" || value[locale].trim() === "") {
      report(file, `${location}.${locale}`, "must be a non-empty string");
    }
  }
}

function isHttpUrl(value) {
  if (typeof value !== "string" || value.trim() === "" || value !== value.trim()) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function validateExternalUrl(value, file, location) {
  if (!isHttpUrl(value)) {
    report(file, location, "must be a non-empty http(s) URL");
  }
}

function validateHref(value, file, location) {
  const isInternal =
    typeof value === "string" &&
    value.trim() === value &&
    (/^#[^\s]+$/.test(value) || /^\/(?!\/)[^\s]*$/.test(value));

  if (!isInternal && !isHttpUrl(value)) {
    report(file, location, "must be a non-empty internal path/anchor or http(s) URL");
  }
}

function isFullDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function isMonth(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) return false;
  const month = Number(value.slice(5, 7));
  return month >= 1 && month <= 12;
}

function isYear(value) {
  return typeof value === "string" && /^\d{4}$/.test(value);
}

function walk(value, file, location = "$") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, file, `${location}[${index}]`));
    return;
  }

  if (!isRecord(value)) return;

  if (hasOwn(value, "en") || hasOwn(value, "zh")) {
    validateLocalized(value, file, location);
  }

  if (hasOwn(value, "id")) {
    const idLocation = `${location}.id`;
    if (typeof value.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.id)) {
      report(file, idLocation, "must be a stable kebab-case id");
    } else if (ids.has(value.id)) {
      report(file, idLocation, `duplicates ${ids.get(value.id)}`);
    } else {
      ids.set(value.id, `${file}:${idLocation}`);
    }
  }

  for (const [key, child] of Object.entries(value)) {
    const childLocation = `${location}.${key}`;

    if (typeof child === "string" && child.startsWith("/assets/")) {
      localAssetReferences.push({ file, location: childLocation, path: child });
    }

    if (bilingualFieldNames.has(key)) {
      validateLocalized(child, file, childLocation);
    }

    if (key.toLowerCase().endsWith("url")) {
      validateExternalUrl(child, file, childLocation);
    } else if (key === "href") {
      validateHref(child, file, childLocation);
    } else if (key === "evidence" && typeof child === "string") {
      validateExternalUrl(child, file, childLocation);
    }

    if ((key === "updatedAt" || key === "verifiedAt") && !isFullDate(child)) {
      report(file, childLocation, "must be a valid YYYY-MM-DD date");
    }

    walk(child, file, childLocation);
  }
}

function validateIdCollection(items, file, location) {
  if (!Array.isArray(items)) return;
  items.forEach((item, index) => {
    if (!isRecord(item) || !hasOwn(item, "id")) {
      report(file, `${location}[${index}].id`, "is required");
    }
  });
}

function validateReferences(values, allowed, file, location, kind) {
  if (!Array.isArray(values)) {
    report(file, location, "must be an array");
    return;
  }

  values.forEach((value, index) => {
    if (typeof value !== "string" || !allowed.has(value)) {
      report(file, `${location}[${index}]`, `references unknown ${kind}: ${String(value)}`);
    }
  });
}

function validateProjectReleaseStatus(status, file, location) {
  if (!isRecord(status)) {
    report(file, location, "must be an object");
    return;
  }

  if (!projectReleaseStates.has(status.state)) {
    report(
      file,
      `${location}.state`,
      `must be one of: ${[...projectReleaseStates].join(", ")}`,
    );
  }

  validateLocalized(status.label, file, `${location}.label`);

  if (!isRecord(status.artifacts) || Object.keys(status.artifacts).length === 0) {
    report(file, `${location}.artifacts`, "must be a non-empty object");
  } else {
    for (const [artifact, state] of Object.entries(status.artifacts)) {
      if (!artifactReleaseStates.has(state)) {
        report(
          file,
          `${location}.artifacts.${artifact}`,
          `must be one of: ${[...artifactReleaseStates].join(", ")}`,
        );
      }
    }
  }

  if (hasOwn(status, "note")) {
    validateLocalized(status.note, file, `${location}.note`);
  }
}

function validateNewsDate(date, file, location) {
  if (!isRecord(date)) {
    report(file, location, "must be an object with value and precision");
    return;
  }

  if (date.precision !== "day" && date.precision !== "month") {
    report(file, `${location}.precision`, "must be day or month");
    return;
  }

  const valid = date.precision === "day" ? isFullDate(date.value) : isMonth(date.value);
  if (!valid) {
    report(
      file,
      `${location}.value`,
      `must be a valid ${date.precision === "day" ? "YYYY-MM-DD" : "YYYY-MM"} date`,
    );
  }
}

function validateProjectDate(date, file, location) {
  if (!isRecord(date)) {
    report(file, location, "must be an object with value and precision");
    return;
  }

  const validators = {
    day: isFullDate,
    month: isMonth,
    year: isYear,
  };
  const validate = validators[date.precision];
  if (!validate) {
    report(file, `${location}.precision`, "must be day, month, or year");
    return;
  }
  if (!validate(date.value)) {
    const formats = { day: "YYYY-MM-DD", month: "YYYY-MM", year: "YYYY" };
    report(file, `${location}.value`, `must be a valid ${formats[date.precision]} date`);
  }
}

async function loadModules() {
  await Promise.all(
    Object.keys(modules).map(async (file) => {
      const absolutePath = path.join(contentDirectory, file);
      let source;

      try {
        source = await readFile(absolutePath, "utf8");
      } catch (error) {
        report(file, "$", `could not be read: ${error.message}`);
        return;
      }

      try {
        parsedModules.set(file, JSON.parse(source));
      } catch (error) {
        report(file, "$", `contains invalid JSON: ${error.message}`);
      }
    }),
  );
}

await loadModules();

for (const [file, rules] of Object.entries(modules)) {
  const content = parsedModules.get(file);
  if (!content) continue;

  if (!isRecord(content)) {
    report(file, "$", "must contain a top-level JSON object");
    continue;
  }

  for (const key of rules.required) {
    if (!hasOwn(content, key)) report(file, `$.${key}`, "is required");
  }

  if (
    typeof content.schemaVersion !== "string" ||
    !/^\d+\.\d+\.\d+$/.test(content.schemaVersion)
  ) {
    report(file, "$.schemaVersion", "must be a semantic x.y.z version string");
  }

  for (const arrayPath of rules.arrays) {
    const value = getAtPath(content, arrayPath);
    if (!Array.isArray(value) || value.length === 0) {
      report(file, `$.${arrayPath}`, "must be a non-empty array");
    }
  }

  walk(content, file);
}

const site = parsedModules.get("site.json");
if (site) {
  validateIdCollection(site.navigation, "site.json", "$.navigation");
  validateIdCollection(site.footer?.links, "site.json", "$.footer.links");
}

const about = parsedModules.get("about.json");
if (about) {
  validateIdCollection(about.pillars, "about.json", "$.pillars");
  about.intro?.body?.forEach((paragraph, index) =>
    validateLocalized(paragraph, "about.json", `$.intro.body[${index}]`),
  );
}

const research = parsedModules.get("research-areas.json");
if (research) validateIdCollection(research.areas, "research-areas.json", "$.areas");

const stack = parsedModules.get("abot-stack.json");
if (stack) {
  validateIdCollection(stack.layers, "abot-stack.json", "$.layers");
  stack.layers?.forEach((layer, layerIndex) => {
    const location = `$.layers[${layerIndex}].items`;
    if (!Array.isArray(layer.items) || layer.items.length === 0) {
      report("abot-stack.json", location, "must be a non-empty array");
      return;
    }
    validateIdCollection(layer.items, "abot-stack.json", location);
    layer.items.forEach((item, itemIndex) =>
      validateProjectReleaseStatus(
        item.releaseStatus,
        "abot-stack.json",
        `${location}[${itemIndex}].releaseStatus`,
      ),
    );
  });
}

const projects = parsedModules.get("projects.json");
if (projects) {
  validateIdCollection(projects.projects, "projects.json", "$.projects");
  projects.projects?.forEach((project, index) => {
    validateProjectDate(project.date, "projects.json", `$.projects[${index}].date`);
    validateProjectReleaseStatus(
      project.releaseStatus,
      "projects.json",
      `$.projects[${index}].releaseStatus`,
    );
  });
}

const publications = parsedModules.get("publications.json");
if (publications) {
  validateIdCollection(publications.publications, "publications.json", "$.publications");
  publications.publications?.forEach((publication, index) => {
    const location = `$.publications[${index}]`;
    if (!Number.isInteger(publication.year) || publication.year < 2000 || publication.year > 2100) {
      report("publications.json", `${location}.year`, "must be a four-digit publication year");
    }
    const venueYear = publication.venue?.en?.match(/20\d{2}/)?.[0];
    if (venueYear && Number(venueYear) !== publication.year) {
      report(
        "publications.json",
        `${location}.year`,
        `must match the canonical venue year ${venueYear}`,
      );
    }
    if (!publicationTypes.has(publication.publicationType)) {
      report(
        "publications.json",
        `${location}.publicationType`,
        `must be one of: ${[...publicationTypes].join(", ")}`,
      );
    }
    if (typeof publication.canonicalWorkId !== "string" || publication.canonicalWorkId.trim() === "") {
      report("publications.json", `${location}.canonicalWorkId`, "must be a stable non-empty work id");
    }
  });
}

const works = parsedModules.get("works.json");
if (works) validateIdCollection(works.filters?.typeOptions, "works.json", "$.filters.typeOptions");

const news = parsedModules.get("news.json");
if (news) {
  validateIdCollection(news.news, "news.json", "$.news");
  news.news?.forEach((item, index) => {
    const location = `$.news[${index}]`;
    validateNewsDate(item.date, "news.json", `${location}.date`);
    if (!isRecord(item.releaseStatus) || !newsReleaseStates.has(item.releaseStatus.state)) {
      report(
        "news.json",
        `${location}.releaseStatus.state`,
        `must be one of: ${[...newsReleaseStates].join(", ")}`,
      );
    } else {
      validateLocalized(
        item.releaseStatus.label,
        "news.json",
        `${location}.releaseStatus.label`,
      );
    }
  });
}

if (site && about && research && stack && projects && publications && works && news) {
  const projectIds = new Set((projects.projects || []).map((project) => project.id));
  const researchAreaIds = new Set((research.areas || []).map((area) => area.id));
  const stageIds = new Set((stack.layers || []).map((layer) => layer.id));
  const validAnchors = new Set([
    "#top",
    "#abot-stack",
    "#research",
    "/works/",
    "#releases",
    "#about",
  ]);

  (site.navigation || []).forEach((item, index) => {
    if (!validAnchors.has(item.href)) {
      report("site.json", `$.navigation[${index}].href`, `references unknown page anchor: ${item.href}`);
    }
  });

  (about.pillars || []).forEach((pillar, index) => {
    if (!stageIds.has(pillar.stageId)) {
      report("about.json", `$.pillars[${index}].stageId`, `references unknown stage: ${pillar.stageId}`);
    }
  });

  (stack.layers || []).forEach((layer, layerIndex) => {
    (layer.items || []).forEach((item, itemIndex) => {
      if (typeof item.projectRef !== "string" || !projectIds.has(item.projectRef)) {
        report(
          "abot-stack.json",
          `$.layers[${layerIndex}].items[${itemIndex}].projectRef`,
          `references unknown project: ${String(item.projectRef)}`,
        );
      }
    });
  });

  (research.areas || []).forEach((area, index) => {
    validateReferences(area.stageIds, stageIds, "research-areas.json", `$.areas[${index}].stageIds`, "stage");
    validateReferences(area.projectIds, projectIds, "research-areas.json", `$.areas[${index}].projectIds`, "project");
  });

  (projects.projects || []).forEach((project, index) => {
    validateReferences(project.stageIds, stageIds, "projects.json", `$.projects[${index}].stageIds`, "stage");
    validateReferences(project.categoryIds, projectCategoryIds, "projects.json", `$.projects[${index}].categoryIds`, "category");
    validateReferences(project.researchAreaIds, researchAreaIds, "projects.json", `$.projects[${index}].researchAreaIds`, "research area");
    if (project.primaryResearchAreaId !== project.researchAreaIds?.[0]) {
      report("projects.json", `$.projects[${index}].primaryResearchAreaId`, "must equal the first researchAreaIds entry");
    }
  });

  (publications.publications || []).forEach((publication, index) => {
    validateReferences(publication.projectIds, projectIds, "publications.json", `$.publications[${index}].projectIds`, "project");
    validateReferences(publication.researchAreaIds, researchAreaIds, "publications.json", `$.publications[${index}].researchAreaIds`, "research area");
    if (publication.primaryResearchAreaId !== publication.researchAreaIds?.[0]) {
      report("publications.json", `$.publications[${index}].primaryResearchAreaId`, "must equal the first researchAreaIds entry");
    }
    if (publication.projectIds.length > 1) {
      report("publications.json", `$.publications[${index}].projectIds`, "must contain at most one canonical project relation");
    }
    const linkedProjectId = publication.projectIds[0];
    if (linkedProjectId && publication.canonicalWorkId !== linkedProjectId) {
      report("publications.json", `$.publications[${index}].canonicalWorkId`, "must match its linked project id");
    }
  });

  (news.news || []).forEach((item, index) => {
    validateReferences(item.projectIds, projectIds, "news.json", `$.news[${index}].projectIds`, "project");
  });

  const projectList = projects.projects || [];
  const publicationList = publications.publications || [];
  const canonicalProjectIds = new Set(projectList.map((project) => project.canonicalWorkId));
  const canonicalPublicationIds = new Set(publicationList.map((publication) => publication.canonicalWorkId));
  const canonicalUnion = new Set([...canonicalProjectIds, ...canonicalPublicationIds]);
  const intersection = [...canonicalProjectIds].filter((id) => canonicalPublicationIds.has(id));
  const projectOnly = [...canonicalProjectIds].filter((id) => !canonicalPublicationIds.has(id));
  const publicationOnly = [...canonicalPublicationIds].filter((id) => !canonicalProjectIds.has(id));

  if (projectList.length !== 40) report("projects.json", "$.projects", `must contain 40 projects, found ${projectList.length}`);
  if (publicationList.length !== 47) report("publications.json", "$.publications", `must contain 47 publications, found ${publicationList.length}`);
  if (projectList.some((project) => project.canonicalWorkId !== project.id)) {
    report("projects.json", "$.projects", "every project canonicalWorkId must equal its project id");
  }
  if (canonicalProjectIds.size !== projectList.length) {
    report("projects.json", "$.projects", "project canonicalWorkId values must be unique");
  }
  if (canonicalPublicationIds.size !== publicationList.length) {
    report("publications.json", "$.publications", "publication canonicalWorkId values must be unique");
  }
  const actualProjectIds = new Set(projectList.map((project) => project.id));
  if (actualProjectIds.size !== expectedProjectIds.size || [...expectedProjectIds].some((id) => !actualProjectIds.has(id))) {
    report("projects.json", "$.projects", "must preserve the exact frozen 40-project ledger");
  }
  if (canonicalUnion.size !== 48) report("works.json", "$.page", `canonical project/publication union must contain 48 works, found ${canonicalUnion.size}`);
  if (canonicalUnion.size !== expectedCanonicalWorkIds.size || [...expectedCanonicalWorkIds].some((id) => !canonicalUnion.has(id))) {
    report("works.json", "$.page", "must preserve the exact frozen 48-work canonical ledger");
  }
  if (intersection.length !== 39) report("publications.json", "$.publications", `must contain 39 project-publication intersections, found ${intersection.length}`);
  if (projectOnly.length !== 1 || projectOnly[0] !== "abot-er-preview") {
    report("projects.json", "$.projects", `project-only work must be abot-er-preview, found ${projectOnly.join(", ")}`);
  }
  const publicationOnlySet = new Set(publicationOnly);
  if (publicationOnlySet.size !== expectedPublicationOnlyWorkIds.size || [...expectedPublicationOnlyWorkIds].some((id) => !publicationOnlySet.has(id))) {
    report("publications.json", "$.publications", `must preserve the exact eight publication-only works, found ${publicationOnly.join(", ")}`);
  }
  if (site.hero?.worksCount !== canonicalUnion.size) {
    report("site.json", "$.hero.worksCount", `must equal the canonical work union (${canonicalUnion.size})`);
  }

  const legacyIds = new Set(publicationList.filter((item) => item.legacyTech).map((item) => item.id));
  if (legacyIds.size !== expectedLegacyPublicationIds.size || [...expectedLegacyPublicationIds].some((id) => !legacyIds.has(id))) {
    report("publications.json", "$.publications", "legacyTech must preserve the exact 29-item legacy technology archive");
  }
  for (const [areaId, expectedCount] of expectedLegacyAreaCounts) {
    const actual = publicationList.filter((item) => item.legacyTech && item.primaryResearchAreaId === areaId).length;
    if (actual !== expectedCount) {
      report("publications.json", "$.publications", `legacy area ${areaId} must contain ${expectedCount} publications, found ${actual}`);
    }
  }

  const fantasyIds = new Set(projectList.filter((project) => project.id.startsWith("fantasy-")).map((project) => project.id));
  if (fantasyIds.size !== 7 || [...expectedFantasyProjectIds].some((id) => !fantasyIds.has(id))) {
    report("projects.json", "$.projects", "must contain the exact seven Fantasy-AMAP research projects");
  }

  const featuredHome = projectList.filter((project) => project.featuredOnHome);
  const featuredHomeIds = new Set(featuredHome.map((project) => project.id));
  const featuredRanks = featuredHome.map((project) => project.homeRank).sort((a, b) => a - b);
  if (featuredHome.length !== 6 || [...expectedHomeProjectIds].some((id) => !featuredHomeIds.has(id))) {
    report("projects.json", "$.projects", "homepage selection must contain the exact six cross-area projects");
  }
  if (featuredRanks.join(",") !== "1,2,3,4,5,6") {
    report("projects.json", "$.projects", "homepage homeRank values must be unique 1 through 6");
  }

  for (const project of projectList) {
    for (const areaId of project.researchAreaIds) {
      const area = research.areas.find((candidate) => candidate.id === areaId);
      if (!area?.projectIds?.includes(project.id)) {
        report("research-areas.json", "$.areas", `missing reverse project reference ${project.id} in ${areaId}`);
      }
    }
  }

  const iclrNews = news.news.find((item) => item.id === "news-iclr-2026-seven-papers");
  const expectedIclrProjects = new Set(["online-navigation-refinement", "janusvln", "ce-nav", "omninav", "fantasy-world", "sat3dgen", "clod-gs"]);
  if (!iclrNews || iclrNews.projectIds.length !== 7 || iclrNews.projectIds.some((id) => !expectedIclrProjects.has(id))) {
    report("news.json", "$.news", "ICLR 2026 announcement must reference the exact seven accepted projects");
  }
}

await Promise.all(
  localAssetReferences.map(async (reference) => {
    const assetPath = path.join(root, "public", reference.path.slice(1));
    try {
      await access(assetPath);
    } catch {
      report(reference.file, reference.location, `references missing local asset ${reference.path}`);
    }
  }),
);

if (errors.size > 0) {
  console.error(`Content validation failed with ${errors.size} error(s):`);
  for (const error of [...errors].sort()) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `Content validation passed: ${parsedModules.size} files and ${ids.size} stable ids checked.`,
  );
}
