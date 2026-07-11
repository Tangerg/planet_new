import type { RandomSource } from "@contexts/playback";

/** Runtime entropy adapter for domain operations such as queue shuffling. */
export class SystemRandom implements RandomSource {
  next(): number {
    return Math.random();
  }
}
