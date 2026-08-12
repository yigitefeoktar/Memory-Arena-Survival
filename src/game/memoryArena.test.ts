import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ENEMY_FACTIONS,
  ENEMY_SHAPES,
  MEMORY_ARENA_CONFIG,
  MEMORY_MAP_CORE_INDICES,
  advanceTriangleAi,
  applyPlayerDamage,
  createInitialChainState,
  createMemoryCoreSpawners,
  createShuffledShapeBag,
  createTriangleAiState,
  getSquareVolleyDirections,
  getTriangleTelegraphVisual,
  isValidChainState,
  markTrianglePlayerHit,
  preserveChainOnSpawnerDestroyed,
  regeneratePlayerHealth,
  registerPlayerEnemyKill,
  turnAngleTowards,
  type ColoredCoreSpawnerState,
  type EnemyAiState,
} from './memoryArena';

const redCircle = { shape: 'circle', color: 'red' } as const;
const blueSquare = { shape: 'square', color: 'blue' } as const;

test('first kill selects a target and starts at one', () => {
  const transition = registerPlayerEnemyKill(createInitialChainState(), redCircle);
  assert.equal(transition.result, 'started');
  assert.deepEqual(transition.state.target, redCircle);
  assert.equal(transition.state.progress, 1);
});

test('matching kills complete a chain, level up, and clear the target', () => {
  let state = createInitialChainState();
  for (let i = 0; i < 4; i++) state = registerPlayerEnemyKill(state, redCircle).state;
  assert.equal(state.level, 2);
  assert.equal(state.completedChains, 1);
  assert.equal(state.progress, 0);
  assert.equal(state.target, null);
});

test('wrong kill retargets and counts as one', () => {
  let state = registerPlayerEnemyKill(createInitialChainState(), redCircle).state;
  state = registerPlayerEnemyKill(state, redCircle).state;
  const transition = registerPlayerEnemyKill(state, blueSquare);
  assert.equal(transition.result, 'retargeted');
  assert.deepEqual(transition.state.target, blueSquare);
  assert.equal(transition.state.progress, 1);
});

test('levels have no artificial maximum and spawners are chain-neutral', () => {
  const original = { ...createInitialChainState(), level: 1_000_000, progress: 3, target: redCircle };
  const completed = registerPlayerEnemyKill(original, redCircle).state;
  assert.equal(completed.level, 1_000_001);
  assert.equal(preserveChainOnSpawnerDestroyed(original), original);
});

test('every shuffled bag contains each shape exactly once', () => {
  const bag = createShuffledShapeBag(() => 0.25);
  assert.deepEqual([...bag].sort(), ['circle', 'square', 'triangle']);
  assert.equal(new Set(bag).size, 3);
});

test('the prototype exposes all twelve shape and color identities', () => {
  const identities = ENEMY_FACTIONS.flatMap(color => ENEMY_SHAPES.map(shape => `${color}:${shape}`));
  assert.equal(identities.length, 12);
  assert.equal(new Set(identities).size, 12);
});

test('enemy AI and colored core state remain serializable data', () => {
  const ai: EnemyAiState = {
    orientation: 0.5,
    movementDirection: { x: 1, y: 0 },
    nextDecisionAt: 2500,
    triangle: createTriangleAiState(100),
  };
  const core: ColoredCoreSpawnerState = {
    factionColor: 'yellow',
    isCore: true,
    hp: 70,
    maxHp: 100,
    nextSpawnAt: 6000,
    spawnBag: ['circle', 'triangle'],
  };
  assert.deepEqual(JSON.parse(JSON.stringify({ ai, core })), { ai, core });
});

test('malformed or incomplete chain identities are rejected', () => {
  assert.equal(isValidChainState(createInitialChainState()), true);
  assert.equal(isValidChainState({ ...createInitialChainState(), target: { shape: 'hexagon', color: 'red' } }), false);
  assert.equal(isValidChainState({ ...createInitialChainState(), target: { shape: 'circle', color: 'purple' } }), false);
  assert.equal(isValidChainState({ ...createInitialChainState(), progress: 4 }), false);
});

test('square volley directions remain orthogonal', () => {
  const directions = getSquareVolleyDirections(0.37);
  for (let i = 0; i < directions.length; i++) {
    const a = directions[i];
    const b = directions[(i + 1) % directions.length];
    assert.ok(Math.abs(a.x * b.x + a.y * b.y) < 1e-10);
    assert.ok(Math.abs(Math.hypot(a.x, a.y) - 1) < 1e-10);
  }
});

test('triangle advances through telegraph, dash, hit-once, and recovery', () => {
  let ai = createTriangleAiState(0);
  ai = advanceTriangleAi(ai, { now: 100, seesTarget: true, travelled: 0, collidedWithWall: false });
  assert.equal(ai.phase, 'telegraph');
  ai = advanceTriangleAi(ai, { now: 700, seesTarget: true, travelled: 0, collidedWithWall: false });
  assert.equal(ai.phase, 'dash');
  ai = markTrianglePlayerHit(ai);
  assert.equal(ai.hitPlayer, true);
  assert.equal(markTrianglePlayerHit(ai), ai);
  ai = advanceTriangleAi(ai, { now: 800, seesTarget: true, travelled: 600, collidedWithWall: false });
  assert.equal(ai.phase, 'recover');
  ai = advanceTriangleAi(ai, { now: 4800, seesTarget: false, travelled: 0, collidedWithWall: false });
  assert.equal(ai.phase, 'wander');
});

test('triangle warning animation keeps the 600ms timing and settles before the dash', () => {
  assert.equal(MEMORY_ARENA_CONFIG.triangle.telegraphMs, 600);
  const start = getTriangleTelegraphVisual(0);
  const middle = getTriangleTelegraphVisual(300);
  const end = getTriangleTelegraphVisual(600);
  assert.equal(start.pullBack, 0);
  assert.ok(middle.pullBack > 0);
  assert.ok(middle.glowBlur > start.glowBlur);
  assert.equal(getTriangleTelegraphVisual(1000).pullBack, end.pullBack);
});

test('triangle warning turns smoothly using the shortest angular path', () => {
  const firstStep = turnAngleTowards(0, Math.PI, 0.2);
  assert.equal(Math.abs(firstStep), 0.2);
  const acrossWrap = turnAngleTowards(Math.PI - 0.05, -Math.PI + 0.05, 0.2);
  assert.ok(Math.abs(acrossWrap - (-Math.PI + 0.05)) < 1e-10);
});

test('damage stacks and continuous regeneration clamps to maximum health', () => {
  let hp = applyPlayerDamage(100, 30);
  hp = applyPlayerDamage(hp, 12);
  hp = applyPlayerDamage(hp, 12);
  assert.equal(hp, 46);
  assert.equal(regeneratePlayerHealth(hp, 100, 2), 50);
  assert.equal(regeneratePlayerHealth(99, 100, 10), 100);
});

test('Memory Arena wall ricochets are disabled by prototype configuration', () => {
  assert.equal(MEMORY_ARENA_CONFIG.combat.bulletRicochetEnabled, false);
});

test('memory map conversion keeps four colored cores and preserves canonical relic data', () => {
  const canonical = [
    { x: 0, y: 0, radius: 40, hp: 100, maxHp: 100 },
    { x: 100, y: 0, radius: 40, hp: 100, maxHp: 100, specialType: 'shield' },
    { x: 50, y: 50, radius: 40, hp: 100, maxHp: 100, specialType: 'singularity' },
    { x: 0, y: 100, radius: 40, hp: 100, maxHp: 100 },
    { x: 100, y: 100, radius: 40, hp: 100, maxHp: 100 },
  ];
  const converted = createMemoryCoreSpawners(canonical, [0, 1, 3, 4]);
  assert.deepEqual(converted.map(core => core.factionColor), ['red', 'blue', 'green', 'yellow']);
  assert.equal(converted.length, 4);
  assert.equal(converted.every(core => core.isCore && core.specialType === undefined), true);
  assert.equal(canonical[1].specialType, 'shield');
  assert.equal(canonical[2].specialType, 'singularity');
});

test('every available arena has a four-faction Memory core layout', () => {
  assert.equal(Object.keys(MEMORY_MAP_CORE_INDICES).length, 19);
  for (const indices of Object.values(MEMORY_MAP_CORE_INDICES)) {
    assert.equal(indices.length, 4);
    assert.equal(new Set(indices).size, 4);
  }
});
