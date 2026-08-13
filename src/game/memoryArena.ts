export const ENEMY_SHAPES = ['circle', 'square', 'triangle'] as const;
export type EnemyShape = (typeof ENEMY_SHAPES)[number];

export const ENEMY_FACTIONS = ['red', 'blue', 'green', 'yellow'] as const;
export type EnemyFactionColor = (typeof ENEMY_FACTIONS)[number];

/**
 * The complete solo-gameplay palette lives here so visual tuning never
 * requires hunting through canvas rendering code.
 */
export const MEMORY_ARENA_PALETTE = {
  player: {
    body: '#F4FBFF',
    effect: '#00E5FF',
    glow: 'rgba(0, 229, 255, 0.34)',
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
  },
  relics: {
    enabled: false,
  },
  player: {
    maxHp: 100,
    regenerationPerSecond: 2,
  },
  spawner: {
    hp: 100,
    playerBulletDamage: 10,
    spawnIntervalMs: 6000,
    spawnStaggerMs: 1500,
    livingEnemyCap: 120,
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

export interface EnemyIdentity {
  shape: EnemyShape;
  color: EnemyFactionColor;
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

export function sameEnemyIdentity(a: EnemyIdentity | null, b: EnemyIdentity): boolean {
  return Boolean(a && a.shape === b.shape && a.color === b.color);
}

export function registerPlayerEnemyKill(current: ChainState, killed: EnemyIdentity): ChainTransition {
  if (!current.target) {
    return {
      result: 'started',
      state: { ...current, target: { ...killed }, progress: 1 },
    };
  }

  if (!sameEnemyIdentity(current.target, killed)) {
    return {
      result: 'retargeted',
      state: { ...current, target: { ...killed }, progress: 1 },
    };
  }

  const nextProgress = current.progress + 1;
  if (nextProgress >= 4) {
    return {
      result: 'completed',
      state: {
        target: null,
        progress: 0,
        level: current.level + 1,
        completedChains: current.completedChains + 1,
      },
    };
  }

  return {
    result: 'advanced',
    state: { ...current, progress: nextProgress },
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

export function regeneratePlayerHealth(hp: number, maxHp: number, deltaSeconds: number): number {
  return Math.min(maxHp, hp + MEMORY_ARENA_CONFIG.player.regenerationPerSecond * Math.max(0, deltaSeconds));
}

export function isValidChainState(value: unknown): value is ChainState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ChainState>;
  const targetValid = candidate.target === null || (
    Boolean(candidate.target) &&
    isEnemyShape(candidate.target?.shape) &&
    isEnemyFactionColor(candidate.target?.color)
  );
  return Boolean(
    targetValid &&
    Number.isInteger(candidate.progress) &&
    (candidate.progress as number) >= 0 &&
    (candidate.progress as number) <= 3 &&
    Number.isInteger(candidate.level) &&
    (candidate.level as number) >= 1 &&
    Number.isInteger(candidate.completedChains) &&
    (candidate.completedChains as number) >= 0
  );
}
