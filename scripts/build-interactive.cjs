const { build } = require("esbuild");
const { createHash } = require("node:crypto");
const { readFile, rename, writeFile } = require("node:fs/promises");
const { join } = require("node:path");

const root = join(__dirname, "..");

async function buildInteractive() {
  const bundle = await build({
    absWorkingDir: root,
    entryPoints: ["components/Interactive/sandbox/runtime.tsx"],
    bundle: true,
    write: false,
    minify: true,
    define: { "process.env.NODE_ENV": '"production"' },
    legalComments: "inline",
  });
  // Keep the bundle out of HTML script parsing. Library strings can contain script tags.
  const payload = Buffer.from(bundle.outputFiles[0].contents).toString("base64");
  const script = 'const payload=document.getElementById("runtime");'
    + 'const bytes=Uint8Array.from(atob(payload.textContent),char=>char.charCodeAt(0));'
    + 'payload.remove();(0,eval)(new TextDecoder().decode(bytes));';
  const hash = createHash("sha256").update(script).digest("base64");
  const policy = [
    "default-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    `script-src 'sha256-${hash}' 'unsafe-eval'`,
    "style-src 'unsafe-inline'",
    "img-src data: blob:",
  ].join("; ");
  const styles = await readFile(join(root, "styles/interactive.css"), "utf8");
  const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${policy}">
<meta name="referrer" content="no-referrer">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>인터랙티브 콘텐츠</title>
<style>${styles}
html { font-family: system-ui, sans-serif; }
body { margin: 0; }
#root { box-sizing: border-box; padding: 4px; display: flow-root; }
</style></head>
<body><div id="root" class="blog-viz"></div>
<script id="runtime" type="application/octet-stream">${payload}</script>
<script>${script}</script></body></html>`;
  const path = join(root, "public/interactive-sandbox.html");
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, html);
  await rename(temporary, path);
}

if (require.main === module) {
  buildInteractive().catch((error) => { console.error(error); process.exitCode = 1; });
}
module.exports = { buildInteractive };
