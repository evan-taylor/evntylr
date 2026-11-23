import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

const INK = "#1d1a17";
const FADED = "rgba(29, 26, 23, 0.32)";

// The wheel, drawn at the same proportions as app/icon.svg: one selected row
// between two that are turning away. iOS rounds the corners itself.
const rows = [
  { width: 62, height: 17, color: FADED },
  { width: 96, height: 28, color: INK },
  { width: 79, height: 17, color: FADED },
];

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 17,
        paddingLeft: 42,
        background: "#f8f7f4",
      }}
    >
      {rows.map((row) => (
        <div
          key={row.width}
          style={{
            width: row.width,
            height: row.height,
            borderRadius: 999,
            background: row.color,
          }}
        />
      ))}
    </div>,
    size
  );
}
