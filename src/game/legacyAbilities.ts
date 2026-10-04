import { createEmptyAbilityOwnership, createInitialAbilityDropProgress, type AbilityOwnership, type AbilityDropProgress } from './memoryArena';

interface LegacyAbilityState {
  player: {
    dash: { active: boolean; endTime: number };
    build: { active: boolean; endTime: number };
    recentBlocks: unknown[];
  };
  abilityOwnership: AbilityOwnership;
  abilityDropProgress: AbilityDropProgress;
  abilityPickups: unknown[];
  damageWaves: unknown[];
  zones: unknown[];
  blocks: unknown[];
  enemies: {
    isPlayerAlly?: boolean;
    conversionPullUntil?: number;
    conversionPullTargetX?: number;
    conversionPullTargetY?: number;
    factionAbilityKind?: string;
    factionAbilityActivatesAt?: number;
    factionAbilityEndsAt?: number;
    factionAbilityTargetX?: number;
    factionAbilityTargetY?: number;
  }[];
  bullets: { isPlayerAlly?: boolean }[];
}

// Old saves retain their format, but cannot restore abilities from the other game.
export function clearLegacyAbilities(state: LegacyAbilityState): void {
  state.player.dash.active = false;
  state.player.dash.endTime = 0;
  state.player.build.active = false;
  state.player.build.endTime = 0;
  state.player.recentBlocks = [];
  state.abilityOwnership = createEmptyAbilityOwnership();
  state.abilityDropProgress = createInitialAbilityDropProgress();
  state.abilityPickups = [];
  state.damageWaves = [];
  state.zones = [];
  state.blocks = [];
  state.bullets = state.bullets.filter(bullet => !bullet.isPlayerAlly);
  for (const enemy of state.enemies) {
    enemy.isPlayerAlly = false;
    delete enemy.conversionPullUntil;
    delete enemy.conversionPullTargetX;
    delete enemy.conversionPullTargetY;
    delete enemy.factionAbilityKind;
    delete enemy.factionAbilityActivatesAt;
    delete enemy.factionAbilityEndsAt;
    delete enemy.factionAbilityTargetX;
    delete enemy.factionAbilityTargetY;
  }
}
