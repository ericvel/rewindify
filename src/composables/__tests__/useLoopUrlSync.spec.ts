import { describe, expect, it } from 'vitest';
import { loopQuery, readLoopFromQuery } from '../useLoopUrlSync';

describe('readLoopFromQuery', () => {
  it('reads a full loop link', () => {
    expect(readLoopFromQuery({ a: '30', b: '60.5', loop: 'true' })).toEqual({
      a: 30,
      b: 60.5,
      on: true,
    });
  });

  it('reads loop=false as an explicit off', () => {
    expect(readLoopFromQuery({ loop: 'false' }).on).toBe(false);
  });

  it('leaves the loop undefined when the param is absent or unrecognised', () => {
    expect(readLoopFromQuery({}).on).toBeUndefined();
    expect(readLoopFromQuery({ loop: '1' }).on).toBeUndefined();
    expect(readLoopFromQuery({ loop: 'yes' }).on).toBeUndefined();
  });

  it('ignores blank and non-numeric bounds rather than reading them as zero', () => {
    expect(readLoopFromQuery({ a: 'abc', b: '' })).toEqual({
      a: undefined,
      b: undefined,
      on: undefined,
    });
    expect(readLoopFromQuery({ a: null, b: undefined }).a).toBeUndefined();
  });

  it('keeps out-of-range numbers for the store to clamp', () => {
    expect(readLoopFromQuery({ a: '-99', b: '99999' })).toMatchObject({ a: -99, b: 99999 });
  });

  it('takes the first value when a param is repeated', () => {
    expect(readLoopFromQuery({ a: ['30', '99'], loop: ['true', 'false'] })).toEqual({
      a: 30,
      b: undefined,
      on: true,
    });
  });
});

describe('loopQuery', () => {
  it('writes the loop when it is on', () => {
    expect(loopQuery({}, true, 30, 60.54)).toEqual({ a: '30', b: '60.5', loop: 'true' });
  });

  it('drops the loop params entirely when the loop is off', () => {
    expect(loopQuery({ a: '30', b: '60', loop: 'true' }, false, 30, 60)).toEqual({});
  });

  it('leaves unrelated params alone', () => {
    expect(loopQuery({ ref: 'share', loop: 'true' }, false, 30, 60)).toEqual({ ref: 'share' });
    expect(loopQuery({ ref: 'share' }, true, 1, 2)).toMatchObject({ ref: 'share', loop: 'true' });
  });

  it('round-trips through the reader', () => {
    expect(readLoopFromQuery(loopQuery({}, true, 12.34, 56.78))).toEqual({
      a: 12.3,
      b: 56.8,
      on: true,
    });
    expect(readLoopFromQuery(loopQuery({}, false, 12, 56)).on).toBeUndefined();
  });
});
