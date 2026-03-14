import { useEffect, useState } from 'react'
import { Ripple } from './ui/ripple'
import { PulsatingButton } from './ui/pulsating-button'

const emergencies = [
  {
    type: 'police',
    label: 'Police',
    subtitle: 'Threat · Crime · Danger',
    emoji: '🚔',
    color: '#3b82f6',
    glowClass: 'glow-police',
    description: 'Call for police assistance',
  },
  {
    type: 'medical',
    label: 'Medical',
    subtitle: 'Injury · Illness · Cardiac',
    emoji: '🏥',
    color: '#ef4444',
    glowClass: 'glow-medical',
    description: 'Request an ambulance',
  },
  {
    type: 'fire',
    label: 'Fire',
    subtitle: 'Fire · Explosion · Rescue',
    emoji: '🚒',
    color: '#f97316',
    glowClass: 'glow-fire',
    description: 'Report fire emergency',
  },
]

function GridBg() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  )
}

const locationBadge = {
  loading:     { text: 'Getting location...', color: 'text-yellow-400',  border: 'border-yellow-500/30', bg: 'bg-yellow-500/10',  dot: 'bg-yellow-400 animate-pulse' },
  ready:       { text: 'Location Ready',      color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400 animate-pulse' },
  denied:      { text: 'Location Off',        color: 'text-red-400',     border: 'border-red-500/30',    bg: 'bg-red-500/10',    dot: 'bg-red-400' },
  unavailable: { text: 'No GPS',              color: 'text-white/40',    border: 'border-white/10',      bg: 'bg-white/5',       dot: 'bg-white/30' },
}

export default function HomeScreen({ onSelect, locationStatus = 'loading', address = '' }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="relative flex min-h-screen flex-col bg-[#0a0a0a] px-5 pb-8 pt-14">
      <GridBg />

      {/* Ambient glow bg */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-10 left-10 h-48 w-48 rounded-full opacity-8 blur-3xl"
          style={{ background: 'radial-gradient(circle, #ef4444 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-20 right-5 h-40 w-40 rounded-full opacity-8 blur-3xl"
          style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }}
        />
      </div>

      {/* Status bar */}
      <div
        className={`relative z-10 mb-8 flex items-center justify-between transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* GPS badge */}
        {(() => {
          const badge = locationBadge[locationStatus] || locationBadge.loading
          return (
            <div className={`flex flex-col gap-0.5`}>
              <div className={`flex items-center gap-1.5 rounded-full border ${badge.border} ${badge.bg} px-3 py-1.5`}>
                <div className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                <span className={`font-outfit text-xs font-medium ${badge.color}`}>{badge.text}</span>
              </div>
              {locationStatus === 'ready' && address && (
                <p className="font-outfit text-[10px] text-white/25 px-1 truncate max-w-[180px]">{address}</p>
              )}
              {locationStatus === 'denied' && (
                <p className="font-outfit text-[10px] text-red-400/60 px-1">Enable location for accurate dispatch</p>
              )}
            </div>
          )
        })()}

        {/* SOS pill */}
        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
          <span className="font-outfit text-xs text-white/50">24/7 Active</span>
        </div>
      </div>

      {/* Header */}
      <div
        className={`relative z-10 mb-10 transition-all duration-500 delay-75 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <h1 className="font-syne text-4xl font-extrabold tracking-tight text-white">
          LIFE<span className="text-red-500">SAVER</span>
        </h1>
        <p className="font-outfit mt-1.5 text-sm font-light tracking-widest text-white/40 uppercase">
          Emergency Response System
        </p>
        <div className="mt-4 h-px w-16 bg-gradient-to-r from-white/20 to-transparent" />
      </div>

      {/* Call to action */}
      <p
        className={`font-outfit relative z-10 mb-5 text-sm font-medium text-white/60 transition-all duration-500 delay-100 ${visible ? 'opacity-100' : 'opacity-0'}`}
      >
        Select your emergency type
      </p>

      {/* Emergency buttons */}
      <div className="relative z-10 flex flex-col gap-3">
        {emergencies.map(({ type, label, subtitle, emoji, color, glowClass }, idx) => (
          <PulsatingButton
            key={type}
            pulseColor={color}
            duration="2.5s"
            onClick={() => onSelect(type)}
            className={`${glowClass} rounded-2xl transition-all duration-500 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{
              transitionDelay: `${150 + idx * 80}ms`,
              background: `linear-gradient(135deg, #111 0%, #0f0f0f 100%)`,
              border: `1px solid ${color}30`,
              minHeight: '96px',
            }}
          >
            {/* Icon */}
            <div
              className="mr-4 flex h-[60px] w-[60px] flex-shrink-0 items-center justify-center rounded-xl text-3xl"
              style={{
                background: `${color}18`,
                border: `1px solid ${color}35`,
              }}
            >
              {emoji}
            </div>

            {/* Text */}
            <div className="flex flex-col items-start">
              <span className="font-syne text-[18px] font-bold text-white">{label}</span>
              <span className="font-outfit mt-0.5 text-xs text-white/45">{subtitle}</span>
            </div>

            {/* Arrow */}
            <div className="ml-auto pr-1 text-white/25">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </PulsatingButton>
        ))}
      </div>

      {/* Ripple background effect */}
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-0 opacity-30">
        <div className="relative h-48 w-48">
          <Ripple
            mainCircleSize={80}
            mainCircleOpacity={0.15}
            numCircles={5}
            color="#ffffff"
          />
        </div>
      </div>

      {/* Footer */}
      <div
        className={`relative z-10 mt-auto pt-8 text-center transition-all duration-500 delay-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
      >
        <p className="font-outfit text-[11px] text-white/20 tracking-widest uppercase">
          Tap to contact emergency services
        </p>
      </div>
    </div>
  )
}
