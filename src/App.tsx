import { useCallback, useState, useEffect, useRef } from 'react'
import { VideoAscii } from 'react-video-ascii'

/* ═══════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════ */

const DATA = {
  name: { line1: 'shehraz', line2: 'riar.' },
  descriptor:
    'working at the intersection of geroscience, health equity, and policy.',
}

/* ═══════════════════════════════════════════════════════════
   HEARTBEAT ENGINE
   Simulates a cardiac lub-dub rhythm.
   
   One full cycle ≈ 1600ms (~38 bpm — deep rest):
     0–120ms    S1 "lub"  (sharp rise → fall)
     120–400ms  brief pause
     400–530ms  S2 "dub"  (softer rise → fall)
     530–1600ms diastolic rest
   ═══════════════════════════════════════════════════════════ */

const HEARTBEAT_CYCLE_MS = 1600

/**
 * Returns a 0→1 intensity value at the given point in the cardiac cycle.
 * Two asymmetric peaks model the S1 and S2 heart sounds.
 */
function heartbeatIntensity(t: number): number {
  const phase = (t % HEARTBEAT_CYCLE_MS) / HEARTBEAT_CYCLE_MS // 0..1

  // S1 — "lub" — strong beat
  const s1Center = 0.06
  const s1Width = 0.045
  const s1 = Math.exp(-((phase - s1Center) ** 2) / (2 * s1Width * s1Width))

  // S2 — "dub" — softer beat
  const s2Center = 0.28
  const s2Width = 0.04
  const s2 = 0.65 * Math.exp(-((phase - s2Center) ** 2) / (2 * s2Width * s2Width))

  return Math.max(s1, s2)
}

function useHeartbeat(isMobile = false) {
  const resting = isMobile ? 2.5 : 1.8
  const peak = isMobile ? 5.5 : 4.5

  const [brightness, setBrightness] = useState(resting)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)

  useEffect(() => {
    startRef.current = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startRef.current
      const intensity = heartbeatIntensity(elapsed)

      // Map intensity (0–1) → brightness range (resting → peak)
      setBrightness(resting + intensity * (peak - resting))

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [resting, peak])

  return brightness
}

/* ═══════════════════════════════════════════════════════════
   RESPONSIVE HOOK
   ═══════════════════════════════════════════════════════════ */

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= breakpoint
  )

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', onChange)
    setIsMobile(mql.matches)
    return () => mql.removeEventListener('change', onChange)
  }, [breakpoint])

  return isMobile
}

/* ═══════════════════════════════════════════════════════════
   HERO — the only component
   ═══════════════════════════════════════════════════════════ */

function Hero() {
  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const isMobile = useIsMobile()
  const brightness = useHeartbeat(isMobile)

  return (
    <section className="hero" id="hero">
      {/* Full-screen ASCII video background */}
      <div className="hero__ascii-bg hero__ascii-bg--heartbeat">
        <VideoAscii
          src="/hero.mp4"
          videoMode={false}
          numColsRaw={isMobile ? 100 : 280}
          brightnessRaw={brightness}
          saturationRaw={0.0}
          bgOpacityRaw={0.0}
          charMode="luminance"
          mouseEffect={{
            style: 'brighten',
            radius: isMobile ? 0.25 : 0.15,
            duration: 2.0,
            trailLen: isMobile ? 15 : 25,
            trailDecay: 6,
            brightness: 5.0,
          }}
          clickEffect={{
            style: 'ripple',
            brightness: 1.3,
            speed: 2,
          }}
          revealEffect={{
            type: 'random',
            duration: 0.6,
          }}
        />
      </div>

      {/* Top nav */}
      <nav className="hero__nav">
        <div className="hero__logo"> </div>
        <ul className="hero__nav-links">
          {['Home', 'Vision', 'Contact', 'CV'].map((label) => (
            <li key={label}>
              <button
                className={`hero__nav-link ${label === 'CV' ? 'hero__nav-link--active' : ''}`}
                onClick={() => scrollTo(label.toLowerCase())}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Spacer (middle row, lets grid push name to bottom) */}
      <div />

      {/* Bottom: huge name + descriptor */}
      <div className="hero__bottom">
        <h1 className="hero__name">
          {DATA.name.line1}
          <br />
          {DATA.name.line2}
        </h1>
        <div className="hero__descriptor">
          <p>{DATA.descriptor}</p>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   APP
   ═══════════════════════════════════════════════════════════ */

export default function App() {
  return <Hero />
}
