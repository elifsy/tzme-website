// Keep text in HTML at full resolution while adapting only the WebGL buffer.
export function createIndustrialQuality({ pixelRatio = 1, compact = false } = {}) {
  const nativeRatio = Math.max(.5, pixelRatio)
  let restRatio = Math.min(nativeRatio, compact ? 1.5 : 1.7), ratio = restRatio
  let previous = null, average = 0, samples = 0, changedAt = -Infinity
  let previousMode = 'orbit'
  const pause = () => { previous = null; average = 0; samples = 0 }
  return {
    get ratio() { return ratio },
    get restRatio() { return restRatio },
    configure(mode, width, height) {
      const ceiling = mode === 'inspect' ? 1.25 : compact ? 1.5 : 1.7
      const budget = mode === 'inspect' ? 1200000 : compact ? 900000 : 2400000
      restRatio = Math.min(nativeRatio, ceiling, Math.sqrt(budget / Math.max(1, width * height)))
      ratio = mode === 'inspect' && previousMode !== mode ? restRatio : Math.min(ratio, restRatio)
      previousMode = mode
      pause()
    },
    update(now, moving) {
      if (!moving) { pause(); return ratio }
      ratio = Math.min(ratio, restRatio, 1.5)
      const elapsed = previous === null ? 0 : now - previous
      previous = now
      // Ignore idle gaps, startup and background-tab intervals.
      if (elapsed <= 0 || elapsed > 250) return ratio
      average = samples ? average * .8 + elapsed * .2 : elapsed
      samples++
      if (samples >= 6 && average > 28 && now - changedAt >= 450) {
        ratio = Math.max(Math.min(1, restRatio), Math.round((ratio - .15) * 100) / 100)
        changedAt = now; average = 0; samples = 0
      }
      return ratio
    },
    pause,
    restore() { ratio = restRatio; changedAt = -Infinity; pause(); return ratio },
  }
}
