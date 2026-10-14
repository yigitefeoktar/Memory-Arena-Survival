import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import './GameOverScreen.css';

interface GameOverScreenProps {
  survivedMs: number;
  highestWave: number;
  hardMode: boolean;
  onRetry: () => void;
  onMainMenu: () => void;
}

const settle = [0.16, 1, 0.3, 1] as const;

export default function GameOverScreen({ survivedMs, highestWave, hardMode, onRetry, onMainMenu }: GameOverScreenProps) {
  const reduceMotion = useReducedMotion();
  const [leaving, setLeaving] = useState(false);
  const pendingAction = useRef<'retry' | 'menu' | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const totalSeconds = Math.floor(Math.max(0, survivedMs) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = String(Math.floor(totalSeconds / 60) % 60).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  const timeSurvived = hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;

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

  const reveal = (delay: number, x = -24): Variants => ({
    enter: { opacity: 0, x: reduceMotion ? 0 : x },
    show: { opacity: 1, x: 0, transition: { duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : delay, ease: settle } },
    leave: { opacity: 0, x: reduceMotion ? 0 : -18, transition: { duration: reduceMotion ? 0 : 0.22 } },
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
        leave: { opacity: 0, transition: { duration: reduceMotion ? 0 : 0.3, delay: reduceMotion ? 0 : 0.14 } },
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
          src="/images/game-over-aftermath.webp"
          alt=""
          aria-hidden="true"
          decoding="async"
          variants={{
            enter: { scale: 1.045 },
            show: { scale: 1, transition: { duration: reduceMotion ? 0 : 1.5, ease: settle } },
            leave: { scale: reduceMotion ? 1 : 1.025, transition: { duration: reduceMotion ? 0 : 0.44, ease: 'easeIn' } },
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
        <div className="game-over-results">
          {hardMode && <motion.div className="game-over-mode" variants={reveal(0.16, -18)}>HARD</motion.div>}
          <div className="game-over-title-frame">
            <motion.h2
              ref={titleRef}
              tabIndex={-1}
              id="game-over-title"
              className="game-over-title"
              variants={{
                enter: { opacity: 0, x: -32, y: 6 },
                show: { opacity: 1, x: 0, y: 0, transition: { duration: reduceMotion ? 0 : 0.65, delay: reduceMotion ? 0 : 0.23, ease: settle } },
                leave: { opacity: 0, x: reduceMotion ? 0 : -26, y: 0, transition: { duration: reduceMotion ? 0 : 0.24 } },
              }}
            ><span>ANNIHILATED</span></motion.h2>
          </div>
          <motion.div
            className="game-over-rule"
            aria-hidden="true"
            variants={{
              enter: { scaleX: 0 },
              show: { scaleX: 1, transition: { duration: reduceMotion ? 0 : 0.65, delay: reduceMotion ? 0 : 0.34, ease: settle } },
              leave: { scaleX: 0, transition: { duration: reduceMotion ? 0 : 0.2 } },
            }}
          />
          <dl id="game-over-stats" className="game-over-stats">
            <motion.div variants={reveal(0.4)}>
              <dt>TIME SURVIVED</dt>
              <dd className="game-over-time">{timeSurvived}</dd>
            </motion.div>
            <motion.div variants={reveal(0.47)}>
              <dt>HIGHEST WAVE</dt>
              <dd>{String(highestWave).padStart(2, '0')}</dd>
            </motion.div>
          </dl>
          <div className="game-over-actions">
            <motion.div className="game-over-action" variants={reveal(0.54)}>
              <button type="button" className="game-over-retry" disabled={leaving} onClick={() => leave('retry')}>RETRY ARENA</button>
            </motion.div>
            <motion.div className="game-over-action" variants={reveal(0.62)}>
              <button type="button" className="game-over-menu" disabled={leaving} onClick={() => leave('menu')}>MAIN MENU</button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
