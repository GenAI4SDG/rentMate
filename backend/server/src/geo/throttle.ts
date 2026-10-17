let lastNominatimAt = 0

export async function throttleNominatim(): Promise<void> {
  const now = Date.now()
  const wait = Math.max(0, 1000 - (now - lastNominatimAt))
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastNominatimAt = Date.now()
}
