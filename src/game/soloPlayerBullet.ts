import {
  findEarliestCircleTargetHit,
  traceReflectedBulletMotion,
  type AxisAlignedSurface,
  type CircleTarget,
} from '../shared/multiplayerBulletPhysics';

// Solo shots stop at their first impact rather than reflecting off arena walls.
export function traceSoloPlayerBullet<T>(options: {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  durationSeconds: number;
  surfaces: AxisAlignedSurface[];
  targets: CircleTarget<T>[];
}) {
  const trace = traceReflectedBulletMotion({ ...options, maxCollisions: 1 });
  const targetHit = findEarliestCircleTargetHit(trace.segments.slice(0, 1), () => options.targets);
  if (targetHit) return { x: targetHit.x, y: targetHit.y, target: targetHit.target.data, surface: null };
  const surface = trace.collisions[0] ?? null;
  return { x: surface?.x ?? trace.x, y: surface?.y ?? trace.y, target: null, surface };
}
