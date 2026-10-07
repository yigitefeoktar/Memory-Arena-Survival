import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { getSoloDifficultySettings } from '../game/memoryArena';
import './MainMenu.css';

interface MainMenuProps {
  onStart: (hardMode: boolean) => void;
  onLoad: () => void;
  loadError: string | null;
  deviceType?: 'desktop' | 'mobile';
}

export default function MainMenu({ onStart, onLoad, loadError }: MainMenuProps) {
  const [difficultyOpen, setDifficultyOpen] = useState(false);
  const [hardMode, setHardMode] = useState(false);
  const startGroupRef = useRef<HTMLDivElement>(null);
  const difficultyButtonRef = useRef<HTMLButtonElement>(null);
  const selectedDifficultyRef = useRef<HTMLInputElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!difficultyOpen) return;
    selectedDifficultyRef.current?.focus();
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
  }, [difficultyOpen, hardMode]);

  const startRun = () => {
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
      className={`survival-menu${hardMode ? ' survival-menu-hard' : ''}`}
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
            <button type="button" className="survival-menu-start" onClick={startRun}>
              <span>START RUN</span>
            </button>
            <button
              ref={difficultyButtonRef}
              type="button"
              className="survival-menu-start-more"
              aria-label="Choose difficulty"
              title={`Difficulty: ${hardMode ? 'Hard' : 'Normal'}`}
              aria-expanded={difficultyOpen}
              aria-controls="survival-menu-run-options"
              onClick={() => setDifficultyOpen(previous => !previous)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div
              id="survival-menu-run-options"
              className={`survival-menu-run-options${difficultyOpen ? ' is-open' : ''}`}
              role="radiogroup"
              aria-label="Difficulty"
              aria-hidden={!difficultyOpen}
              inert={!difficultyOpen}
            >
              {[false, true].map(isHard => {
                const difficulty = getSoloDifficultySettings(isHard);
                return (
                  <label key={String(isHard)} className="survival-menu-run-mode">
                    <input
                      ref={isHard === hardMode ? selectedDifficultyRef : null}
                      type="radio"
                      name="survival-difficulty"
                      value={isHard ? 'hard' : 'normal'}
                      checked={isHard === hardMode}
                      onChange={() => setHardMode(isHard)}
                      aria-label={isHard ? 'Hard' : 'Normal'}
                    />
                    <span className="survival-menu-mode-copy">
                      <span>{isHard ? 'HARD' : 'NORMAL'}</span>
                      <span className="survival-menu-mode-detail">{difficulty.maxHp} HP · UP TO {difficulty.maximumStreaks} STREAKS / WAVE</span>
                      <span className="survival-menu-mode-detail">{isHard ? 'HEAL ON WAVE CLEAR ONLY' : `REGENERATION · ${difficulty.regenerationPercentPerSecond * 100}% HP / SEC`}</span>
                    </span>
                  </label>
                );
              })}
            </div>
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
