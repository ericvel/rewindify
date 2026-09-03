import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import SavedLoopsSelect from '../SavedLoopsSelect.vue';
import { TEST_TRACK } from '@/playback/__tests__/fixtures';
import { usePlayerStore } from '@/stores/player';

vi.mock('@/playback/spotifyPlaybackSource', async () => {
  const fake = await import('@/playback/__tests__/fakePlaybackSource');
  return { createSpotifyPlaybackSource: fake.createFakePlaybackSource };
});

/**
 * jsdom has no popover, and the popover is the whole subject here: the bug this
 * file exists for was a store and a plate disagreeing about whether the plate
 * was out. So the two methods and the one selector are stood up with the piece
 * of the real contract that matters — `showPopover` on an open popover is a
 * no-op, and both transitions fire `toggle` with a `newState`.
 */
const OPEN = new WeakSet<Element>();
const nativeMatches = HTMLElement.prototype.matches;

function toggleEvent(newState: 'open' | 'closed') {
  const event = new Event('toggle');
  Object.assign(event, { newState, oldState: newState === 'open' ? 'closed' : 'open' });
  return event;
}

function installPopover() {
  HTMLElement.prototype.showPopover = function showPopover(this: HTMLElement) {
    if (OPEN.has(this)) return;
    OPEN.add(this);
    this.dispatchEvent(toggleEvent('open'));
  };
  HTMLElement.prototype.hidePopover = function hidePopover(this: HTMLElement) {
    if (!OPEN.has(this)) return;
    OPEN.delete(this);
    this.dispatchEvent(toggleEvent('closed'));
  };
  HTMLElement.prototype.matches = function matches(this: HTMLElement, selector: string) {
    if (selector === ':popover-open') return OPEN.has(this);
    return nativeMatches.call(this, selector);
    // `matches` is declared as a set of type predicates, which a plain boolean
    // return cannot satisfy; the stub only has to answer the one selector.
  } as typeof HTMLElement.prototype.matches;
}

function mountSelect() {
  return mount(SavedLoopsSelect, {
    props: { variant: 'desktop' },
    attachTo: document.body,
  });
}

/** A real press: `pointerdown` records the state, then the click acts on it. */
function pressField(wrapper: ReturnType<typeof mountSelect>) {
  const field = wrapper.get('#saved-loops-toggle').element as HTMLButtonElement;
  field.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  field.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
}

function plateOf(wrapper: ReturnType<typeof mountSelect>) {
  return wrapper.get('#saved-loops-plate').element as HTMLElement;
}

describe('SavedLoopsSelect', () => {
  let player: ReturnType<typeof usePlayerStore>;

  beforeEach(async () => {
    installPopover();
    localStorage.clear();
    setActivePinia(createPinia());
    player = usePlayerStore();
    await player.loadTrack(TEST_TRACK, { a: 30, b: 60, on: true });
  });

  afterEach(() => {
    HTMLElement.prototype.matches = nativeMatches;
  });

  /*
   * The regression. Two instances of this component exist across the
   * breakpoint, only one is mounted, and removing a popover from the document
   * hides it without firing `toggle` — so a fresh instance could mount against
   * a store that still said open, over a plate that was shut. Every press then
   * asked for a state the store already held, and the pointer never got the
   * plate back.
   */
  describe('a store that disagrees with the plate', () => {
    it('opens on a press when the store already says open', async () => {
      const wrapper = mountSelect();
      player.openSavedLoops();
      await nextTick();
      // Exactly the stranded state: a popover taken out of the document is
      // hidden without a `toggle`, so the request stands and the plate does not.
      OPEN.delete(plateOf(wrapper));

      pressField(wrapper);
      await nextTick();

      expect(OPEN.has(plateOf(wrapper))).toBe(true);
      expect(player.savedLoopsOpen).toBe(true);
    });

    it('reconciles a fresh mount to a standing request', async () => {
      player.openSavedLoops();
      const wrapper = mountSelect();
      await nextTick();

      expect(OPEN.has(plateOf(wrapper))).toBe(true);
    });

    it('withdraws the request it can no longer serve', async () => {
      const wrapper = mountSelect();
      pressField(wrapper);
      await nextTick();
      expect(player.savedLoopsOpen).toBe(true);

      wrapper.unmount();

      expect(player.savedLoopsOpen).toBe(false);
    });
  });

  describe('the window', () => {
    it('prints the loop the live loop is sitting on', async () => {
      player.saveLoop('Bridge');
      await nextTick();
      const wrapper = mountSelect();

      expect(wrapper.get('.select__value').text()).toBe('Bridge');
    });

    it('tells an empty track from a loop that is not saved', async () => {
      const wrapper = mountSelect();
      expect(wrapper.get('.select__value').text()).toBe('None saved');

      player.saveLoop('Bridge');
      player.nudge('a', 2);
      await nextTick();

      expect(wrapper.get('.select__value').text()).toBe('None');
    });

    /*
     * The identity of a loop is the range it prints, so a nudge the readouts
     * cannot show may not take the user off their row.
     */
    it('holds the loop across a nudge inside the printed second', async () => {
      player.saveLoop('Bridge');
      await nextTick();
      const wrapper = mountSelect();

      player.nudge('b', 0.4);
      await nextTick();

      expect(wrapper.get('.select__value').text()).toBe('Bridge');
    });
  });

  describe('the create row', () => {
    it('opens as a chooser, with the form behind the plus', async () => {
      player.saveLoop('Bridge');
      await nextTick();
      const wrapper = mountSelect();
      pressField(wrapper);
      await nextTick();

      expect(wrapper.find('.select__add').exists()).toBe(true);
      expect(wrapper.find('.select__name-field').exists()).toBe(false);
    });

    it('prints the count beside the plus, and the ceiling as full', async () => {
      const wrapper = mountSelect();
      player.saveLoop('One');
      await nextTick();

      expect(wrapper.get('.select__count').text()).toBe('1 saved');
    });

    it('reveals the form and takes the caret on a save request', async () => {
      const wrapper = mountSelect();
      player.requestLoopSave();
      await nextTick();
      await nextTick();

      const name = wrapper.get('.select__name-field').element;
      expect(document.activeElement).toBe(name);
    });

    /*
     * The dead end this closes: with the loop off there was a grey field, a
     * grey cap, and no words anywhere on the surface — and the only reader the
     * app told was a screen reader.
     */
    it('prints why a save is refused', async () => {
      player.toggleLoop();
      const wrapper = mountSelect();
      player.requestLoopSave();
      await nextTick();
      await nextTick();

      expect(wrapper.get('.select__reason').text()).toBe('Turn the loop on to save it');
      expect(wrapper.get('.select__commit').attributes('aria-describedby')).toBe(
        'saved-loops-reason',
      );
    });

    /* The cap printing SAVE used to *be* named "This loop is already saved". */
    it('keeps SAVE as the control name', async () => {
      const wrapper = mountSelect();
      player.requestLoopSave();
      await nextTick();
      await nextTick();

      const save = wrapper.get('.select__commit');
      expect(save.text()).toBe('Save');
      expect(save.attributes('aria-label')).toBeUndefined();
    });

    it('stores no name for an untouched field', async () => {
      const wrapper = mountSelect();
      player.requestLoopSave();
      await nextTick();
      await nextTick();
      await wrapper.get('.select__form').trigger('submit');

      expect(player.trackSavedLoops[0]?.name).toBeNull();
    });

    it('clamps a typed name by graphemes, not code units', async () => {
      const wrapper = mountSelect();
      player.requestLoopSave();
      await nextTick();
      await nextTick();

      const field = wrapper.get('.select__name-field');
      await field.setValue('👨‍👩‍👧‍👦'.repeat(30));
      await wrapper.get('.select__form').trigger('submit');

      // Whole families, none of them split down their joiners.
      expect(player.trackSavedLoops[0]?.name).toBe('👨‍👩‍👧‍👦'.repeat(24));
    });
  });

  describe('the list', () => {
    // Three distinct spans off the loaded 30–60, so newest-first is Third,
    // Second, First and no two rows print the same range.
    beforeEach(async () => {
      player.saveLoop('First');
      player.nudge('a', 5);
      player.saveLoop('Second');
      player.nudge('a', 5);
      player.saveLoop('Third');
      await nextTick();
    });

    it('gives every row its range in the one column', () => {
      const wrapper = mountSelect();
      expect(wrapper.findAll('.select__times')).toHaveLength(3);
    });

    it('enters at the loop you are on, not at the top', async () => {
      // Back onto `First`, which newest-first puts at the bottom of three.
      player.nudge('a', -10);
      const wrapper = mountSelect();
      await nextTick();

      await wrapper.get('#saved-loops-toggle').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      await nextTick();

      const rows = wrapper.findAll('.select__row');
      expect(document.activeElement).toBe(rows[2]?.element);
    });

    it('walks up out of the list rather than round it', async () => {
      const wrapper = mountSelect();
      pressField(wrapper);
      await nextTick();

      const rows = wrapper.findAll('.select__row');
      await rows[0]?.trigger('keydown', { key: 'ArrowUp' });
      await nextTick();

      expect(document.activeElement).toBe(wrapper.get('.select__add').element);
    });

    it('deletes from the keyboard and lands on the row that took its place', async () => {
      const wrapper = mountSelect();
      pressField(wrapper);
      await nextTick();

      await wrapper.findAll('.select__row')[0]?.trigger('keydown', { key: 'Backspace' });
      await nextTick();
      await nextTick();

      expect(player.trackSavedLoops.map((entry) => entry.name)).toEqual(['Second', 'First']);
      expect(document.activeElement).toBe(wrapper.findAll('.select__row')[0]?.element);
    });

    it('says out loud what a delete did', async () => {
      const wrapper = mountSelect();
      pressField(wrapper);
      await nextTick();

      await wrapper.findAll('.select__delete')[0]?.trigger('click');
      await nextTick();
      await nextTick();

      expect(wrapper.get('[role="status"]').text()).toBe('Deleted loop Third');
    });
  });

  describe('escape', () => {
    it('abandons a half-typed name before it puts the plate away', async () => {
      const wrapper = mountSelect();
      player.requestLoopSave();
      await nextTick();
      await nextTick();
      await wrapper.get('.select__name-field').setValue('Half typed');

      const plate = wrapper.get('#saved-loops-plate');
      await plate.trigger('keydown', { key: 'Escape' });
      expect(OPEN.has(plateOf(wrapper))).toBe(true);
      expect((wrapper.get('.select__name-field').element as HTMLInputElement).value).toBe('');

      await plate.trigger('keydown', { key: 'Escape' });
      expect(OPEN.has(plateOf(wrapper))).toBe(false);
    });
  });
});
