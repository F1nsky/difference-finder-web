import { describe, expect, it } from 'vitest';
import { buildDiff, getSummary } from './diff';
import { parseDocument } from './parser';

describe('difference engine', () => {
  it('finds nested additions, removals, and changes', () => {
    const result = buildDiff(
      { name: 'Nova', active: true, profile: { level: 2, theme: 'dark' } },
      { name: 'Nova', active: false, profile: { level: 3 }, role: 'admin' },
    );

    expect(getSummary(result)).toEqual({ added: 1, removed: 1, changed: 2, unchanged: 1, total: 5 });
  });

  it('parses YAML in auto mode', () => {
    expect(parseDocument('service:\n  port: 4173', 'auto')).toEqual({ service: { port: 4173 } });
  });
});
