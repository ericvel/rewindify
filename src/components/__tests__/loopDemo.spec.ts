import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import LoopDemo from '../LoopDemo.vue';

describe('LoopDemo', () => {
  let nextFrame: FrameRequestCallback | undefined;

  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn<() => void>(),
      removeEventListener: vi.fn<() => void>(),
    }));
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      nextFrame = callback;
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts before A and arms only after the playhead crosses it', async () => {
    const wrapper = mount(LoopDemo);
    const demo = wrapper.get('.demo');
    const loopStart = Number.parseFloat(
      (wrapper.get('.demo__region').element as HTMLElement).style.left,
    );
    const headPosition = () =>
      Number.parseFloat((wrapper.get('.demo__playhead').element as HTMLElement).style.left);

    expect(headPosition()).toBeLessThan(loopStart);
    expect(demo.classes()).not.toContain('is-armed');

    nextFrame?.(1_000);
    nextFrame?.(1_500);
    await nextTick();

    expect(headPosition()).toBe(loopStart);
    expect(demo.classes()).not.toContain('is-armed');

    nextFrame?.(1_501);
    await nextTick();

    expect(headPosition()).toBeGreaterThan(loopStart);
    expect(demo.classes()).toContain('is-armed');

    wrapper.unmount();
  });
});
