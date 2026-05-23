import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { marked } from "marked";
import { beforeAll, describe, expect, it } from "vitest";

const ROOT_DIR = resolve(__dirname, "..");
const DOCS_DIR = join(ROOT_DIR, "docs");
const DIST_DIR = join(ROOT_DIR, "dist");
const SITE_BASE = "/refract-docs";
const execFileAsync = promisify(execFile);

// Helper to recursively find all .md files
async function findMarkdownFiles(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true });
	const files: string[] = [];
	for (const entry of entries) {
		const fp = join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await findMarkdownFiles(fp)));
		} else if (entry.name.endsWith(".md")) {
			files.push(fp);
		}
	}
	return files;
}

async function findHtmlFiles(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true });
	const files: string[] = [];
	for (const entry of entries) {
		const fp = join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await findHtmlFiles(fp)));
		} else if (entry.name.endsWith(".html")) {
			files.push(fp);
		}
	}
	return files;
}

// Extract all links/images from markdown content using marked
function extractLinks(content: string): string[] {
	const links: string[] = [];
	const renderer = new marked.Renderer();

	// Collect markdown links
	renderer.link = ({ href }) => {
		if (href) links.push(href);
		return "";
	};

	// Collect images
	renderer.image = ({ href }) => {
		if (href) links.push(href);
		return "";
	};

	marked.parse(content, { renderer });

	// Extract HTML links (like <a href="...">) since index.md uses them.
	const htmlLinkRegex = /href=["']([^"']+)["']/g;
	let match = htmlLinkRegex.exec(content);
	while (match !== null) {
		links.push(match[1]);
		match = htmlLinkRegex.exec(content);
	}

	// Extract HTML src attributes for images (if any)
	const htmlSrcRegex = /src=["']([^"']+)["']/g;
	let srcMatch = htmlSrcRegex.exec(content);
	while (srcMatch !== null) {
		links.push(srcMatch[1]);
		srcMatch = htmlSrcRegex.exec(content);
	}

	return Array.from(new Set(links));
}

function checkLink(
	sourceFile: string,
	href: string,
): { isValid: boolean; resolvedPath: string } {
	// Ignore external links
	if (
		href.startsWith("http://") ||
		href.startsWith("https://") ||
		href.startsWith("mailto:") ||
		href.startsWith("data:") ||
		href.startsWith("javascript:")
	) {
		return { isValid: true, resolvedPath: href };
	}

	// Remove anchor hash and query params
	const [pathPart] = href.split(/[?#]/);
	if (!pathPart) {
		return { isValid: true, resolvedPath: href }; // Page-internal anchor
	}

	let resolvedPath: string;
	if (pathPart.startsWith("/")) {
		// Root-relative
		// Try relative to docs first, then relative to repository root
		const docsPath = join(DOCS_DIR, pathPart.slice(1));
		const rootPath = join(ROOT_DIR, pathPart.slice(1));

		if (existsSync(docsPath) || existsSync(`${docsPath}.md`)) {
			return { isValid: true, resolvedPath: docsPath };
		}
		if (existsSync(rootPath)) {
			return { isValid: true, resolvedPath: rootPath };
		}
		resolvedPath = docsPath;
	} else {
		// Relative to the source file
		resolvedPath = join(dirname(sourceFile), pathPart);
	}

	// 1. Exact path matches
	if (existsSync(resolvedPath)) {
		return { isValid: true, resolvedPath };
	}

	// Clean up trailing slash for further existence checks (e.g. appending .md)
	const cleanResolvedPath = resolvedPath.endsWith("/")
		? resolvedPath.slice(0, -1)
		: resolvedPath;

	// 1b. If it's an asset file (ends with .svg, .css, etc.), check if it exists in the ROOT_DIR/assets directory
	const isAssetExtension = /\.(svg|css|png|jpg|jpeg|gif|webp|ico|ipynb)$/i.test(
		pathPart,
	);
	if (isAssetExtension) {
		const assetName = basename(pathPart);
		const assetPath = join(ROOT_DIR, "assets", assetName);
		if (existsSync(assetPath)) {
			return { isValid: true, resolvedPath: assetPath };
		}
	}

	// 1c. Try resolving relative to the compiled output directory structure
	if (sourceFile.startsWith(DOCS_DIR)) {
		const relToDocs = sourceFile.slice(DOCS_DIR.length + 1); // e.g. "demo.md" or "tutorials/wikipedia-history.md"
		const slug = relToDocs.replace(/\.md$/, "");
		const outputDir = slug === "index" ? DOCS_DIR : join(DOCS_DIR, slug);
		const resolvedOutputDirPath = join(outputDir, pathPart);
		const cleanOutputDirPath = resolvedOutputDirPath.endsWith("/")
			? resolvedOutputDirPath.slice(0, -1)
			: resolvedOutputDirPath;

		if (
			existsSync(resolvedOutputDirPath) ||
			existsSync(`${cleanOutputDirPath}.md`)
		) {
			return { isValid: true, resolvedPath: resolvedOutputDirPath };
		}
		if (pathPart.endsWith("/")) {
			if (
				existsSync(`${cleanOutputDirPath}.md`) ||
				existsSync(join(resolvedOutputDirPath, "index.md"))
			) {
				return { isValid: true, resolvedPath: `${cleanOutputDirPath}.md` };
			}
		}
	}

	// 2. Markdown file referenced without extension (e.g. quickstart -> quickstart.md)
	if (existsSync(`${cleanResolvedPath}.md`)) {
		return { isValid: true, resolvedPath: `${cleanResolvedPath}.md` };
	}

	// 3. Trailing slash / folder references
	if (pathPart.endsWith("/")) {
		if (existsSync(`${cleanResolvedPath}.md`)) {
			return { isValid: true, resolvedPath: `${cleanResolvedPath}.md` };
		}
		if (existsSync(join(resolvedPath, "index.md"))) {
			return { isValid: true, resolvedPath: join(resolvedPath, "index.md") };
		}
	}

	// 4. No extension reference to file inside folder or sibling folder
	if (existsSync(`${cleanResolvedPath}.md`)) {
		return { isValid: true, resolvedPath: `${cleanResolvedPath}.md` };
	}

	return { isValid: false, resolvedPath };
}

function isExternalLink(href: string): boolean {
	return /^(https?:|mailto:|data:|javascript:)/.test(href);
}

function normalizeUrlPath(path: string): string {
	const parts: string[] = [];
	for (const part of path.split("/")) {
		if (!part || part === ".") continue;
		if (part === "..") {
			parts.pop();
		} else {
			parts.push(part);
		}
	}
	return `/${parts.join("/")}${path.endsWith("/") ? "/" : ""}`;
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function checkGeneratedLink(
	sourceFile: string,
	href: string,
): Promise<{ isValid: boolean; resolvedPath: string }> {
	if (isExternalLink(href) || href.startsWith("#")) {
		return { isValid: true, resolvedPath: href };
	}

	const [pathAndQuery, hash] = href.split("#");
	const [pathPart] = pathAndQuery.split("?");
	if (!pathPart) {
		return { isValid: true, resolvedPath: href };
	}

	const relativeDir = dirname(sourceFile)
		.replace(DIST_DIR, "")
		.replaceAll("\\", "/");
	const pagePath = `${SITE_BASE}${relativeDir === "/" ? "" : relativeDir}/`;
	const urlPath = normalizeUrlPath(
		pathPart.startsWith("/") ? pathPart : `${pagePath}${pathPart}`,
	);

	if (!(urlPath === `${SITE_BASE}/` || urlPath.startsWith(`${SITE_BASE}/`))) {
		return { isValid: false, resolvedPath: urlPath };
	}

	const diskPath = urlPath.slice(SITE_BASE.length) || "/";
	let resolvedPath = diskPath.endsWith("/")
		? join(DIST_DIR, diskPath, "index.html")
		: join(DIST_DIR, diskPath);

	try {
		const pathStat = await stat(resolvedPath);
		if (pathStat.isDirectory()) {
			resolvedPath = join(resolvedPath, "index.html");
			await stat(resolvedPath);
		}
		if (hash) {
			const html = await readFile(resolvedPath, "utf-8");
			const decodedHash = decodeURIComponent(hash);
			const idPattern = new RegExp(`id=["']${escapeRegExp(decodedHash)}["']`);
			if (!idPattern.test(html)) {
				return {
					isValid: false,
					resolvedPath: `${resolvedPath}#${decodedHash}`,
				};
			}
		}
		return { isValid: true, resolvedPath };
	} catch {
		return { isValid: false, resolvedPath };
	}
}

describe("Documentation Links Validator", async () => {
	const mdFiles = await findMarkdownFiles(DOCS_DIR);
	// Also include the root README.md
	mdFiles.push(join(ROOT_DIR, "README.md"));

	for (const file of mdFiles) {
		const relativeFilePath = file.replace(`${ROOT_DIR}/`, "");

		it(`should have valid links in ${relativeFilePath}`, async () => {
			const content = await readFile(file, "utf-8");
			const hrefs = extractLinks(content);
			const invalidLinks: string[] = [];

			for (const href of hrefs) {
				const { isValid, resolvedPath } = checkLink(file, href);
				if (!isValid) {
					invalidLinks.push(`${href} (resolved: ${resolvedPath})`);
				}
			}

			expect(
				invalidLinks,
				`Found broken links in ${relativeFilePath}:\n${invalidLinks.join("\n")}`,
			).toEqual([]);
		});
	}
});

describe("Generated site links", async () => {
	beforeAll(async () => {
		await execFileAsync(process.execPath, ["build.mjs"], { cwd: ROOT_DIR });
	});

	it("should have valid internal links after build", async () => {
		const htmlFiles = await findHtmlFiles(DIST_DIR);
		const invalidLinks: string[] = [];

		for (const file of htmlFiles) {
			const relativeFilePath = file.replace(`${DIST_DIR}/`, "");
			const html = await readFile(file, "utf-8");
			const hrefs = extractLinks(html);

			for (const href of hrefs) {
				const { isValid, resolvedPath } = await checkGeneratedLink(file, href);
				if (!isValid) {
					invalidLinks.push(
						`${relativeFilePath}: ${href} (resolved: ${resolvedPath})`,
					);
				}
			}
		}

		expect(
			invalidLinks,
			`Found broken generated links:\n${invalidLinks.join("\n")}`,
		).toEqual([]);
	});
});
