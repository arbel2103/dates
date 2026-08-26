/**
 * The glowing moon in the top-right of the night world.
 *
 * The halo is its own radial-gradient layer rather than a box-shadow: the moon
 * drifts, and a composited element's shadow gets rasterised to layer bounds
 * that do not include a 160px spread, which shows up as a bright rectangle.
 */
export default function Moon({ size = 118 }: { size?: number }) {
  const halo = size * 3.4
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: size * -0.18,
        right: size * -0.16,
        width: size,
        height: size,
        animation: 'moon-float 14s ease-in-out infinite',
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: (size - halo) / 2,
          top: (size - halo) / 2,
          width: halo,
          height: halo,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(247,214,140,.42) 0%, rgba(247,214,140,.22) 26%, rgba(247,214,140,.08) 48%, transparent 70%)',
        }}
      />
      <div className="moon" style={{ width: size, height: size, inset: 0, animation: 'none' }}>
        <span className="moon-crater" style={{ width: '17%', height: '17%', top: '30%', left: '52%' }} />
        <span className="moon-crater" style={{ width: '11%', height: '11%', top: '52%', left: '34%' }} />
        <span className="moon-crater" style={{ width: '13%', height: '13%', top: '58%', left: '62%' }} />
      </div>
    </div>
  )
}
