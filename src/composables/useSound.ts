// Web Audio API sound effects — no audio files needed
let audioCtx: AudioContext | null = null

const getCtx = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  return audioCtx
}

const playTone = (freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15, startDelay = 0) => {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay)

    gain.gain.setValueAtTime(volume, ctx.currentTime + startDelay)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration)

    osc.start(ctx.currentTime + startDelay)
    osc.stop(ctx.currentTime + startDelay + duration + 0.05)
  } catch {
    // Silently fail if audio context not available
  }
}

export function useSound() {
  /** Soft blip on hover */
  const playHover = () => {
    playTone(800, 0.08, 'sine', 0.06)
  }

  /** Confirm tone on select */
  const playSelect = () => {
    playTone(523, 0.08, 'sine', 0.12)
    playTone(659, 0.08, 'sine', 0.10, 0.07)
  }

  /** Success chime on task complete */
  const playTaskComplete = () => {
    playTone(523, 0.1, 'sine', 0.14)
    playTone(659, 0.1, 'sine', 0.14, 0.1)
    playTone(784, 0.15, 'sine', 0.14, 0.2)
  }

  /** Error/offline buzz */
  const playError = () => {
    playTone(200, 0.15, 'square', 0.08)
    playTone(180, 0.15, 'square', 0.08, 0.12)
  }

  /** Status change notification */
  const playStatusChange = () => {
    playTone(440, 0.06, 'triangle', 0.08)
    playTone(520, 0.08, 'triangle', 0.08, 0.05)
  }

  /** Message received ping */
  const playMessage = () => {
    playTone(600, 0.06, 'sine', 0.08)
    playTone(800, 0.08, 'sine', 0.08, 0.06)
  }

  return {
    playHover,
    playSelect,
    playTaskComplete,
    playError,
    playStatusChange,
    playMessage,
  }
}
