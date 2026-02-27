'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

type BGMTrack = 'lobby' | 'writing' | 'evaluating' | 'results'

interface BGMPlayerProps {
  track: BGMTrack
}

// Musical note frequencies
const NOTES: Record<string, number> = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00,
  A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25,
  G3: 196.00, A3: 220.00, B3: 246.94, F5: 698.46, G5: 783.99,
}

function createOscillator(
  ctx: AudioContext,
  freq: number,
  type: OscillatorType,
  gainValue: number,
  startTime: number,
  duration: number,
  destination: AudioNode
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(gainValue, startTime + 0.05)
  gain.gain.setValueAtTime(gainValue, startTime + duration - 0.1)
  gain.gain.linearRampToValueAtTime(0, startTime + duration)
  osc.connect(gain)
  gain.connect(destination)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

// Lobby: Gentle ambient pads, calm and inviting
function playLobby(ctx: AudioContext, masterGain: AudioNode) {
  const chords = [
    [NOTES.C4, NOTES.E4, NOTES.G4],
    [NOTES.A3, NOTES.C4, NOTES.E4],
    [NOTES.F4, NOTES.A4, NOTES.C5],
    [NOTES.G3, NOTES.B3, NOTES.D4],
  ]
  const loopDuration = chords.length * 3
  let time = ctx.currentTime

  for (let loop = 0; loop < 8; loop++) {
    chords.forEach((chord) => {
      chord.forEach((freq) => {
        createOscillator(ctx, freq, 'sine', 0.06, time, 2.8, masterGain)
        createOscillator(ctx, freq * 2, 'sine', 0.02, time + 0.2, 2.4, masterGain)
      })
      time += 3
    })
  }
  return loopDuration * 8
}

// Writing: Focused lo-fi style, rhythmic soft pulses
function playWriting(ctx: AudioContext, masterGain: AudioNode) {
  const melody = [
    NOTES.E4, NOTES.G4, NOTES.A4, NOTES.G4,
    NOTES.E4, NOTES.D4, NOTES.C4, NOTES.D4,
    NOTES.E4, NOTES.C5, NOTES.B4, NOTES.A4,
    NOTES.G4, NOTES.E4, NOTES.D4, NOTES.E4,
  ]
  let time = ctx.currentTime
  const beatDuration = 0.8

  for (let loop = 0; loop < 6; loop++) {
    melody.forEach((freq, i) => {
      createOscillator(ctx, freq, 'triangle', 0.07, time, beatDuration * 0.9, masterGain)
      // Subtle bass
      if (i % 4 === 0) {
        createOscillator(ctx, freq / 2, 'sine', 0.04, time, beatDuration * 3.5, masterGain)
      }
      time += beatDuration
    })
  }
  return melody.length * beatDuration * 6
}

// Evaluating: Tense, pulsing, anticipation
function playEvaluating(ctx: AudioContext, masterGain: AudioNode) {
  let time = ctx.currentTime
  const pulse = [NOTES.D4, NOTES.F4, NOTES.D4, NOTES.F4, NOTES.G4, NOTES.F4]
  const beatDuration = 0.5

  for (let loop = 0; loop < 10; loop++) {
    pulse.forEach((freq) => {
      createOscillator(ctx, freq, 'square', 0.03, time, beatDuration * 0.6, masterGain)
      createOscillator(ctx, freq * 0.5, 'sine', 0.05, time, beatDuration * 0.8, masterGain)
      time += beatDuration
    })
  }
  return pulse.length * beatDuration * 10
}

// Results: Triumphant, celebratory fanfare then calm
function playResults(ctx: AudioContext, masterGain: AudioNode) {
  let time = ctx.currentTime

  // Fanfare intro
  const fanfare = [NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C5, NOTES.E5]
  fanfare.forEach((freq, i) => {
    createOscillator(ctx, freq, 'triangle', 0.08, time + i * 0.3, 1.2, masterGain)
    createOscillator(ctx, freq * 0.5, 'sine', 0.04, time + i * 0.3, 1.0, masterGain)
  })
  time += 2.5

  // Calm celebration loop
  const chords = [
    [NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C5],
    [NOTES.F4, NOTES.A4, NOTES.C5, NOTES.F5],
    [NOTES.G4, NOTES.B4, NOTES.D5, NOTES.G5],
    [NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C5],
  ]
  for (let loop = 0; loop < 6; loop++) {
    chords.forEach((chord) => {
      chord.forEach((freq) => {
        createOscillator(ctx, freq, 'sine', 0.05, time, 2.6, masterGain)
      })
      time += 2.8
    })
  }
  return time - ctx.currentTime
}

const TRACK_PLAYERS: Record<BGMTrack, (ctx: AudioContext, gain: AudioNode) => number> = {
  lobby: playLobby,
  writing: playWriting,
  evaluating: playEvaluating,
  results: playResults,
}

export function BGMPlayer({ track }: BGMPlayerProps) {
  const [muted, setMuted] = useState(false)
  const [started, setStarted] = useState(false)
  const ctxRef = useRef<AudioContext | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  const startAudio = useCallback(() => {
    if (ctxRef.current) {
      ctxRef.current.close()
    }
    const ctx = new AudioContext()
    const masterGain = ctx.createGain()
    masterGain.gain.value = muted ? 0 : 0.5
    masterGain.connect(ctx.destination)

    ctxRef.current = ctx
    gainRef.current = masterGain

    TRACK_PLAYERS[track](ctx, masterGain)
    setStarted(true)
  }, [track, muted])

  // Restart when track changes
  useEffect(() => {
    if (started) {
      startAudio()
    }
    return () => {
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        ctxRef.current.close()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track])

  // Update volume when muted changes
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = muted ? 0 : 0.5
    }
  }, [muted])

  const handleToggle = () => {
    if (!started) {
      startAudio()
    }
    setMuted(!muted)
  }

  return (
    <button
      onClick={handleToggle}
      className="fixed top-4 right-4 z-50 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full transition-all"
      title={!started ? 'BGM 재생' : muted ? 'BGM 켜기' : 'BGM 끄기'}
    >
      {muted || !started ? (
        <VolumeX className="w-5 h-5 text-violet-300" />
      ) : (
        <Volume2 className="w-5 h-5 text-violet-300" />
      )}
    </button>
  )
}
