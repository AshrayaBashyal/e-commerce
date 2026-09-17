import { getInitials, getTile } from '../utils/placeholder'

// Renders the real product photo when one exists; otherwise a flat
// monogram tile so the catalog still reads as a real store rather than
// a grid of broken-image icons.
export default function ProductThumb({ image, alt, name, fontSize = '1.5rem' }) {
  if (image) {
    return <img src={image} alt={alt || name} />
  }
  const tile = getTile(name)
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: tile.bg,
        color: tile.fg,
        fontWeight: 700,
        fontSize,
        letterSpacing: '0.02em',
      }}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  )
}
