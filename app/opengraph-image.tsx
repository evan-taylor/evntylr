import { ImageResponse } from "next/og";
import { heroContent } from "@/features/home/content";
import { siteConfig } from "@/lib/site";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export const alt = `${siteConfig.name} website preview`;

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        background: "#0a0a0c",
        color: "#f1f1f3",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 24,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#8f9098",
        }}
      >
        {siteConfig.name}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "22px",
          maxWidth: "860px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 600,
            lineHeight: 1.05,
          }}
        >
          {siteConfig.title}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 34,
            lineHeight: 1.35,
            color: "#d1d1d7",
          }}
        >
          {siteConfig.description}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 26,
          color: "#8f9098",
        }}
      >
        <div style={{ display: "flex" }}>{heroContent.location}</div>
        <div style={{ display: "flex" }}>{heroContent.accent}</div>
      </div>
    </div>,
    size
  );
}
