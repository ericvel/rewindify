import { seedFromId } from '@/spotify/track';
import type { Track } from '@/playback/types';

/**
 * The fixture catalogue: enough tracks that the recently played list overflows
 * every surface that shows it, which is the point of having one.
 */
const ENTRIES: [title: string, artist: string, album: string, seconds: number][] = [
  ['Prelude in C', 'Ana Vestergaard', 'Keyboard Studies', 142],
  ['Blue Interval', 'The Long Room', 'Blue Interval', 213],
  ['Cassette Sunrise', 'Nils Hovden', 'Tape Loops', 268],
  ['Half Step Down', 'Marisol Reyes Trio', 'Live at the Vault', 401],
  ['Static Garden', 'Pelagic Wire', 'Static Garden', 187],
  ['Fourth Position', 'Ana Vestergaard', 'Etudes for Practice', 96],
  ['Nightshift Waltz', 'The Long Room', 'Second Floor', 234],
  ['Copper Wire', 'Juno Adeyemi', 'Copper Wire', 176],
  ['Slow Tremolo', 'Pelagic Wire', 'Static Garden', 312],
  ['Rain on the B Side', 'Nils Hovden', 'Tape Loops', 205],
  ['Turnaround', 'Marisol Reyes Trio', 'Live at the Vault', 158],
  ['Eight Bars Later', 'Hollow Choir', 'Eight Bars Later', 249],
  ['Metronome Blues', 'Juno Adeyemi', 'Copper Wire', 131],
  ['Upper Register', 'Ana Vestergaard', 'Etudes for Practice', 88],
  ['Ferry Terminal', 'The Long Room', 'Second Floor', 297],
  ['Dropped D', 'Hollow Choir', 'Eight Bars Later', 221],
  ['Second Chorus', 'Marisol Reyes Trio', 'Head Charts', 344],
  ['Paper Lantern', 'Sable Field', 'Paper Lantern', 192],
  ['Broken Arpeggio', 'Ana Vestergaard', 'Keyboard Studies', 119],
  ['Tape Hiss', 'Nils Hovden', 'Tape Loops', 263],
  ['Loop Point', 'Pelagic Wire', 'Loop Point', 385],
  ['Backbeat Study', 'Juno Adeyemi', 'Room Tone', 147],
  ['Green Room', 'The Long Room', 'Second Floor', 208],
  ['Sixteenth Notes', 'Hollow Choir', 'Practice Room', 173],
  ['Low Tide', 'Sable Field', 'Paper Lantern', 279],
  ['Trading Fours', 'Marisol Reyes Trio', 'Head Charts', 366],
  ['Room Tone', 'Juno Adeyemi', 'Room Tone', 154],
  ['Third Take', 'Hollow Choir', 'Practice Room', 226],
  ['Harmonic Minor', 'Ana Vestergaard', 'Etudes for Practice', 104],
  ['Last Ferry', 'Sable Field', 'Last Ferry', 318],
];

/**
 * Artwork as a data uri, so a fixture run needs no network at all. Real covers
 * are photographs; these only have to be distinct enough that a list of thirty
 * rows does not read as one repeated placeholder.
 */
function artwork(seed: number): string {
  const hue = seed % 360;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="176" height="176">` +
    `<rect width="176" height="176" fill="hsl(${hue} 30% 78%)"/>` +
    `<circle cx="88" cy="88" r="${44 + (seed % 30)}" fill="hsl(${(hue + 40) % 360} 45% 42%)"/>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Spotify ids are 22 base62 characters, and the router round-trips them. */
function fakeId(index: number): string {
  return `fake${String(index).padStart(18, '0')}`;
}

export const FAKE_TRACKS: Track[] = /* @__PURE__ */ ENTRIES.map(
  ([title, artist, album, seconds], index) => {
    const id = fakeId(index);
    const seed = seedFromId(id);
    return {
      id,
      uri: `spotify:track:${id}`,
      title,
      artist,
      album,
      duration: seconds,
      seed,
      artworkUrl: artwork(seed),
    };
  },
);

/**
 * Built on first use, not at module scope: a top-level `new Map` is a side
 * effect as far as the bundler is concerned, and would keep this whole file in
 * a production build that never reads it.
 */
let byId: Map<string, Track> | undefined;

export function fakeTrack(id: string): Track | undefined {
  byId ??= new Map(FAKE_TRACKS.map((track) => [track.id, track]));
  return byId.get(id);
}
