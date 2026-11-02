import { beforeAll, describe, expect, it } from 'vitest';
import type { L } from '@onigam/lab-kit/i18n';
import { boldParts } from '@onigam/lab-kit/ui';
import { installFakeDom } from '../panels/test-dom';
import { SHEETS } from '../drawings';
import { ASSEMBLY } from './assembly';
import { INSTALL } from './install';
import { LESSONS } from './lessons';
import { OVERVIEWS } from './overviews';
import { PARTS } from './parts';

// The kit's `rich()` draws what the visitor reads, and this lab's marks stand next to its bold markers. These tests run the lab's own sentences through the kit's own splitter, in both languages, so that neither a change of the kit nor of a text can put raw stars back on the screen.

beforeAll(() => installFakeDom());

function renderedTexts(): [string, L][] {
  const out: [string, L][] = [];
  for (const les of LESSONS) {
    out.push([`${les.id}.summary`, les.summary]);
    les.body.forEach((b, i) => out.push([`${les.id}.body[${i}]`, b]));
    les.quiz?.forEach((qu, i) =>
      out.push([`${les.id}.quiz[${i}].q`, qu.q], [`${les.id}.quiz[${i}].explain`, qu.explain]),
    );
  }
  for (const p of PARTS) {
    out.push([`${p.id}.short`, p.short], [`${p.id}.description`, p.description]);
    if (p.maintenance) out.push([`${p.id}.maintenance`, p.maintenance]);
    if (p.tip) out.push([`${p.id}.tip`, p.tip]);
    if (p.design) out.push([`${p.id}.design`, p.design]);
  }
  for (const s of [...ASSEMBLY, ...INSTALL]) {
    out.push([`${s.id}.text`, s.text]);
    if (s.tip) out.push([`${s.id}.tip`, s.tip]);
    if (s.warning) out.push([`${s.id}.warning`, s.warning]);
  }
  for (const [world, o] of Object.entries(OVERVIEWS)) out.push([`overview ${world}`, o.text]);
  for (const s of SHEETS) out.push([`${s.id}.description`, s.description]);
  return out;
}

describe('the bold and the marks, through the kit’s own function', () => {
  it('holds a bold that ends on a star mark or a dagger', () => {
    expect(boldParts('**7 mm*** suffisent')).toEqual([
      { text: '7 mm*', bold: true },
      { text: ' suffisent', bold: false },
    ]);
    expect(boldParts('**7 mm†** suffisent')[0]).toEqual({ text: '7 mm†', bold: true });
  });
  it('leaves no raw marker anywhere the kit renders with it, in either language', () => {
    const raw: string[] = [];
    const texts = renderedTexts();
    expect(texts.length).toBeGreaterThan(300);
    for (const [where, t] of texts) {
      for (const lang of ['fr', 'en'] as const) {
        for (const para of t[lang].split(/\n\s*\n/)) {
          for (const piece of boldParts(para))
            if (piece.text.includes('**')) raw.push(`${where} (${lang}): ${piece.text}`);
        }
      }
    }
    expect(raw.join('\n')).toBe('');
  });
});
