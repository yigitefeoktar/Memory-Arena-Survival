import { ArrowRight, FolderOpen } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

interface MainMenuProps {
  onStart: () => void;
  onLoad: () => void;
  loadError: string | null;
  deviceType: 'desktop' | 'mobile';
}

export default function MainMenu({ onStart, onLoad, loadError, deviceType }: MainMenuProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="survival-menu"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
    >
      <div className="survival-menu-grid" aria-hidden="true" />
      <motion.main
        className="survival-menu-content"
        aria-labelledby="survival-menu-title"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.45, ease: 'easeOut' }}
      >
        <div className="survival-menu-eyebrow"><span /> ENDLESS WAVES. ONE SURVIVOR.</div>

        <div className="survival-menu-emblem" aria-hidden="true">
          <svg viewBox="0 0 320 170" fill="none">
            <defs>
              <radialGradient id="menu-core-glow">
                <stop stopColor="#66f5ff" stopOpacity="0.3" />
                <stop offset="1" stopColor="#66f5ff" stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse cx="160" cy="85" rx="110" ry="63" stroke="#66f5ff" strokeOpacity="0.12" />
            <ellipse cx="160" cy="85" rx="75" ry="43" stroke="#66f5ff" strokeOpacity="0.22" strokeDasharray="3 9" />
            <path d="M30 85h90m80 0h90M160 12v42m0 62v42" stroke="#66f5ff" strokeOpacity="0.15" />
            <circle cx="160" cy="85" r="60" fill="url(#menu-core-glow)" />
            <g className="survival-menu-core">
              <circle cx="160" cy="85" r="24" stroke="#66f5ff" strokeOpacity="0.3" />
              <circle cx="160" cy="85" r="12" fill="#66f5ff" />
              <circle cx="160" cy="85" r="4" fill="#effeff" />
              <path d="m174 81 11-4" stroke="#66f5ff" strokeWidth="3" strokeLinecap="round" />
            </g>
            <g stroke="#ff647c" strokeWidth="2" fill="#ff647c" fillOpacity="0.1">
              <rect x="61" y="52" width="18" height="18" transform="rotate(-15 70 61)" />
              <rect x="241" y="65" width="18" height="18" transform="rotate(20 250 74)" />
              <rect x="201" y="127" width="18" height="18" transform="rotate(-12 210 136)" />
            </g>
            <path d="m109 130 9-16 9 16Z" stroke="#b69aff" strokeWidth="2" fill="#b69aff" fillOpacity="0.1" />
            <circle cx="208" cy="31" r="8" stroke="#dfff92" strokeWidth="2" fill="#dfff92" fillOpacity="0.1" />
            <g fill="#66f5ff" fillOpacity="0.5">
              <circle cx="47" cy="110" r="2" /><circle cx="270" cy="115" r="2" /><circle cx="129" cy="33" r="1.5" />
            </g>
          </svg>
        </div>

        <h1 id="survival-menu-title" className="survival-menu-title">
          MEMORY <span>ARENA</span>
        </h1>
        <div className="survival-menu-subtitle">SURVIVAL</div>
        <p className="survival-menu-description">
          Remember your target. Keep the chain alive.
          <span>Match three kills by color and shape to clear each wave.</span>
        </p>

        <div className="survival-menu-actions">
          <button type="button" className="survival-menu-start" onClick={onStart}>
            ENTER ARENA <ArrowRight size={21} aria-hidden="true" />
          </button>
          <button type="button" className="survival-menu-load" onClick={onLoad}>
            <FolderOpen size={15} aria-hidden="true" /> Load saved run
          </button>
          {loadError && <p role="alert" className="survival-menu-error">{loadError}</p>}
        </div>

        <div className="survival-menu-controls" aria-label="Game controls">
          {deviceType === 'mobile' ? (
            <><span>Left stick <b>Move</b></span><span>Right stick <b>Aim & fire</b></span></>
          ) : (
            <><span><kbd>WASD</kbd> Move</span><span><kbd>MOUSE</kbd> Aim & fire</span><span><kbd>ESC</kbd> Pause</span></>
          )}
        </div>
      </motion.main>
    </motion.div>
  );
}
