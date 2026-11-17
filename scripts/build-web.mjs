import { cp, mkdir, rm } from "node:fs/promises";

const files = ["index.html", "style.css", "script.js"];
await rm("www", { recursive: true, force: true });
await mkdir("www", { recursive: true });
for (const file of files) {
  await cp(file, `www/${file}`);
}
console.log("Web build complete: copied", files.join(", "), "to www/");
