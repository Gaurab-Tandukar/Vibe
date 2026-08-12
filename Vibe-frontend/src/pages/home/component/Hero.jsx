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

      {/* Content (Navbar + hero text) renders above the overlay */}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </section>
  );
}
