/**
 * scripts/build-master-brief.ts
 *
 * Generates `lib/docs-brief.generated.ts` from the markdown sources in
 * `docs/master-brief/*.md`.
 *
 * Why this exists: the Master Brief must be readable as rendered markdown on
 * GitHub (for the client and for anyone reviewing the repo) AND served by the
 * site at `/docs/brief`. Keeping two copies would drift, so the `.md` files are
 * the single source of truth and this script derives the TypeScript the site
 * imports.
 *
 * The markdown stays GitHub-correct: images are referenced relative to the file
 * (`../../public/docs/master-brief/...`). The generator rewrites them to the
 * web path the site serves (`/docs/master-brief/...`).
 *
 * Usage:
 *   tsx scripts/build-master-brief.ts           # write lib/docs-brief.generated.ts
 *   tsx scripts/build-master-brief.ts --check   # fail (exit 1) if out of sync
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, 'docs', 'master-brief');
const OUT_FILE = join(ROOT, 'lib', 'docs-brief.generated.ts');
const CHECK = process.argv.includes('--check');

interface Frontmatter {
  title: string;
  description: string;
  badge?: string;
  category: string;
  slug: string;
  order: number;
  /** Short sidebar label; falls back to `title`. */
  nav?: string;
  /** Short sidebar badge; falls back to `badge`. */
  navBadge?: string;
}

interface Parsed {
  fm: Frontmatter;
  body: string;
}

/** Minimal frontmatter parser — only what this generator writes. */
function parseFrontmatter(raw: string, file: string): Parsed {
  if (!raw.startsWith('---\n')) {
    throw new Error(`${file}: missing frontmatter block`);
  }
  const end = raw.indexOf('\n---', 3);
  if (end === -1) throw new Error(`${file}: unterminated frontmatter`);

  const block = raw.slice(4, end);
  const body = raw.slice(end + 4).replace(/^\n+/, '');

  const values: Record<string, string> = {};
  for (const line of block.split('\n')) {
    if (!line.trim()) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
    values[key] = val;
  }

  for (const req of ['title', 'description', 'category', 'slug', 'order']) {
    if (!values[req]) throw new Error(`${file}: frontmatter is missing "${req}"`);
  }

  return {
    fm: {
      title: values.title!,
      description: values.description!,
      badge: values.badge,
      category: values.category!,
      slug: values.slug!,
      order: Number(values.order),
      nav: values.nav,
      navBadge: values.navBadge
    },
    body
  };
}

/** Must match the id algorithm in components/docs/docs-layout.tsx. */
function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Level-2 headings only — those are the ones the renderer gives ids to. */
function deriveToc(body: string): { id: string; title: string; level: number }[] {
  const toc: { id: string; title: string; level: number }[] = [];
  let inFence = false;
  for (const line of body.split('\n')) {
    if (line.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (line.startsWith('## ')) {
      const title = line.slice(3).trim();
      toc.push({ id: headingId(title), title, level: 2 });
    }
  }
  return toc;
}

/** GitHub-relative image paths -> the path the site serves. */
function toWebPaths(body: string): string {
  return body.replace(/\]\((?:\.\.\/)+public\/docs\//g, '](/docs/');
}

function tsString(s: string): string {
  const escaped = s
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
  return '`' + escaped + '`';
}

function build(): string {
  const files = readdirSync(SRC_DIR).filter((f) => f.endsWith('.md'));
  if (files.length === 0) throw new Error(`no .md files found in ${SRC_DIR}`);

  const parsed = files.map((f) => parseFrontmatter(readFileSync(join(SRC_DIR, f), 'utf8'), f));
  parsed.sort((a, b) => a.fm.order - b.fm.order);

  const seen = new Set<string>();
  for (const p of parsed) {
    if (seen.has(p.fm.slug)) throw new Error(`duplicate slug: ${p.fm.slug}`);
    seen.add(p.fm.slug);
  }

  const pages = parsed
    .map((p) => {
      const toc = deriveToc(p.body)
        .map((t) => `      { id: '${t.id}', title: ${JSON.stringify(t.title)}, level: 2 }`)
        .join(',\n');
      const badge = p.fm.badge ? `\n    badge: ${JSON.stringify(p.fm.badge)},` : '';
      return `  'brief/${p.fm.slug}': {
    slug: ${JSON.stringify(p.fm.slug)},
    title: ${JSON.stringify(p.fm.title)},
    description: ${JSON.stringify(p.fm.description)},${badge}
    category: ${JSON.stringify(p.fm.category)},
    scope: 'brief',
    lastUpdated: LAST_UPDATED,
    tableOfContents: [
${toc}
    ],
    content: ${tsString(toWebPaths(p.body))}
  }`;
    })
    .join(',\n\n');

  // Rebuild the sidebar structure from the same frontmatter, grouped by category
  // in first-seen order. Deriving it removes the hand-maintained duplicate.
  const categories: string[] = [];
  for (const p of parsed) {
    if (!categories.includes(p.fm.category)) categories.push(p.fm.category);
  }
  const structure = categories
    .map((cat) => {
      const items = parsed
        .filter((p) => p.fm.category === cat)
        .map((p) => {
          // The sidebar uses the short nav label so it does not truncate.
          const navTitle = p.fm.nav ?? p.fm.title;
          const navBadge = p.fm.navBadge ?? p.fm.badge;
          const badge = navBadge ? `\n        badge: ${JSON.stringify(navBadge)},` : '';
          return `      {
        title: ${JSON.stringify(navTitle)},
        slug: ${JSON.stringify(p.fm.slug)},${badge}
        description: ${JSON.stringify(p.fm.description)}
      }`;
        })
        .join(',\n');
      return `  {
    title: ${JSON.stringify(cat)},
    items: [
${items}
    ]
  }`;
    })
    .join(',\n');

  return `/**
 * lib/docs-brief.generated.ts
 *
 * ⚠️ GENERATED FILE — DO NOT EDIT BY HAND.
 *
 * Source of truth: \`docs/master-brief/*.md\` (markdown, rendered by GitHub).
 * Regenerate:      \`npx tsx scripts/build-master-brief.ts\`
 * Verify:          \`npx tsx scripts/build-master-brief.ts --check\`
 *
 * The table of contents and the sidebar structure are derived from the markdown,
 * so they cannot drift from the content.
 */
import type { DocCategory, DocPageContent } from './docs-content';

const LAST_UPDATED = '2026-10-08';

export const BRIEF_DOCS_STRUCTURE: DocCategory[] = [
${structure}
];

export const BRIEF_PAGES: Record<string, DocPageContent> = {
${pages}
};
`;
}

const output = build();

if (CHECK) {
  if (!existsSync(OUT_FILE)) {
    console.error('CHECK FAILED: lib/docs-brief.generated.ts does not exist.');
    console.error('Run: npx tsx scripts/build-master-brief.ts');
    process.exit(1);
  }
  const current = readFileSync(OUT_FILE, 'utf8');
  if (current !== output) {
    console.error('CHECK FAILED: lib/docs-brief.generated.ts is out of sync with docs/master-brief/*.md');
    console.error('Run: npx tsx scripts/build-master-brief.ts');
    process.exit(1);
  }
  console.log('ok    lib/docs-brief.generated.ts is in sync with docs/master-brief/*.md');
} else {
  writeFileSync(OUT_FILE, output, 'utf8');
  console.log(`wrote lib/docs-brief.generated.ts (${output.length} chars) from ${readdirSync(SRC_DIR).filter((f) => f.endsWith('.md')).length} markdown files`);
}
