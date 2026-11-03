/**
 * Keeps app code on the UI kit and the audited design tokens (see UI_AUDIT.md).
 * Fails when code outside components/ui reintroduces something the kit replaced.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../../..');
const SCAN_DIRS = ['components', 'pages'];

// The kit itself, and the report renderer (its colours are report content, not app UI).
const EXCLUDED_DIRS = ['components/ui', 'components/Reports/render'];

type Rule = { name: string; pattern: RegExp; allow?: string[] };

const rules: Rule[] = [
  {
    name: 'import headlessui through @/components/ui (or @/components/ui/headless)',
    pattern: /from ["']@headlessui\/react["']/,
  },
  { name: 'components/Core was folded into the kit', pattern: /components\/Core\// },
  {
    name: 'use semantic colours (primary, accent, danger, success, warning) instead of brand-*',
    pattern:
      /\b(?:bg|text|border|shadow|from|to|via|ring|fill|stroke)-brand-(?:purple|cyan|rose|emerald|amber)\b/,
  },
  {
    name: 'use status tokens (danger, success, warning, info) instead of raw palette colours',
    pattern:
      /\b(?:bg|text|border|ring|from|to)-(?:rose|red|green|emerald|sky|blue|amber|yellow|orange)-[0-9]{3}\b/,
  },
  {
    name: 'use theme tokens instead of hex colour classes',
    pattern: /\b(?:bg|text|border|divide|ring|from|to)-\[#[0-9a-fA-F]{3,8}\]/,
    // Light "paper" behind the report preview, matching what the report renders on.
    allow: ['components/Reports/ReportViewer.tsx'],
  },
  {
    name: 'use the kit Spinner instead of <Loader2 className="animate-spin">',
    pattern: /<Loader2\b/,
  },
  {
    name: 'build class names from full strings; Tailwind cannot see `bg-${x}` at build time',
    pattern: /`[^`]*(?:\b(?:bg|text|border|ring|shadow)-|\b(?:hover|focus|group-hover):)\$\{/,
    // `text-${e.id}` there is an undo-history key, not a class name.
    allow: ['components/Reports/designer/Inspector.tsx'],
  },
];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full).split(path.sep).join('/');
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || EXCLUDED_DIRS.includes(rel)) continue;
      walk(full, out);
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      out.push(rel);
    }
  }
  return out;
}

const files = SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d)));

describe('UI kit guard', () => {
  it('finds source files to scan', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  for (const rule of rules) {
    it(rule.name, () => {
      const offenders: string[] = [];
      for (const file of files) {
        if (rule.allow?.includes(file)) continue;
        const lines = fs.readFileSync(path.join(ROOT, file), 'utf8').split(/\r?\n/);
        lines.forEach((line, i) => {
          if (rule.pattern.test(line))
            offenders.push(`${file}:${i + 1}  ${line.trim().slice(0, 120)}`);
        });
      }
      expect(offenders).toEqual([]);
    });
  }
});
