export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");

    if (response.status !== 404 || !acceptsHtml || !["GET", "HEAD"].includes(request.method)) {
      return response;
    }

    const indexUrl = new URL(request.url);
    indexUrl.pathname = ["/works", "/works/"].includes(indexUrl.pathname)
      ? "/works/index.html"
      : "/index.html";
    indexUrl.search = "";
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};
