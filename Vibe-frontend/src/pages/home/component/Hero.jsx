export default function Hero({
  backgroundImage,
  children,
  minHeight = "100vh",
  overlay = true,
}) {
  return (
    <section
      style={{
        position: "relative",
        minHeight,
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      {/*
        Optional dark gradient overlay - makes text/navbar readable over a
        busy image without needing to darken the image file itself.
        Strongest at the top (where the navbar sits), fading down.
      */}
      {overlay && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0) 60%)",
            pointerEvents: "none",
          }}
        />
      )}

      {/*
        No "position: relative" here anymore - this div doesn't need its own
        containing block. The <section> above already provides one, so any
        position:absolute children (like your bottom-pinned buttons) now
        measure against the FULL hero height, not just this div's content height.
        z-index still works fine without "position" here since this is a flex
        item inside the section's flex container.
      */}
      <div style={{ zIndex: 1 }}>{children}</div>
    </section>
  );
}
