"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ImageItem = {
  src: string;
  alt: string;
  /** Legenda opcional exibida abaixo do telefone central. */
  caption?: string;
};

type PhoneFrameProps = {
  image: ImageItem;
  priority?: boolean;
  className?: string;
};

/** Moldura de iPhone com notch, usada para cada slide do carrossel. */
export function PhoneFrame({ image, priority = false, className }: PhoneFrameProps) {
  return (
    <div
      className={cn(
        "relative w-[240px] rounded-[2.4rem] border border-foreground/10 bg-foreground/[0.04] p-2 shadow-2xl shadow-black/10 backdrop-blur dark:bg-white/5 sm:w-[270px]",
        className,
      )}
    >
      <div className="relative aspect-[9/19.5] overflow-hidden rounded-[2rem] border bg-background">
        <div className="absolute left-1/2 top-2 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-foreground/90" />
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 640px) 270px, 240px"
          priority={priority}
          className="object-cover"
          draggable={false}
        />
      </div>
    </div>
  );
}

export type PhoneCarouselProps = {
  images: ImageItem[];
  /** Troca automática de slide (ms). Use 0 para desativar. */
  autoPlayInterval?: number;
  className?: string;
};

const SWIPE_THRESHOLD = 60;

export function PhoneCarousel({ images, autoPlayInterval = 4500, className }: PhoneCarouselProps) {
  const [index, setIndex] = React.useState(0);
  const [direction, setDirection] = React.useState<1 | -1>(1);
  const [paused, setPaused] = React.useState(false);
  const total = images.length;

  const go = React.useCallback(
    (dir: 1 | -1) => {
      setDirection(dir);
      setIndex((i) => (i + dir + total) % total);
    },
    [total],
  );

  const goTo = (i: number) => {
    if (i === index) return;
    setDirection(i > index ? 1 : -1);
    setIndex(i);
  };

  React.useEffect(() => {
    if (!autoPlayInterval || paused || total < 2) return;
    const id = setInterval(() => go(1), autoPlayInterval);
    return () => clearInterval(id);
  }, [autoPlayInterval, paused, total, go]);

  if (total === 0) return null;

  const prev = images[(index - 1 + total) % total];
  const next = images[(index + 1) % total];
  const current = images[index];

  return (
    <div
      className={cn("flex w-full flex-col items-center gap-6", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(-1);
        if (e.key === "ArrowRight") go(1);
      }}
      role="region"
      aria-roledescription="carrossel"
      aria-label="Telas do app"
    >
      <div className="relative flex w-full items-center justify-center overflow-hidden py-6">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl" />

        {total > 1 && (
          <div
            aria-hidden
            className="absolute left-1/2 hidden -translate-x-[calc(50%+220px)] scale-[0.82] opacity-40 blur-[1px] transition-all md:block lg:-translate-x-[calc(50%+260px)]"
          >
            <PhoneFrame image={prev} />
          </div>
        )}

        <motion.div
          className="relative z-10 touch-pan-y"
          drag={total > 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={(_, info) => {
            if (info.offset.x < -SWIPE_THRESHOLD) go(1);
            else if (info.offset.x > SWIPE_THRESHOLD) go(-1);
          }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={current.src + index}
              initial={{ opacity: 0, x: direction * 80, scale: 0.94 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: direction * -80, scale: 0.94 }}
              transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              <PhoneFrame image={current} priority={index === 0} />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {total > 1 && (
          <div
            aria-hidden
            className="absolute left-1/2 hidden translate-x-[calc(-50%+220px)] scale-[0.82] opacity-40 blur-[1px] transition-all md:block lg:translate-x-[calc(-50%+260px)]"
          >
            <PhoneFrame image={next} />
          </div>
        )}
      </div>

      <div className="flex min-h-5 items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={current.src}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-center text-sm text-muted-foreground"
          >
            {current.caption ?? current.alt}
          </motion.p>
        </AnimatePresence>
      </div>

      {total > 1 && (
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" aria-label="Tela anterior" onClick={() => go(-1)}>
            <ChevronLeft />
          </Button>

          <div className="flex items-center gap-2" role="tablist" aria-label="Selecionar tela">
            {images.map((img, i) => (
              <button
                key={img.src}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Ir para tela ${i + 1}: ${img.alt}`}
                onClick={() => goTo(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === index ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60",
                )}
              />
            ))}
          </div>

          <Button variant="outline" size="icon" aria-label="Próxima tela" onClick={() => go(1)}>
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}
