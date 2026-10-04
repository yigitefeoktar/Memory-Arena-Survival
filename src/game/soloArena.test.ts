import assert from 'node:assert/strict';
import test from 'node:test';
import { advanceSoloWaveBreak, createInitialSoloWaveState, getSoloWaveStreakTarget, isValidSoloWaveState, restoreSoloWaveState, MEMORY_ARENA_CONFIG, type SoloWaveState } from './memoryArena';
import { getSpawnVisual, SPAWN_ANIMATION_MS } from './roundOpening';
import {
  getArenaMaterializeAtMs, ARENA_WALL_STAGGER_MS, findClearArenaPosition,
  getSoloArenaFrame, getSoloArenaLayout, isArenaPositionClear,
  SOLO_ARENA_BOUNDARY, SOLO_ARENA_HEIGHT, SOLO_ARENA_LAYOUTS, SOLO_ARENA_WIDTH,
} from './soloArena';

const breakAt = (wave: number, elapsed: number): SoloWaveState => ({
  number: wave, phase: 'break', completedStreaks: getSoloWaveStreakTarget(wave),
  breakRemainingMs: MEMORY_ARENA_CONFIG.waves.breakMs - elapsed,
});

test('all layouts keep the original compact boundary and clear player-sized passages', () => {
  assert.deepEqual(getSoloArenaLayout(1).interior, [
    { x: 340, y: 260, w: 90, h: 90 }, { x: 770, y: 550, w: 90, h: 90 },
  ]);
  for (const layout of SOLO_ARENA_LAYOUTS) {
    assert.deepEqual(layout.walls.slice(0, 4), SOLO_ARENA_BOUNDARY);
    assert.ok(isArenaPositionClear(600, 450, 22, layout.walls));
    for (const wall of layout.interior) {
      assert.ok(wall.x >= 40 + 44 && wall.y >= 40 + 44);
      assert.ok(wall.x + wall.w <= SOLO_ARENA_WIDTH - 40 - 44);
      assert.ok(wall.y + wall.h <= SOLO_ARENA_HEIGHT - 40 - 44);
    }
    // Every free grid cell is reachable from the center with the largest player.
    const cells = new Set<string>();
    for (let x = 80; x <= 1120; x += 20) for (let y = 80; y <= 820; y += 20) {
      if (isArenaPositionClear(x, y, 22, layout.walls)) cells.add(`${x},${y}`);
    }
    const reached = new Set<string>(['600,440']);
    const queue = [[600, 440]];
    for (let index = 0; index < queue.length; index++) {
      const [x, y] = queue[index];
      for (const [nx, ny] of [[x - 20, y], [x + 20, y], [x, y - 20], [x, y + 20]]) {
        const key = `${nx},${ny}`;
        if (cells.has(key) && !reached.has(key)) { reached.add(key); queue.push([nx, ny]); }
      }
    }
    assert.equal(reached.size, cells.size, `${layout.name} has no trapped pockets`);
  }
});

test('layouts repeat indefinitely and switch once per wave break without changing the boundary', () => {
  assert.equal(getSoloArenaFrame(createInitialSoloWaveState()).layout, getSoloArenaLayout(1));
  for (const wave of [1, 2, 3, 4, 5, 100, 999999]) {
    assert.equal(getSoloArenaLayout(wave + 4), getSoloArenaLayout(wave));
    for (const elapsed of [0, 175, 350, 450, 470, 600, 999]) {
      const frame = getSoloArenaFrame(breakAt(wave, elapsed));
      assert.deepEqual(frame.walls.slice(0, 4), SOLO_ARENA_BOUNDARY);
      assert.equal(frame.layout, getSoloArenaLayout(wave + (elapsed >= getArenaMaterializeAtMs(wave) ? 1 : 0)));
      assert.deepEqual(getSoloArenaFrame(JSON.parse(JSON.stringify(breakAt(wave, elapsed)))), frame, 'save/load retains the transition');
    }
    const next = advanceSoloWaveBreak(breakAt(wave, 999), 1);
    assert.equal(next.phase, 'active');
    assert.equal(getSoloArenaFrame(next).walls, getSoloArenaLayout(wave + 1).walls);
  }
});

test('walls use enemy spawn easing, stagger their arrival, and become solid only when all are visible', () => {
  const midway = getSoloArenaFrame(breakAt(1, SPAWN_ANIMATION_MS / 2));
  assert.deepEqual(midway.interior[0].visual, getSpawnVisual(SPAWN_ANIMATION_MS / 2));
  assert.equal(getSoloArenaFrame(breakAt(1, SPAWN_ANIMATION_MS)).walls, SOLO_ARENA_BOUNDARY);
  const arrival = getArenaMaterializeAtMs(1) + SPAWN_ANIMATION_MS / 2;
  const frame = getSoloArenaFrame(breakAt(1, arrival));
  assert.deepEqual(frame.interior[0].visual, getSpawnVisual(SPAWN_ANIMATION_MS / 2));
  assert.ok(frame.interior[0].visual.alpha > frame.interior[1].visual.alpha);
  assert.equal(frame.walls, SOLO_ARENA_BOUNDARY);
  const solidAt = getArenaMaterializeAtMs(1) + SPAWN_ANIMATION_MS + ARENA_WALL_STAGGER_MS;
  assert.equal(getSoloArenaFrame(breakAt(1, solidAt - 1)).walls, SOLO_ARENA_BOUNDARY);
  assert.equal(getSoloArenaFrame(breakAt(1, solidAt)).walls, getSoloArenaLayout(2).walls);
  for (const { visual } of getSoloArenaFrame(breakAt(1, arrival), true).interior) {
    assert.equal(visual.scale, 1);
    assert.equal(visual.ringAlpha, 0);
  }
});

test('materializing walls move players and pickups to the nearest clear point inside the fixed box', () => {
  for (const layout of SOLO_ARENA_LAYOUTS) for (const wall of layout.interior) {
    for (const radius of [16, 22]) {
      const body = { x: wall.x + wall.w / 2, y: wall.y + wall.h / 2, radius };
      const clear = findClearArenaPosition(body, layout.walls);
      assert.ok(isArenaPositionClear(clear.x, clear.y, radius, layout.walls));
      assert.ok(Math.hypot(clear.x - body.x, clear.y - body.y) <= Math.min(wall.w, wall.h) / 2 + radius + 2);
      assert.ok(clear.x > 40 && clear.x < 1160 && clear.y > 40 && clear.y < 860);
    }
    const free = { x: 600, y: 450, radius: 22 };
    assert.deepEqual(findClearArenaPosition(free, layout.walls), { x: free.x, y: free.y });
  }
});

test('valid positions stay fixed and corner overlaps use the shortest diagonal exit', () => {
  const walls = getSoloArenaLayout(1).walls;
  const nearBoundary = { x: 56, y: 450, radius: 16 };
  assert.deepEqual(findClearArenaPosition(nearBoundary, walls), { x: 56, y: 450 });
  const body = { x: 332, y: 252, radius: 16 };
  const clear = findClearArenaPosition(body, walls);
  assert.ok(isArenaPositionClear(clear.x, clear.y, body.radius, walls));
  assert.ok(Math.abs((clear.x - body.x) - (clear.y - body.y)) < 0.0001);
  assert.ok(Math.abs(Math.hypot(clear.x - body.x, clear.y - body.y) - (16.01 - Math.hypot(8, 8))) < 0.0001);
});

test('every layout finishes its final wall on the same tick as the next wave starts', () => {
  for (const wave of [1, 2, 3, 4, 100]) {
    const before = breakAt(wave, MEMORY_ARENA_CONFIG.waves.breakMs - 1);
    const frame = getSoloArenaFrame(before);
    assert.equal(frame.layout, getSoloArenaLayout(wave + 1));
    assert.equal(frame.walls, SOLO_ARENA_BOUNDARY);
    assert.ok(frame.interior.at(-1)!.visual.alpha < 1);
    assert.equal(advanceSoloWaveBreak(before, 0).phase, 'break');
    const next = advanceSoloWaveBreak(before, 1);
    assert.equal(next.phase, 'active');
    assert.equal(next.number, wave + 1);
    assert.equal(getSoloArenaFrame(next).walls, getSoloArenaLayout(wave + 1).walls);
    assert.ok(getSoloArenaFrame(next).interior.every(wall => wall.visual.alpha === 1));
  }
});

test('older saves retain wave progress and resume with the shorter break', () => {
  for (const remaining of [3000, 2000, 1000, 200, 0]) {
    const old = { ...breakAt(2, 0), breakRemainingMs: remaining };
    assert.equal(isValidSoloWaveState(old), true);
    const restored = restoreSoloWaveState(old);
    assert.equal(restored.number, old.number);
    assert.equal(restored.completedStreaks, old.completedStreaks);
    assert.ok(restored.breakRemainingMs <= MEMORY_ARENA_CONFIG.waves.breakMs);
    assert.deepEqual(getSoloArenaFrame(old), getSoloArenaFrame(restored));
    assert.equal(advanceSoloWaveBreak(old, MEMORY_ARENA_CONFIG.waves.breakMs).number, 3);
  }
  assert.equal(isValidSoloWaveState({ ...breakAt(1, 0), breakRemainingMs: 3001 }), false);
});
