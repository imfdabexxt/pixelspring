const http = require("http");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const port = Number(process.env.PORT || 5173);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jsx": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

function safeJoin(base, reqPath) {
  const target = path.join(base, reqPath);
  const normBase = path.resolve(base);
  const normTarget = path.resolve(target);
  if (!normTarget.startsWith(normBase)) return null;
  return normTarget;
}

http
  .createServer((req, res) => {
    try {
      const urlPath = decodeURIComponent(String(req.url || "/").split("?")[0]);
      const rel = urlPath === "/" ? "/index.html" : urlPath;
      const filePath = safeJoin(root, rel);
      if (!filePath) {
        res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("forbidden");
        return;
      }

      fs.stat(filePath, (err, st) => {
        if (err || !st.isFile()) {
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("not found");
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          "Content-Type": mime[ext] || "application/octet-stream",
          "Cache-Control": "no-cache",
        });
        fs.createReadStream(filePath).pipe(res);
      });
    } catch (e) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(String((e && e.stack) || e));
    }
  })
  .listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Frontend running on http://localhost:${port}`);
  });

