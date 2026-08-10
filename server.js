const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 10000;
const ROOT = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

const server = http.createServer((req, res) => {
  let requestPath;

  try {
    requestPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname);
  } catch {
    res.writeHead(400);
    return res.end("Bad request");
  }

  if (requestPath === "/") {
    requestPath = "/index.html";
  }

  // Prevent path traversal outside the website directory.
  const filePath = path.resolve(ROOT, "." + requestPath);
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.stat(filePath, (statError, stats) => {
    if (!statError && stats.isDirectory()) {
      return serveFile(path.join(filePath, "index.html"), res);
    }

    serveFile(filePath, res);
  });
});

function serveFile(filePath, res) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      if (error.code === "ENOENT") {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        return res.end("404 - Page not found");
      }

      console.error(error);
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("500 - Internal server error");
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extension] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=300"
    });
    res.end(data);
  });
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`AquaticMC website running on port ${PORT}`);
});
