import { describe, it, expect } from 'vitest';
import { snapToGrid } from '../snap';

describe('snapToGrid', () => {
  it('snaps to nearest grid point', () => {
    expect(snapToGrid(123, 50)).toBe(100);
    expect(snapToGrid(127, 50)).toBe(150);
  });
  it('already on grid stays', () => {
    expect(snapToGrid(150, 50)).toBe(150);
  });
  it('handles zero', () => {
    expect(snapToGrid(0, 50)).toBe(0);
  });
  it('handles negative', () => {
    expect(snapToGrid(-123, 50)).toBe(-100);
  });
});
