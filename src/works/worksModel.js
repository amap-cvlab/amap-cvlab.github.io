import { localize, normalizeLinks } from "../content";

function projectYear(project) {
  return Number(project?.date?.value?.slice(0, 4)) || 0;
}

export function mergeWorks(projects = [], publications = []) {
  const byCanonicalId = new Map();

  for (const project of projects) {
    byCanonicalId.set(project.canonicalWorkId, {
      id: project.canonicalWorkId,
      canonicalWorkId: project.canonicalWorkId,
      project,
      publications: [],
    });
  }

  for (const publication of publications) {
    const canonicalWorkId = publication.canonicalWorkId;
    const current = byCanonicalId.get(canonicalWorkId) || {
      id: canonicalWorkId,
      canonicalWorkId,
      project: null,
      publications: [],
    };
    current.publications.push(publication);
    byCanonicalId.set(canonicalWorkId, current);
  }

  return [...byCanonicalId.values()].map((work) => {
    const publication = [...work.publications].sort((a, b) => b.year - a.year)[0] || null;
    const project = work.project;
    const years = [...new Set([
      ...work.publications.map((item) => item.year),
      projectYear(project),
    ].filter(Boolean))].sort((a, b) => b - a);
    const researchAreaIds = [...new Set([
      ...(project?.researchAreaIds || []),
      ...work.publications.flatMap((item) => item.researchAreaIds || []),
    ])];
    const primaryResearchAreaId = project?.primaryResearchAreaId
      || publication?.primaryResearchAreaId
      || researchAreaIds[0];
    const links = [...new Map([
      ...normalizeLinks(project?.links),
      ...work.publications.flatMap((item) => normalizeLinks(item.links)),
    ].map((item) => [item.url, item])).values()];
    const series = [...new Set([
      ...(project?.categoryIds?.includes("abot") ? ["ABot"] : []),
      ...work.publications.map((item) => item.series).filter(Boolean),
    ])];

    return {
      ...work,
      publication,
      title: project?.name || publication?.title,
      publicationTitle: project && publication ? publication.title : null,
      summary: project?.summary || publication?.summary,
      year: years[0] || 0,
      years,
      venue: publication?.venue,
      publicationType: publication?.publicationType,
      primaryResearchAreaId,
      researchAreaIds,
      links,
      series,
      media: project?.media,
      hasProject: Boolean(project),
      hasPublication: work.publications.length > 0,
    };
  });
}

export function filterWorks(works, filters, language = "en") {
  const query = filters.query.trim().toLocaleLowerCase(language === "zh" ? "zh-CN" : "en-US");
  const series = filters.series.trim().toLocaleLowerCase();

  return works.filter((work) => {
    if (filters.type === "project" && !work.hasProject) return false;
    if (filters.type === "publication" && !work.hasPublication) return false;
    if (filters.area !== "all" && !work.researchAreaIds.includes(filters.area)) return false;
    if (filters.year !== "all" && !work.years.includes(Number(filters.year))) return false;
    if (series && !work.series.some((value) => value.toLocaleLowerCase() === series)) return false;
    if (!query) return true;

    const searchText = [
      localize(work.title, language),
      localize(work.publicationTitle, language),
      localize(work.summary, language),
      localize(work.venue, language),
      ...work.series,
    ].join(" ").toLocaleLowerCase(language === "zh" ? "zh-CN" : "en-US");
    return searchText.includes(query);
  });
}

export function groupWorks(works, areas = []) {
  const areaOrder = new Map(areas.map((area) => [area.id, area.order]));
  const groups = new Map();

  for (const work of works) {
    const areaId = work.primaryResearchAreaId;
    if (!groups.has(areaId)) groups.set(areaId, []);
    groups.get(areaId).push(work);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => (areaOrder.get(a) || 999) - (areaOrder.get(b) || 999))
    .map(([areaId, items]) => ({
      areaId,
      items: items.sort((a, b) => b.year - a.year || String(a.id).localeCompare(String(b.id))),
    }));
}
