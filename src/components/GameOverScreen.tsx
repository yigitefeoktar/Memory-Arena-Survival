import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import './GameOverScreen.css';

interface GameOverScreenProps {
  score: number;
  highestWave: number;
  hardMode: boolean;
  onRetry: () => void;
  onMainMenu: () => void;
}

const settle = [0.16, 1, 0.3, 1] as const;

export default function GameOverScreen({ score, highestWave, hardMode, onRetry, onMainMenu }: GameOverScreenProps) {
  const reduceMotion = useReducedMotion();
  const [leaving, setLeaving] = useState(false);
  const pendingAction = useRef<'retry' | 'menu' | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, []);

  const leave = (action: 'retry' | 'menu') => {
    // Lock immediately, including two clicks before React commits the disabled state.
    if (pendingAction.current) return;
    if (reduceMotion) {
      pendingAction.current = action;
      if (action === 'retry') onRetry();
      else onMainMenu();
      return;
    }
    pendingAction.current = action;
    setLeaving(true);
  };

  const reveal = (delay: number, y = 16): Variants => ({
    enter: { opacity: 0, y: reduceMotion ? 0 : y },
    show: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : delay, ease: settle } },
    leave: { opacity: 0, y: reduceMotion ? 0 : -12, transition: { duration: reduceMotion ? 0 : 0.16 } },
  });

  return (
    <motion.section
      className={`game-over-screen${hardMode ? ' game-over-hard' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
      aria-describedby="game-over-stats"
      aria-busy={leaving}
      initial={reduceMotion ? false : 'enter'}
      animate={leaving ? 'leave' : 'show'}
      variants={{
        enter: { opacity: 0 },
        show: { opacity: 1, transition: { duration: reduceMotion ? 0 : 0.2 } },
        leave: { opacity: 0, transition: { duration: reduceMotion ? 0 : 0.26, delay: reduceMotion ? 0 : 0.14 } },
      }}
      onAnimationComplete={definition => {
        if (definition !== 'leave') return;
        const action = pendingAction.current;
        pendingAction.current = null;
        // Start the next run only after the whole overlay has faded away.
        if (action === 'retry') onRetry();
        else if (action === 'menu') onMainMenu();
      }}
    >
      <div className="game-over-backdrop" aria-hidden="true">
        <motion.img
          className="game-over-art"
          src="/images/game-over-arena.webp"
          alt=""
          aria-hidden="true"
          decoding="async"
          variants={{
            enter: { scale: 1.065 },
            show: { scale: 1, transition: { duration: reduceMotion ? 0 : 1.2, ease: settle } },
            leave: { scale: reduceMotion ? 1 : 1.035, transition: { duration: reduceMotion ? 0 : 0.4, ease: 'easeIn' } },
          }}
        />
        <div className="game-over-shade" aria-hidden="true" />
        {!reduceMotion && (
          <div className="game-over-fragments" aria-hidden="true">
            <span /><span /><span /><span /><span /><span />
          </div>
        )}
      </div>
      <div className="game-over-content">
        <motion.header className="game-over-header" variants={reveal(0.05, -8)}>
          <div className="game-over-brand">MEMORY ARENA<span>SURVIVAL</span></div>
          <span className="game-over-mode">{hardMode ? 'HARD' : 'NORMAL'}</span>
        </motion.header>
        <div className="game-over-results">
          <motion.h2
            ref={titleRef}
            tabIndex={-1}
            id="game-over-title"
            className="game-over-title"
            variants={{
              enter: { opacity: 0, scale: 1.12, y: 18 },
              show: { opacity: 1, scale: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : 0.08, ease: settle } },
              leave: { opacity: 0, scale: reduceMotion ? 1 : 0.98, y: reduceMotion ? 0 : -22, transition: { duration: reduceMotion ? 0 : 0.22 } },
            }}
          >ANNIHILATED</motion.h2>
          <motion.div
            className="game-over-rule"
            aria-hidden="true"
            variants={{
              enter: { scaleX: 0 },
              show: { scaleX: 1, transition: { duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : 0.16, ease: settle } },
              leave: { scaleX: 0, transition: { duration: reduceMotion ? 0 : 0.2 } },
            }}
          />
          <dl id="game-over-stats" className="game-over-stats">
            <motion.div variants={reveal(0.24)}>
              <dt>FINAL SCORE</dt>
              <dd>{score.toLocaleString('en-US')}</dd>
            </motion.div>
            <motion.div variants={reveal(0.31)}>
              <dt>HIGHEST WAVE</dt>
              <dd>{String(highestWave).padStart(2, '0')}</dd>
            </motion.div>
          </dl>
          <motion.div className="game-over-actions" variants={reveal(0.38, 22)}>
            <button type="button" className="game-over-retry" disabled={leaving} onClick={() => leave('retry')}>RETRY ARENA</button>
            <button type="button" className="game-over-menu" disabled={leaving} onClick={() => leave('menu')}>MAIN MENU</button>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
