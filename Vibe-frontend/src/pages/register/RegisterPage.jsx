import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import FormField from "../../components/ui/FormField";
import CloseBtn from "../../components/ui/CloseBtn";
import doodlePattern from "../../assets/doodle-pattern.svg";

// ── Validation rules ──
const makeValidators = (form) => ({
  firstName: (v) =>
    !v.trim()
      ? "First name is required."
      : v.trim().length < 2
        ? "At least 2 characters."
        : "",
  lastName: (v) =>
    !v.trim()
      ? "Last name is required."
      : v.trim().length < 2
        ? "At least 2 characters."
        : "",
  username: (v) =>
    !v.trim()
      ? "Username is required."
      : v.trim().length < 3
        ? "At least 3 characters."
        : !/^[a-zA-Z0-9_]+$/.test(v.trim())
          ? "Only letters, numbers, and underscores."
          : "",
  phoneNumber: (v) =>
    !v.trim()
      ? "Phone number is required."
      : v.replace(/\D/g, "").length < 7
        ? "Enter a valid phone number (min 7 digits)."
        : "",
  email: (v) =>
    !v.trim()
      ? "Email is required."
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
        ? "Enter a valid email address."
        : "",
  password: (v) =>
    !v
      ? "Password is required."
      : v.length < 6
        ? "Minimum 6 characters."
        : "",
  confirmPassword: (v) =>
    !v
      ? "Please confirm your password."
      : v !== form.password
        ? "Passwords do not match."
        : "",
});

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  username: "",
  phoneNumber: "",
  email: "",
  password: "",
  confirmPassword: "",
  agreeToTerms: false,
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const validators = makeValidators(form);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  const handleBlur = useCallback((e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  }, []);

  function getError(field) {
    return validators[field]?.(form[field]) || "";
  }

  const fieldKeys = Object.keys(validators);
  const allFieldsValid = fieldKeys.every((k) => !getError(k));
  const allValid = allFieldsValid && form.agreeToTerms;

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    // Mark everything touched
    const allTouched = {};
    fieldKeys.forEach((k) => (allTouched[k] = true));
    setTouched(allTouched);

    if (!allFieldsValid) return;

    if (!form.agreeToTerms) {
      setFormError("You must agree to the Terms and Conditions to register.");
      return;
    }

    const payload = { ...form };
    delete payload.confirmPassword;
    delete payload.agreeToTerms;

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
        className="card border-0 shadow-lg rounded-4 position-relative"
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
            <p className="text-secondary small mb-0">
              Join the real-time conversation today
            </p>
          </div>

          {formError && (
            <div
              className="alert alert-danger py-2 px-3 small rounded-3 mb-3"
              role="alert"
            >
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
                  onBlur={handleBlur}
                  required
                  touched={touched.firstName}
                  error={getError("firstName")}
                />
              </div>
              <div className="col-12 col-md-6">
                <FormField
                  label="Last name"
                  name="lastName"
                  value={form.lastName}
                  placeholder="e.g. Jean"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  touched={touched.lastName}
                  error={getError("lastName")}
                />
              </div>
            </div>

            <div className="row g-2">
              <div className="col-12 col-md-6">
                <FormField
                  label="Username"
                  name="username"
                  value={form.username}
                  placeholder="BillieJeanNotMyLover"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  touched={touched.username}
                  error={getError("username")}
                />
              </div>
              <div className="col-12 col-md-6">
                <FormField
                  label="Phone number"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  placeholder="123-456-7890"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  touched={touched.phoneNumber}
                  error={getError("phoneNumber")}
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
              onBlur={handleBlur}
              required
              touched={touched.email}
              error={getError("email")}
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
                  onBlur={handleBlur}
                  autoComplete="new-password"
                  required
                  touched={touched.password}
                  error={getError("password")}
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
                  onBlur={handleBlur}
                  autoComplete="new-password"
                  required
                  touched={touched.confirmPassword}
                  error={getError("confirmPassword")}
                />
              </div>
            </div>

            {/* Password match indicator */}
            {form.password && form.confirmPassword && (
              <div className="mb-2">
                {form.password === form.confirmPassword ? (
                  <span className="field-valid-msg">
                    <i className="bi bi-check-circle-fill" /> Passwords match
                  </span>
                ) : (
                  <span className="field-error-msg">
                    <i className="bi bi-x-circle-fill" style={{ fontSize: "0.72rem" }} /> Passwords do not match
                  </span>
                )}
              </div>
            )}

            {/* Terms and Conditions Checkbox */}
            <div className="form-check mt-3 mb-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="agreeToTerms"
                name="agreeToTerms"
                checked={form.agreeToTerms}
                onChange={handleChange}
              />
              <label
                className="form-check-label text-secondary small"
                htmlFor="agreeToTerms"
              >
                I agree to the{" "}
                <Link
                  to="/terms"
                  target="_blank"
                  className="text-success fw-semibold text-decoration-none"
                >
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  target="_blank"
                  className="text-success fw-semibold text-decoration-none"
                >
                  Privacy Policy
                </Link>
                .
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-success w-100 py-2.5 rounded-pill shadow-sm mt-2"
              disabled={submitting || !allValid}
            >
              {submitting ? (
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                />
              ) : null}
              {submitting ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p className="text-center text-secondary small mt-4 mb-0">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-success fw-semibold text-decoration-none"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
