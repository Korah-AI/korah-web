import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/* ── helpers ── */
const fade = (frame: number, inAt: number, outAt: number, dur = 15) =>
  interpolate(
    frame,
    [inAt, inAt + dur, outAt - dur, outAt],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

const slideUp = (frame: number, inAt: number, px = 60, dur = 20) =>
  interpolate(frame, [inAt, inAt + dur], [px, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const scaleIn = (frame: number, fps: number, delay: number) =>
  spring({ frame: frame - delay, fps, config: { damping: 12, mass: 0.8 } });

/* ── styles ── */
const font: React.CSSProperties = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontWeight: 700,
  letterSpacing: "-0.03em",
};

const gradient =
  "linear-gradient(135deg, #7c3aed 0%, #a855f7 40%, #c084fc 100%)";

const subtleGlow = (color: string, size = 120) =>
  `0 0 ${size}px ${color}, 0 0 ${size * 2}px ${color}`;

/* ── SCENES ── */

/** Scene 1 – Logo reveal (0 → 3.5s = 0–105) */
const LogoReveal: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const logoScale = scaleIn(frame, fps, 10);
  const logoOpacity = fade(frame, 0, 105, 20);
  const textOpacity = fade(frame, 25, 105, 15);
  const textY = slideUp(frame, 25, 30, 20);
  const glowOpacity = interpolate(frame, [0, 40], [0, 0.6], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "#000",
        justifyContent: "center",
        alignItems: "center",
        opacity: logoOpacity,
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)",
          opacity: glowOpacity,
          filter: "blur(60px)",
        }}
      />
      <Img
        src={staticFile("logo.png")}
        style={{
          width: 180,
          height: 180,
          transform: `scale(${logoScale})`,
          filter: `drop-shadow(0 0 40px rgba(139,92,246,0.5))`,
        }}
      />
      <div
        style={{
          ...font,
          fontSize: 72,
          color: "#fff",
          marginTop: 24,
          transform: `translateY(${textY}px)`,
          opacity: textOpacity,
        }}
      >
        Korah
      </div>
      <div
        style={{
          ...font,
          fontSize: 18,
          fontWeight: 500,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          background: gradient,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginTop: 8,
          transform: `translateY(${textY}px)`,
          opacity: textOpacity,
        }}
      >
        Study Smarter
      </div>
    </AbsoluteFill>
  );
};

/** Scene 2 – "Introducing SAT Math Chat" (3.5→7s = 105–210) */
const Introducing: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const sceneFrame = frame - 105;
  const containerOpacity = fade(frame, 105, 210, 18);

  const introOpacity = fade(frame, 110, 210, 12);
  const introY = slideUp(frame, 110, 40, 22);

  const titleScale = scaleIn(frame, fps, 140);
  const titleOpacity = fade(frame, 135, 210, 15);

  const lineWidth = interpolate(sceneFrame, [50, 75], [0, 300], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "#000",
        justifyContent: "center",
        alignItems: "center",
        opacity: containerOpacity,
      }}
    >
      <div
        style={{
          ...font,
          fontSize: 24,
          fontWeight: 400,
          color: "rgba(255,255,255,0.5)",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          transform: `translateY(${introY}px)`,
          opacity: introOpacity,
        }}
      >
        Introducing
      </div>
      <div
        style={{
          ...font,
          fontSize: 80,
          fontWeight: 900,
          color: "#fff",
          marginTop: 12,
          transform: `scale(${titleScale})`,
          opacity: titleOpacity,
          textShadow: "0 0 80px rgba(139,92,246,0.4)",
        }}
      >
        SAT Math Chat
      </div>
      <div
        style={{
          width: lineWidth,
          height: 3,
          background: gradient,
          borderRadius: 2,
          marginTop: 20,
          opacity: titleOpacity,
        }}
      />
      <div
        style={{
          ...font,
          fontSize: 22,
          fontWeight: 400,
          color: "rgba(255,255,255,0.55)",
          marginTop: 20,
          opacity: titleOpacity,
        }}
      >
        AI tutoring meets interactive graphing
      </div>
    </AbsoluteFill>
  );
};

/** Scene 3 – Feature: Interactive Graphing (7→11s = 210–330) */
const FeatureGraphing: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const containerOpacity = fade(frame, 210, 330, 18);
  const imgScale = scaleIn(frame, fps, 220);
  const imgOpacity = fade(frame, 215, 330, 15);
  const textOpacity = fade(frame, 235, 330, 15);
  const textY = slideUp(frame, 235, 30, 20);

  // Subtle float animation on the image
  const floatY = Math.sin((frame - 210) * 0.06) * 4;

  return (
    <AbsoluteFill
      style={{
        background: "#000",
        opacity: containerOpacity,
      }}
    >
      {/* Purple gradient bg accent */}
      <div
        style={{
          position: "absolute",
          top: -200,
          right: -200,
          width: 800,
          height: 800,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 60%)",
          filter: "blur(80px)",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: "0 80px",
          gap: 60,
        }}
      >
        {/* Screenshot */}
        <div
          style={{
            transform: `scale(${imgScale}) translateY(${floatY}px)`,
            opacity: imgOpacity,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: subtleGlow("rgba(139,92,246,0.15)", 60),
            border: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
          }}
        >
          <Img
            src={staticFile("desmos1.png")}
            style={{ width: 560, display: "block" }}
          />
        </div>

        {/* Text */}
        <div
          style={{
            transform: `translateY(${textY}px)`,
            opacity: textOpacity,
            maxWidth: 420,
          }}
        >
          <div
            style={{
              ...font,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              background: gradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: 12,
            }}
          >
            Live Desmos Integration
          </div>
          <div
            style={{
              ...font,
              fontSize: 44,
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.15,
            }}
          >
            Interactive
            <br />
            Graphing
          </div>
          <div
            style={{
              ...font,
              fontSize: 18,
              fontWeight: 400,
              color: "rgba(255,255,255,0.5)",
              marginTop: 16,
              lineHeight: 1.5,
            }}
          >
            Visualize equations, find intersections, and explore functions in
            real time.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Scene 4 – Feature: AI Regressions (11→15s = 330–450) */
const FeatureRegressions: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const containerOpacity = fade(frame, 330, 450, 18);
  const imgScale = scaleIn(frame, fps, 340);
  const imgOpacity = fade(frame, 335, 450, 15);
  const textOpacity = fade(frame, 355, 450, 15);
  const textY = slideUp(frame, 355, 30, 20);
  const floatY = Math.sin((frame - 330) * 0.06) * 4;

  return (
    <AbsoluteFill
      style={{
        background: "#000",
        opacity: containerOpacity,
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: -200,
          left: -200,
          width: 800,
          height: 800,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 60%)",
          filter: "blur(80px)",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: "0 80px",
          gap: 60,
          flexDirection: "row-reverse",
        }}
      >
        <div
          style={{
            transform: `scale(${imgScale}) translateY(${floatY}px)`,
            opacity: imgOpacity,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: subtleGlow("rgba(168,85,247,0.15)", 60),
            border: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
          }}
        >
          <Img
            src={staticFile("desmos3.png")}
            style={{ width: 520, display: "block" }}
          />
        </div>

        <div
          style={{
            transform: `translateY(${textY}px)`,
            opacity: textOpacity,
            maxWidth: 420,
          }}
        >
          <div
            style={{
              ...font,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              background: gradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: 12,
            }}
          >
            AI-Powered
          </div>
          <div
            style={{
              ...font,
              fontSize: 44,
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.15,
            }}
          >
            Instant
            <br />
            Regressions
          </div>
          <div
            style={{
              ...font,
              fontSize: 18,
              fontWeight: 400,
              color: "rgba(255,255,255,0.5)",
              marginTop: 16,
              lineHeight: 1.5,
            }}
          >
            Linear, quadratic, exponential. Ask Korah and watch the best-fit
            curve appear.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Scene 5 – Feature: Solve Visually (15→17.5s = 450–525) */
const FeatureSolve: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const containerOpacity = fade(frame, 450, 525, 15);
  const imgScale = scaleIn(frame, fps, 455);
  const imgOpacity = fade(frame, 453, 525, 12);
  const textOpacity = fade(frame, 468, 525, 12);
  const textY = slideUp(frame, 468, 30, 18);
  const floatY = Math.sin((frame - 450) * 0.07) * 3;

  return (
    <AbsoluteFill
      style={{
        background: "#000",
        opacity: containerOpacity,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 1000,
          height: 1000,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 60%)",
          filter: "blur(100px)",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: "0 80px",
          gap: 60,
        }}
      >
        <div
          style={{
            transform: `scale(${imgScale}) translateY(${floatY}px)`,
            opacity: imgOpacity,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: subtleGlow("rgba(124,58,237,0.15)", 60),
            border: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
          }}
        >
          <Img
            src={staticFile("desmos2.png")}
            style={{ width: 480, display: "block" }}
          />
        </div>

        <div
          style={{
            transform: `translateY(${textY}px)`,
            opacity: textOpacity,
            maxWidth: 440,
          }}
        >
          <div
            style={{
              ...font,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              background: gradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: 12,
            }}
          >
            Skip the Algebra
          </div>
          <div
            style={{
              ...font,
              fontSize: 44,
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.15,
            }}
          >
            Solve Problems
            <br />
            Visually
          </div>
          <div
            style={{
              ...font,
              fontSize: 18,
              fontWeight: 400,
              color: "rgba(255,255,255,0.5)",
              marginTop: 16,
              lineHeight: 1.5,
            }}
          >
            Graph both sides. Find intersections. Get the answer faster than
            anyone else in the room.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Scene 6 – Closing (17.5→20s = 525–600) */
const Closing: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const containerOpacity = fade(frame, 525, 610, 15);
  const logoScale = scaleIn(frame, fps, 530);
  const textOpacity = fade(frame, 545, 610, 12);
  const textY = slideUp(frame, 545, 25, 18);
  const urlOpacity = fade(frame, 558, 610, 10);
  const urlY = slideUp(frame, 558, 20, 15);

  const glowPulse =
    0.3 + 0.15 * Math.sin((frame - 525) * 0.08);

  return (
    <AbsoluteFill
      style={{
        background: "#000",
        justifyContent: "center",
        alignItems: "center",
        opacity: containerOpacity,
      }}
    >
      {/* Pulsing glow */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 65%)",
          opacity: glowPulse,
          filter: "blur(80px)",
        }}
      />

      <Img
        src={staticFile("logo.png")}
        style={{
          width: 120,
          height: 120,
          transform: `scale(${logoScale})`,
          filter: "drop-shadow(0 0 30px rgba(139,92,246,0.5))",
        }}
      />

      <div
        style={{
          ...font,
          fontSize: 52,
          fontWeight: 800,
          color: "#fff",
          marginTop: 20,
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
        }}
      >
        Korah
      </div>

      <div
        style={{
          ...font,
          fontSize: 22,
          fontWeight: 500,
          color: "rgba(255,255,255,0.45)",
          marginTop: 8,
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
        }}
      >
        Your AI study companion
      </div>

      {/* Divider */}
      <div
        style={{
          width: 60,
          height: 2,
          background: gradient,
          borderRadius: 1,
          marginTop: 28,
          opacity: urlOpacity,
        }}
      />

      <div
        style={{
          ...font,
          fontSize: 28,
          fontWeight: 600,
          marginTop: 20,
          background: gradient,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          opacity: urlOpacity,
          transform: `translateY(${urlY}px)`,
          letterSpacing: "0.02em",
        }}
      >
        korah.app
      </div>
    </AbsoluteFill>
  );
};

/* ── MAIN COMPOSITION ── */
export const MyComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* Scenes layered – opacity handles transitions */}
      {frame < 115 && <LogoReveal frame={frame} fps={fps} />}
      {frame >= 100 && frame < 220 && (
        <Introducing frame={frame} fps={fps} />
      )}
      {frame >= 200 && frame < 340 && (
        <FeatureGraphing frame={frame} fps={fps} />
      )}
      {frame >= 320 && frame < 460 && (
        <FeatureRegressions frame={frame} fps={fps} />
      )}
      {frame >= 440 && frame < 535 && (
        <FeatureSolve frame={frame} fps={fps} />
      )}
      {frame >= 520 && <Closing frame={frame} fps={fps} />}
    </AbsoluteFill>
  );
};
