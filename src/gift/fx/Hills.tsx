/** The dark scalloped horizon the night world sits on. */
export default function Hills({ height = 120 }: { height?: number }) {
  const lobes = []
  for (let x = -6; x < 132; x += 11) {
    lobes.push(<circle key={x} cx={x} cy={13} r={7.2} fill="#150F20" />)
  }
  return (
    <svg
      viewBox="0 0 120 30"
      preserveAspectRatio="none"
      aria-hidden
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height }}
    >
      {lobes}
      <rect x={-2} y={13} width={124} height={20} fill="#150F20" />
    </svg>
  )
}
