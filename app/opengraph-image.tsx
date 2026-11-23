import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { experienceItems, heroContent } from "@/features/home/content";
import { siteConfig } from "@/lib/site";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export const alt = `${siteConfig.name}, software developer. A picker wheel with his name selected, between Soljio and Taylored Instruction.`;

// The same palette and wheel maths as the home page, so the card is the site at a glance.
const COLOR = {
  background: "#f8f7f4",
  ink: "#1d1a17",
  soft: "#47433f",
  muted: "#6b6762",
};
const MARGIN = 88;
const ROW_HEIGHT = 112;
const NAME_SIZE = 104;
const TURN_DEGREES = 26;
const SHRINK_PER_STEP = 0.07;
const OPACITY_BY_STEP = [1, 0.5, 0.16];

const loadFont = (file: string) =>
  readFile(join(process.cwd(), "assets/fonts", file));

// Rows in wheel order, top to bottom. The two beside the name are the two he founded.
const ROWS_ABOVE = ["hovn", "soljio"];
const ROWS_BELOW = ["taylored", "codebox"];

const labelFor = (id: string) => {
  const item = experienceItems.find((entry) => entry.id === id);
  if (!item) {
    throw new Error(`Share image: no experience item with id "${id}"`);
  }
  return item.label ?? item.organization;
};

function wheelRows() {
  const above = ROWS_ABOVE.map(labelFor);
  const below = ROWS_BELOW.map(labelFor);
  return [...above, heroContent.name, ...below].map((text, index) => {
    const steps = Math.abs(index - above.length);
    const scale = 1 - steps * SHRINK_PER_STEP;
    const turn = Math.cos((steps * TURN_DEGREES * Math.PI) / 180);
    return {
      text,
      opacity: OPACITY_BY_STEP[steps] ?? 0,
      // Rows get smaller and flatter as they turn away, as they do on the site.
      fontSize: Math.round(NAME_SIZE * scale),
      transform: `scale(1, ${turn})`,
    };
  });
}

export default async function OpenGraphImage() {
  const [regular, semibold] = await Promise.all([
    loadFont("Inter-Regular.ttf"),
    loadFont("Inter-SemiBold.ttf"),
  ]);
  const host = new URL(siteConfig.url).host;

  return new ImageResponse(
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        padding: `0 ${MARGIN}px`,
        background: COLOR.background,
        color: COLOR.ink,
        fontFamily: "Inter",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        {wheelRows().map((row) => (
          <div
            key={row.text}
            style={{
              display: "flex",
              alignItems: "center",
              height: ROW_HEIGHT,
              fontSize: row.fontSize,
              fontWeight: 600,
              letterSpacing: "-0.04em",
              whiteSpace: "nowrap",
              opacity: row.opacity,
              transform: row.transform,
            }}
          >
            {row.text}
          </div>
        ))}
      </div>

      {/* The selected row reads across, like a row on the site: name, then what he does. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: MARGIN,
          height: "100%",
          display: "flex",
          alignItems: "center",
          fontSize: 34,
          letterSpacing: "-0.01em",
          color: COLOR.soft,
        }}
      >
        {heroContent.role}
      </div>

      <div
        style={{
          position: "absolute",
          top: 56,
          right: MARGIN,
          display: "flex",
          fontSize: 26,
          color: COLOR.muted,
        }}
      >
        {host}
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Inter", data: regular, weight: 400, style: "normal" },
        { name: "Inter", data: semibold, weight: 600, style: "normal" },
      ],
    }
  );
}
