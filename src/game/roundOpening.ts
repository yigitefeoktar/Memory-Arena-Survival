export const ROUND_OPENING_MS = 1150;
export const SPAWN_ANIMATION_MS = 350;

export interface RoundOpening {
  startedAt: number;
  readyAt: number;
  released: boolean;
}

export function createRoundOpening(now: number): RoundOpening {
  return { startedAt: now, readyAt: now + ROUND_OPENING_MS, released: false };
}

export function isRoundOpeningBlocked(opening: RoundOpening | null, now: number, bannerVisible = false): boolean {
  return Boolean(opening && !opening.released && (now < opening.readyAt || bannerVisible));
}

export function getSpawnVisual(ageMs: number, reducedMotion = false) {
  const progress = Math.max(0, Math.min(1, ageMs / SPAWN_ANIMATION_MS));
  const eased = 1 - Math.pow(1 - progress, 3);
  return {
    alpha: eased,
    scale: reducedMotion ? 1 : 0.2 + eased * 0.8,
    ringAlpha: reducedMotion ? 0 : (1 - progress) * 0.65,
    ringScale: 1.8 - eased * 0.8,
  };
}
