import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = join(__dirname, "docs");
const DIST_DIR = join(__dirname, "dist");
const ASSETS_DIR = join(__dirname, "assets");
const BASE = process.env.BASE || "/refract-docs/";

const NAV = [
	{ title: "Home", slug: "index" },
	{
		title: "Getting Started",
		slug: null,
		children: [
			{ title: "Why Refract", slug: "why-refract" },
			{ title: "Live Demo", slug: "demo" },
			{ title: "Quick Start", slug: "quickstart" },
			{ title: "Complete Workflow", slug: "complete-workflow" },
			{ title: "Install", slug: "install" },
			{ title: "Concepts", slug: "concepts" },
		],
	},
	{
		title: "Reference",
		slug: null,
		children: [
			{ title: "CLI", slug: "cli" },
			{ title: "SDK / Packages", slug: "sdk" },
			{ title: "Event Schema", slug: "schema" },
			{ title: "Event Taxonomy", slug: "events" },
			{ title: "Depth Levels", slug: "depth" },
			{ title: "Bundles & Manifests", slug: "bundle-manifest" },
			{ title: "Evaluation", slug: "eval" },
			{ title: "Architecture Decisions", slug: "architecture-decisions" },
		],
	},
	{
		title: "Integration",
		slug: null,
		children: [
			{ title: "Downstream Integration", slug: "downstream" },
			{ title: "MCP / AI Agents", slug: "mcp" },
			{ title: "Analytics with DuckDB", slug: "analytics" },
			{ title: "Notebooks", slug: "notebooks" },
			{ title: "Cron Monitoring", slug: "cron" },
		],
	},
	{
		title: "Tutorials",
		slug: null,
		children: [
			{ title: "Wikipedia History", slug: "tutorials/wikipedia-history" },
			{ title: "Fandom Canon", slug: "tutorials/fandom-canon" },
			{ title: "Citation Churn", slug: "tutorials/citation-churn" },
			{ title: "Dispute Timeline", slug: "tutorials/dispute-timeline" },
			{ title: "Cross-Wiki Diff", slug: "tutorials/cross-wiki-diff" },
			{ title: "Refract UI", slug: "tutorials/refract-ui" },
		],
	},
	{
		title: "Appendix",
		slug: null,
		children: [
			{ title: "Glossary", slug: "glossary" },
			{ title: "FAQ", slug: "faq" },
			{ title: "Interpreting Output", slug: "interpretation" },
			{ title: "Security", slug: "security" },
			{ title: "Boundary", slug: "boundary" },
			{ title: "Naming", slug: "naming" },
			{ title: "Frontier Use Cases", slug: "frontier-use-cases" },
			{ title: "Contributing to Docs", slug: "contributing-docs" },
		],
	},
];

function resolveTitle(slug) {
	for (const item of NAV) {
		if (item.slug === slug) return item.title;
		if (item.children) {
			for (const child of item.children) {
				if (child.slug === slug) return child.title;
			}
		}
	}
	return basename(slug);
}

function slugHref(slug) {
	return slug === "index" ? BASE : `${BASE}${slug}/`;
}

function renderNav(currentSlug) {
	function link(item) {
		const isActive = item.slug === currentSlug;
		const cls = isActive ? "nav-link active" : "nav-link";
		return `<a href="${slugHref(item.slug)}" class="${cls}">${item.title}</a>`;
	}

	let html = "";
	for (const item of NAV) {
		if (item.children) {
			const parentActive = item.children.some((c) => c.slug === currentSlug);
			html += `<div class="nav-section">${item.title}</div>`;
			html += `<div class="nav-group${parentActive ? " open" : ""}">`;
			for (const child of item.children) {
				html += link(child);
			}
			html += "</div>";
		} else {
			html += link(item);
		}
	}
	return html;
}

function plainText(tokens) {
	return tokens
		.map((token) => {
			if (token.tokens) return plainText(token.tokens);
			return token.text ?? token.raw ?? "";
		})
		.join("");
}

function slugifyHeading(text) {
	return text
		.toLowerCase()
		.trim()
		.replace(/[`]/g, "")
		.replace(/[^\w\s-]/g, "")
		.replace(/\s/g, "-");
}

function wrapHTML(title, content, currentSlug) {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Refract</title>
  <link rel="stylesheet" href="${BASE}style.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>◈</text></svg>">
  <meta name="description" content="Refract — the open claim-history layer for public knowledge. Deterministic event stream of claims, sources, and disputes across revision histories.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Manrope:wght@300;400;500;600;700&family=Recursive:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <input type="checkbox" id="menu-toggle" class="menu-toggle">
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <a href="${BASE}" class="brand">Refract</a>
        <p class="tagline">The open claim-history layer<br>for public knowledge.</p>
      </div>
      <nav class="sidebar-nav">
        ${renderNav(currentSlug)}
      </nav>
      <div class="sidebar-footer">
        <a href="https://github.com/refract-org/refract" class="sidebar-link">GitHub</a>
        <a href="https://www.npmjs.com/org/refract-org" class="sidebar-link">npm packages</a>
      </div>
    </aside>
    <label for="menu-toggle" class="menu-overlay"></label>
    <main class="content">
      <label for="menu-toggle" class="menu-btn" aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </label>
      ${content}
    </main>
  </div>
</body>
</html>`;
}

function rewriteLink(href, sourceDir = "") {
	if (!href) return href;
	if (href.startsWith("http") || href.startsWith("#")) return href;

	const [, rawPath = "", suffix = ""] = href.match(/^([^?#]*)([?#].*)?$/) ?? [];
	if (!rawPath) return href;

	let path = rawPath.replace(/\.md$/, "/");
	if (sourceDir && !path.startsWith("/")) {
		path = `${sourceDir}/${path}`;
	}

	path = posix.normalize(path);
	if (path === "." || path === "index") return `${BASE}${suffix}`;
	if (path === "index/") return `${BASE}${suffix}`;

	const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
	return `${BASE}${normalizedPath}${suffix}`;
}

async function collectFiles(dir, base = "") {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];
	const assets = [];
	for (const entry of entries) {
		const fp = join(dir, entry.name);
		const rel = base ? `${base}/${entry.name}` : entry.name;
		if (entry.isDirectory()) {
			const res = await collectFiles(fp, rel);
			files.push(...res.files);
			assets.push(...res.assets);
		} else if (entry.name.endsWith(".md")) {
			files.push({ path: fp, slug: rel.replace(/\.md$/, "") });
		} else {
			assets.push({ path: fp, rel });
		}
	}
	return { files, assets };
}

async function build() {
	await rm(DIST_DIR, { recursive: true, force: true });
	await mkdir(DIST_DIR, { recursive: true });

	const { files, assets } = await collectFiles(DOCS_DIR);

	const renderer = new marked.Renderer();
	let currentSourceDir = "";
	let currentHeadingCounts = new Map();
	renderer.link = ({ href, title, text }) => {
		const h = rewriteLink(href, currentSourceDir);
		const t = title ? ` title="${title}"` : "";
		return `<a href="${h}"${t}>${text}</a>`;
	};
	renderer.image = ({ href, title, text }) => {
		const h = rewriteLink(href, currentSourceDir);
		const t = title ? ` title="${title}"` : "";
		return `<img src="${h}" alt="${text}"${t}>`;
	};
	renderer.heading = function ({ tokens, depth }) {
		const text = this.parser.parseInline(tokens);
		const baseSlug = slugifyHeading(plainText(tokens));
		const count = currentHeadingCounts.get(baseSlug) ?? 0;
		currentHeadingCounts.set(baseSlug, count + 1);
		const slug = count === 0 ? baseSlug : `${baseSlug}-${count}`;
		return `<h${depth} id="${slug}">${text}</h${depth}>`;
	};

	marked.use({ gfm: true, breaks: false });

	for (const file of files) {
		const raw = await readFile(file.path, "utf-8");
		currentSourceDir = dirname(file.slug);
		if (currentSourceDir === ".") currentSourceDir = "";
		currentHeadingCounts = new Map();
		const body = marked.parse(raw, { renderer });
		const h1Match = raw.match(/^#\s+(.+)/m);
		const title = h1Match ? h1Match[1] : resolveTitle(file.slug);
		const html = wrapHTML(title, body, file.slug);

		if (file.slug === "index") {
			await writeFile(join(DIST_DIR, "index.html"), html);
		} else {
			const outDir = join(DIST_DIR, file.slug);
			await mkdir(outDir, { recursive: true });
			await writeFile(join(outDir, "index.html"), html);
		}
	}

	for (const asset of assets) {
		const dest = join(DIST_DIR, asset.rel);
		await mkdir(dirname(dest), { recursive: true });
		await cp(asset.path, dest);
	}

	await cp(ASSETS_DIR, DIST_DIR, { recursive: true });
	console.log(
		`Built ${files.length} pages and copied ${assets.length} assets to dist/`,
	);
}

build().catch((err) => {
	console.error(err);
	process.exit(1);
});
