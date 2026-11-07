import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Zarbia Atlas — tapis marocains faits main, pièces uniques tissées dans l’Atlas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social card used by every page that does not provide its own. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "linear-gradient(135deg, #1C1712 0%, #2A211B 55%, #3A2A1E 100%)",
          color: "#FAF6F0",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -120,
            top: -120,
            width: 420,
            height: 420,
            borderRadius: 9999,
            border: "1px solid rgba(176,141,87,0.35)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -40,
            top: -40,
            width: 260,
            height: 260,
            borderRadius: 9999,
            background: "rgba(176,141,87,0.12)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 9999,
              border: "1px solid rgba(176,141,87,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#C9A875",
              fontSize: 26,
              fontFamily: "serif",
            }}
          >
            Z
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              letterSpacing: 6,
              fontSize: 18,
              textTransform: "uppercase",
              color: "rgba(250,246,240,0.75)",
            }}
          >
            <span>Zarbia Atlas</span>
            <span style={{ fontSize: 12, letterSpacing: 4, color: "#B08D57" }}>
              Aït Bouguemez · Maroc
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              width: 92,
              height: 1,
              background: "#B08D57",
              marginBottom: 34,
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 74,
              lineHeight: 1.04,
              fontFamily: "serif",
              maxWidth: 900,
              letterSpacing: -1.5,
            }}
          >
            Des tapis qui portent une histoire.
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 24,
              color: "rgba(250,246,240,0.62)",
              maxWidth: 820,
            }}
          >
            Pièces uniques tissées main dans l’Atlas · Certificat d’origine ·
            Livraison internationale
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(250,246,240,0.12)",
            paddingTop: 24,
            fontSize: 16,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "rgba(250,246,240,0.5)",
          }}
        >
          <span>Laine vierge · Teintures végétales</span>
          <span style={{ color: "#C9A875" }}>zarbia-atlas.ma</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
