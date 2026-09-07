import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ABILITY_BY_FACTION,
  ENEMY_FACTIONS,
  ENEMY_SHAPES,
  FACTION_EMERGENCY_ABILITY_BY_FACTION,
  MEMORY_ARENA_CONFIG,
  MEMORY_MAP_CORE_INDICES,
  advanceFactionEmergencyState,
  advanceTriangleAi,
  addFactionEmergencyPressure,
  areEnemyFactionsHostile,
  applyPlayerDamage,
  collectAbilityPickup,
  canEnemyFactionDamageSpawner,
  createInitialChainState,
  createEmptyAbilityOwnership,
  createInitialAbilityDropProgress,
  createInitialFactionRaidStates,
  createInitialFactionEmergencyStates,
  createInitialPlayerUpgradeRanks,
  createMemoryCoreSpawners,
  createShuffledShapeBag,
  createTriangleAiState,
  countRemainingCoreSpawners,
  findNearestSpawnerReplicationPosition,
  getSquareVolleyDirections,
  getRaidFormationOffset,
  getTriangleTelegraphVisual,
  getPlayerLevelStats,
  getWallFollowDirection,
  grantPlayerLevelUpgrade,
  derivePlayerUpgradeRanks,
  isValidChainState,
  isValidFactionRaidStates,
  isValidFactionEmergencyStates,
  markTrianglePlayerHit,
  preserveChainOnSpawnerDestroyed,
  regeneratePlayerHealth,
  registerPlayerEnemyKill,
  registerAbilityDropKill,
  turnAngleTowards,
  type ColoredCoreSpawnerState,
  type EnemyAiState,
} from './memoryArena';

test('wall following chooses the route toward the target and keeps outward clearance', () => {
  const direction = getWallFollowDirection(
    [{ x: -1, y: 0 }],
    { x: 1, y: -0.5 },
  );

  assert.ok(direction.y < 0, 'should follow the wall upward toward the target');
  assert.ok(direction.x < 0, 'should keep a small outward component away from the wall');
  assert.ok(Math.abs(Math.hypot(direction.x, direction.y) - 1) < 0.0001);
});

test('wall following splits equally good routes using the stable tie breaker', () => {
  const clockwise = getWallFollowDirection([{ x: -1, y: 0 }], { x: 1, y: 0 }, 1);
  const counterClockwise = getWallFollowDirection([{ x: -1, y: 0 }], { x: 1, y: 0 }, -1);
  assert.ok(clockwise.y < 0);
  assert.ok(counterClockwise.y > 0);
});

test('ability colours map to the four existing tools', () => {
  assert.deepEqual(ABILITY_BY_FACTION, {
    red: 'damage',
    blue: 'special',
    green: 'convert',
    yellow: 'build',
  });
});

test('each enemy faction owns a weaker version of its matching player ability', () => {
  assert.deepEqual(FACTION_EMERGENCY_ABILITY_BY_FACTION, {
    red: 'damagePulse',
    blue: 'reflectionShield',
    green: 'conversionPulse',
    yellow: 'buildWall',
  });
});

test('ability drops use a deterministic twelve percent roll', () => {
  const ownership = createEmptyAbilityOwnership();
  const progress = createInitialAbilityDropProgress();
  const miss = registerAbilityDropKill({
    factionColor: 'red', credit: 'player', defeatedWasPlayerAlly: false,
    ownership, progress, hasActivePickup: false, randomValue: 0.12,
  });
  assert.equal(miss.shouldDrop, false);
  assert.equal(miss.progress.red, 1);

  const hit = registerAbilityDropKill({
    factionColor: 'blue', credit: 'ally', defeatedWasPlayerAlly: false,
    ownership, progress: miss.progress, hasActivePickup: false, randomValue: 0.119,
  });
  assert.equal(hit.shouldDrop, true);
  assert.equal(hit.abilityId, 'special');
  assert.equal(hit.progress.blue, 0);
});

test('the eighth eligible kill guarantees a drop independently per colour', () => {
  const ownership = createEmptyAbilityOwnership();
  let progress = createInitialAbilityDropProgress();
  let result = registerAbilityDropKill({
    factionColor: 'green', credit: 'player', defeatedWasPlayerAlly: false,
    ownership, progress, hasActivePickup: false, randomValue: 1,
  });
  progress = result.progress;
  for (let kill = 2; kill <= 8; kill++) {
    result = registerAbilityDropKill({
      factionColor: 'green', credit: 'ally', defeatedWasPlayerAlly: false,
      ownership, progress, hasActivePickup: false, randomValue: 1,
    });
    progress = result.progress;
  }
  assert.equal(result.shouldDrop, true);
  assert.equal(progress.green, 0);
  assert.equal(progress.red, 0);
});

test('faction kills, ally deaths, owned abilities, and active pickups cannot drop duplicates', () => {
  const base = {
    factionColor: 'yellow' as const,
    ownership: createEmptyAbilityOwnership(),
    progress: createInitialAbilityDropProgress(),
    randomValue: 0,
  };
  assert.equal(registerAbilityDropKill({ ...base, credit: 'faction', defeatedWasPlayerAlly: false, hasActivePickup: false }).shouldDrop, false);
  assert.equal(registerAbilityDropKill({ ...base, credit: 'ally', defeatedWasPlayerAlly: true, hasActivePickup: false }).shouldDrop, false);
  assert.equal(registerAbilityDropKill({ ...base, credit: 'player', defeatedWasPlayerAlly: false, hasActivePickup: true }).shouldDrop, false);
  assert.equal(registerAbilityDropKill({
    ...base,
    credit: 'player',
    defeatedWasPlayerAlly: false,
    hasActivePickup: false,
    ownership: { ...base.ownership, build: true },
  }).shouldDrop, false);
});

test('collecting a pickup unlocks only its ability and preserves the shared cooldown timestamp', () => {
  const ownership = createEmptyAbilityOwnership();
  const collected = collectAbilityPickup(ownership, 'convert', 12345);
  assert.deepEqual(collected.ownership, {
    damage: false,
    special: false,
    build: false,
    convert: true,
  });
  assert.equal(collected.abilityLastUsed, 12345);
  assert.deepEqual(createEmptyAbilityOwnership(), ownership);
});

const redCircle = { shape: 'circle', color: 'red' } as const;
const redSquare = { shape: 'square', color: 'red' } as const;
const redTriangle = { shape: 'triangle', color: 'red' } as const;
const blueCircle = { shape: 'circle', color: 'blue' } as const;
const greenCircle = { shape: 'circle', color: 'green' } as const;
const yellowCircle = { shape: 'circle', color: 'yellow' } as const;
const blueSquare = { shape: 'square', color: 'blue' } as const;

test('first kill selects a target and starts at one', () => {
  const transition = registerPlayerEnemyKill(createInitialChainState(), redCircle);
  assert.equal(transition.result, 'started');
  assert.deepEqual(transition.state.target, redCircle);
  assert.equal(transition.state.matchingShape, 'circle');
  assert.equal(transition.state.matchingColor, 'red');
  assert.equal(transition.state.progress, 1);
});

test('four enemies sharing one color complete a chain', () => {
  let state = createInitialChainState();
  for (const enemy of [redCircle, redSquare, redTriangle, redCircle]) {
    state = registerPlayerEnemyKill(state, enemy).state;
  }
  assert.equal(state.level, 2);
  assert.equal(state.completedChains, 1);
  assert.equal(state.progress, 0);
  assert.equal(state.target, null);
  assert.equal(state.matchingShape, null);
  assert.equal(state.matchingColor, null);
});

test('four enemies sharing one shape complete a chain', () => {
  let state = createInitialChainState();
  for (const enemy of [redCircle, blueCircle, greenCircle, yellowCircle]) {
    state = registerPlayerEnemyKill(state, enemy).state;
  }
  assert.equal(state.level, 2);
  assert.equal(state.completedChains, 1);
});

test('the whole streak must retain a common trait', () => {
  let state = registerPlayerEnemyKill(createInitialChainState(), redCircle).state;
  state = registerPlayerEnemyKill(state, redSquare).state;
  assert.equal(state.matchingShape, null);
  assert.equal(state.matchingColor, 'red');

  const transition = registerPlayerEnemyKill(state, blueSquare);
  assert.equal(transition.result, 'retargeted');
  assert.deepEqual(transition.state.target, blueSquare);
  assert.equal(transition.state.matchingShape, 'square');
  assert.equal(transition.state.matchingColor, 'blue');
  assert.equal(transition.state.progress, 1);
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
  const original = {
    ...createInitialChainState(),
    level: 1_000_000,
    progress: 3,
    target: redCircle,
    matchingShape: redCircle.shape,
    matchingColor: redCircle.color,
  };
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

test('different enemy factions are hostile while matching factions are friendly', () => {
  assert.equal(MEMORY_ARENA_CONFIG.combat.enemyFactionCombatEnabled, true);
  assert.equal(areEnemyFactionsHostile('red', 'blue'), true);
  assert.equal(areEnemyFactionsHostile('green', 'yellow'), true);
  assert.equal(areEnemyFactionsHostile('red', 'red'), false);
});

test('faction raids begin idle and use stable spread-out formation positions', () => {
  const raids = createInitialFactionRaidStates(500);
  assert.deepEqual(Object.keys(raids), [...ENEMY_FACTIONS]);
  assert.equal(Object.values(raids).every(raid => raid.phase === 'idle' && raid.phaseStartedAt === 500), true);

  const first = getRaidFormationOffset('enemy-17');
  const repeated = getRaidFormationOffset('enemy-17');
  const second = getRaidFormationOffset('enemy-18');
  assert.deepEqual(first, repeated);
  assert.notDeepEqual(first, second);
  assert.ok(Math.hypot(first.x, first.y) >= MEMORY_ARENA_CONFIG.raids.formationRadiusMin);
  assert.ok(Math.hypot(first.x, first.y) <= MEMORY_ARENA_CONFIG.raids.formationRadiusMax);
  assert.equal(isValidFactionRaidStates(raids), true);
  assert.equal(isValidFactionRaidStates({ ...raids, red: { ...raids.red, phase: 'retreating' } }), false);
});

test('faction emergency pressure produces one telegraphed activation and then cooldown', () => {
  const emergencies = createInitialFactionEmergencyStates(1000);
  const building = advanceFactionEmergencyState(emergencies.red, {
    now: 3100,
    deltaSeconds: 2.1,
    nearbyFriendlies: 0,
    nearbyHostiles: MEMORY_ARENA_CONFIG.factionEmergency.minimumNearbyHostiles,
    factionAlive: true,
    abilityAvailable: true,
  });
  assert.equal(building.beganTelegraph, true);
  assert.equal(building.state.phase, 'telegraph');
  assert.equal(building.state.pressure, MEMORY_ARENA_CONFIG.factionEmergency.maximumPressure);

  const warning = advanceFactionEmergencyState(building.state, {
    now: 3100 + MEMORY_ARENA_CONFIG.factionEmergency.telegraphMs - 1,
    deltaSeconds: 0.016,
    nearbyFriendlies: 0,
    nearbyHostiles: 12,
    factionAlive: true,
    abilityAvailable: true,
  });
  assert.equal(warning.detonated, false);
  assert.equal(warning.state.phase, 'telegraph');

  const blast = advanceFactionEmergencyState(warning.state, {
    now: 3100 + MEMORY_ARENA_CONFIG.factionEmergency.telegraphMs,
    deltaSeconds: 0.016,
    nearbyFriendlies: 0,
    nearbyHostiles: 12,
    factionAlive: true,
    abilityAvailable: true,
  });
  assert.equal(blast.detonated, true);
  assert.equal(blast.state.phase, 'cooldown');
  assert.equal(blast.state.pressure, 0);

  const stillCooling = advanceFactionEmergencyState(blast.state, {
    now: blast.state.cooldownUntil - 1,
    deltaSeconds: 10,
    nearbyFriendlies: 0,
    nearbyHostiles: 12,
    factionAlive: true,
    abilityAvailable: true,
  });
  assert.equal(stillCooling.detonated, false);
  assert.equal(stillCooling.state.phase, 'cooldown');
});

test('replica losses add bounded emergency pressure while safe cores recover', () => {
  const initial = createInitialFactionEmergencyStates(0).red;
  const pressured = addFactionEmergencyPressure(
    initial,
    MEMORY_ARENA_CONFIG.factionEmergency.replicaLossPressure,
  );
  assert.equal(pressured.pressure, MEMORY_ARENA_CONFIG.factionEmergency.replicaLossPressure);

  const clamped = addFactionEmergencyPressure(pressured, 10_000);
  assert.equal(clamped.pressure, MEMORY_ARENA_CONFIG.factionEmergency.maximumPressure);

  const recovering = advanceFactionEmergencyState(pressured, {
    now: 1000,
    deltaSeconds: 1,
    nearbyFriendlies: 5,
    nearbyHostiles: 0,
    factionAlive: true,
    abilityAvailable: true,
  });
  assert.equal(
    recovering.state.pressure,
    MEMORY_ARENA_CONFIG.factionEmergency.replicaLossPressure -
      MEMORY_ARENA_CONFIG.factionEmergency.pressureDecayPerSecond,
  );
  assert.equal(isValidFactionEmergencyStates(createInitialFactionEmergencyStates(0)), true);
  assert.equal(isValidFactionEmergencyStates({ red: { phase: 'idle', pressure: -1 } }), false);
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
  assert.equal(isValidChainState({
    ...createInitialChainState(),
    target: redCircle,
    matchingShape: null,
    matchingColor: null,
    progress: 1,
  }), false);
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
  assert.equal(regeneratePlayerHealth(hp, 100, 0.02, 2), 50);
  assert.equal(regeneratePlayerHealth(99, 100, 0.02, 10), 100);
});

test('player levels follow the fixed fire, hp, regeneration, cooldown cycle', () => {
  let ranks = createInitialPlayerUpgradeRanks();
  const upgradedStats = [];
  for (let level = 2; level <= 5; level++) {
    const upgrade = grantPlayerLevelUpgrade(level, ranks);
    ranks = upgrade.ranks;
    upgradedStats.push(upgrade.stat);
  }
  assert.deepEqual(upgradedStats, ['fireRate', 'maxHp', 'regeneration', 'cooldown']);
  assert.deepEqual(ranks, { fireRate: 1, maxHp: 1, regeneration: 1, cooldown: 1 });
});

test('level stats scale quickly with percentage regeneration and whole cooldowns', () => {
  const levelFive = getPlayerLevelStats(derivePlayerUpgradeRanks(5));
  assert.equal(levelFive.maxHp, 140);
  assert.equal(levelFive.regenerationPercentPerSecond, 0.0275);
  assert.equal(levelFive.bulletsPerSecond, 1.75);
  assert.equal(levelFive.cooldownSeconds, 13);

  const levelSeventeen = getPlayerLevelStats(derivePlayerUpgradeRanks(17));
  assert.equal(levelSeventeen.maxHp, 384);
  assert.ok(Math.abs(levelSeventeen.regenerationPercentPerSecond - 0.05) < 1e-12);
  assert.ok(Math.abs(levelSeventeen.bulletsPerSecond - 4.802) < 1e-12);
  assert.equal(levelSeventeen.cooldownSeconds, 7);
});

test('high fire rate becomes three streams while preserving total bullet output', () => {
  const threeStreamStats = getPlayerLevelStats({
    ...createInitialPlayerUpgradeRanks(),
    fireRate: 7,
  });
  assert.equal(threeStreamStats.streamCount, 3);
  assert.ok(Math.abs(threeStreamStats.bulletsPerSecond - 1.25 * Math.pow(1.4, 7)) < 1e-10);
  assert.ok(Math.abs(3000 / threeStreamStats.volleyIntervalMs - threeStreamStats.bulletsPerSecond) < 1e-10);

  const capped = getPlayerLevelStats({
    ...createInitialPlayerUpgradeRanks(),
    fireRate: 100,
  });
  assert.equal(capped.bulletsPerSecond, 30);
  assert.equal(capped.volleyIntervalMs, 100);
});

test('capped fire and cooldown cycle slots continue upgrading hp and regeneration', () => {
  const before = derivePlayerUpgradeRanks(45);
  const after = derivePlayerUpgradeRanks(49);
  assert.equal(getPlayerLevelStats(before).cooldownSeconds, 4);
  assert.equal(getPlayerLevelStats(before).bulletsPerSecond, 30);
  assert.equal(after.maxHp - before.maxHp, 2);
  assert.equal(after.regeneration - before.regeneration, 2);
  assert.equal(after.fireRate, before.fireRate);
  assert.equal(after.cooldown, before.cooldown);
  assert.deepEqual(derivePlayerUpgradeRanks(1_000_000), derivePlayerUpgradeRanks(1_000_000));
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

test('core objective counting ignores replicated spawners', () => {
  assert.equal(countRemainingCoreSpawners([
    { isCore: true, hp: 100 },
    { isCore: true, hp: 0 },
    { isCore: false, hp: 60 },
    { hp: 60 },
  ]), 1);
});

test('enemy factions can damage only hostile replicated spawners', () => {
  assert.equal(canEnemyFactionDamageSpawner('red', { isCore: true, factionColor: 'blue' }), false);
  assert.equal(canEnemyFactionDamageSpawner('red', { isCore: false, factionColor: 'red' }), false);
  assert.equal(canEnemyFactionDamageSpawner('red', { isCore: false, factionColor: 'blue' }), true);
});

test('spawner replication chooses the nearest valid candidate ring', () => {
  const startDistance = MEMORY_ARENA_CONFIG.spawner.replicationStartDistance;
  const searchStep = MEMORY_ARENA_CONFIG.spawner.replicationSearchStep;
  const position = findNearestSpawnerReplicationPosition(
    { x: 1000, y: 1000 },
    (x, y) => Math.hypot(x - 1000, y - 1000) >= startDistance + searchStep - 0.01,
  );
  assert.ok(position);
  assert.ok(Math.abs(Math.hypot(position.x - 1000, position.y - 1000) - (startDistance + searchStep)) < 0.01);
  assert.equal(findNearestSpawnerReplicationPosition({ x: 0, y: 0 }, () => false), null);
});
