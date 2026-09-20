export const ENEMY_SHAPES = ['circle', 'square', 'triangle'] as const;
export type EnemyShape = (typeof ENEMY_SHAPES)[number];

export const ENEMY_FACTIONS = ['red', 'blue', 'green', 'yellow'] as const;
export type EnemyFactionColor = (typeof ENEMY_FACTIONS)[number];

export const ABILITY_IDS = ['damage', 'special', 'build', 'convert'] as const;
export type AbilityId = (typeof ABILITY_IDS)[number];

export type AbilityOwnership = Record<AbilityId, boolean>;
export type AbilityDropProgress = Record<EnemyFactionColor, number>;
export type AbilityKillCredit = 'player' | 'ally' | 'faction';

export interface AbilityPickup {
  id: string;
  x: number;
  y: number;
  radius: number;
  factionColor: EnemyFactionColor;
  abilityId: AbilityId;
}

export const ABILITY_BY_FACTION: Record<EnemyFactionColor, AbilityId> = {
  red: 'damage',
  blue: 'special',
  green: 'convert',
  yellow: 'build',
};

export const ABILITY_LABELS: Record<AbilityId, string> = {
  damage: 'DAMAGE',
  special: 'SPECIAL',
  build: 'BUILD',
  convert: 'CONVERT',
};

/**
 * The complete solo-gameplay palette lives here so visual tuning never
 * requires hunting through canvas rendering code.
 */
export const MEMORY_ARENA_PALETTE = {
  player: {
    body: '#F4FBFF',
    effect: '#00E5FF',
    glow: 'rgba(0, 229, 255, 0.34)',
    allyBody: '#083B46',
  },
  walls: {
    fill: '#101820',
    stroke: '#294354',
    highlight: '#477083',
    glow: 'rgba(71, 112, 131, 0.28)',
  },
  factions: {
    red: { bright: '#FF4D6D', body: '#541D2B', glow: 'rgba(255, 77, 109, 0.34)' },
    blue: { bright: '#637CFF', body: '#222B59', glow: 'rgba(99, 124, 255, 0.34)' },
    green: { bright: '#2ED99A', body: '#174A3A', glow: 'rgba(46, 217, 154, 0.32)' },
    yellow: { bright: '#FFC857', body: '#57451E', glow: 'rgba(255, 200, 87, 0.32)' },
  },
} as const;

export const ENEMY_COLOR_HEX: Record<EnemyFactionColor, string> = {
  red: MEMORY_ARENA_PALETTE.factions.red.bright,
  blue: MEMORY_ARENA_PALETTE.factions.blue.bright,
  green: MEMORY_ARENA_PALETTE.factions.green.bright,
  yellow: MEMORY_ARENA_PALETTE.factions.yellow.bright,
};

export const PLAYER_COLOR_HEX = MEMORY_ARENA_PALETTE.player.effect;

export const MEMORY_ARENA_CONFIG = {
  combat: {
    bulletRicochetEnabled: false,
    enemyFactionCombatEnabled: true,
  },
  navigation: {
    wallFollowOutwardWeight: 0.28,
    pathClearanceInset: 0.5,
  },
  threat: {
    millisecondsPerTimeTier: 60000,
    playerLevelsPerTier: 3,
    spawnIntervalMultiplierPerTier: 0.92,
    minimumSpawnIntervalMs: 3000,
    replicationIntervalMultiplierPerTier: 0.9,
    minimumReplicationIntervalMs: 12000,
    armySizePerTwoTiers: 1,
    maximumArmySize: 14,
    factionAbilityCooldownReductionMsPerTier: 1000,
    minimumFactionAbilityCooldownMs: 15000,
    movementMultiplierPerTier: 0.025,
    maximumMovementMultiplier: 1.3,
    fullVisualIntensityTier: 12,
  },
  raids: {
    armySize: 6,
    preparationMs: 2000,
    engagementRange: 300,
    arrivalRange: 260,
    minimumArrivals: 3,
    siegeMs: 15000,
    cooldownMs: 10000,
    formationRadiusMin: 130,
    formationRadiusMax: 210,
  },
  factionEmergency: {
    maximumPressure: 100,
    minimumNearbyHostiles: 4,
    pressurePerExcessHostilePerSecond: 12,
    pressureDecayPerSecond: 16,
    replicaLossPressure: 30,
    telegraphMs: 1200,
    cooldownMs: 30000,
    redPulseRadius: 125,
    blueShieldRadius: 42,
    blueShieldDurationMs: 3500,
    greenConversionRadius: 180,
    greenPullDurationMs: 700,
    yellowFormationSpeed: 240,
    yellowFormationForwardOffset: 110,
    yellowWallSegmentSize: 36,
    yellowWallSpacing: 40,
    yellowWallDurationMs: 10000,
  },
  relics: {
    enabled: false,
  },
  abilityDrops: {
    chance: 0.12,
    pityKills: 8,
    pickupRadius: 16,
    collectionPadding: 4,
  },
  player: {
    maxHp: 100,
    regenerationPercentPerSecond: 0.02,
  },
  progression: {
    hpMultiplierPerUpgrade: 1.4,
    fireRateMultiplierPerUpgrade: 1.4,
    regenerationPercentPerUpgrade: 0.0075,
    cooldownSecondsPerUpgrade: 2,
    minimumCooldownSeconds: 4,
    threeStreamThresholdBulletsPerSecond: 10,
    maximumBulletsPerSecond: 30,
    maximumVisualRadius: 22,
  },
  spawner: {
    hp: 100,
    playerBulletDamage: 10,
    spawnIntervalMs: 6000,
    spawnStaggerMs: 1500,
    livingEnemyCap: 120,
    replicationIntervalMs: 25000,
    replicationStaggerMs: 2500,
    replicationRetryMs: 5000,
    replicaHp: 60,
    replicaRadius: 32,
    maximumLivingSpawners: 40,
    replicationStartDistance: 180,
    replicationSearchStep: 48,
    replicationSearchRadius: 720,
    replicationCandidateAngles: 16,
    replicationPlacementPadding: 14,
    replicationPlayerClearance: 120,
  },
  circle: {
    bulletDamage: 30,
    fireIntervalMs: 2500,
    aggroRange: 1000,
  },
  square: {
    bulletDamage: 12,
    fireIntervalMs: 2500,
    rotationRadiansPerSecond: 0.5,
    minTurnIntervalMs: 2500,
    maxTurnIntervalMs: 4500,
  },
  triangle: {
    dashDamage: 50,
    detectionRange: 450,
    telegraphMs: 600,
    telegraphTurnSpeedRadiansPerSecond: 9,
    dashSpeed: 500,
    maxDashDistance: 600,
    recoveryMs: 4000,
  },
} as const;

export interface MovementVector {
  x: number;
  y: number;
}

export interface MemoryThreatStats {
  tier: number;
  timeTier: number;
  levelTier: number;
  spawnIntervalMs: number;
  replicationIntervalMs: number;
  armySize: number;
  factionAbilityCooldownMs: number;
  enemyMovementMultiplier: number;
  visualIntensity: number;
}

export function getMemoryThreatStats(elapsedRunMs: number, playerLevel: number): MemoryThreatStats {
  const config = MEMORY_ARENA_CONFIG.threat;
  const safeElapsedMs = Math.max(0, Number.isFinite(elapsedRunMs) ? elapsedRunMs : 0);
  const safeLevel = Math.max(1, Number.isFinite(playerLevel) ? Math.floor(playerLevel) : 1);
  const timeTier = Math.floor(safeElapsedMs / config.millisecondsPerTimeTier);
  const levelTier = Math.floor((safeLevel - 1) / config.playerLevelsPerTier);
  const tier = timeTier + levelTier;
  return {
    tier,
    timeTier,
    levelTier,
    spawnIntervalMs: Math.max(
      config.minimumSpawnIntervalMs,
      Math.round(MEMORY_ARENA_CONFIG.spawner.spawnIntervalMs * Math.pow(
        config.spawnIntervalMultiplierPerTier,
        tier,
      )),
    ),
    replicationIntervalMs: Math.max(
      config.minimumReplicationIntervalMs,
      Math.round(MEMORY_ARENA_CONFIG.spawner.replicationIntervalMs * Math.pow(
        config.replicationIntervalMultiplierPerTier,
        tier,
      )),
    ),
    armySize: Math.min(
      config.maximumArmySize,
      MEMORY_ARENA_CONFIG.raids.armySize + Math.floor(tier / 2) * config.armySizePerTwoTiers,
    ),
    factionAbilityCooldownMs: Math.max(
      config.minimumFactionAbilityCooldownMs,
      MEMORY_ARENA_CONFIG.factionEmergency.cooldownMs -
        tier * config.factionAbilityCooldownReductionMsPerTier,
    ),
    enemyMovementMultiplier: Math.min(
      config.maximumMovementMultiplier,
      1 + tier * config.movementMultiplierPerTier,
    ),
    visualIntensity: Math.min(1, tier / config.fullVisualIntensityTier),
  };
}

/**
 * Picks a stable direction along a wall while keeping a small outward component.
 * The outward component prevents units from repeatedly scraping into the wall,
 * while the target score makes them take the shorter side around an obstacle.
 */
export function getWallFollowDirection(
  collisionNormals: readonly MovementVector[],
  targetDirection: MovementVector,
  tieBreaker = 1,
): MovementVector {
  let normalX = 0;
  let normalY = 0;
  for (const normal of collisionNormals) {
    normalX += normal.x;
    normalY += normal.y;
  }

  const normalLength = Math.hypot(normalX, normalY);
  if (normalLength <= 0.0001) {
    const targetLength = Math.hypot(targetDirection.x, targetDirection.y);
    return targetLength > 0.0001
      ? { x: targetDirection.x / targetLength, y: targetDirection.y / targetLength }
      : { x: tieBreaker >= 0 ? 1 : -1, y: 0 };
  }
  normalX /= normalLength;
  normalY /= normalLength;

  const targetLength = Math.hypot(targetDirection.x, targetDirection.y);
  const targetX = targetLength > 0.0001 ? targetDirection.x / targetLength : 0;
  const targetY = targetLength > 0.0001 ? targetDirection.y / targetLength : 0;
  const clockwise = { x: -normalY, y: normalX };
  const counterClockwise = { x: normalY, y: -normalX };
  const clockwiseScore = clockwise.x * targetX + clockwise.y * targetY;
  const counterClockwiseScore = counterClockwise.x * targetX + counterClockwise.y * targetY;
  const tangent = Math.abs(clockwiseScore - counterClockwiseScore) < 0.02
    ? (tieBreaker >= 0 ? clockwise : counterClockwise)
    : (clockwiseScore > counterClockwiseScore ? clockwise : counterClockwise);
  const outwardWeight = MEMORY_ARENA_CONFIG.navigation.wallFollowOutwardWeight;
  const steerX = tangent.x + normalX * outwardWeight;
  const steerY = tangent.y + normalY * outwardWeight;
  const steerLength = Math.max(0.0001, Math.hypot(steerX, steerY));
  return { x: steerX / steerLength, y: steerY / steerLength };
}

export const PLAYER_UPGRADE_STATS = ['fireRate', 'maxHp', 'regeneration', 'cooldown'] as const;
export type PlayerUpgradeStat = (typeof PLAYER_UPGRADE_STATS)[number];

export interface PlayerUpgradeRanks {
  fireRate: number;
  maxHp: number;
  regeneration: number;
  cooldown: number;
}

export interface PlayerLevelStats {
  maxHp: number;
  regenerationPercentPerSecond: number;
  bulletsPerSecond: number;
  streamCount: 1 | 3;
  volleyIntervalMs: number;
  cooldownSeconds: number;
  visualRadius: number;
}

export interface PlayerLevelUpgrade {
  stat: PlayerUpgradeStat;
  ranks: PlayerUpgradeRanks;
  stats: PlayerLevelStats;
}

export function createInitialPlayerUpgradeRanks(): PlayerUpgradeRanks {
  return { fireRate: 0, maxHp: 0, regeneration: 0, cooldown: 0 };
}

export function isValidPlayerUpgradeRanks(value: unknown): value is PlayerUpgradeRanks {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Partial<PlayerUpgradeRanks>;
  return PLAYER_UPGRADE_STATS.every(stat => (
    Number.isInteger(candidate[stat]) &&
    (candidate[stat] as number) >= 0 &&
    (candidate[stat] as number) <= 1_000_000_000
  ));
}

export function getPlayerLevelStats(ranks: PlayerUpgradeRanks): PlayerLevelStats {
  const progression = MEMORY_ARENA_CONFIG.progression;
  const uncappedBulletsPerSecond = 1.25 * Math.pow(progression.fireRateMultiplierPerUpgrade, ranks.fireRate);
  const bulletsPerSecond = Math.min(progression.maximumBulletsPerSecond, uncappedBulletsPerSecond);
  const streamCount: 1 | 3 = bulletsPerSecond > progression.threeStreamThresholdBulletsPerSecond ? 3 : 1;
  return {
    maxHp: Math.min(1_000_000_000, Math.round(
      MEMORY_ARENA_CONFIG.player.maxHp * Math.pow(progression.hpMultiplierPerUpgrade, ranks.maxHp),
    )),
    regenerationPercentPerSecond:
      MEMORY_ARENA_CONFIG.player.regenerationPercentPerSecond +
      ranks.regeneration * progression.regenerationPercentPerUpgrade,
    bulletsPerSecond,
    streamCount,
    volleyIntervalMs: 1000 * streamCount / bulletsPerSecond,
    cooldownSeconds: Math.max(
      progression.minimumCooldownSeconds,
      15 - ranks.cooldown * progression.cooldownSecondsPerUpgrade,
    ),
    visualRadius: Math.min(
      progression.maximumVisualRadius,
      16 + ranks.maxHp * 0.75,
    ),
  };
}

function isPlayerUpgradeStatCapped(stat: PlayerUpgradeStat, ranks: PlayerUpgradeRanks): boolean {
  const stats = getPlayerLevelStats(ranks);
  if (stat === 'fireRate') {
    return stats.bulletsPerSecond >= MEMORY_ARENA_CONFIG.progression.maximumBulletsPerSecond;
  }
  if (stat === 'cooldown') {
    return stats.cooldownSeconds <= MEMORY_ARENA_CONFIG.progression.minimumCooldownSeconds;
  }
  return false;
}

export function grantPlayerLevelUpgrade(
  newLevel: number,
  currentRanks: PlayerUpgradeRanks,
): PlayerLevelUpgrade {
  const cycleIndex = Math.max(0, newLevel - 2) % PLAYER_UPGRADE_STATS.length;
  let stat = PLAYER_UPGRADE_STATS[cycleIndex];
  if (isPlayerUpgradeStatCapped(stat, currentRanks)) {
    stat = currentRanks.maxHp <= currentRanks.regeneration ? 'maxHp' : 'regeneration';
  }
  const ranks = { ...currentRanks, [stat]: currentRanks[stat] + 1 };
  return { stat, ranks, stats: getPlayerLevelStats(ranks) };
}

export function derivePlayerUpgradeRanks(level: number): PlayerUpgradeRanks {
  const boundedLevel = Math.max(1, Math.floor(level));
  let ranks = createInitialPlayerUpgradeRanks();
  const exactEnd = Math.min(boundedLevel, 45);
  for (let nextLevel = 2; nextLevel <= exactEnd; nextLevel++) {
    ranks = grantPlayerLevelUpgrade(nextLevel, ranks).ranks;
  }

  if (boundedLevel <= exactEnd) return ranks;

  let remaining = boundedLevel - exactEnd;
  const completeCycles = Math.floor(remaining / 4);
  if (completeCycles > 0) {
    ranks = {
      ...ranks,
      maxHp: ranks.maxHp + completeCycles * 2,
      regeneration: ranks.regeneration + completeCycles * 2,
    };
    remaining -= completeCycles * 4;
  }
  for (let offset = 1; offset <= remaining; offset++) {
    ranks = grantPlayerLevelUpgrade(exactEnd + completeCycles * 4 + offset, ranks).ranks;
  }
  return ranks;
}

export function createEmptyAbilityOwnership(): AbilityOwnership {
  return { damage: false, special: false, build: false, convert: false };
}

export function createFullAbilityOwnership(): AbilityOwnership {
  return { damage: true, special: true, build: true, convert: true };
}

export function createInitialAbilityDropProgress(): AbilityDropProgress {
  return { red: 0, blue: 0, green: 0, yellow: 0 };
}

export function collectAbilityPickup(
  ownership: AbilityOwnership,
  abilityId: AbilityId,
  abilityLastUsed: number,
): { ownership: AbilityOwnership; abilityLastUsed: number } {
  return {
    ownership: ownership[abilityId] ? ownership : { ...ownership, [abilityId]: true },
    abilityLastUsed,
  };
}

export function isValidAbilityOwnership(value: unknown): value is AbilityOwnership {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Partial<AbilityOwnership>;
  return ABILITY_IDS.every(abilityId => typeof candidate[abilityId] === 'boolean');
}

export function isValidAbilityDropProgress(value: unknown): value is AbilityDropProgress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Partial<AbilityDropProgress>;
  return ENEMY_FACTIONS.every(faction => (
    Number.isInteger(candidate[faction]) &&
    (candidate[faction] as number) >= 0 &&
    (candidate[faction] as number) < MEMORY_ARENA_CONFIG.abilityDrops.pityKills
  ));
}

export interface AbilityDropKillInput {
  factionColor: EnemyFactionColor;
  credit: AbilityKillCredit;
  defeatedWasPlayerAlly: boolean;
  ownership: AbilityOwnership;
  progress: AbilityDropProgress;
  hasActivePickup: boolean;
  randomValue: number;
}

export interface AbilityDropKillResult {
  abilityId: AbilityId;
  shouldDrop: boolean;
  progress: AbilityDropProgress;
}

export function registerAbilityDropKill(input: AbilityDropKillInput): AbilityDropKillResult {
  const abilityId = ABILITY_BY_FACTION[input.factionColor];
  const eligibleCredit = input.credit === 'player' || input.credit === 'ally';
  if (
    !eligibleCredit ||
    input.defeatedWasPlayerAlly ||
    input.ownership[abilityId] ||
    input.hasActivePickup
  ) {
    return { abilityId, shouldDrop: false, progress: input.progress };
  }

  const nextCount = input.progress[input.factionColor] + 1;
  const shouldDrop = nextCount >= MEMORY_ARENA_CONFIG.abilityDrops.pityKills ||
    input.randomValue < MEMORY_ARENA_CONFIG.abilityDrops.chance;
  return {
    abilityId,
    shouldDrop,
    progress: {
      ...input.progress,
      [input.factionColor]: shouldDrop ? 0 : nextCount,
    },
  };
}

export interface EnemyIdentity {
  shape: EnemyShape;
  color: EnemyFactionColor;
}

export function getMissingEnemyCombinations(
  enemies: readonly { shape?: EnemyShape; factionColor?: EnemyFactionColor; isPlayerAlly?: boolean }[],
): EnemyIdentity[] {
  const present = new Set(enemies.filter(enemy => !enemy.isPlayerAlly).map(enemy => `${enemy.factionColor}:${enemy.shape}`));
  return ENEMY_FACTIONS.flatMap(color => ENEMY_SHAPES
    .filter(shape => !present.has(`${color}:${shape}`))
    .map(shape => ({ shape, color })));
}

export interface EnemyAiState {
  orientation: number;
  movementDirection: Vector2;
  nextDecisionAt: number;
  triangle?: TriangleAiState;
}

export interface ColoredCoreSpawnerState {
  factionColor: EnemyFactionColor;
  isCore: true;
  hp: number;
  maxHp: number;
  nextSpawnAt: number;
  spawnBag: EnemyShape[];
}

export interface LegacySpawnerDefinition {
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  specialType?: string;
}

export type MemoryCoreSpawnerDefinition = LegacySpawnerDefinition & {
  factionColor: EnemyFactionColor;
  isCore: true;
};

export function createMemoryCoreSpawners(
  originalSpawners: readonly LegacySpawnerDefinition[],
  coreIndices: readonly number[],
): MemoryCoreSpawnerDefinition[] {
  if (coreIndices.length !== ENEMY_FACTIONS.length || new Set(coreIndices).size !== coreIndices.length) {
    throw new Error('Memory maps require four unique core spawner indices');
  }

  return coreIndices.map((sourceIndex, factionIndex) => {
    const source = originalSpawners[sourceIndex];
    if (!source) throw new Error(`Missing spawner index ${sourceIndex}`);
    return {
      ...source,
      specialType: MEMORY_ARENA_CONFIG.relics.enabled ? source.specialType : undefined,
      factionColor: ENEMY_FACTIONS[factionIndex],
      isCore: true,
    };
  });
}

// Values are ordered red, blue, green, yellow. Five-spawner maps omit the least
// structurally important core while the canonical map and relic data remain unchanged.
export const MEMORY_MAP_CORE_INDICES: Record<string, readonly [number, number, number, number]> = {
  medium: [0, 1, 2, 3],
  easy: [2, 1, 0, 3],
  hard: [0, 1, 2, 3],
  classic_arena: [0, 1, 2, 3],
  crossroads: [0, 1, 2, 3],
  snipers_nest: [2, 1, 0, 3],
  fortress: [3, 2, 1, 4],
  choke_points: [0, 1, 2, 3],
  the_gauntlet: [0, 1, 3, 4],
  pinball: [1, 2, 3, 4],
  safe_haven: [4, 2, 0, 3],
  gladiator_pit: [1, 2, 3, 4],
  sector_control: [0, 1, 2, 3],
  hellfire_ring: [1, 2, 3, 4],
  gridlock: [1, 2, 0, 4],
  labyrinth: [0, 1, 3, 4],
  scattered_ruins: [0, 1, 3, 4],
  checkerboard: [0, 1, 3, 4],
  memory_test: [0, 1, 2, 3],
};

export interface ChainState {
  target: EnemyIdentity | null;
  matchingShape: EnemyShape | null;
  matchingColor: EnemyFactionColor | null;
  progress: number;
  level: number;
  completedChains: number;
}

export type ChainResult = 'started' | 'advanced' | 'retargeted' | 'completed';

export interface ChainTransition {
  state: ChainState;
  result: ChainResult;
}

export function createInitialChainState(): ChainState {
  return {
    target: null,
    matchingShape: null,
    matchingColor: null,
    progress: 0,
    level: 1,
    completedChains: 0,
  };
}

export function isEnemyShape(value: unknown): value is EnemyShape {
  return typeof value === 'string' && (ENEMY_SHAPES as readonly string[]).includes(value);
}

export function isEnemyFactionColor(value: unknown): value is EnemyFactionColor {
  return typeof value === 'string' && (ENEMY_FACTIONS as readonly string[]).includes(value);
}

export type FactionRaidPhase = 'idle' | 'forming' | 'marching' | 'sieging' | 'cooldown';

export interface FactionRaidState {
  phase: FactionRaidPhase;
  targetFactionColor: EnemyFactionColor | null;
  phaseStartedAt: number;
}

export type FactionRaidStates = Record<EnemyFactionColor, FactionRaidState>;

export type FactionEmergencyPhase = 'idle' | 'telegraph' | 'cooldown';

export interface FactionEmergencyState {
  phase: FactionEmergencyPhase;
  pressure: number;
  phaseStartedAt: number;
  cooldownUntil: number;
}

export type FactionEmergencyStates = Record<EnemyFactionColor, FactionEmergencyState>;

export interface FactionEmergencyTransition {
  state: FactionEmergencyState;
  beganTelegraph: boolean;
  detonated: boolean;
}

export type FactionEnemyAbilityId = 'damagePulse' | 'reflectionShield' | 'conversionPulse' | 'buildWall';

export const FACTION_EMERGENCY_ABILITY_BY_FACTION: Record<EnemyFactionColor, FactionEnemyAbilityId> = {
  red: 'damagePulse',
  blue: 'reflectionShield',
  green: 'conversionPulse',
  yellow: 'buildWall',
};

export function isFactionEnemyAbilityId(value: unknown): value is FactionEnemyAbilityId {
  return typeof value === 'string' && [
    'damagePulse',
    'reflectionShield',
    'conversionPulse',
    'buildWall',
  ].includes(value);
}

export function createInitialFactionRaidStates(now = 0): FactionRaidStates {
  return Object.fromEntries(ENEMY_FACTIONS.map(faction => [faction, {
    phase: 'idle',
    targetFactionColor: null,
    phaseStartedAt: now,
  }])) as FactionRaidStates;
}

export function createInitialFactionEmergencyStates(now = 0): FactionEmergencyStates {
  return Object.fromEntries(ENEMY_FACTIONS.map(faction => [faction, {
    phase: 'idle',
    pressure: 0,
    phaseStartedAt: now,
    cooldownUntil: now,
  }])) as FactionEmergencyStates;
}

export function isValidFactionEmergencyStates(value: unknown): value is FactionEmergencyStates {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Partial<Record<EnemyFactionColor, Partial<FactionEmergencyState>>>;
  return ENEMY_FACTIONS.every(faction => {
    const state = candidate[faction];
    return Boolean(
      state &&
      ['idle', 'telegraph', 'cooldown'].includes(state.phase ?? '') &&
      typeof state.pressure === 'number' &&
      Number.isFinite(state.pressure) &&
      state.pressure >= 0 &&
      state.pressure <= MEMORY_ARENA_CONFIG.factionEmergency.maximumPressure &&
      typeof state.phaseStartedAt === 'number' &&
      Number.isFinite(state.phaseStartedAt) &&
      state.phaseStartedAt >= 0 &&
      typeof state.cooldownUntil === 'number' &&
      Number.isFinite(state.cooldownUntil) &&
      state.cooldownUntil >= 0
    );
  });
}

export function addFactionEmergencyPressure(
  current: FactionEmergencyState,
  amount: number,
): FactionEmergencyState {
  if (current.phase !== 'idle' || amount <= 0) return current;
  return {
    ...current,
    pressure: Math.min(
      MEMORY_ARENA_CONFIG.factionEmergency.maximumPressure,
      current.pressure + amount,
    ),
  };
}

export function advanceFactionEmergencyState(
  current: FactionEmergencyState,
  input: {
    now: number;
    deltaSeconds: number;
    nearbyFriendlies: number;
    nearbyHostiles: number;
    factionAlive: boolean;
    abilityAvailable: boolean;
    cooldownMs?: number;
  },
): FactionEmergencyTransition {
  const config = MEMORY_ARENA_CONFIG.factionEmergency;
  if (!input.factionAlive) {
    return {
      state: {
        phase: 'idle',
        pressure: 0,
        phaseStartedAt: input.now,
        cooldownUntil: input.now,
      },
      beganTelegraph: false,
      detonated: false,
    };
  }

  if (current.phase === 'telegraph') {
    if (input.now - current.phaseStartedAt < config.telegraphMs) {
      return { state: current, beganTelegraph: false, detonated: false };
    }
    return {
      state: {
        phase: 'cooldown',
        pressure: 0,
        phaseStartedAt: input.now,
        cooldownUntil: input.now + Math.max(0, input.cooldownMs ?? config.cooldownMs),
      },
      beganTelegraph: false,
      detonated: true,
    };
  }

  if (current.phase === 'cooldown') {
    if (input.now < current.cooldownUntil) {
      return { state: current, beganTelegraph: false, detonated: false };
    }
    return {
      state: {
        phase: 'idle',
        pressure: 0,
        phaseStartedAt: input.now,
        cooldownUntil: input.now,
      },
      beganTelegraph: false,
      detonated: false,
    };
  }

  const safeDeltaSeconds = Math.max(0, input.deltaSeconds);
  const excessHostiles = input.nearbyHostiles >= config.minimumNearbyHostiles
    ? Math.max(0, input.nearbyHostiles - input.nearbyFriendlies)
    : 0;
  const pressureDelta = excessHostiles > 0
    ? excessHostiles * config.pressurePerExcessHostilePerSecond * safeDeltaSeconds
    : -config.pressureDecayPerSecond * safeDeltaSeconds;
  const pressure = Math.max(0, Math.min(config.maximumPressure, current.pressure + pressureDelta));

  if (input.abilityAvailable && pressure >= config.maximumPressure) {
    return {
      state: {
        phase: 'telegraph',
        pressure: config.maximumPressure,
        phaseStartedAt: input.now,
        cooldownUntil: current.cooldownUntil,
      },
      beganTelegraph: true,
      detonated: false,
    };
  }

  return {
    state: { ...current, pressure },
    beganTelegraph: false,
    detonated: false,
  };
}

export function isValidFactionRaidStates(value: unknown): value is FactionRaidStates {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Partial<Record<EnemyFactionColor, Partial<FactionRaidState>>>;
  return ENEMY_FACTIONS.every(faction => {
    const raid = candidate[faction];
    const targetIsValid = raid?.targetFactionColor === null || (
      isEnemyFactionColor(raid?.targetFactionColor) &&
      raid.targetFactionColor !== faction
    );
    return Boolean(
      raid &&
      ['idle', 'forming', 'marching', 'sieging', 'cooldown'].includes(raid.phase ?? '') &&
      targetIsValid &&
      typeof raid.phaseStartedAt === 'number' &&
      Number.isFinite(raid.phaseStartedAt) &&
      raid.phaseStartedAt >= 0
    );
  });
}

export function getRaidFormationOffset(enemyId: string): Vector2 {
  let hash = 2166136261;
  for (let index = 0; index < enemyId.length; index++) {
    hash ^= enemyId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const unsignedHash = hash >>> 0;
  const angle = (unsignedHash / 0xffffffff) * Math.PI * 2;
  const radiusRange = MEMORY_ARENA_CONFIG.raids.formationRadiusMax - MEMORY_ARENA_CONFIG.raids.formationRadiusMin;
  const radius = MEMORY_ARENA_CONFIG.raids.formationRadiusMin + (unsignedHash % 997) / 996 * radiusRange;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

export function areEnemyFactionsHostile(
  first: EnemyFactionColor,
  second: EnemyFactionColor,
): boolean {
  return first !== second;
}

export function registerPlayerEnemyKill(current: ChainState, killed: EnemyIdentity): ChainTransition {
  if (!current.target) {
    return {
      result: 'started',
      state: {
        ...current,
        target: { ...killed },
        matchingShape: killed.shape,
        matchingColor: killed.color,
        progress: 1,
      },
    };
  }

  const matchingShape = current.matchingShape === killed.shape ? current.matchingShape : null;
  const matchingColor = current.matchingColor === killed.color ? current.matchingColor : null;
  if (!matchingShape && !matchingColor) {
    return {
      result: 'retargeted',
      state: {
        ...current,
        target: { ...killed },
        matchingShape: killed.shape,
        matchingColor: killed.color,
        progress: 1,
      },
    };
  }

  const nextProgress = current.progress + 1;
  if (nextProgress >= 4) {
    return {
      result: 'completed',
      state: {
        target: null,
        matchingShape: null,
        matchingColor: null,
        progress: 0,
        level: current.level + 1,
        completedChains: current.completedChains + 1,
      },
    };
  }

  return {
    result: 'advanced',
    state: { ...current, matchingShape, matchingColor, progress: nextProgress },
  };
}

export function preserveChainOnSpawnerDestroyed(current: ChainState): ChainState {
  return current;
}

export function createShuffledShapeBag(random: () => number = Math.random): EnemyShape[] {
  const bag = [...ENEMY_SHAPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

export function takeShapeFromBag(
  currentBag: readonly EnemyShape[],
  random: () => number = Math.random,
): { shape: EnemyShape; remaining: EnemyShape[] } {
  const bag = currentBag.length > 0 ? [...currentBag] : createShuffledShapeBag(random);
  const shape = bag.shift();
  if (!shape) {
    throw new Error('Shape bag could not produce an enemy shape');
  }
  return { shape, remaining: bag };
}

export interface Vector2 {
  x: number;
  y: number;
}

export function countRemainingCoreSpawners(
  spawners: readonly { isCore?: boolean; hp?: number }[],
): number {
  return spawners.filter(spawner => spawner.isCore === true && (spawner.hp ?? 1) > 0).length;
}

export function canEnemyFactionDamageSpawner(
  attackingFaction: EnemyFactionColor,
  spawner: { isCore?: boolean; factionColor?: EnemyFactionColor },
): boolean {
  return spawner.isCore === false && Boolean(
    spawner.factionColor && areEnemyFactionsHostile(attackingFaction, spawner.factionColor),
  );
}

export function findNearestSpawnerReplicationPosition(
  origin: Vector2,
  isValid: (x: number, y: number) => boolean,
  angleOffset = 0,
): Vector2 | null {
  const config = MEMORY_ARENA_CONFIG.spawner;
  for (
    let distance = config.replicationStartDistance;
    distance <= config.replicationSearchRadius;
    distance += config.replicationSearchStep
  ) {
    for (let index = 0; index < config.replicationCandidateAngles; index++) {
      const angle = angleOffset + index * Math.PI * 2 / config.replicationCandidateAngles;
      const x = origin.x + Math.cos(angle) * distance;
      const y = origin.y + Math.sin(angle) * distance;
      if (isValid(x, y)) return { x, y };
    }
  }
  return null;
}

export function getSquareVolleyDirections(rotation: number): [Vector2, Vector2, Vector2, Vector2] {
  return [0, 1, 2, 3].map((index) => {
    const angle = rotation + index * Math.PI / 2;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  }) as [Vector2, Vector2, Vector2, Vector2];
}

export type TrianglePhase = 'wander' | 'telegraph' | 'dash' | 'recover';

export interface TriangleAiState {
  phase: TrianglePhase;
  phaseStartedAt: number;
  dashDistance: number;
  hitPlayer: boolean;
}

export interface TriangleTelegraphVisual {
  pullBack: number;
  glowBlur: number;
  auraAlpha: number;
  auraScale: number;
  scaleX: number;
  scaleY: number;
}

export function getTriangleTelegraphVisual(elapsedMs: number): TriangleTelegraphVisual {
  const progress = Math.max(0, Math.min(1, elapsedMs / MEMORY_ARENA_CONFIG.triangle.telegraphMs));
  const easedProgress = progress * progress * (3 - 2 * progress);

  return {
    pullBack: 7 * easedProgress,
    glowBlur: 12 + easedProgress * 16,
    auraAlpha: 0.08 + easedProgress * 0.2,
    auraScale: 1.1 + easedProgress * 0.35,
    scaleX: 1 - easedProgress * 0.07,
    scaleY: 1 + easedProgress * 0.05,
  };
}

export function turnAngleTowards(current: number, target: number, maxStep: number): number {
  const twoPi = Math.PI * 2;
  const delta = ((target - current + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
  if (Math.abs(delta) <= maxStep) return target;
  return current + Math.sign(delta) * Math.max(0, maxStep);
}

export interface TriangleStepInput {
  now: number;
  seesTarget: boolean;
  travelled: number;
  collidedWithWall: boolean;
}

export function createTriangleAiState(now = 0): TriangleAiState {
  return { phase: 'wander', phaseStartedAt: now, dashDistance: 0, hitPlayer: false };
}

export function advanceTriangleAi(
  current: TriangleAiState,
  input: TriangleStepInput,
): TriangleAiState {
  if (current.phase === 'wander' && input.seesTarget) {
    return { phase: 'telegraph', phaseStartedAt: input.now, dashDistance: 0, hitPlayer: false };
  }

  if (
    current.phase === 'telegraph' &&
    input.now - current.phaseStartedAt >= MEMORY_ARENA_CONFIG.triangle.telegraphMs
  ) {
    return { phase: 'dash', phaseStartedAt: input.now, dashDistance: 0, hitPlayer: false };
  }

  if (current.phase === 'dash') {
    const dashDistance = current.dashDistance + Math.max(0, input.travelled);
    if (input.collidedWithWall || dashDistance >= MEMORY_ARENA_CONFIG.triangle.maxDashDistance) {
      return { phase: 'recover', phaseStartedAt: input.now, dashDistance, hitPlayer: current.hitPlayer };
    }
    return { ...current, dashDistance };
  }

  if (
    current.phase === 'recover' &&
    input.now - current.phaseStartedAt >= MEMORY_ARENA_CONFIG.triangle.recoveryMs
  ) {
    return { phase: 'wander', phaseStartedAt: input.now, dashDistance: 0, hitPlayer: false };
  }

  return current;
}

export function markTrianglePlayerHit(current: TriangleAiState): TriangleAiState {
  if (current.phase !== 'dash' || current.hitPlayer) return current;
  return { ...current, hitPlayer: true };
}

export function applyPlayerDamage(hp: number, damage: number): number {
  return Math.max(0, hp - Math.max(0, damage));
}

export function regeneratePlayerHealth(
  hp: number,
  maxHp: number,
  regenerationPercentPerSecond: number,
  deltaSeconds: number,
): number {
  return Math.min(
    maxHp,
    hp + maxHp * Math.max(0, regenerationPercentPerSecond) * Math.max(0, deltaSeconds),
  );
}

export function isValidChainState(value: unknown): value is ChainState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ChainState>;
  const targetValid = candidate.target === null || (
    Boolean(candidate.target) &&
    isEnemyShape(candidate.target?.shape) &&
    isEnemyFactionColor(candidate.target?.color)
  );
  const matchingShapeValid = candidate.matchingShape === null || isEnemyShape(candidate.matchingShape);
  const matchingColorValid = candidate.matchingColor === null || isEnemyFactionColor(candidate.matchingColor);
  const progressValid = Number.isInteger(candidate.progress) &&
    (candidate.progress as number) >= 0 &&
    (candidate.progress as number) <= 3;
  const targetAndTraitsAgree = candidate.progress === 0
    ? candidate.target === null && candidate.matchingShape === null && candidate.matchingColor === null
    : Boolean(
        candidate.target &&
        (candidate.matchingShape !== null || candidate.matchingColor !== null) &&
        (candidate.matchingShape === null || candidate.matchingShape === candidate.target.shape) &&
        (candidate.matchingColor === null || candidate.matchingColor === candidate.target.color)
      );
  return Boolean(
    targetValid &&
    matchingShapeValid &&
    matchingColorValid &&
    progressValid &&
    targetAndTraitsAgree &&
    Number.isInteger(candidate.level) &&
    (candidate.level as number) >= 1 &&
    Number.isInteger(candidate.completedChains) &&
    (candidate.completedChains as number) >= 0
  );
}
