import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import FormField from "../../components/FormField";
import Button from "../../components/Button";
import CloseBtn from "../../components/CloseBtn";

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

    if (!form.username || !form.password) {
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
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div
        className="card shadow-sm  position-relative"
        style={{ width: "100%", maxWidth: "400px" }}
      >
        <CloseBtn />
        <div className="card-body p-4">
          <h2 className="card-title text-center mb-4">Log in to Vibe</h2>

          {formError && (
            <div className="alert alert-danger py-2" role="alert">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <FormField
              label="Username"
              name="username"
              value={form.username}
              placeholder="BillieJeanNotMyLover"
              onChange={handleChange}
              autoComplete="username"
              required
            />

            <FormField
              label="Password"
              type="password"
              name="password"
              value={form.password}
              placeholder="********"
              onChange={handleChange}
              autoComplete="current-password"
              required
            />

            <Button type="submit" className="w-100" disabled={submitting}>
              {submitting ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <p className="text-center mt-3 mb-0">
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
