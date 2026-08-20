import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import FormField from "../../components/FormField";
import CloseBtn from "../../components/CloseBtn";
import doodlePattern from "../../assets/doodle-pattern.svg";

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  username: "",
  phoneNumber: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    const {
      firstName,
      lastName,
      username,
      phoneNumber,
      email,
      password,
      confirmPassword,
    } = form;
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !username.trim() ||
      !phoneNumber.trim() ||
      !email.trim() ||
      !password
    ) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }

    const payload = { ...form };
    delete payload.confirmPassword;

    setSubmitting(true);
    const result = await register(payload);
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
        className="card border-0 shadow-lg rounded-4 position-relative overflow-hidden"
        style={{ width: "100%", maxWidth: "520px", backgroundColor: "#ffffff" }}
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
              <i className="bi bi-person-plus-fill fs-4" />
            </span>
            <h2 className="card-title fw-bold text-dark mb-1">
              Create your Vibe account
            </h2>
            <p className="text-secondary small mb-0">Join the real-time conversation today</p>
          </div>

          {formError && (
            <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3" role="alert">
              <i className="bi bi-exclamation-circle-fill me-2" />
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="row g-2">
              <div className="col-12 col-md-6">
                <FormField
                  label="First name"
                  name="firstName"
                  value={form.firstName}
                  placeholder="e.g. Billie"
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-12 col-md-6">
                <FormField
                  label="Last name"
                  name="lastName"
                  value={form.lastName}
                  placeholder="e.g. Jean"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="row g-2">
              <div className="col-12 col-md-6">
                <FormField
                  label="Username"
                  name="username"
                  value={form.username}
                  placeholder="billiejean"
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-12 col-md-6">
                <FormField
                  label="Phone number"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  placeholder="123-456-7890"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <FormField
              label="Email address"
              type="email"
              name="email"
              value={form.email}
              placeholder="billiejean@example.com"
              onChange={handleChange}
              required
            />

            <div className="row g-2">
              <div className="col-12 col-md-6">
                <FormField
                  label="Password"
                  type="password"
                  name="password"
                  value={form.password}
                  placeholder="At least 6 chars"
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="col-12 col-md-6">
                <FormField
                  label="Confirm password"
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  placeholder="Re-enter password"
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {form.password && form.confirmPassword && (
              <div className="mb-2">
                {form.password === form.confirmPassword ? (
                  <span className="text-success extra-small d-flex align-items-center gap-1">
                    <i className="bi bi-check-circle-fill" /> Passwords match
                  </span>
                ) : (
                  <span className="text-danger extra-small d-flex align-items-center gap-1">
                    <i className="bi bi-x-circle-fill" /> Passwords do not match
                  </span>
                )}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-success w-100 py-2.5 rounded-pill shadow-sm mt-3"
              disabled={submitting}
            >
              {submitting ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" />
              ) : null}
              {submitting ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p className="text-center text-secondary small mt-4 mb-0">
            Already have an account?{" "}
            <Link to="/login" className="text-success fw-semibold text-decoration-none">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
