// Level geometry: a unified height field for the subway station.
// Two levels — a central platform (y=0) and two lower tracks (y=-1.2) —
// connected by stair ramps at z = +/- STAIR_Z. Both the player and the
// enemies walk this field, so they can follow each other up and down.

export const STAIR_Z = 27;
export const STAIR_HALF = 1.7;
export const PLATFORM_HALF = 4;   // |x| <= PLATFORM_HALF  -> platform (y=0)
export const TRACK_HALF = 6;      // |x| >= TRACK_HALF      -> track   (y=-1.2)
export const TRACK_DROP = -1.2;

export function isStairZ(z) {
  return Math.abs(Math.abs(z) - STAIR_Z) <= STAIR_HALF;
}

// Walkable ground height at any (x, z).
export function groundY(x, z) {
  const ax = Math.abs(x);
  if (ax <= PLATFORM_HALF) return 0;
  if (ax >= TRACK_HALF) return TRACK_DROP;
  if (isStairZ(z)) {
    const t = (ax - PLATFORM_HALF) / (TRACK_HALF - PLATFORM_HALF);
    return t * TRACK_DROP;
  }
  return TRACK_DROP;
}

// Overall playable bounds.
export const BOUNDS = { x: 7.6, z: 29 };
