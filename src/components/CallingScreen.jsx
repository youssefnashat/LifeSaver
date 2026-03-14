import { useState, useEffect } from 'react'
import { Ripple } from './ui/ripple'
import { emergencyConfig, generateDispatchPhrase } from '../emergencyQuizLogic'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

// Map frontend emergency types to backend types
const TYPE_MAP = { police: 'police', medical: 'ems', fire: 'fire' }

const statusSteps = ['Connecting...', 'Reaching dispatch...', 'Line secured', 'Connected']

export default function CallingScreen({ type, answers, address, coords, onConfirm, onBack }) {
  const config = emergencyConfig[type]
  const phrase = generateDispatchPhrase(type, answers)

  const [statusIdx, setStatusIdx] = useState(0)
  const [showPhrase, setShowPhrase] = useState(false)
  const [visible, setVisible] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [callStatus, setCallStatus] = useState('pending') // 'pending' | 'success' | 'error'

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIdx((prev) => {
        if (prev < statusSteps.length - 1) return prev + 1
        clearInterval(interval)
        return prev
      })
    }, 1200)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (statusIdx >= 2) {
      const t = setTimeout(() => setShowPhrase(true), 400)
      return () => clearTimeout(t)
    }
  }, [statusIdx])

  useEffect(() => {
    const timer = setInterval(() => setCallDuration((d) => d + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  // Place the actual 911 call as soon as CallingScreen mounts
  useEffect(() => {
    const resolvedAddress = address ||
      (coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : 'Unknown location')

    fetch(`${BACKEND_URL}/api/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: TYPE_MAP[type] || type,
        address: resolvedAddress,
        situation: phrase, // human-readable context for Groq
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Call failed')
        return res.json()
      })
      .then(() => setCallStatus('success'))
      .catch(() => setCallStatus('error'))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const formatDuration = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const isConnected = statusIdx === statusSteps.length - 1

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-[#0a0a0a]">
      {/* Dark gradient overlay at top */}
      <div
        className="absolute inset-x-0 top-0 h-64 opacity-30"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${config.color}40 0%, transparent 70%)`,
        }}
      />

      {/* Ripple bg effect */}
      <div className="absolute inset-0 flex items-center justify-center opacity-60">
        <div className="relative h-full w-full">
          <Ripple
            mainCircleSize={120}
            mainCircleOpacity={isConnected ? 0.2 : 0.12}
            numCircles={isConnected ? 7 : 5}
            color={config.color}
            className="opacity-80"
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex w-full flex-col items-center px-5 pt-16 pb-8">
        {/* Back / Cancel (subtle) */}
        <div className="mb-8 flex w-full justify-start">
          <button
            onClick={onBack}
            className="font-outfit text-xs text-white/30 hover:text-white/50"
          >
            ← Back
          </button>
        </div>

        {/* Service label */}
        <div
          className={`mb-6 flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: `${config.color}15`, border: `1px solid ${config.color}30` }}
        >
          <span className="text-base">{config.emoji}</span>
          <span className="font-syne text-sm font-bold tracking-wider text-white">{config.label.toUpperCase()}</span>
        </div>

        {/* Call number */}
        <div
          className={`mb-3 transition-all duration-500 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <div className="font-syne text-6xl font-extrabold tracking-tight text-white">
            {config.callNumber}
          </div>
        </div>

        {/* Status / duration */}
        <div
          className={`mb-12 transition-all duration-500 delay-150 ${visible ? 'opacity-100' : 'opacity-0'}`}
        >
          {isConnected ? (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: config.color }} />
              <span className="font-outfit text-sm font-medium" style={{ color: config.color }}>
                {formatDuration(callDuration)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 animate-ping rounded-full bg-white/60" />
              <span className="font-outfit text-sm text-white/60">
                {statusSteps[statusIdx]}
              </span>
            </div>
          )}
        </div>

        {/* Animated call icon */}
        <div
          className={`relative mb-12 flex h-28 w-28 items-center justify-center rounded-full transition-all duration-500 delay-200 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
          style={{
            background: `radial-gradient(circle, ${config.color}25 0%, ${config.color}10 100%)`,
            border: `2px solid ${config.color}40`,
            boxShadow: isConnected
              ? `0 0 40px ${config.color}50, 0 0 80px ${config.color}20`
              : `0 0 20px ${config.color}30`,
          }}
        >
          <span
            className={`text-5xl ${isConnected ? '' : 'animate-phone-ring'}`}
            style={{ filter: `drop-shadow(0 0 12px ${config.color}80)` }}
          >
            📞
          </span>
        </div>

        {/* Address being dispatched */}
        {address && (
          <div className={`mb-4 flex items-center gap-2 transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            <span className="text-xs">📍</span>
            <span className="font-outfit text-xs text-white/40 truncate">{address}</span>
          </div>
        )}

        {/* Dispatch phrase */}
        <div
          className={`w-full rounded-2xl border p-4 transition-all duration-700 ${
            showPhrase ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
          style={{
            background: `${config.color}08`,
            borderColor: `${config.color}25`,
          }}
        >
          <div className="mb-2 flex items-center gap-2">
            <div
              className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold"
              style={{ background: config.color, color: '#000' }}
            >
              AI
            </div>
            <span className="font-outfit text-xs font-medium uppercase tracking-wider" style={{ color: config.color }}>
              Dispatch Message
            </span>
          </div>
          <p className="font-outfit text-sm leading-relaxed text-white/80">{phrase}</p>
        </div>

        {/* Confirm button or error */}
        {callStatus === 'error' ? (
          <div
            className={`mt-6 w-full rounded-2xl border border-red-500/30 bg-red-500/10 py-4 text-center transition-all duration-700 ${
              showPhrase ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <p className="font-outfit text-sm text-red-400">Call failed. Please dial 911 directly.</p>
          </div>
        ) : (
          <button
            onClick={onConfirm}
            disabled={callStatus !== 'success'}
            className={`mt-6 w-full rounded-2xl py-4 font-syne text-base font-bold tracking-wide text-white transition-all duration-700 ${
              showPhrase ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            } ${callStatus !== 'success' ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{
              background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}cc 100%)`,
              boxShadow: `0 8px 32px ${config.color}40`,
            }}
          >
            {callStatus === 'pending' ? 'Placing call...' : 'Help Is Coming →'}
          </button>
        )}

        <p className="font-outfit mt-4 text-center text-xs text-white/25">
          Stay on the line. Do not hang up.
        </p>
      </div>
    </div>
  )
}
