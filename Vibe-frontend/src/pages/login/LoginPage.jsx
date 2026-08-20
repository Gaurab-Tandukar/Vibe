import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import FormField from "../../components/FormField";
import Button from "../../components/Button";
import CloseBtn from "../../components/CloseBtn";
import doodlePattern from "../../assets/doodle-pattern.svg";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!form.username.trim() || !form.password) {
      setFormError("Enter your username and password.");
      return;
    }

    setSubmitting(true);
    const result = await login(form);
    setSubmitting(false);

    if (result.success) {
      navigate("/profile");
    } else {
      setFormError(result.message);
    }
  }

  return (
    <div
      className="container-fluid d-flex justify-content-center align-items-center min-vh-100 py-5"
      style={{
        backgroundColor: "#eef3ea",
        backgroundImage: `url(${doodlePattern})`,
        backgroundRepeat: "repeat",
        backgroundSize: "320px 320px",
      }}
    >
      <div
        className="card border-0 shadow-lg rounded-4 position-relative"
        style={{ width: "100%", maxWidth: "440px", backgroundColor: "#ffffff" }}
      >
        <CloseBtn />
        <div className="card-body p-4 p-sm-5">
          <div className="text-center mb-4">
            <span
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-2"
              style={{
                width: 48,
                height: 48,
                backgroundColor: "rgba(45, 106, 79, 0.12)",
                color: "#2d6a4f",
              }}
            >
              <i className="bi bi-box-arrow-in-right fs-4" />
            </span>
            <h2 className="card-title fw-bold text-dark mb-1">
              Welcome back to Vibe
            </h2>
            <p className="text-secondary small mb-0">Enter your credentials to access your chats</p>
          </div>

          {formError && (
            <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3" role="alert">
              <i className="bi bi-exclamation-circle-fill me-2" />
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <FormField
              label="Username or Email"
              name="username"
              value={form.username}
              placeholder="e.g. BillieJeanNotMyLover"
              onChange={handleChange}
              autoComplete="username"
              required
            />

            <FormField
              label="Password"
              type="password"
              name="password"
              value={form.password}
              placeholder="••••••••"
              onChange={handleChange}
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              className="w-100 py-2.5 rounded-pill shadow-sm mt-3"
              disabled={submitting}
            >
              {submitting ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" />
              ) : null}
              {submitting ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <p className="text-center text-secondary small mt-4 mb-0">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-success fw-semibold text-decoration-none">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
