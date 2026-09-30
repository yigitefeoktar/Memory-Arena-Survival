export interface BurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  radius: number;
  shape?: 'shard' | 'spark';
  rotation?: number;
  spin?: number;
}

export interface BurstShockwave {
  x: number;
  y: number;
  color: string;
  maxRadius: number;
  age: number;
  maxAge: number;
  thickness: number;
}

export interface BurstState {
  particles: BurstParticle[];
  shockwaves: BurstShockwave[];
  shake: number;
}

// Visual only: never changes collisions or network state. Limit bursts during
// chain reactions so a crowded wave cannot grow the particle list forever.
export function spawnDestructionBurst(
  state: BurstState,
  x: number,
  y: number,
  color: string,
  scale = 1,
  reducedMotion = false,
): void {
  const count = reducedMotion ? 5 : Math.round(22 * scale);
  const available = Math.max(0, 700 - state.particles.length);
  for (let i = 0; i < Math.min(count, available); i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
    const shard = !reducedMotion && i % 3 === 0;
    const speed = (shard ? 95 : 145) * scale * (0.75 + Math.random() * 0.65);
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: reducedMotion ? 0.25 : 0.42 + Math.random() * 0.35,
      color: i % 5 === 0 ? '#ffffff' : color,
      radius: (shard ? 3.2 : 1.8) * Math.min(scale, 1.6),
      shape: shard ? 'shard' : 'spark',
      rotation: angle,
      spin: shard ? (Math.random() - 0.5) * 10 : 0,
    });
  }
  state.shockwaves.push({
    x, y, color,
    maxRadius: (reducedMotion ? 48 : 90) * scale,
    age: 0,
    maxAge: reducedMotion ? 0.2 : 0.42,
    thickness: 8 * Math.min(scale, 1.6),
  });
  if (!reducedMotion) state.shake = Math.max(state.shake, Math.min(14, 4 * scale));
}
