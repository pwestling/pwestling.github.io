import indexHtml from "./index.html";

Bun.serve({
  port: 3000,
  routes: {
    "/": indexHtml
  },
  development: {
    hmr: true,
    console: true
  }
});

