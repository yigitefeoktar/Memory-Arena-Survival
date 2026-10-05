import { motion, useReducedMotion } from 'motion/react';
import './MainMenu.css';

interface MainMenuProps {
  onStart: () => void;
  onLoad: () => void;
  loadError: string | null;
  deviceType?: 'desktop' | 'mobile';
}

export default function MainMenu({ onStart, onLoad, loadError }: MainMenuProps) {
  const reduceMotion = useReducedMotion();
  const entrance = (delay: number, y = 16) => ({
    initial: reduceMotion ? false as const : { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduceMotion ? 0 : 0.65, delay: reduceMotion ? 0 : delay },
  });

  return (
    <motion.div
      className="survival-menu"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
    >
      <motion.img
        className="survival-menu-art"
        src="/images/menu-arena.webp"
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        initial={reduceMotion ? false : { scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 1.8, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="survival-menu-shade" aria-hidden="true" />
      {!reduceMotion && (
        <div className="survival-menu-embers" aria-hidden="true">
          <span /><span /><span /><span /><span /><span />
        </div>
      )}
      <main
        className="survival-menu-content"
        aria-labelledby="survival-menu-title"
      >
        <h1 id="survival-menu-title" className="survival-menu-title">
          <span className="survival-menu-title-line"><motion.span {...entrance(0.08, 42)}>MEMORY</motion.span></span>
          <span className="survival-menu-title-line"><motion.span {...entrance(0.2, 42)}>ARENA</motion.span></span>
        </h1>
        <motion.div className="survival-menu-subtitle" {...entrance(0.35, 10)}>SURVIVAL</motion.div>
        <div className="survival-menu-actions">
          <motion.div className="survival-menu-action-enter" {...entrance(0.45)}>
            <button type="button" className="survival-menu-start" onClick={onStart}>
              START RUN
            </button>
          </motion.div>
          <motion.div className="survival-menu-action-enter" {...entrance(0.55)}>
            <button type="button" className="survival-menu-load" onClick={onLoad}>
              LOAD SAVED RUN
            </button>
          </motion.div>
          {loadError && <p role="alert" className="survival-menu-error">{loadError}</p>}
        </div>
      </main>
    </motion.div>
  );
}
