import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  username: "",
  phoneNo: "",
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

    // Client-side checks before ever hitting the backend
    const {
      firstName,
      lastName,
      username,
      phoneNo,
      email,
      password,
      confirmPassword,
    } = form;
    if (
      !firstName ||
      !lastName ||
      !username ||
      !phoneNo ||
      !email ||
      !password
    ) {
      setFormError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    // Strip confirmPassword - backend doesn't expect it
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
    <div className="container d-flex justify-content-center align-items-center min-vh-100 py-5">
      <div
        className="card shadow-sm"
        style={{ width: "100%", maxWidth: "480px" }}
      >
        <div className="card-body p-4">
          <h2 className="card-title text-center mb-4">
            Create your Vibe account
          </h2>

          {formError && (
            <div className="alert alert-danger py-2" role="alert">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="row">
              <div className="col-6 mb-3">
                <label htmlFor="firstName" className="form-label">
                  First name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="firstName"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-6 mb-3">
                <label htmlFor="lastName" className="form-label">
                  Last name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="lastName"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                type="text"
                className="form-control"
                id="username"
                name="username"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="phoneNo" className="form-label">
                Phone number
              </label>
              <input
                type="tel"
                className="form-control"
                id="phoneNo"
                name="phoneNo"
                value={form.phoneNo}
                onChange={handleChange}
                required
              />
            </div>

            <div className="row">
              <div className="col-6 mb-3">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="col-6 mb-3">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm password
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 mt-2"
              disabled={submitting}
            >
              {submitting ? "Creating account..." : "Sign up"}
            </button>
          </form>

          <p className="text-center mt-3 mb-0">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
