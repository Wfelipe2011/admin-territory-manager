import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? walk(join(directory, entry.name))
          : join(directory, entry.name),
      ),
    )
  ).flat();
}
const buildId = (await readFile(".next/BUILD_ID", "utf8")).trim();
// Build assets are public code, never administrative HTML or API responses.
// Include all chunks so conditional imports and Next's runtime stay available
// offline too, rather than caching only the scripts seen on a first visit.
const assets = (await walk(".next/static"))
  .filter((file) => /\.(js|css|woff2?|ttf)$/.test(file))
  .map(
    (file) =>
      `/_next/static/${relative(".next/static", file).split("\\").join("/")}`,
  );
const publicFiles = [
  "/publicador",
  "/login",
  "/manifest.webmanifest",
  "/logo.png",
  "/login.png",
  "/rectangle_1.png",
  "/rectangle_2.png",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png",
];
const template = await readFile("scripts/sw-template.js", "utf8");
await writeFile(
  "public/sw.js",
  template
    .replace("__BUILD_ID__", JSON.stringify(buildId))
    .replace("__PRECACHE__", JSON.stringify([...publicFiles, ...assets])),
);
console.log(
  `PWA: ${assets.length} recursos estáticos e entrada pública preparados (${buildId}).`,
);
