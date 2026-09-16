import type { Image } from "@contexts/catalog";
import { Art, artPair } from "@/components/primitives";

type HeroArtProps = {
  seed: number;
  grad?: string[];
  image?: string;
  images?: Image[];
  size: number;
  className?: string;
};

export function HeroArt({ seed, grad, image, images, size, className }: HeroArtProps) {
  return (
    <Art
      seed={seed}
      grad={grad}
      image={image}
      images={images}
      data-hero="1"
      className={className}
      style={{ width: size, height: size, boxShadow: "0 30px 70px -14px rgba(0,0,0,.62)" }}
      glow={artPair(seed, grad)[1]}
    />
  );
}
