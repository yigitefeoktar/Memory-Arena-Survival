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

  return (
    <motion.div
      className="survival-menu"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
    >
      <img
        className="survival-menu-art"
        src="/images/menu-arena.webp"
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
      />
      <div className="survival-menu-shade" aria-hidden="true" />
      <motion.main
        className="survival-menu-content"
        aria-labelledby="survival-menu-title"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.35, ease: 'easeOut' }}
      >
        <h1 id="survival-menu-title" className="survival-menu-title">
          <span>MEMORY</span><span>ARENA</span>
        </h1>
        <div className="survival-menu-subtitle">SURVIVAL</div>
        <div className="survival-menu-actions">
          <button type="button" className="survival-menu-start" onClick={onStart}>
            START RUN
          </button>
          <button type="button" className="survival-menu-load" onClick={onLoad}>
            LOAD SAVED RUN
          </button>
          {loadError && <p role="alert" className="survival-menu-error">{loadError}</p>}
        </div>
      </motion.main>
    </motion.div>
  );
}
