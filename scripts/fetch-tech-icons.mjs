// Downloads every icon in src/lib/tech-icons.js from Iconbuddy's CDN into public/icons/tech/ (skips existing files)
// and records the sources in iconbuddy.json under "tech". Run: node scripts/fetch-tech-icons.mjs
import fs from "node:fs";
import { TECH_ICONS } from "../src/lib/tech-icons.js";
const dir = "public/icons/tech"; fs.mkdirSync(dir, { recursive: true });
const manifest = JSON.parse(fs.readFileSync("iconbuddy.json", "utf8")); manifest.tech = {};
const failed = [];
for (const ref of new Set(Object.values(TECH_ICONS))) {
  const file = `${dir}/${ref.replace("/", "--")}.svg`, source = `https://files.svgcdn.io/${ref}.svg`;
  manifest.tech[ref] = { source, path: file, license: ref.startsWith("tabler/") ? "MIT (Tabler)" : "CC0 (Simple Icons)" };
  if (fs.existsSync(file)) continue;
  const res = await fetch(source);
  if (!res.ok) { failed.push(`${ref} ${res.status}`); continue; }
  fs.writeFileSync(file, await res.text());
}
fs.writeFileSync("iconbuddy.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(failed.length ? `missing: ${failed.join(", ")}` : "all icons present");
