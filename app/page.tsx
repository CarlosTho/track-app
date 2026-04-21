'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Flame } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView] as const
}

const DURATION_WORDS = ['1-week', '30-day', '2-week', '90-day']

function HeroDuration() {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const tick = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx((i) => (i + 1) % DURATION_WORDS.length)
        setVisible(true)
      }, 320)
    }, 2800)
    return () => clearInterval(tick)
  }, [])

  return (
    <span
      className="relative inline-block align-baseline italic"
      style={{ minWidth: '4.5ch' }}
    >
      <span aria-hidden className="invisible whitespace-nowrap">
        90-day
      </span>
      <span
        aria-live="polite"
        className="absolute inset-0 whitespace-nowrap transition-all duration-[320ms] ease-out"
        style={{
          color: 'var(--tp-orange)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(8px)',
        }}
      >
        {DURATION_WORDS[idx]}
      </span>
    </span>
  )
}

function ActivityItem({
  user,
  action,
  time,
  color,
  isNew = false,
}: {
  user: string
  action: string
  time: string
  color: string
  isNew?: boolean
}) {
  return (
    <div
      className={`${isNew ? 'tp-slide-down' : ''} flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-[12.5px]`}
      style={{
        background: 'var(--tp-bg3)',
        borderColor: isNew ? 'rgba(249,115,22,0.25)' : 'var(--tp-border)',
      }}
    >
      <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
      <div className="flex-1" style={{ color: 'var(--tp-text-soft)' }}>
        <strong className="font-medium" style={{ color: 'var(--tp-text)' }}>
          {user}
        </strong>{' '}
        {action}
      </div>
      <div className="text-[11px]" style={{ color: 'var(--tp-text-muted)' }}>
        {time}
      </div>
    </div>
  )
}

const ACTIVITY_POOL = [
  { user: 'You',  action: 'logged breakfast ✓', time: 'just now', color: '#22c55e' },
  { user: 'Alex', action: 'logged breakfast',    time: '2m ago',   color: '#F97316' },
  { user: 'You',  action: 'logged lunch ✓',      time: '1h ago',   color: '#22c55e' },
  { user: 'Alex', action: 'logged lunch',         time: '1h ago',   color: '#F97316' },
  { user: 'You',  action: 'logged dinner ✓',      time: '2h ago',   color: '#22c55e' },
  { user: 'Alex', action: 'skipped dinner ⚠️',   time: '5h ago',   color: '#eab308' },
  { user: 'You',  action: 'hit a 12-day streak 🔥', time: '10m ago', color: '#F97316' },
  { user: 'Alex', action: 'logged snack',          time: '30m ago',  color: '#F97316' },
]

function MockupCard() {
  const [tick, setTick]           = useState(0)
  const [streakA, setStreakA]     = useState(9)
  const [streakB]                 = useState(9)
  const [progress, setProgress]   = useState(68)
  const [feedStart, setFeedStart] = useState(0)
  const [feedKey, setFeedKey]     = useState(0)
  const [alexTyping, setAlexTyping] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 3000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (tick > 0 && tick % 2 === 0) setStreakA((x) => x + 1)
  }, [tick])

  // Progress slowly ticks up then resets
  useEffect(() => {
    const t = setInterval(() => setProgress((p) => (p >= 74 ? 67 : p + 1)), 2200)
    return () => clearInterval(t)
  }, [])

  // Cycle activity feed
  useEffect(() => {
    const next = (feedStart + 1) % ACTIVITY_POOL.length
    const isAlexNext = ACTIVITY_POOL[next].user === 'Alex'

    const delay = setTimeout(() => {
      if (isAlexNext) {
        setAlexTyping(true)
        setTimeout(() => {
          setAlexTyping(false)
          setFeedStart(next)
          setFeedKey((k) => k + 1)
        }, 700)
      } else {
        setFeedStart(next)
        setFeedKey((k) => k + 1)
      }
    }, 1600)

    return () => clearTimeout(delay)
  }, [feedStart])

  const day = Math.floor(tick / 3) + 5

  const feed = [
    ACTIVITY_POOL[feedStart],
    ACTIVITY_POOL[(feedStart - 1 + ACTIVITY_POOL.length) % ACTIVITY_POOL.length],
    ACTIVITY_POOL[(feedStart - 2 + ACTIVITY_POOL.length) % ACTIVITY_POOL.length],
  ]

  return (
    <div
      className="tp-animate-float rounded-[20px] border p-6"
      style={{
        background: 'var(--tp-bg2)',
        borderColor: 'var(--tp-border-strong)',
        boxShadow: 'var(--tp-shadow-lg)',
      }}
    >
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="font-syne text-sm font-bold"
            style={{ color: 'var(--tp-text)' }}
          >
            Week Challenge
          </div>
          <div className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: 'rgba(34,197,94,0.12)', color: '#16a34a' }}>
            <span className="tp-live-dot h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
            LIVE
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
          style={{
            background: 'var(--tp-orange-dim)',
            borderColor: 'rgba(249,115,22,0.2)',
            color: 'var(--tp-orange-light)',
          }}
        >
          🔥 Day {day}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div
          className="mb-1.5 flex justify-between text-xs"
          style={{ color: 'var(--tp-text-muted)' }}
        >
          <span>Overall progress</span>
          <span style={{ color: 'var(--tp-orange-light)' }}>{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--tp-bg3)' }}>
          <div
            className="h-full rounded-full transition-all duration-[2200ms] ease-in-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--tp-orange), var(--tp-orange-light))',
            }}
          />
        </div>
      </div>

      {/* You */}
      <div
        className="mb-4 flex items-center gap-3 rounded-xl border px-4 py-3.5"
        style={{ background: 'var(--tp-bg3)', borderColor: 'var(--tp-border)' }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #F97316, #c2410c)' }}
        >
          J
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-medium" style={{ color: 'var(--tp-text)' }}>You</div>
          <div className="mt-0.5 text-[11.5px]" style={{ color: 'var(--tp-text-muted)' }}>
            3/3 meals today ✓
          </div>
        </div>
        <div
          className="font-syne text-xl font-extrabold transition-transform duration-300"
          style={{ color: 'var(--tp-orange)' }}
          key={streakA}
        >
          {streakA} days
        </div>
      </div>

      <div
        className="mb-4 text-center text-[10px] font-semibold tracking-[0.1em]"
        style={{ color: 'var(--tp-text-muted)' }}
      >
        VS
      </div>

      {/* Partner */}
      <div
        className="mb-4 flex items-center gap-3 rounded-xl border px-4 py-3.5"
        style={{ background: 'var(--tp-bg3)', borderColor: 'var(--tp-border)' }}
      >
        <div
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4338ca)' }}
        >
          A
          {alexTyping && (
            <span
              className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-green-400"
              style={{ boxShadow: '0 0 0 2px white' }}
            />
          )}
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-medium" style={{ color: 'var(--tp-text)' }}>Alex</div>
          <div className="mt-0.5 text-[11.5px]" style={{ color: 'var(--tp-text-muted)' }}>
            {alexTyping ? (
              <span style={{ color: '#16a34a' }}>logging now...</span>
            ) : (
              '2/3 meals today'
            )}
          </div>
        </div>
        <div className="font-syne text-xl font-extrabold" style={{ color: '#6366f1' }}>
          {streakB} days
        </div>
      </div>

      {/* Activity feed */}
      <div className="flex flex-col gap-2">
        <ActivityItem key={`${feedKey}-0`} isNew {...feed[0]} />
        <ActivityItem key={`${feedKey}-1`}       {...feed[1]} />
        <ActivityItem key={`${feedKey}-2`}       {...feed[2]} />
      </div>
    </div>
  )
}

function StepCard({
  number,
  icon,
  title,
  desc,
  delay,
}: {
  number: string
  icon: React.ReactNode
  title: string
  desc: string
  delay: number
}) {
  const [ref, inView] = useInView(0.1)

  return (
    <div
      ref={ref}
      className="group relative overflow-hidden rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'var(--tp-bg2)',
        borderColor: 'var(--tp-border)',
        boxShadow: 'var(--tp-shadow-sm)',
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s, border-color 0.3s, box-shadow 0.3s`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(circle at 0% 0%, var(--tp-orange-dim) 0%, transparent 60%)',
        }}
      />
      <div
        className="font-syne mb-5 text-[11px] font-bold uppercase tracking-[0.12em]"
        style={{ color: 'var(--tp-orange)' }}
      >
        {number}
      </div>
      <div
        className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
        style={{ background: 'var(--tp-orange-dim)', color: 'var(--tp-orange)' }}
      >
        {icon}
      </div>
      <div
        className="font-syne mb-2.5 text-xl font-bold"
        style={{ color: 'var(--tp-text)' }}
      >
        {title}
      </div>
      <div
        className="text-[14.5px] font-light leading-relaxed"
        style={{ color: 'var(--tp-text-muted)' }}
      >
        {desc}
      </div>
    </div>
  )
}

function StepsSection({ steps }: { steps: { number: string; icon: React.ReactNode; title: string; desc: string }[] }) {
  const [labelRef, labelInView] = useInView(0.2)
  const [headingRef, headingInView] = useInView(0.2)

  return (
    <section id="how-it-works" className="relative px-6 pt-20 pb-24 md:px-16">
      <div
        ref={labelRef}
        className="mb-3.5 text-xs font-semibold uppercase tracking-[0.15em]"
        style={{
          color: 'var(--tp-text-muted)',
          opacity: labelInView ? 1 : 0,
          transform: labelInView ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}
      >
        How it works
      </div>
      <h2
        ref={headingRef}
        className="font-syne mb-14 max-w-[480px] text-[clamp(28px,2.9vw,42px)] font-extrabold leading-[1.05] tracking-[-0.025em] text-balance"
        style={{
          color: 'var(--tp-text)',
          opacity: headingInView ? 1 : 0,
          transform: headingInView ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s',
        }}
      >
        Three steps to{' '}
        <span style={{ color: 'var(--tp-orange)' }}>real</span> accountability
      </h2>

      <div className="relative grid grid-cols-1 gap-0.5 md:grid-cols-3">
        {steps.map((step, i) => (
          <StepCard key={step.number} {...step} delay={i * 0.15} />
        ))}
      </div>
    </section>
  )
}

export default function LandingPage() {
  const { user } = useAuth()
  const ctaHref = user ? '/dashboard' : '/auth'

  const steps = [
    {
      number: '01 — Create',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M11 7v8M7 11h8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ),
      title: 'Create a Challenge',
      desc: "Set the duration, rules, and what you're tracking. Flexible to any goal you're working on.",
    },
    {
      number: '02 — Invite',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="15" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M2 18c0-3 2.7-5 6-5h6c3.3 0 6 2 6 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ),
      title: 'Invite a Friend',
      desc: 'Share a 6-digit code. Your partner joins, you both agree to the same rules, the game begins.',
    },
    {
      number: '03 — Track',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path
            d="M3 15L8 9l4 5 3-4 4 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="18" cy="15" r="2" fill="currentColor" opacity="0.4" />
        </svg>
      ),
      title: 'Track Progress',
      desc: "Log daily. See your partner's activity in real time. A streak is on the line — for both of you.",
    },
  ]

  return (
    <div
      className="font-dmsans tp-dot-grid relative min-h-screen overflow-x-hidden"
      style={{ background: 'var(--tp-bg)', color: 'var(--tp-text)' }}
    >
      {/* Landing-specific top nav (hidden when the main authed Navbar is showing) */}
      {!user && (
        <nav
          className="tp-animate-fade-in fixed inset-x-0 top-0 z-[100] flex h-16 items-center justify-between px-6 backdrop-blur-[20px] md:px-10"
          style={{
            background: 'rgba(250,250,249,0.85)',
            borderBottom: '1px solid var(--tp-border)',
          }}
        >
          <Link
            href="/"
            className="font-syne flex items-center gap-2 text-[18px] font-bold"
            style={{ color: 'var(--tp-text)' }}
          >
            <Flame className="h-5 w-5" style={{ color: 'var(--tp-orange)' }} />
            TrackPair
          </Link>
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5"
            style={{ background: 'var(--tp-orange)' }}
          >
            Join now
          </Link>
        </nav>
      )}

      {/* HERO */}
      <section className="relative grid min-h-[calc(100vh-4rem)] grid-cols-1 items-center gap-12 overflow-hidden px-6 pt-20 pb-14 md:gap-16 md:px-16 md:pt-24 md:pb-16 lg:grid-cols-2">
        {/* Glow blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            width: 600,
            height: 600,
            background: 'var(--tp-orange)',
            filter: 'blur(120px)',
            top: -200,
            right: -100,
            opacity: 0.06,
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            width: 400,
            height: 400,
            background: 'var(--tp-orange)',
            filter: 'blur(120px)',
            bottom: 0,
            left: -100,
            opacity: 0.04,
          }}
        />

        {/* LEFT */}
        <div className="relative z-[2]">
          <div
            className="tp-animate-fade-up mb-7 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12.5px] font-medium"
            style={{
              background: 'var(--tp-orange-dim)',
              borderColor: 'rgba(249,115,22,0.25)',
              color: 'var(--tp-orange-light)',
              animationDelay: '0.1s',
            }}
          >
            <span className="relative inline-block h-1.5 w-1.5">
              <span
                className="absolute inset-0 rounded-full"
                style={{ background: 'var(--tp-orange)' }}
              />
              <span
                className="tp-animate-pulse-ring absolute rounded-full border-[1.5px]"
                style={{
                  inset: '-4px',
                  borderColor: 'var(--tp-orange)',
                }}
              />
            </span>
            Accountability that actually works
          </div>

          <h1
            className="font-syne tp-animate-fade-up mb-6 max-w-[560px] pb-1 text-[clamp(38px,4.2vw,58px)] font-extrabold leading-[1.06] tracking-[-0.025em] text-pretty"
            style={{
              color: 'var(--tp-text)',
              animationDelay: '0.2s',
            }}
          >
            Start a <HeroDuration />{' '}
            <span className="inline-block pb-[0.08em]">challenge</span>
            <br />
            <span style={{ color: 'var(--tp-orange)' }}>with someone.</span>
          </h1>

          <p
            className="tp-animate-fade-up mb-10 max-w-[460px] text-[17px] font-light leading-[1.65]"
            style={{
              color: 'var(--tp-text-soft)',
              animationDelay: '0.35s',
            }}
          >
            Pair up with a partner, set your rules, log every day.{' '}
            <em
              className="not-italic font-medium"
              style={{ color: 'var(--tp-text)' }}
            >
              Someone is watching
            </em>{' '}
            — that&apos;s what makes it work.
          </p>

          <div
            className="tp-animate-fade-up flex flex-wrap items-center gap-3.5"
            style={{ animationDelay: '0.45s' }}
          >
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-[15px] font-medium text-white transition-all hover:-translate-y-0.5"
              style={{
                background: 'var(--tp-orange)',
                boxShadow: '0 0 0 0 rgba(249,115,22,0)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  '0 8px 32px rgba(249,115,22,0.35)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow = '0 0 0 0 rgba(249,115,22,0)')
              }
            >
              Get Started Free
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border px-5 py-3.5 text-[15px] font-normal transition-colors"
              style={{
                background: 'transparent',
                color: 'var(--tp-text-soft)',
                borderColor: 'var(--tp-border)',
              }}
            >
              See how it works
            </a>
          </div>
        </div>

        {/* RIGHT */}
        <div className="tp-animate-fade-in relative z-[2] flex items-center justify-center">
          <div className="relative mx-auto w-full max-w-[360px] sm:max-w-[400px] lg:max-w-[440px]">
            <MockupCard />
          </div>
        </div>
      </section>

      {/* STEPS */}
      <StepsSection steps={steps} />

      {/* TAGLINE */}
      <section className="relative flex flex-col items-center px-6 pt-16 pb-24 text-center md:px-16">
        <h2
          className="font-syne relative z-[1] mb-5 max-w-[620px] text-[clamp(34px,4.2vw,54px)] font-extrabold leading-[1.04] tracking-[-0.025em] text-balance"
          style={{ color: 'var(--tp-text)' }}
        >
          You don&apos;t have to
          <br />
          do it <em className="tp-animate-shimmer not-italic">alone.</em>
        </h2>
        <div
          className="font-syne pointer-events-none mb-8 select-none text-[clamp(32px,5vw,72px)] font-extrabold tracking-[-0.04em]"
          style={{
            color: 'transparent',
            WebkitTextStroke: '1.5px rgba(0,0,0,0.55)',
          }}
        >
          Do it, Together
        </div>
        <p
          className="relative z-[1] mb-9 text-[17px] font-light"
          style={{ color: 'var(--tp-text-muted)' }}
        >
          The accountability gap is real. TrackPair closes it.
        </p>
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 rounded-xl px-9 py-4 text-base font-medium text-white transition-all hover:-translate-y-0.5"
          style={{
            background: 'var(--tp-orange)',
            boxShadow: '0 8px 32px rgba(249,115,22,0.25)',
          }}
        >
          Start your challenge
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>

      {/* FOOTER */}
      <footer
        className="flex flex-col items-center justify-between gap-4 border-t px-6 py-6 text-sm md:flex-row md:px-16"
        style={{ borderColor: 'var(--tp-border)' }}
      >
        <div
          className="font-syne flex items-center gap-2 text-[15px] font-bold"
          style={{ color: 'var(--tp-text-muted)' }}
        >
          <Flame className="h-4 w-4" style={{ color: 'var(--tp-orange)' }} />
          TrackPair © 2026
        </div>
        <div className="flex gap-6">
          <a
            href="#"
            className="text-[13px] transition-colors hover:text-[color:var(--tp-text)]"
            style={{ color: 'var(--tp-text-muted)' }}
          >
            Privacy
          </a>
          <a
            href="#"
            className="text-[13px] transition-colors hover:text-[color:var(--tp-text)]"
            style={{ color: 'var(--tp-text-muted)' }}
          >
            Terms
          </a>
          <a
            href="#"
            className="text-[13px] transition-colors hover:text-[color:var(--tp-text)]"
            style={{ color: 'var(--tp-text-muted)' }}
          >
            Contact
          </a>
        </div>
      </footer>
    </div>
  )
}
