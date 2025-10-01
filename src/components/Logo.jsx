export default function Logo({ width = 180, height = 40 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 180 40"
    >
      <text
        x="0"
        y="28"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="32"
        fontWeight="bold"
      >
        <tspan fill="#2A2A86">shop</tspan>
        <tspan fill="#FCAF17">now</tspan>
      </text>
    </svg>
  );
}
