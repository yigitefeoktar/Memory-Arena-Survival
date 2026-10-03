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
  advanceSoloWaveBreak,
  addFactionEmergencyPressure,
  areEnemyFactionsHostile,
  applyPlayerDamage,
  calculateEnemySeparationSteering,
  collectAbilityPickup,
  canEnemyFactionDamageSpawner,
  canMemoryProjectileDamageEnemies,
  createInitialChainState,
  createInitialSoloWaveState,
  createEmptyAbilityOwnership,
  createInitialAbilityDropProgress,
  createInitialFactionRaidStates,
  createInitialFactionEmergencyStates,
  createInitialPlayerUpgradeRanks,
  createMemoryCoreSpawners,
  composeThreeByThreeArena,
  createShuffledShapeBag,
  createTriangleAiState,
  countRemainingCoreSpawners,
  findNearestSpawnerReplicationPosition,
  getSquareVolleyDirections,
  getRaidFormationOffset,
  getTriangleTelegraphVisual,
  getPlayerLevelStats,
  getMemoryThreatStats,
  getSoloWaveIdentities,
  getSoloWaveRescueSpawns,
  getSoloWaveRoster,
  getSoloWaveSpeedMultiplier,
  getSoloWaveStreakTarget,
  getMissingEnemyCombinations,
  getLeastRepresentedEnemyCombination,
  getWallFollowDirection,
  grantPlayerLevelUpgrade,
  derivePlayerUpgradeRanks,
  isValidChainState,
  isValidSoloWaveState,
  isValidFactionRaidStates,
  isValidFactionEmergencyStates,
  markTrianglePlayerHit,
  preserveChainOnSpawnerDestroyed,
  regeneratePlayerHealth,
  registerPlayerEnemyKill,
  registerSoloWaveStreak,
  registerAbilityDropKill,
  resolveEnemyOverlaps,
  turnAngleTowards,
  type ColoredCoreSpawnerState,
  type EnemyAiState,
} from './memoryArena';
import { getMapDimensions, isValidMapId, VALID_MAP_IDS } from '../shared/matchSettings';

test('3x3 arena composition creates a seamless 9000px world', () => {
  const boundaryWalls = [
    { x: 0, y: 0, w: 3000, h: 50 },
    { x: 0, y: 0, w: 50, h: 3000 },
    { x: 2950, y: 0, w: 50, h: 3000 },
    { x: 0, y: 2950, w: 3000, h: 50 },
  ];
  const tiles = Array.from({ length: 9 }, (_, index) => ({
    walls: [...boundaryWalls, { x: 100 + index, y: 200, w: 60, h: 80 }],
    spawners: [{ x: 400, y: 500, tile: index }],
    ...(index === 4 ? { spawnPoint: { x: 600, y: 700 } } : {}),
  }));

  const composed = composeThreeByThreeArena(tiles);
  assert.equal(composed.width, 9000);
  assert.equal(composed.height, 9000);
  assert.equal(composed.walls.length, 13, 'four world boundaries plus one interior wall per tile');
  assert.equal(composed.spawners.length, 9);
  assert.deepEqual(composed.spawnPoint, { x: 3600, y: 3700 });
  assert.deepEqual(composed.spawners[8], { x: 6400, y: 6500, tile: 8 });
  assert.ok(composed.walls.some(wall => wall.x === 6108 && wall.y === 6200));
  assert.equal(composed.walls.filter(wall => wall.w === 9000 || wall.h === 9000).length, 4);
});

test('nearby enemies receive equal and opposite separation steering', () => {
  const steering = calculateEnemySeparationSteering([
    { id: 'left', x: 0, y: 0, radius: 10 },
    { id: 'right', x: 15, y: 0, radius: 10 },
    { id: 'far', x: 100, y: 0, radius: 10 },
  ]);

  assert.ok(steering[0].x < 0);
  assert.ok(steering[1].x > 0);
  assert.ok(Math.abs(steering[0].x + steering[1].x) < 1e-9);
  assert.deepEqual(steering[2], { x: 0, y: 0 });
});

test('overlap resolution preserves a dense allowance while separating stacked enemies', () => {
  const enemies = [
    { id: 'first', x: 50, y: 50, radius: 16 },
    { id: 'second', x: 50, y: 50, radius: 16 },
  ];
  const result = resolveEnemyOverlaps(enemies);
  const distance = Math.hypot(enemies[1].x - enemies[0].x, enemies[1].y - enemies[0].y);
  const expectedMinimum = 32 * MEMORY_ARENA_CONFIG.navigation.minimumEnemyDistanceRatio;

  assert.ok(result.correctedPairs > 0);
  assert.ok(distance >= expectedMinimum - 1e-6);
  assert.ok(distance < 32, 'the configured allowance should retain slight visual overlap');
  assert.ok(result.maximumRemainingOverlap < 1e-6);
});

test('overlap resolution reapplies position constraints after every pass', () => {
  const enemies = [
    { id: 'wall-side', x: 2, y: 20, radius: 10 },
    { id: 'inside', x: 8, y: 20, radius: 10 },
  ];
  let constraintCalls = 0;
  resolveEnemyOverlaps(enemies, enemy => {
    constraintCalls++;
    return { x: Math.max(0, enemy.x), y: enemy.y };
  });

  assert.equal(constraintCalls, enemies.length * MEMORY_ARENA_CONFIG.navigation.overlapResolutionPasses);
  assert.ok(enemies.every(enemy => enemy.x >= 0));
});

test('mega grid is a valid map with shared 9000px server bounds', () => {
  assert.equal(isValidMapId('mega_grid'), true);
  assert.deepEqual(getMapDimensions('mega_grid'), { width: 9000, height: 9000 });
  assert.deepEqual(getMapDimensions('medium'), { width: 3000, height: 3000 });
});

test('missing enemy combinations cover every hostile colour and shape', () => {
  const all = getMissingEnemyCombinations([]);
  assert.equal(all.length, ENEMY_FACTIONS.length * ENEMY_SHAPES.length);
  assert.equal(new Set(all.map(enemy => `${enemy.color}:${enemy.shape}`)).size, all.length);
  assert.deepEqual(getMissingEnemyCombinations([
    { factionColor: 'red', shape: 'circle' },
    { factionColor: 'blue', shape: 'square', isPlayerAlly: true },
  ]).filter(enemy => enemy.color === 'red' && enemy.shape === 'circle'), []);
  assert.ok(getMissingEnemyCombinations([
    { factionColor: 'blue', shape: 'square', isPlayerAlly: true },
  ]).some(enemy => enemy.color === 'blue' && enemy.shape === 'square'));
});

test('the larger autonomous roster remains evenly spread across all identities', () => {
  const population = MEMORY_ARENA_CONFIG.population;
  const combinations = ENEMY_FACTIONS.length * ENEMY_SHAPES.length;
  assert.equal(population.openingHostiles, combinations * 2);
  assert.equal(population.targetHostiles, combinations * 3);
  assert.ok(population.maximumTotalEnemies > population.targetHostiles);

  const enemies: Array<{ factionColor: (typeof ENEMY_FACTIONS)[number]; shape: (typeof ENEMY_SHAPES)[number] }> = [];
  for (let index = 0; index < population.targetHostiles; index++) {
    const next = getLeastRepresentedEnemyCombination(enemies);
    enemies.push({ factionColor: next.color, shape: next.shape });
  }
  for (const color of ENEMY_FACTIONS) {
    for (const shape of ENEMY_SHAPES) {
      assert.equal(enemies.filter(enemy => enemy.factionColor === color && enemy.shape === shape).length, 3);
    }
  }
  assert.deepEqual(getMissingEnemyCombinations(enemies), []);
});

test('converted allies do not count toward a hostile identity', () => {
  const enemies = ENEMY_FACTIONS.flatMap(factionColor => ENEMY_SHAPES.map(shape => ({ factionColor, shape })));
  enemies.push({ factionColor: 'red', shape: 'circle' });
  assert.deepEqual(getLeastRepresentedEnemyCombination([
    ...enemies,
    { factionColor: 'red', shape: 'square', isPlayerAlly: true },
  ]), { color: 'red', shape: 'square' });
});

test('the denser roster has a lower theoretical ranged damage budget', () => {
  const circlesPerRoster = ENEMY_FACTIONS.length;
  const squaresPerRoster = ENEMY_FACTIONS.length;
  const previousDamagePerSecond = circlesPerRoster * 30 / 2.5 + squaresPerRoster * 4 * 12 / 2.5;
  const copiesPerCombination = MEMORY_ARENA_CONFIG.population.targetHostiles / (ENEMY_FACTIONS.length * ENEMY_SHAPES.length);
  const swarmDamagePerSecond =
    circlesPerRoster * copiesPerCombination * MEMORY_ARENA_CONFIG.circle.bulletDamage * 1000 / MEMORY_ARENA_CONFIG.circle.fireIntervalMs +
    squaresPerRoster * copiesPerCombination * 4 * MEMORY_ARENA_CONFIG.square.bulletDamage * 1000 / MEMORY_ARENA_CONFIG.square.fireIntervalMs;
  assert.ok(swarmDamagePerSecond < previousDamagePerSecond * 0.6);
});

test('memory threat combines elapsed time and player level', () => {
  const opening = getMemoryThreatStats(0, 1);
  assert.equal(opening.tier, 0);
  assert.equal(opening.spawnIntervalMs, MEMORY_ARENA_CONFIG.spawner.spawnIntervalMs);
  assert.equal(opening.replicationIntervalMs, MEMORY_ARENA_CONFIG.spawner.replicationIntervalMs);
  assert.equal(opening.armySize, MEMORY_ARENA_CONFIG.raids.armySize);
  assert.equal(opening.enemyMovementMultiplier, 1);

  const escalated = getMemoryThreatStats(120000, 7);
  assert.equal(escalated.timeTier, 2);
  assert.equal(escalated.levelTier, 2);
  assert.equal(escalated.tier, 4);
  assert.ok(escalated.spawnIntervalMs < opening.spawnIntervalMs);
  assert.ok(escalated.replicationIntervalMs < opening.replicationIntervalMs);
  assert.equal(escalated.armySize, 8);
  assert.equal(escalated.factionAbilityCooldownMs, 26000);
  assert.equal(escalated.enemyMovementMultiplier, 1.1);
});

test('memory threat keeps every high-pressure stat within its gameplay cap', () => {
  const maximum = getMemoryThreatStats(10_000_000, 1000);
  assert.equal(maximum.spawnIntervalMs, MEMORY_ARENA_CONFIG.threat.minimumSpawnIntervalMs);
  assert.equal(maximum.replicationIntervalMs, MEMORY_ARENA_CONFIG.threat.minimumReplicationIntervalMs);
  assert.equal(maximum.armySize, MEMORY_ARENA_CONFIG.threat.maximumArmySize);
  assert.equal(maximum.factionAbilityCooldownMs, MEMORY_ARENA_CONFIG.threat.minimumFactionAbilityCooldownMs);
  assert.equal(maximum.enemyMovementMultiplier, MEMORY_ARENA_CONFIG.threat.maximumMovementMultiplier);
  assert.equal(maximum.visualIntensity, 1);
});

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
const blueCircle = { shape: 'circle', color: 'blue' } as const;
const blueSquare = { shape: 'square', color: 'blue' } as const;

test('first kill selects a target and starts at one', () => {
  const transition = registerPlayerEnemyKill(createInitialChainState(), redCircle);
  assert.equal(transition.result, 'started');
  assert.deepEqual(transition.state.target, redCircle);
  assert.equal(transition.state.matchingShape, 'circle');
  assert.equal(transition.state.matchingColor, 'red');
  assert.equal(transition.state.progress, 1);
});

test('three enemies with the exact same color and shape complete a chain', () => {
  assert.equal(MEMORY_ARENA_CONFIG.chain.requiredKills, 3);
  let state = createInitialChainState();
  for (const enemy of [redCircle, redCircle, redCircle]) {
    state = registerPlayerEnemyKill(state, enemy).state;
  }
  assert.equal(state.level, 1);
  assert.equal(state.completedChains, 1);
  assert.equal(state.progress, 0);
  assert.equal(state.target, null);
  assert.equal(state.matchingShape, null);
  assert.equal(state.matchingColor, null);
});

test('matching only the color or only the shape resets the chain', () => {
  const started = registerPlayerEnemyKill(createInitialChainState(), redCircle).state;
  const sameColor = registerPlayerEnemyKill(started, redSquare);
  assert.equal(sameColor.result, 'retargeted');
  assert.deepEqual(sameColor.state.target, redSquare);
  assert.equal(sameColor.state.progress, 1);

  const sameShape = registerPlayerEnemyKill(started, blueCircle);
  assert.equal(sameShape.result, 'retargeted');
  assert.deepEqual(sameShape.state.target, blueCircle);
  assert.equal(sameShape.state.progress, 1);
});

test('wrong kill retargets and counts as one', () => {
  let state = registerPlayerEnemyKill(createInitialChainState(), redCircle).state;
  state = registerPlayerEnemyKill(state, redCircle).state;
  const transition = registerPlayerEnemyKill(state, blueSquare);
  assert.equal(transition.result, 'retargeted');
  assert.deepEqual(transition.state.target, blueSquare);
  assert.equal(transition.state.progress, 1);
});

test('solo waves clear only after enough exact three-kill streaks and restart after the break', () => {
  let wave = createInitialSoloWaveState();
  let chain = createInitialChainState();
  assert.equal(getSoloWaveStreakTarget(1), 2);
  assert.equal(getSoloWaveStreakTarget(4), 5);
  for (const kill of [redCircle, redCircle, blueSquare, blueSquare, blueSquare]) {
    const transition = registerPlayerEnemyKill(chain, kill);
    chain = transition.state;
    if (transition.result === 'completed') wave = registerSoloWaveStreak(wave);
  }
  assert.equal(wave.completedStreaks, 1);
  assert.equal(chain.level, 1);
  assert.equal(wave.phase, 'active');
  assert.equal(chain.progress, 0);
  for (let i = 0; i < 3; i++) {
    const transition = registerPlayerEnemyKill(chain, redCircle);
    chain = transition.state;
    if (transition.result === 'completed') wave = registerSoloWaveStreak(wave);
  }
  assert.equal(wave.phase, 'break');
  assert.equal(wave.completedStreaks, 2);
  assert.equal(chain.level, 1);
  assert.equal(registerSoloWaveStreak(wave), wave);
  assert.equal(advanceSoloWaveBreak(wave, 2999).phase, 'break');
  wave = advanceSoloWaveBreak(wave, 3000);
  assert.deepEqual(wave, { number: 2, completedStreaks: 0, phase: 'active', breakRemainingMs: 0 });
  assert.equal(getSoloWaveStreakTarget(wave.number), 3);
  assert.equal(isValidSoloWaveState(wave), true);
  assert.equal(isValidSoloWaveState({ ...wave, completedStreaks: 3 }), false);
});

test('opening waves start with sixteen enemies across four visible identities and scale to eight identities', () => {
  const opening = getSoloWaveIdentities(1);
  assert.equal(opening.length, 4);
  assert.equal(new Set(opening.map(identity => identity.color)).size, 4);
  assert.equal(new Set(opening.map(identity => identity.shape)).size, 3);
  assert.equal(getSoloWaveIdentities(4).length, 5);
  assert.equal(getSoloWaveIdentities(13).length, 8);
  for (const wave of [1, 3, 4, 10, 100]) {
    const identities = getSoloWaveIdentities(wave);
    assert.equal(new Set(identities.map(identity => `${identity.color}:${identity.shape}`)).size, identities.length);
    const initial = getSoloWaveRoster(wave);
    assert.equal(initial.length, identities.length * MEMORY_ARENA_CONFIG.waves.enemiesPerIdentity);
    for (const identity of identities) {
      assert.equal(initial.filter(enemy => enemy.shape === identity.shape && enemy.color === identity.color).length, 4);
    }
    const waveState = { number: wave, completedStreaks: 0, phase: 'active' as const, breakRemainingMs: 0 };
    const reinforcements = getSoloWaveRescueSpawns(waveState, createInitialChainState(), initial);
    assert.deepEqual(getSoloWaveRescueSpawns(waveState, createInitialChainState(), [...initial, ...reinforcements]), []);
    if (wave === 3) assert.equal(reinforcements.length, 3);
  }
  assert.equal(getSoloWaveSpeedMultiplier(1), 1);
  assert.ok(getSoloWaveSpeedMultiplier(5) > getSoloWaveSpeedMultiplier(1));
  assert.equal(getSoloWaveSpeedMultiplier(100), MEMORY_ARENA_CONFIG.waves.maximumSpeedMultiplier);
});

test('a partial chain receives a spare target before its last matching enemies are gone', () => {
  const wave = createInitialSoloWaveState();
  const roster = getSoloWaveRoster(1);
  assert.deepEqual(getSoloWaveRescueSpawns(wave, createInitialChainState(), []), roster);
  const chain = registerPlayerEnemyKill(createInitialChainState(), roster[0]).state;
  assert.deepEqual(getSoloWaveRescueSpawns(wave, chain, roster.slice(2)), [roster[0]]);
  assert.deepEqual(getSoloWaveRescueSpawns(wave, chain, roster.slice(4)), [roster[0], roster[0], roster[0]]);
  assert.deepEqual(getSoloWaveRescueSpawns(wave, chain, roster.slice(1)), []);
});

test('reinforcements arrive while one streak is still possible and stabilize the roster', () => {
  const wave = { ...createInitialSoloWaveState(), completedStreaks: 1 };
  const identity = getSoloWaveIdentities(1)[0];
  const living = [identity, identity, identity];
  const reinforcements = getSoloWaveRescueSpawns(wave, createInitialChainState(), living);
  assert.equal(reinforcements.length, 3);
  assert.deepEqual(getSoloWaveRescueSpawns(wave, createInitialChainState(), [...living, ...reinforcements]), []);

  const activeWave = createInitialSoloWaveState();
  const roster = getSoloWaveRoster(1);
  const stranded = [roster[0], roster[4]];
  const rescue = getSoloWaveRescueSpawns(activeWave, createInitialChainState(), stranded);
  assert.equal(rescue.length, 9);
  assert.deepEqual(getSoloWaveRescueSpawns(activeWave, createInitialChainState(), [...stranded, ...rescue]), []);
  assert.deepEqual(getSoloWaveRescueSpawns({ ...activeWave, completedStreaks: 2, phase: 'break' }, createInitialChainState(), []), []);
});

test('completing a streak preserves existing player levels and spawners are chain-neutral', () => {
  const original = {
    ...createInitialChainState(),
    level: 1_000_000,
    progress: 2,
    target: redCircle,
    matchingShape: redCircle.shape,
    matchingColor: redCircle.color,
  };
  const completed = registerPlayerEnemyKill(original, redCircle).state;
  assert.equal(completed.level, original.level);
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

test('autonomous enemy faction combat is disabled while faction relationships remain identifiable', () => {
  assert.equal(MEMORY_ARENA_CONFIG.combat.enemyFactionCombatEnabled, false);
  assert.equal(areEnemyFactionsHostile('red', 'blue'), true);
  assert.equal(areEnemyFactionsHostile('green', 'yellow'), true);
  assert.equal(areEnemyFactionsHostile('red', 'red'), false);
});

test('only the player can damage enemies while autonomous faction combat is disabled', () => {
  assert.equal(canMemoryProjectileDamageEnemies({ isPlayer: true }), true);
  assert.equal(canMemoryProjectileDamageEnemies({ isPlayer: false, isPlayerAlly: true }), false);
  assert.equal(canMemoryProjectileDamageEnemies({ isPlayer: false, factionColor: 'red' }), false);
  assert.equal(canMemoryProjectileDamageEnemies({ isPlayer: false }), false);
  assert.equal(canMemoryProjectileDamageEnemies({ isPlayer: false, isPlayerAlly: true }, true), true);
  assert.equal(canMemoryProjectileDamageEnemies({ isPlayer: false, factionColor: 'red' }, true), true);
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
    cooldownMs: 17000,
  });
  assert.equal(blast.detonated, true);
  assert.equal(blast.state.phase, 'cooldown');
  assert.equal(blast.state.pressure, 0);
  assert.equal(blast.state.cooldownUntil, 3100 + MEMORY_ARENA_CONFIG.factionEmergency.telegraphMs + 17000);

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
    matchingColor: redCircle.color,
    progress: 1,
  }), false);
  assert.equal(isValidChainState({
    ...createInitialChainState(),
    target: redCircle,
    matchingShape: redCircle.shape,
    matchingColor: redCircle.color,
    progress: 3,
  }), false);
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
  ai = advanceTriangleAi(ai, { now: 1000, seesTarget: true, travelled: 0, collidedWithWall: false });
  assert.equal(ai.phase, 'dash');
  ai = markTrianglePlayerHit(ai);
  assert.equal(ai.hitPlayer, true);
  assert.equal(markTrianglePlayerHit(ai), ai);
  ai = advanceTriangleAi(ai, { now: 1100, seesTarget: true, travelled: 600, collidedWithWall: false });
  assert.equal(ai.phase, 'recover');
  ai = advanceTriangleAi(ai, { now: 6100, seesTarget: false, travelled: 0, collidedWithWall: false });
  assert.equal(ai.phase, 'wander');
});

test('triangle warning animation keeps the 900ms timing and settles before the dash', () => {
  assert.equal(MEMORY_ARENA_CONFIG.triangle.telegraphMs, 900);
  const start = getTriangleTelegraphVisual(0);
  const middle = getTriangleTelegraphVisual(450);
  const end = getTriangleTelegraphVisual(900);
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
  assert.equal(Object.keys(MEMORY_MAP_CORE_INDICES).length, VALID_MAP_IDS.length + 1);
  assert.ok(VALID_MAP_IDS.every(mapId => mapId in MEMORY_MAP_CORE_INDICES));
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
