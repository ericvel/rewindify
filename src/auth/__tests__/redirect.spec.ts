import { describe, expect, it } from 'vitest';
import { resolveRedirectTarget } from '../redirect';

describe('resolveRedirectTarget', () => {
  it('keeps a shared loop link intact', () => {
    expect(resolveRedirectTarget('/track/nocturne?a=30&b=60&loop=true')).toBe(
      '/track/nocturne?a=30&b=60&loop=true',
    );
  });

  it('falls back to the root when there is nothing to go back to', () => {
    expect(resolveRedirectTarget(undefined)).toBe('/');
    expect(resolveRedirectTarget(null)).toBe('/');
    expect(resolveRedirectTarget('')).toBe('/');
    expect(resolveRedirectTarget('   ')).toBe('/');
    expect(resolveRedirectTarget(42)).toBe('/');
  });

  it('rejects protocol-relative targets despite the leading slash', () => {
    expect(resolveRedirectTarget('//evil.example')).toBe('/');
    expect(resolveRedirectTarget('/\\evil.example')).toBe('/');
  });

  it('rejects absolute URLs', () => {
    expect(resolveRedirectTarget('https://evil.example/track/1')).toBe('/');
    expect(resolveRedirectTarget('javascript:alert(1)')).toBe('/');
  });

  it('does not decode, so a literal percent survives', () => {
    expect(resolveRedirectTarget('/track/100%25')).toBe('/track/100%25');
    expect(resolveRedirectTarget('%2Ftrack%2Fnocturne')).toBe('/');
  });

  it('takes the first value when the param is repeated', () => {
    expect(resolveRedirectTarget(['/track/one', '/track/two'])).toBe('/track/one');
    expect(resolveRedirectTarget([])).toBe('/');
  });
});
