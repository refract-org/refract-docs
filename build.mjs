import { execFileSync } from "node:child_process";
import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = join(__dirname, "docs");
const DIST_DIR = join(__dirname, "dist");
const ASSETS_DIR = join(__dirname, "assets");
const BASE = process.env.BASE || "/refract-docs/";

function assetVersion() {
	if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 12);
	try {
		return execFileSync("git", ["rev-parse", "--short=12", "HEAD"], {
			cwd: __dirname,
			encoding: "utf-8",
		})
			.trim()
			.replace(/[^\w.-]/g, "");
	} catch {
		return "dev";
	}
}

const ASSET_VERSION = assetVersion();

let NAV = [];

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

function getExcerpt(markdown) {
	// Remove code blocks
	let text = markdown.replace(/```[\s\S]*?```/g, "");
	// Remove inline code tags
	text = text.replace(/`([^`]+)`/g, "$1");
	// Remove HTML tags
	text = text.replace(/<[^>]*>/g, "");
	// Remove markdown links
	text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
	// Remove headings
	text = text.replace(/^#+\s+.+$/gm, "");
	// Get first non-empty lines
	const lines = text
		.split("\n")
		.map((l) => l.trim())
		.filter(Boolean);
	if (lines.length === 0) return "";
	const firstLine = lines[0];
	return firstLine.length > 140 ? `${firstLine.slice(0, 137)}...` : firstLine;
}

function wrapHTML(title, content, currentSlug, headings = []) {
	let tocHtml = "";
	if (headings.length > 0) {
		tocHtml += `<div class="toc-title">On this page</div>`;
		tocHtml += `<div class="toc-links">`;
		for (const h of headings) {
			const cls = h.depth === 3 ? "toc-link depth-3" : "toc-link";
			tocHtml += `<a href="#${h.id}" class="${cls}">${h.text}</a>`;
		}
		tocHtml += `</div>`;
	}
	const hasToc = headings.length > 0;
	const tocStyle = hasToc ? "" : ' style="display: none;"';

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Refract</title>
  <link rel="stylesheet" href="${BASE}style.css?v=${ASSET_VERSION}">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>◈</text></svg>">
  <meta name="description" content="Refract — the open claim-history layer for public knowledge. Deterministic event stream of claims, sources, and disputes across revision histories.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Manrope:wght@300;400;500;600;700&family=Recursive:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <div id="progress" aria-hidden="true"></div>
  <input type="checkbox" id="menu-toggle" class="menu-toggle">
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <a href="${BASE}" class="brand">Refract</a>
        <p class="tagline">The open claim-history layer<br>for public knowledge.</p>
        <div class="sidebar-search">
          <button class="search-trigger" id="search-trigger" aria-label="Search documentation">
            <svg class="search-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>Search docs...</span>
            <kbd class="search-shortcut">/</kbd>
          </button>
        </div>
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
    <div class="content-container">
      <main class="content">
        <label for="menu-toggle" class="menu-btn" aria-label="Toggle menu">
          <span></span><span></span><span></span>
        </label>
        ${content}
      </main>
      <aside class="toc-sidebar" aria-label="Table of Contents"${tocStyle}>
        ${tocHtml}
      </aside>
    </div>
  </div>

  <!-- Search Modal -->
  <div class="search-modal-backdrop" id="search-modal-backdrop">
    <div class="search-modal">
      <div class="search-modal-header">
        <div class="search-modal-input-wrapper">
          <svg class="search-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" class="search-modal-input" id="search-modal-input" placeholder="Search documentation..." autocomplete="off">
        </div>
        <button class="search-modal-close" id="search-modal-close">ESC</button>
      </div>
      <div class="search-modal-results" id="search-modal-results">
        <div class="search-no-results">Type something to search...</div>
      </div>
      <div class="search-modal-footer">
        <span><kbd>↑↓</kbd> Navigate</span>
        <span><kbd>Enter</kbd> Select</span>
        <span><kbd>Esc</kbd> Close</span>
      </div>
    </div>
  </div>

  <script>
    // 1. Scroll Progress Bar fallback
    if (!CSS.supports('animation-timeline', 'scroll()')) {
      const progress = document.querySelector('#progress');
      if (progress) {
        window.addEventListener('scroll', () => {
          const scrollable = document.documentElement.scrollHeight - window.innerHeight;
          const scrolled = window.scrollY;
          const progressPercentage = scrollable > 0 ? (scrolled / scrollable) : 0;
          progress.style.transform = 'scaleX(' + progressPercentage + ')';
        }, { passive: true });
      }
    }

    // 2. Scroll-Spy TOC highlighting
    const links = document.querySelectorAll('.toc-link');
    const headings = document.querySelectorAll('.content h2, .content h3');
    let activeHeadingId = null;

    if (links.length > 0 && headings.length > 0) {
      const observerOptions = {
        root: null,
        rootMargin: '0px 0px -60% 0px',
        threshold: 0
      };

      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            activeHeadingId = entry.target.id;
            updateActiveTocLink();
          }
        }
      }, observerOptions);

      headings.forEach((h) => {
        if (h.id) observer.observe(h);
      });

      function updateActiveTocLink() {
        if (!activeHeadingId) return;
        links.forEach((link) => {
          const href = link.getAttribute('href');
          if (href === '#' + activeHeadingId) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }

      window.addEventListener('scroll', () => {
        let current = "";
        for (const h of headings) {
          if (window.scrollY >= h.offsetTop - 120) {
            current = h.id;
          }
        }
        if (current && current !== activeHeadingId) {
          activeHeadingId = current;
          updateActiveTocLink();
        }
      }, { passive: true });
    }

    // 3. Floating Copy Button on Code Blocks
    document.querySelectorAll('.content pre').forEach((preBlock) => {
      const code = preBlock.querySelector('code');
      if (!code) return;
      
      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copy</span>';
      
      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(code.innerText);
          btn.classList.add('copied');
          btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Copied!</span>';
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copy</span>';
          }, 2000);
        } catch (err) {
          console.error('Failed to copy text: ', err);
        }
      });
      
      preBlock.appendChild(btn);
    });

    // 4. Interactive Search
    const backdrop = document.getElementById('search-modal-backdrop');
    const trigger = document.getElementById('search-trigger');
    const closeBtn = document.getElementById('search-modal-close');
    const searchInput = document.getElementById('search-modal-input');
    const resultsContainer = document.getElementById('search-modal-results');
    
    let indexLoaded = false;
    let searchData = [];
    let selectedIndex = -1;
    let currentResults = [];

    async function loadSearchIndex() {
      if (indexLoaded) return;
      try {
        const resp = await fetch('${BASE}search-index.json');
        searchData = await resp.json();
        indexLoaded = true;
      } catch (err) {
        console.error('Failed to load search index:', err);
      }
    }

    function openSearch() {
      backdrop.style.display = 'flex';
      backdrop.offsetHeight;
      backdrop.classList.add('open');
      searchInput.focus();
      loadSearchIndex();
      document.body.style.overflow = 'hidden';
    }

    function closeSearch() {
      backdrop.classList.remove('open');
      setTimeout(() => {
        backdrop.style.display = 'none';
      }, 200);
      document.body.style.overflow = '';
      searchInput.value = '';
      resultsContainer.innerHTML = '<div class="search-no-results">Type something to search...</div>';
      currentResults = [];
      selectedIndex = -1;
    }

    trigger?.addEventListener('click', openSearch);
    closeBtn?.addEventListener('click', closeSearch);
    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) closeSearch();
    });

    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearch();
      } else if (e.key === '/' && document.activeElement !== searchInput && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        openSearch();
      } else if (e.key === 'Escape' && backdrop.classList.contains('open')) {
        closeSearch();
      }
    });

    searchInput?.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      if (!query) {
        resultsContainer.innerHTML = '<div class="search-no-results">Type something to search...</div>';
        currentResults = [];
        selectedIndex = -1;
        return;
      }
      performSearch(query);
    });

    function performSearch(query) {
      const results = [];
      for (const page of searchData) {
        const titleMatch = page.title.toLowerCase().includes(query);
        const excerptMatch = page.excerpt.toLowerCase().includes(query);
        const matchedHeadings = page.headings.filter(h => h.text.toLowerCase().includes(query));
        
        if (titleMatch || excerptMatch || matchedHeadings.length > 0) {
          results.push({
            page,
            titleMatch,
            excerptMatch,
            matchedHeadings
          });
        }
      }
      
      if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="search-no-results">No results found for "' + escapeHtml(query) + '"</div>';
        currentResults = [];
        selectedIndex = -1;
        return;
      }
      
      currentResults = [];
      let html = '';
      for (const res of results) {
        html += '<div class="search-result-group">';
        html += '  <div class="search-result-group-title">' + escapeHtml(res.page.title) + '</div>';
        
        const href = res.page.slug === 'index' ? '${BASE}' : '${BASE}' + res.page.slug + '/';
        const itemIndex = currentResults.length;
        currentResults.push({ href, title: res.page.title });
        
        html += '  <div class="search-result-item" data-index="' + itemIndex + '" data-href="' + href + '">';
        html += '    <div class="search-result-item-title">' + highlightText(res.page.title, query) + '</div>';
        if (res.page.excerpt) {
          html += '    <div class="search-result-item-excerpt">' + highlightText(res.page.excerpt, query) + '</div>';
        }
        html += '  </div>';
        
        for (const h of res.matchedHeadings) {
          const hHref = href + '#' + h.id;
          const hIndex = currentResults.length;
          currentResults.push({ href: hHref, title: res.page.title + ' > ' + h.text });
          
          html += '  <div class="search-result-item" data-index="' + hIndex + '" data-href="' + hHref + '">';
          html += '    <div class="search-result-item-title" style="padding-left: 12px; border-left: 1px solid var(--border); font-size: 0.78rem;">';
          html += '      <span style="color: var(--text-dim);">#</span> ' + highlightText(h.text, query);
          html += '    </div>';
          html += '  </div>';
        }
        html += '</div>';
      }
      
      resultsContainer.innerHTML = html;
      selectedIndex = 0;
      updateSelection();
      
      document.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const href = item.getAttribute('data-href');
          window.location.href = href;
        });
      });
    }

    function updateSelection() {
      const items = document.querySelectorAll('.search-result-item');
      items.forEach((item, idx) => {
        if (idx === selectedIndex) {
          item.classList.add('selected');
          item.scrollIntoView({ block: 'nearest' });
        } else {
          item.classList.remove('selected');
        }
      });
    }

    function escapeHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function highlightText(text, query) {
      const idx = text.toLowerCase().indexOf(query);
      if (idx === -1) return escapeHtml(text);
      const before = text.slice(0, idx);
      const match = text.slice(idx, idx + query.length);
      const after = text.slice(idx + query.length);
      return escapeHtml(before) + '<mark>' + escapeHtml(match) + '</mark>' + escapeHtml(after);
    }

    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentResults.length > 0) {
          selectedIndex = (selectedIndex + 1) % currentResults.length;
          updateSelection();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentResults.length > 0) {
          selectedIndex = (selectedIndex - 1 + currentResults.length) % currentResults.length;
          updateSelection();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < currentResults.length) {
          window.location.href = currentResults[selectedIndex].href;
        }
      }
    });
  </script>
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
	NAV = JSON.parse(await readFile(join(DOCS_DIR, "nav.json"), "utf-8"));

	await rm(DIST_DIR, { recursive: true, force: true });
	await mkdir(DIST_DIR, { recursive: true });

	const { files, assets } = await collectFiles(DOCS_DIR);

	const searchIndex = [];
	const renderer = new marked.Renderer();
	let currentSourceDir = "";
	let currentHeadingCounts = new Map();
	let currentHeadings = [];

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
		if (depth === 2 || depth === 3) {
			currentHeadings.push({ text: plainText(tokens), id: slug, depth });
		}
		return `<h${depth} id="${slug}">${text}</h${depth}>`;
	};

	marked.use({ gfm: true, breaks: false });

	for (const file of files) {
		const raw = await readFile(file.path, "utf-8");
		currentSourceDir = dirname(file.slug);
		if (currentSourceDir === ".") currentSourceDir = "";
		currentHeadingCounts = new Map();
		currentHeadings = [];
		const body = marked.parse(raw, { renderer });
		const h1Match = raw.match(/^#\s+(.+)/m);
		const title = h1Match ? h1Match[1] : resolveTitle(file.slug);
		const html = wrapHTML(title, body, file.slug, currentHeadings);

		if (file.slug === "index") {
			await writeFile(join(DIST_DIR, "index.html"), html);
		} else {
			const outDir = join(DIST_DIR, file.slug);
			await mkdir(outDir, { recursive: true });
			await writeFile(join(outDir, "index.html"), html);
		}

		searchIndex.push({
			title,
			slug: file.slug,
			excerpt: getExcerpt(raw),
			headings: currentHeadings.map((h) => ({ text: h.text, id: h.id })),
		});
	}

	await writeFile(
		join(DIST_DIR, "search-index.json"),
		JSON.stringify(searchIndex, null, 2),
	);

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
