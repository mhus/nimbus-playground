import { makeNoise2D } from 'open-simplex-noise';

export class WorldGenerator {
  private noise2D: ReturnType<typeof makeNoise2D>;

  constructor(seed: number) {
    this.noise2D = makeNoise2D(seed);
  }

  getHeight(x: number, z: number): number {
    const scale = 0.02;
    const noise = this.noise2D(x * scale, z * scale);

    // Map noise [-1, 1] to height [32, 96]
    const baseHeight = 64;
    const amplitude = 32;

    return Math.floor(baseHeight + noise * amplitude);
  }
}
