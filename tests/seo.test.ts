import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { beforeAll, describe, expect, it } from "vitest";

const ROOT_DIR = resolve(__dirname, "..");
const DIST_DIR = join(ROOT_DIR, "dist");
const SITE_URL = "https://refract-org.github.io/refract-docs/";
const SITE_DESCRIPTION =
	"Refract — the open claim-history layer for public knowledge. Deterministic event stream of claims, sources, and disputes across revision histories.";
// Pages that use the site description: the home page by design, and pages with
// no prose paragraph to describe them (the build logs these).
const SITE_DESCRIPTION_PAGES = ["glossary", "index"];
const execFileAsync = promisify(execFile);

type Page = { slug: string; title: string; html: string };
type JsonLdNode = Record<string, unknown> & { "@type": string };

function canonicalFor(slug: string): string {
	return slug === "index" ? SITE_URL : `${SITE_URL}${slug}/`;
}

function decodeEntities(text: string): string {
	return text
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&amp;/g, "&");
}

function metaContents(html: string, attr: string, key: string): string[] {
	const pattern = new RegExp(`<meta ${attr}="${key}" content="([^"]*)">`, "g");
	return Array.from(html.matchAll(pattern), (match) =>
		decodeEntities(match[1]),
	);
}

function descriptionOf(html: string): string {
	return metaContents(html, "name", "description")[0] ?? "";
}

// Visible text of an HTML fragment: tags dropped, entities decoded,
// whitespace collapsed.
function textOf(fragment: string): string {
	return decodeEntities(fragment.replace(/<[^>]+>/g, ""))
		.replace(/\s+/g, " ")
		.trim();
}

function stringsIn(value: unknown): string[] {
	if (typeof value === "string") return [value];
	if (Array.isArray(value)) return value.flatMap(stringsIn);
	if (value && typeof value === "object") {
		return Object.values(value).flatMap(stringsIn);
	}
	return [];
}

function canonicals(html: string): string[] {
	return Array.from(
		html.matchAll(/<link rel="canonical" href="([^"]*)">/g),
		(match) => decodeEntities(match[1]),
	);
}

function jsonLdGraph(html: string): JsonLdNode[] {
	const blocks = Array.from(
		html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
		(match) => JSON.parse(match[1]),
	);
	expect(blocks).toHaveLength(1);
	expect(blocks[0]["@context"]).toBe("https://schema.org");
	return blocks[0]["@graph"];
}

function nodeOfType(graph: JsonLdNode[], type: string): JsonLdNode {
	const node = graph.find((entry) => entry["@type"] === type);
	expect(node, `missing ${type} node`).toBeDefined();
	return node as JsonLdNode;
}

describe("technical SEO", () => {
	const pages: Page[] = [];

	beforeAll(async () => {
		await execFileAsync(process.execPath, ["build.mjs"], { cwd: ROOT_DIR });
		// The search index lists every rendered page; claims-e2e checks that.
		const searchIndex = JSON.parse(
			await readFile(join(DIST_DIR, "search-index.json"), "utf-8"),
		) as Array<{ slug: string; title: string }>;
		for (const { slug, title } of searchIndex) {
			const file =
				slug === "index"
					? join(DIST_DIR, "index.html")
					: join(DIST_DIR, slug, "index.html");
			pages.push({ slug, title, html: await readFile(file, "utf-8") });
		}
		expect(pages.length).toBeGreaterThan(1);
	});

	it("gives every page one canonical URL, at the address it is served from", () => {
		for (const { slug, html } of pages) {
			expect(canonicals(html), slug).toEqual([canonicalFor(slug)]);
		}
	});

	it("titles each page with the visible text of its H1", () => {
		for (const { slug, title, html } of pages) {
			const h1 = html.match(/<h1 [^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "";
			expect(title, slug).toBe(textOf(h1));
			expect(html, slug).toContain(`<title>${title} — Refract</title>`);
		}
		const crossWiki = pages.find((page) =>
			page.slug.endsWith("cross-wiki-diff"),
		);
		expect(crossWiki?.title).toBe(
			"Tutorial: Cross-wiki comparison with refract diff",
		);
	});

	it("keeps the site description on the home page", () => {
		const home = pages.find((page) => page.slug === "index");
		expect(descriptionOf(home?.html ?? "")).toBe(SITE_DESCRIPTION);
	});

	it("gives each doc page its own description, apart from listed fallbacks", () => {
		const fallbacks = pages
			.filter(({ html }) => descriptionOf(html) === SITE_DESCRIPTION)
			.map(({ slug }) => slug)
			.sort();
		expect(fallbacks).toEqual(SITE_DESCRIPTION_PAGES);

		const descriptions = pages
			.filter(({ slug }) => !SITE_DESCRIPTION_PAGES.includes(slug))
			.map(({ html }) => descriptionOf(html));
		expect(new Set(descriptions).size).toBe(descriptions.length);
	});

	it("takes each description from the page's own text, cut at a word boundary", () => {
		for (const { slug, html } of pages) {
			if (SITE_DESCRIPTION_PAGES.includes(slug)) continue;
			const description = descriptionOf(html);
			const main = html.match(/<main class="content">([\s\S]*?)<\/main>/);
			const body = textOf(main?.[1] ?? "");
			const cut = description.endsWith("…");
			const prefix = cut ? description.slice(0, -1) : description;
			const at = body.indexOf(prefix);

			expect(at, `${slug}: ${description}`).toBeGreaterThanOrEqual(0);
			if (cut) {
				expect(body[at + prefix.length], slug).toMatch(/[^\p{L}\p{N}]/u);
			}
		}
	});

	it("keeps every description to 160 characters or fewer", () => {
		for (const { slug, html } of pages) {
			const description = descriptionOf(html);
			expect(description.length, `${slug}: ${description}`).toBeLessThanOrEqual(
				160,
			);
			expect(description.length, slug).toBeGreaterThan(0);
		}
	});

	it("leaves no markdown backticks or asterisks in titles or descriptions", () => {
		for (const { slug, html } of pages) {
			const texts = [
				textOf(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ""),
				descriptionOf(html),
				...metaContents(html, "property", "og:title"),
				...metaContents(html, "property", "og:description"),
				...stringsIn(jsonLdGraph(html)),
			];
			for (const text of texts) {
				expect(text, slug).not.toMatch(/[`*]/);
			}
		}
	});

	it("emits Open Graph and Twitter card tags that match the page", () => {
		for (const { slug, title, html } of pages) {
			const description = metaContents(html, "name", "description");
			expect(metaContents(html, "property", "og:title"), slug).toEqual([title]);
			expect(metaContents(html, "property", "og:description"), slug).toEqual(
				description,
			);
			expect(metaContents(html, "property", "og:url"), slug).toEqual([
				canonicalFor(slug),
			]);
			expect(metaContents(html, "property", "og:type"), slug).toEqual([
				slug === "index" ? "website" : "article",
			]);
			expect(metaContents(html, "property", "og:site_name"), slug).toEqual([
				"Refract",
			]);
			expect(metaContents(html, "name", "twitter:card"), slug).toEqual([
				"summary",
			]);
		}
	});

	it("escapes titles in attributes and JSON-LD", () => {
		const compare = pages.find((page) => page.slug === "compare");
		expect(compare?.title).toContain("'");
		expect(compare?.html).toContain("Wikipedia&#39;s page history");
		for (const { slug, html } of pages) {
			for (const [, json] of html.matchAll(
				/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
			)) {
				expect(json, slug).not.toContain("<");
			}
		}
	});

	it("describes the home page as a WebSite for the Refract source code", () => {
		const home = pages.find((page) => page.slug === "index");
		const graph = jsonLdGraph(home?.html ?? "");
		const website = nodeOfType(graph, "WebSite");
		const source = nodeOfType(graph, "SoftwareSourceCode");

		expect(website).toMatchObject({ name: "Refract", url: SITE_URL });
		expect(website.description).toBe(
			metaContents(home?.html ?? "", "name", "description")[0],
		);
		expect(source.codeRepository).toBe(
			"https://github.com/refract-org/refract",
		);
		expect(website.about).toEqual({ "@id": source["@id"] });
	});

	it("describes every doc page as a TechArticle with a breadcrumb trail", () => {
		for (const { slug, title, html } of pages) {
			if (slug === "index") continue;
			const url = canonicalFor(slug);
			const graph = jsonLdGraph(html);
			const article = nodeOfType(graph, "TechArticle");
			const breadcrumbs = nodeOfType(graph, "BreadcrumbList");

			expect(article, slug).toMatchObject({
				headline: title,
				description: metaContents(html, "name", "description")[0],
				url,
				isPartOf: { "@type": "WebSite", url: SITE_URL },
			});
			expect(breadcrumbs.itemListElement, slug).toEqual([
				expect.objectContaining({ position: 1, name: "Home", item: SITE_URL }),
				expect.objectContaining({ position: 2, item: url }),
			]);
		}
	});

	it("lists every page once in sitemap.xml, with no guessed lastmod", async () => {
		const sitemap = await readFile(join(DIST_DIR, "sitemap.xml"), "utf-8");
		const locs = Array.from(sitemap.matchAll(/<loc>([^<]*)<\/loc>/g), (m) =>
			decodeEntities(m[1]),
		);

		expect(sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(
			true,
		);
		expect(sitemap).toContain(
			'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		);
		expect(sitemap).not.toContain("<lastmod>");
		expect(new Set(locs).size).toBe(locs.length);
		expect([...locs].sort()).toEqual(
			pages.map((page) => canonicalFor(page.slug)).sort(),
		);
		for (const loc of locs) {
			const diskPath = join(DIST_DIR, loc.slice(SITE_URL.length), "index.html");
			expect(existsSync(diskPath), loc).toBe(true);
		}
	});
});
