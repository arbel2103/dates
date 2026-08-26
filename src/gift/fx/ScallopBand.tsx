/**
 * The band of overlapping heart-lobes along the bottom of the red world. Two
 * rows at different depths give the horizon the softness the reference has —
 * one row alone reads as a repeating pattern rather than a hill of hearts.
 */
export default function ScallopBand({
  back = 'rgba(126,20,28,0.30)',
  front = 'rgba(158,28,36,0.24)',
  height = 108,
}: {
  back?: string
  front?: string
  height?: number
}) {
  return (
    <svg
      viewBox="0 0 120 30"
      preserveAspectRatio="none"
      aria-hidden
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height }}
    >
      <Row fill={back} y={13} step={8} r={4.4} />
      <Row fill={front} y={18} step={11} r={5.6} offset={4.5} />
    </svg>
  )
}

function Row({
  fill,
  y,
  step,
  r,
  offset = 0,
}: {
  fill: string
  y: number
  step: number
  r: number
  offset?: number
}) {
  const lobes = []
  for (let x = -step + offset; x < 132; x += step) {
    lobes.push(<circle key={x} cx={x} cy={y} r={r} fill={fill} />)
  }
  return (
    <g>
      {lobes}
      <rect x={-2} y={y} width={124} height={32 - y} fill={fill} />
    </g>
  )
}
