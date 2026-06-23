import type { CanvasNodeShape } from "@/types/canvas"

interface NodeShapeSurfaceProps {
  color: string
  selected?: boolean
  shape: CanvasNodeShape
}

export function NodeShapeSurface({
  color,
  selected = false,
  shape,
}: NodeShapeSurfaceProps) {
  const stroke = selected
    ? "rgba(255, 255, 255, 0.35)"
    : "rgba(255, 255, 255, 0.1)"

  if (shape === "rectangle" || shape === "pill" || shape === "circle") {
    const borderRadius =
      shape === "circle" ? "50%" : shape === "pill" ? "9999px" : "0.25rem"

    return (
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: color,
          border: `1px solid ${stroke}`,
          borderRadius,
        }}
      />
    )
  }

  if (shape === "diamond") {
    return (
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full overflow-visible"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <polygon
          points="50,1 99,50 50,99 1,50"
          fill={color}
          stroke={stroke}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    )
  }

  if (shape === "hexagon") {
    return (
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full overflow-visible"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <polygon
          points="25,1 75,1 99,50 75,99 25,99 1,50"
          fill={color}
          stroke={stroke}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    )
  }

  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 h-full w-full overflow-visible"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      <ellipse
        cx="50"
        cy="86"
        rx="48"
        ry="13"
        fill={color}
        stroke={stroke}
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <rect x="2" y="14" width="96" height="72" fill={color} />
      <path
        d="M2 14v72M98 14v72"
        fill="none"
        stroke={stroke}
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <ellipse
        cx="50"
        cy="14"
        rx="48"
        ry="13"
        fill={color}
        stroke={stroke}
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
