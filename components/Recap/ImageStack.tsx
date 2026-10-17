import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export default function ImageStack({ ids, playing, renderImage }: { ids: string[]; playing: boolean; renderImage: (id: string) => ReactNode }) {
  const [index, setIndex] = useState(0);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!playing || reducedMotion || ids.length < 2) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % ids.length), 3600);
    return () => window.clearInterval(timer);
  }, [playing, reducedMotion, ids.length, index]);
  return <div className="recap-image-stack" role="group" aria-label={`사진 ${ids.length}장`}>
    <div className="recap-stack-cards">
      {ids.map((id, position) => {
        const depth = (position - index + ids.length) % ids.length;
        return <motion.div key={id} className="recap-stack-card" aria-hidden={depth !== 0} inert={depth !== 0} style={{ zIndex: ids.length - depth }}
          animate={{ rotate: depth === 0 ? -2 : depth % 2 ? 7 : -8, y: depth * -9, scale: 1 - Math.min(depth, 3) * .045, opacity: depth < 3 ? 1 : 0 }}
          transition={{ duration: reducedMotion ? 0 : .65, ease: [.22, 1, .36, 1] }}>
          {renderImage(id)}
        </motion.div>;
      })}
    </div>
    <div className="recap-stack-controls">
      <button type="button" aria-label="이전 사진" onClick={() => setIndex((index + ids.length - 1) % ids.length)}>←</button>
      <span aria-live="off">{index + 1} / {ids.length}</span>
      <button type="button" aria-label="다음 사진" onClick={() => setIndex((index + 1) % ids.length)}>→</button>
    </div>
  </div>;
}
