'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';

/* -------------------------------------------------------------------------- */
/*  Timing (tweak here)                                                       */
/* -------------------------------------------------------------------------- */
const MIN_MS = 2300; // minimum time the bottle takes to fill
const MAX_MS = 7000; // safety cap: never keep the user waiting longer than this
const LAND_WAIT_MS = 480; // let the last pill land before sealing
const SEAL_MS = 700; // cap travels down and clicks on
const READY_MS = 520; // hold on the "ready" state
const EXIT_MS = 820; // circular reveal of the site

type Phase = 'loading' | 'sealing' | 'ready' | 'exiting' | 'done';

/* -------------------------------------------------------------------------- */
/*  Pill layout (deterministic so server & client markup always match)        */
/* -------------------------------------------------------------------------- */
interface PillSpec {
  kind: 'capsule' | 'tablet';
  color: string;
  x: number;
  y: number;
  rot: number;
  sx: number;
  sy: number;
  mx: number;
  my: number;
  r0: number;
  r1: number;
}

const COLS = 5;
const ROWS = 7;
const PILL_COLORS = ['var(--primary)', 'var(--saffron)', 'var(--taken)'];

function buildPills(): PillSpec[] {
  let seed = 20261024;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const r1 = (n: number) => Math.round(n * 10) / 10;

  const all: PillSpec[] = [];
  for (let row = 0; row < ROWS; row++) {
    const rowPills: PillSpec[] = [];
    for (let col = 0; col < COLS; col++) {
      const base = row % 2 ? 78 + col * 24 : 64 + col * 28;
      const x = r1(Math.min(176, Math.max(64, base + (rand() - 0.5) * 8)));
      const y = r1(306 - row * 23 + (rand() - 0.5) * 5);
      const kind = rand() < 0.58 ? 'capsule' : 'tablet';
      const rot = r1(kind === 'capsule' ? (rand() - 0.5) * 150 : rand() * 360);
      const color = PILL_COLORS[Math.floor(rand() * PILL_COLORS.length)];
      const startX = 120 + (rand() - 0.5) * 16;
      const startY = -62 - rand() * 10;
      const mouthX = 120 + (rand() - 0.5) * 8;
      const mouthY = 96;
      rowPills.push({
        kind,
        color,
        x,
        y,
        rot,
        sx: r1(startX - x),
        sy: r1(startY - y),
        mx: r1(mouthX - x),
        my: r1(mouthY - y),
        r0: r1((rand() - 0.5) * 360),
        r1: r1((rand() - 0.5) * 120),
      });
    }
    // shuffle inside the row so pills don't land strictly left → right
    for (let i = rowPills.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [rowPills[i], rowPills[j]] = [rowPills[j], rowPills[i]];
    }
    all.push(...rowPills);
  }
  return all;
}

const PILLS = buildPills();
const TOTAL = PILLS.length;

/* -------------------------------------------------------------------------- */
/*  Bottle geometry                                                           */
/* -------------------------------------------------------------------------- */
const BOTTLE_OUTER =
  'M78 66 L78 100 C78 118 44 120 44 148 L44 300 Q44 326 70 326 L170 326 Q196 326 196 300 L196 148 C196 120 162 118 162 100 L162 66 Z';
const BOTTLE_INNER =
  'M84 66 L84 102 C84 120 50 122 50 150 L50 298 Q50 320 72 320 L168 320 Q190 320 190 298 L190 150 C190 122 156 120 156 102 L156 66 Z';

function PillShape({ kind, color }: { kind: PillSpec['kind']; color: string }) {
  if (kind === 'capsule') {
    return (
      <>
        <rect x={-13} y={-5.5} width={26} height={11} rx={5.5} fill="#F7F4EC" />
        <path d="M0 -5.5 H-7.5 a5.5 5.5 0 0 0 0 11 H0 Z" style={{ fill: color }} />
        <rect x={-13} y={-5.5} width={26} height={11} rx={5.5} fill="none" stroke="rgba(0,0,0,.22)" strokeWidth={0.8} />
        <line x1={-9} y1={-2.6} x2={9} y2={-2.6} stroke="#fff" strokeOpacity={0.55} strokeWidth={1.6} strokeLinecap="round" />
      </>
    );
  }
  return (
    <>
      <circle r={7.5} fill="#FBFAF6" stroke="rgba(0,0,0,.22)" strokeWidth={0.8} />
      <line x1={-5.5} y1={0} x2={5.5} y2={0} stroke="rgba(0,0,0,.2)" strokeWidth={0.9} strokeLinecap="round" />
      <path d="M-4.6 -2.8 A5.4 5.4 0 0 1 -1 -5.2" fill="none" stroke="#fff" strokeWidth={1.4} strokeLinecap="round" />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */
export function SplashScreen() {
  const t = useTranslations('splash');
  const [phase, setPhase] = React.useState<Phase>('loading');
  const [percent, setPercent] = React.useState(0);
  const phaseRef = React.useRef<Phase>('loading');

  const go = React.useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const finish = React.useCallback(() => {
    document.documentElement.setAttribute('data-splash', 'done');
    go('done');
  }, [go]);

  const skip = React.useCallback(() => {
    if (phaseRef.current === 'exiting' || phaseRef.current === 'done') return;
    go('exiting');
  }, [go]);

  /* 1. Loading: progress follows real readiness (window load + fonts) ------ */
  React.useEffect(() => {
    const html = document.documentElement;
    if (html.getAttribute('data-splash') !== 'on') {
      go('done');
      return;
    }

    const t0 = performance.now();
    let last = t0;
    let p = 0;
    let ready = false;
    let raf = 0;
    let sealTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const markReady = () => {
      ready = true;
    };
    const onLoad = () => {
      const fonts = document.fonts?.ready;
      if (fonts) fonts.then(markReady, markReady);
      else markReady();
    };
    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad, { once: true });

    const tick = (now: number) => {
      if (cancelled || phaseRef.current !== 'loading') return;
      const elapsed = now - t0;
      const dt = Math.min(now - last, 60);
      last = now;

      const forced = elapsed >= MAX_MS;
      const timeP = Math.min(elapsed / MIN_MS, 1);
      const eased = (1 - Math.pow(1 - timeP, 2.2)) * 100;
      // Until the page is really ready we hold at ~90 %
      const target = forced ? 100 : Math.min(eased, ready ? 100 : 90);
      const k = 1 - Math.exp(-dt / (target >= 100 ? 130 : 200));
      p += (target - p) * k;
      if (target >= 100 && p > 99.4) p = 100;

      const whole = Math.floor(p);
      setPercent((prev) => (prev === whole ? prev : whole));

      if (p >= 100) {
        sealTimer = setTimeout(() => {
          if (phaseRef.current === 'loading') go('sealing');
        }, LAND_WAIT_MS);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (sealTimer) clearTimeout(sealTimer);
      window.removeEventListener('load', onLoad);
    };
  }, [go]);

  /* 2. Sequence after the bottle is full ---------------------------------- */
  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (phase === 'sealing') timer = setTimeout(() => go('ready'), SEAL_MS);
    else if (phase === 'ready') timer = setTimeout(() => go('exiting'), READY_MS);
    else if (phase === 'exiting') timer = setTimeout(finish, EXIT_MS);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [phase, go, finish]);

  /* 3. Esc to skip --------------------------------------------------------- */
  React.useEffect(() => {
    if (phase === 'done') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, skip]);

  if (phase === 'done') return null;

  const filled = Math.floor((percent * TOTAL) / 100);
  const isReady = phase === 'ready' || phase === 'exiting';
  const sealed = phase !== 'loading';

  return (
    <div
      className="dm-splash"
      data-phase={phase}
      aria-busy={phase === 'loading'}
    >
      {phase !== 'exiting' && (
        <button type="button" onClick={skip} className="dm-splash-skip">
          {t('skip')}
        </button>
      )}

      <div className="dm-splash-content">
        <div className="dm-bottle-wrap">
          <svg viewBox="-50 -90 340 450" className="dm-bottle-svg" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id="dmsp-back" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#7A3D05" />
                <stop offset="0.5" stopColor="#D9912A" />
                <stop offset="1" stopColor="#6A3504" />
              </linearGradient>
              <linearGradient id="dmsp-glass" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#A85A08" stopOpacity="0.62" />
                <stop offset="0.28" stopColor="#F2B24A" stopOpacity="0.2" />
                <stop offset="0.62" stopColor="#E39A2A" stopOpacity="0.12" />
                <stop offset="1" stopColor="#8A4706" stopOpacity="0.66" />
              </linearGradient>
              <linearGradient id="dmsp-lip" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#8A4706" />
                <stop offset="0.35" stopColor="#E7A23A" />
                <stop offset="1" stopColor="#7A3F06" />
              </linearGradient>
              <linearGradient id="dmsp-cap" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#0A4B4F" />
                <stop offset="0.3" stopColor="#14868C" />
                <stop offset="0.65" stopColor="#0F6B70" />
                <stop offset="1" stopColor="#083C40" />
              </linearGradient>
              <radialGradient id="dmsp-shadow" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor="#000" stopOpacity="0.28" />
                <stop offset="1" stopColor="#000" stopOpacity="0" />
              </radialGradient>
              <clipPath id="dmsp-clip">
                <path d={BOTTLE_INNER} />
                <rect x={-60} y={-100} width={360} height={166} />
              </clipPath>
            </defs>

            {/* pulse ring when sealed */}
            <circle className="dm-ring" cx={120} cy={196} r={70} fill="none" strokeWidth={3} style={{ stroke: 'var(--primary)' }} />

            <ellipse cx={120} cy={334} rx={84} ry={9} fill="url(#dmsp-shadow)" />

            <g className="dm-stage" data-sealed={sealed}>
              {/* back of the glass */}
              <path d={BOTTLE_OUTER} fill="url(#dmsp-back)" fillOpacity={0.5} />

              {/* pills */}
              <g clipPath="url(#dmsp-clip)">
                {PILLS.map((p, i) => (
                  <g
                    key={i}
                    className={i < filled ? 'dm-pill is-in' : 'dm-pill'}
                    style={
                      {
                        '--sx': `${p.sx}px`,
                        '--sy': `${p.sy}px`,
                        '--mx': `${p.mx}px`,
                        '--my': `${p.my}px`,
                        '--r0': `${p.r0}deg`,
                        '--r1': `${p.r1}deg`,
                      } as React.CSSProperties
                    }
                  >
                    <g transform={`translate(${p.x} ${p.y}) rotate(${p.rot}) scale(1.3)`}>
                      <PillShape kind={p.kind} color={p.color} />
                    </g>
                  </g>
                ))}
              </g>

              {/* front glass: tint, highlights, outline */}
              <path d={BOTTLE_OUTER} fill="url(#dmsp-glass)" />
              <path d="M56 156 Q56 150 62 150 Q66 150 66 156 L66 300 Q66 312 60 312 Q56 312 56 300 Z" fill="#fff" fillOpacity={0.34} />
              <path d="M178 160 Q181 160 181 166 L181 296 Q181 304 178 304 Q175 304 175 296 L175 166 Q175 160 178 160 Z" fill="#fff" fillOpacity={0.16} />
              <path d="M84 72 L84 98 Q84 106 88 110" fill="none" stroke="#fff" strokeOpacity={0.4} strokeWidth={3} strokeLinecap="round" />
              <path d={BOTTLE_OUTER} fill="none" stroke="#5E2E03" strokeOpacity={0.55} strokeWidth={2} strokeLinejoin="round" />
              <rect x={70} y={56} width={100} height={12} rx={6} fill="url(#dmsp-lip)" stroke="#5E2E03" strokeOpacity={0.5} strokeWidth={1.5} />

              {/* label */}
              <g transform="translate(120 252)">
                <rect x={-52} y={-27} width={104} height={54} rx={9} fill="#FFFDF8" stroke="rgba(0,0,0,.14)" strokeWidth={1} />
                <path d="M-52 -18 Q-52 -27 -43 -27 H43 Q52 -27 52 -18 V-14 H-52 Z" fill="#0F6B70" />
                <circle cx={-36} cy={-20.5} r={2.2} fill="#F5A524" />
                <text
                  x={0}
                  y={5}
                  textAnchor="middle"
                  fontSize={15}
                  fontWeight={700}
                  fill="#0F6B70"
                  style={{ fontFamily: 'var(--font-readex-pro), system-ui, sans-serif' }}
                  direction="ltr"
                >
                  DoseMinder
                </text>
                <path
                  className="dm-beat"
                  d="M-30 17 H-13 L-8 9 L0 23 L5 17 H30"
                  pathLength={60}
                  fill="none"
                  stroke="#0F6B70"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>

              {/* success badge */}
              <g transform="translate(186 302)">
                <g className="dm-check" data-on={isReady}>
                  <circle r={17} style={{ fill: 'var(--taken)', stroke: 'var(--paper)' }} strokeWidth={3.5} />
                  <path d="M-7 0.5 L-2 5.5 L7.5 -5" fill="none" stroke="#fff" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </g>

              {/* cap: floats beside the bottle, then seals it */}
              <g className="dm-cap" data-sealed={sealed}>
                <g className="dm-cap-float">
                  <rect x={-54} y={-40} width={108} height={40} rx={10} fill="url(#dmsp-cap)" />
                  {Array.from({ length: 12 }).map((_, i) => (
                    <line key={i} x1={-44 + i * 8} y1={-34} x2={-44 + i * 8} y2={-6} stroke="#000" strokeOpacity={0.14} strokeWidth={2} strokeLinecap="round" />
                  ))}
                  <rect x={-54} y={-40} width={108} height={7} rx={5} fill="#fff" fillOpacity={0.2} />
                  <rect x={-54} y={-40} width={108} height={40} rx={10} fill="none" stroke="#052B2E" strokeOpacity={0.5} strokeWidth={1.5} />
                  <path d="M-4 -26 H4 M0 -30 V-22" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" />
                </g>
              </g>
            </g>
          </svg>
        </div>

        <div className="dm-splash-meta">
          <p key={isReady ? 'ready' : 'loading'} className="dm-splash-status dm-fade-up" aria-live="polite">
            {isReady ? t('ready') : t('loading')}
          </p>
          <div
            className="dm-splash-bar"
            role="progressbar"
            aria-label={t('aria')}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <div className="dm-splash-bar-fill" style={{ transform: `scaleX(${percent / 100})` }} />
          </div>
          <span className="font-numeric dm-splash-percent" aria-hidden="true">
            {percent}%
          </span>
        </div>
      </div>
    </div>
  );
}
