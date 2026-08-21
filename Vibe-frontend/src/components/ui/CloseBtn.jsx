import { useNavigate } from "react-router-dom";

export default function CloseBtn() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="btn-close position-absolute rounded-circle"
      style={{
        top: "-10px",
        right: "-10px",
        width: "1.6rem",
        height: "1.6rem",
        border: "1px solid rgba(0, 0, 0, 0.1)",
        backgroundColor: "rgb(255, 255, 255)",
        opacity: 1,
        zIndex: 999,
      }}
      aria-label="Close"
      onClick={() => navigate("/")}
    />
  );
}
