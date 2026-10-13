// Turns the built site in dist/ into a redirect-only site.
//
// The documentation now lives in the refract repository (apps/docs) and is
// published at https://refract-org.github.io/refract/. Run after
// `npm run build`: every page under /refract-docs/ is replaced by one that
// sends the reader to the same page at the new address, keeping any query and
// fragment. Everything that is not a page (images, the notebook, the sitemap)
// stays where it was, so a link straight to an image keeps working. 404.html
// catches any other path, which GitHub Pages serves for a missing one.
import { readdir, writeFile } from "node:fs/promises";
import { dirname, join, posix, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = join(dirname(fileURLToPath(import.meta.url)), "dist");
const OLD_BASE = "/refract-docs/";
const NEW_SITE = "https://refract-org.github.io/refract/";

async function* files(dir) {
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) yield* files(path);
		else yield path;
	}
}

function escapeAttribute(value) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;");
}

function page(target, script) {
	const href = escapeAttribute(target);
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Refract documentation has moved</title>
<link rel="canonical" href="${href}">
<meta http-equiv="refresh" content="0; url=${href}">
<script>${script}</script>
</head>
<body>
<p>The Refract documentation has moved to <a href="${href}">${href}</a>.</p>
</body>
</html>
`;
}

let redirected = 0;
for await (const path of files(DIST)) {
	const rel = relative(DIST, path).split(sep).join(posix.sep);
	if (!rel.endsWith(".html")) continue;
	const target =
		rel === "index.html"
			? NEW_SITE
			: rel.endsWith("/index.html")
				? `${NEW_SITE}${rel.slice(0, -"index.html".length)}`
				: `${NEW_SITE}${rel}`;
	await writeFile(
		path,
		page(
			target,
			`location.replace(${JSON.stringify(target)} + location.search + location.hash);`,
		),
	);
	redirected++;
}

const prefix = JSON.stringify(OLD_BASE.slice(0, -1));
await writeFile(
	join(DIST, "404.html"),
	page(
		NEW_SITE,
		`var path = location.pathname;
if (path.indexOf(${prefix}) === 0) path = path.slice(${prefix}.length);
location.replace(${JSON.stringify(NEW_SITE.slice(0, -1))} + path + location.search + location.hash);`,
	),
);

console.log(
	`Replaced ${redirected} pages with redirects to ${NEW_SITE} and wrote 404.html.`,
);
