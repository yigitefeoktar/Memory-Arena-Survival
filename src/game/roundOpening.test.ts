import assert from 'node:assert/strict';
import test from 'node:test';
import { createRoundOpening, getSpawnVisual, isRoundOpeningBlocked, ROUND_OPENING_MS, SPAWN_ANIMATION_MS } from './roundOpening';

test('new rounds remain frozen through the opening cue and any longer objective banner', () => {
  const opening = createRoundOpening(500);
  assert.equal(isRoundOpeningBlocked(opening, 500), true);
  assert.equal(isRoundOpeningBlocked(opening, 500 + ROUND_OPENING_MS - 1), true);
  assert.equal(isRoundOpeningBlocked(opening, opening.readyAt), false);
  assert.equal(isRoundOpeningBlocked(opening, opening.readyAt + 2000, true), true);
  opening.released = true;
  assert.equal(isRoundOpeningBlocked(opening, opening.readyAt + 2000, true), false);
  assert.equal(isRoundOpeningBlocked(null, 500, true), false, 'loading or resuming does not start a new round');
});

test('spawn animation materializes smoothly, clamps time, and respects reduced motion', () => {
  assert.deepEqual(getSpawnVisual(-100), getSpawnVisual(0));
  assert.equal(getSpawnVisual(0).alpha, 0);
  const middle = getSpawnVisual(SPAWN_ANIMATION_MS / 2);
  assert.ok(middle.alpha > 0 && middle.alpha < 1);
  assert.ok(middle.scale > 0.2 && middle.scale < 1);
  assert.deepEqual(getSpawnVisual(SPAWN_ANIMATION_MS + 100), { alpha: 1, scale: 1, ringAlpha: 0, ringScale: 1 });
  const reduced = getSpawnVisual(SPAWN_ANIMATION_MS / 2, true);
  assert.equal(reduced.scale, 1);
  assert.equal(reduced.ringAlpha, 0);
  assert.equal(reduced.alpha, middle.alpha);
});
