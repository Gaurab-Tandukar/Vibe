import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import FormField from "../../components/FormField";
import CloseBtn from "../../components/CloseBtn";

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
        className="card shadow-sm position-relative"
        style={{ width: "100%", maxWidth: "480px" }}
      >
        <CloseBtn />
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
              <FormField
                label="First name"
                name="firstName"
                value={form.firstName}
                placeholder="Billie"
                onChange={handleChange}
                required
              />
              <FormField
                label="Last name"
                name="lastName"
                value={form.lastName}
                placeholder="Jean"
                onChange={handleChange}
                required
              />
            </div>

            <FormField
              label="Username"
              name="username"
              value={form.username}
              placeholder="BillieJeanNotMyLover"
              onChange={handleChange}
              required
            />

            <FormField
              label="Email"
              type="email"
              name="email"
              value={form.email}
              placeholder="billiejean10@example.com"
              onChange={handleChange}
              required
            />

            <FormField
              label="Phone number"
              name="phoneNo"
              value={form.phoneNo}
              placeholder="123-456-7890"
              onChange={handleChange}
              required
            />

            <div className="row">
              <FormField
                label="Password"
                type="password"
                name="password"
                value={form.password}
                placeholder="********"
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
              <FormField
                label="Confirm password"
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                placeholder="********"
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
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
