"use client";

import { useEffect, useRef } from "react";

/**
 * Fundo quadriculado da hero que reage ao mouse: as linhas da grade acendem
 * em verde ao redor do cursor e um halo difuso (o mesmo brilho das bordas do
 * celular) segue o ponteiro, pulsando suavemente.
 *
 * Os eventos são ouvidos no elemento pai (a section da hero), então este
 * componente deve ser filho direto dela. Tudo aqui é decorativo (aria-hidden)
 * e não captura cliques (pointer-events-none).
 */
export function GridGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const section = el?.parentElement;
    if (!el || !section) return;

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--gx", `${e.clientX - r.left}px`);
      el.style.setProperty("--gy", `${e.clientY - r.top}px`);
      el.style.setProperty("--glow", "1");
    };
    const leave = () => el.style.setProperty("--glow", "0");

    section.addEventListener("pointermove", move);
    section.addEventListener("pointerleave", leave);
    return () => {
      section.removeEventListener("pointermove", move);
      section.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10"
      style={{ "--gx": "50%", "--gy": "-999px", "--glow": 0 } as React.CSSProperties}
    >
      {/* grade base (como antes) */}
      <div className="bg-grid mask-fade-b absolute inset-0" />

      {/* camadas verdes: aparecem/somem com o mouse (opacidade em --glow) */}
      <div className="grid-glow-fade absolute inset-0">
        {/* halo difuso pulsante, no tom do brilho do celular */}
        <div className="grid-glow-halo absolute inset-0" />
        {/* linhas da grade acesas em verde perto do cursor */}
        <div className="bg-grid-primary grid-glow-spot mask-fade-b absolute inset-0" />
      </div>
    </div>
  );
}
