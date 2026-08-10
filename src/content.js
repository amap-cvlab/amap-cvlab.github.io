const CONTENT_FILES = {
  site: "site.json",
  about: "about.json",
  research: "research-areas.json",
  stack: "abot-stack.json",
  projects: "projects.json",
  news: "news.json",
};

const WORKS_CONTENT_FILES = {
  site: "site.json",
  research: "research-areas.json",
  projects: "projects.json",
  publications: "publications.json",
  works: "works.json",
};

async function loadFiles(files, signal) {
  const entries = await Promise.all(
    Object.entries(files).map(async ([key, file]) => {
      const response = await fetch(`/data/${file}`, { signal, cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`Unable to load ${file} (${response.status})`);
      }
      return [key, await response.json()];
    }),
  );

  return Object.fromEntries(entries);
}

export async function loadContent(signal) {
  return loadFiles(CONTENT_FILES, signal);
}

export async function loadWorksContent(signal) {
  return loadFiles(WORKS_CONTENT_FILES, signal);
}

export function localize(value, language = "en") {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map((item) => localize(item, language));
  return value[language] ?? value.en ?? value.zh ?? "";
}

export function getInitialLanguage() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("lang");
  if (fromQuery === "zh" || fromQuery === "en") return fromQuery;
  return window.localStorage.getItem("amap-cvlab-language") === "zh" ? "zh" : "en";
}

export function persistLanguage(language) {
  window.localStorage.setItem("amap-cvlab-language", language);
  const url = new URL(window.location.href);
  url.searchParams.set("lang", language);
  window.history.replaceState({}, "", url);
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
}

export function formatDate(value, precision = "day", language = "en") {
  if (!value) return "";
  if (precision === "year") return value;
  if (precision === "month") {
    const [year, month] = value.split("-").map(Number);
    return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-GB", {
      year: "numeric",
      month: language === "zh" ? "long" : "short",
    }).format(new Date(Date.UTC(year, month - 1, 1)));
  }
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function itemDate(item = {}) {
  if (item.date && typeof item.date === "object") {
    return { value: item.date.value, precision: item.date.precision || "day" };
  }
  return {
    value: item.publishedAt || item.updatedAt || "",
    precision: item.datePrecision || "day",
  };
}

export function normalizeLinks(links = []) {
  if (Array.isArray(links)) {
    return links
      .filter((link) => link && typeof link.url === "string")
      .map((link, index) => ({
        type: link.type || `link-${index + 1}`,
        label: link.label || link.type || { en: "Open", zh: "打开" },
        url: link.url,
      }));
  }

  if (!links || typeof links !== "object") return [];
  return Object.entries(links)
    .filter(([, url]) => typeof url === "string" && url.length > 0)
    .map(([type, url]) => ({
      type,
      label: type.replace(/([A-Z])/g, " $1"),
      url,
    }));
}

export function primaryLink(links = []) {
  const normalized = normalizeLinks(links);
  const priorities = ["project", "experience", "demo", "studio", "github", "code", "paper", "dataset", "model"];
  return (
    priorities.map((type) => normalized.find((link) => link.type === type)?.url).find(Boolean) ||
    normalized[0]?.url ||
    "#projects"
  );
}
