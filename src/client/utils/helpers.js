// Generate a device fingerprint for fraud detection
export function generateFingerprint() {
  const { userAgent, language, platform } = navigator
  const { width, height, colorDepth } = screen
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const raw = `${userAgent}|${language}|${platform}|${width}x${height}|${colorDepth}|${timezone}`
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(8, '0') + `-${Date.now().toString(16)}`
}
