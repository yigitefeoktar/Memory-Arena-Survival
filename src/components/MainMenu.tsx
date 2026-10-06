import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import './MainMenu.css';

interface MainMenuProps {
  onStart: (hardMode: boolean) => void;
  onLoad: () => void;
  loadError: string | null;
  deviceType?: 'desktop' | 'mobile';
}

export default function MainMenu({ onStart, onLoad, loadError }: MainMenuProps) {
  const [difficultyOpen, setDifficultyOpen] = useState(false);
  const startGroupRef = useRef<HTMLDivElement>(null);
  const difficultyButtonRef = useRef<HTMLButtonElement>(null);
  const hardRunRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!difficultyOpen) return;
    hardRunRef.current?.focus();
    const dismissOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !startGroupRef.current?.contains(event.target)) {
        setDifficultyOpen(false);
      }
    };
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setDifficultyOpen(false);
      difficultyButtonRef.current?.focus();
    };
    document.addEventListener('pointerdown', dismissOutside);
    document.addEventListener('keydown', dismissOnEscape);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside);
      document.removeEventListener('keydown', dismissOnEscape);
    };
  }, [difficultyOpen]);

  const startRun = (hardMode: boolean) => {
    setDifficultyOpen(false);
    onStart(hardMode);
  };
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
          <motion.div
            ref={startGroupRef}
            className="survival-menu-action-enter survival-menu-start-group"
            onBlur={event => {
              if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setDifficultyOpen(false);
            }}
            {...entrance(0.45)}
          >
            <button type="button" className="survival-menu-start" onClick={() => startRun(false)}>
              START RUN
            </button>
            <button
              ref={difficultyButtonRef}
              type="button"
              className="survival-menu-start-more"
              aria-label="More run options"
              aria-expanded={difficultyOpen}
              aria-controls="survival-menu-run-options"
              onClick={() => setDifficultyOpen(previous => !previous)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {difficultyOpen && (
              <div id="survival-menu-run-options" className="survival-menu-run-options" role="group" aria-label="Alternate run modes">
                <button ref={hardRunRef} type="button" className="survival-menu-hard-run" onClick={() => startRun(true)}>
                  <span>START HARD MODE</span>
                  <span className="survival-menu-hard-detail">100 HP · UP TO 5 STREAKS / WAVE</span>
                </button>
              </div>
            )}
          </motion.div>
          <motion.div className="survival-menu-action-enter" {...entrance(0.55)}>
            <button type="button" className="survival-menu-load" onClick={() => { setDifficultyOpen(false); onLoad(); }}>
              LOAD SAVED RUN
            </button>
          </motion.div>
          {loadError && <p role="alert" className="survival-menu-error">{loadError}</p>}
        </div>
      </main>
    </motion.div>
  );
}
