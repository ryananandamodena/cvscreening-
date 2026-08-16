import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

// Regression guard: production components (pages/, components/, layouts/) must never contain
// fabricated data that was previously found and removed (Module 6/10). This walks the real
// production source directories only — it does NOT touch tests/, node_modules, or the
// intentionally-mocked service layer (services/*.service.ts use an explicit, documented
// VITE_ENABLE_MOCK env flag, which is a different, allowed pattern — see Module 6 report).
const PRODUCTION_DIRS = ['pages', 'components', 'layouts'];
const ROOT = join(__dirname, '..');

const FORBIDDEN_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  // Matches an actual declaration/usage (`MOCK_EMPLOYEE_ID = 1`, `MOCK_EMPLOYEE_ID)`), not a
  // backtick-quoted historical comment referencing the now-removed hardcode.
  { label: 'MOCK_EMPLOYEE_ID (active declaration/usage)', pattern: /MOCK_EMPLOYEE_ID\s*[=)]/ },
  { label: 'MOCK_ORG_DATA', pattern: /MOCK_ORG_DATA/ },
  { label: '"Sarah Johnson" fabricated name', pattern: /Sarah Johnson/ },
  { label: '"Eleanor Vance" fabricated name', pattern: /Eleanor Vance/ },
  { label: 'fabricated salary figure (Rp 15,000,000)', pattern: /Rp 15,000,000/ },
  { label: 'fabricated performance rating (4\\.2/5)', pattern: /4\.2\/5/ },
  { label: 'hardcoded fake certificate data comment', pattern: /Mock certificates - in real app/ },
  { label: 'hardcoded mock employee profile comment', pattern: /Mock employee data - in real app/ },
  { label: 'hardcoded mock pending requests comment', pattern: /Mock pending requests/ },
];

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === '__tests__' || entry === 'node_modules') continue;
      walk(full, files);
    } else if (/\.(tsx?|jsx?)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

describe('production mock data scan', () => {
  const sourceFiles = PRODUCTION_DIRS.flatMap((dir) => {
    try {
      return walk(join(ROOT, dir));
    } catch {
      return [];
    }
  });

  it('found at least some production source files to scan (sanity check the scan itself works)', () => {
    expect(sourceFiles.length).toBeGreaterThan(10);
  });

  for (const { label, pattern } of FORBIDDEN_PATTERNS) {
    it(`no production file contains: ${label}`, () => {
      const offenders = sourceFiles.filter((f) => pattern.test(readFileSync(f, 'utf-8')));
      expect(offenders).toEqual([]);
    });
  }
});
