import { detectCycle } from '../src/utils/cycle-detection';

describe('cycle detection', () => {
  it('returns empty for acyclic data', () => {
    const rows = [
      { name: 'A', reportsTo: 'B' },
      { name: 'B', reportsTo: 'C' },
      { name: 'C' },
    ];
    expect(detectCycle(rows)).toEqual([]);
  });

  it('detects simple cycle', () => {
    const rows = [
      { name: 'A', reportsTo: 'B' },
      { name: 'B', reportsTo: 'A' },
    ];
    const res = detectCycle(rows);
    expect(res.length).toBeGreaterThan(0);
    expect(res).toContain('A');
    expect(res).toContain('B');
  });

  it('detects longer cycle', () => {
    const rows = [
      { name: 'A', reportsTo: 'B' },
      { name: 'B', reportsTo: 'C' },
      { name: 'C', reportsTo: 'A' },
      { name: 'D' },
    ];
    const res = detectCycle(rows);
    expect(res.sort()).toEqual(['A', 'B', 'C'].sort());
  });
});
