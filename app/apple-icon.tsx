import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0c",
          borderRadius: "44px",
          border: "4px solid rgba(255,255,255,0.12)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 78,
            height: 92,
            display: "flex",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 16,
              borderRadius: 999,
              background: "#f1f1f3",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 78,
              height: 16,
              borderRadius: 999,
              background: "#f1f1f3",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 38,
              width: 62,
              height: 16,
              borderRadius: 999,
              background: "#f1f1f3",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              width: 78,
              height: 16,
              borderRadius: 999,
              background: "#f1f1f3",
            }}
          />
        </div>
      </div>
    ),
    size
  );
}
