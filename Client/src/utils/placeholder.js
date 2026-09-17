// Deterministic "no photo yet" tile: same product always gets the same
// initials + tint, so the grid looks intentional rather than broken,
// without introducing new colors outside the palette.
const PALETTE = [
  { bg: '#E4EDEA', fg: '#1F5C4D' }, // accent tint
  { bg: '#ECEBE7', fg: '#6B685F' }, // ink-muted tint
  { bg: '#F1F0EC', fg: '#1C1B19' }, // neutral tint
]

function hashString(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function getInitials(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

export function getTile(name = '') {
  const idx = hashString(name) % PALETTE.length
  return PALETTE[idx]
}
