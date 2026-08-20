import { useState } from "react";
import FormField from "../../../components/FormField";
import Button from "../../../components/Button";

const INITIAL_FORM = { name: "", email: "", subject: "General Inquiry", message: "" };

export default function ContactForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [sent, setSent] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setFormError("Please fill in your name, email, and message.");
      return;
    }

    setSubmitting(true);
    // Simulate quick dispatch
    await new Promise((resolve) => setTimeout(resolve, 600));

    setSubmitting(false);
    setSent(true);
    setForm(INITIAL_FORM);
  }

  if (sent) {
    return (
      <div className="contact-form-container text-center d-flex flex-column justify-content-center align-items-center py-5">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center mb-3 shadow-sm"
          style={{
            width: 64,
            height: 64,
            backgroundColor: "rgba(34, 197, 94, 0.15)",
            color: "#16a34a",
          }}
        >
          <i className="bi bi-check2-circle fs-1" />
        </div>
        <h3 className="fw-bold text-dark mb-2">Message Dispatched!</h3>
        <p className="text-secondary mb-4 small" style={{ maxWidth: 300 }}>
          Thank you for reaching out to the Vibe team. We&apos;ve received your note and will get back to you shortly.
        </p>
        <Button onClick={() => setSent(false)} className="px-4 rounded-pill">
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <div className="contact-form-container">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Send a Message</h3>
          <p className="text-secondary small mb-0">Fill out the form below and we&apos;ll be in touch.</p>
        </div>
        <span
          className="rounded-circle d-flex align-items-center justify-content-center shadow-xs"
          style={{
            width: 40,
            height: 40,
            backgroundColor: "rgba(45, 106, 79, 0.1)",
            color: "#2d6a4f",
          }}
        >
          <i className="bi bi-send-fill fs-5" />
        </span>
      </div>

      {formError && (
        <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3" role="alert">
          <i className="bi bi-exclamation-circle-fill me-2" />
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="row g-3 mb-3">
          <div className="col-12 col-sm-6">
            <FormField
              label="Your Name"
              name="name"
              value={form.name}
              placeholder="e.g. Alex Carter"
              onChange={handleChange}
              autoComplete="name"
              required
            />
          </div>
          <div className="col-12 col-sm-6">
            <FormField
              label="Email Address"
              type="email"
              name="email"
              value={form.email}
              placeholder="you@example.com"
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="subject" className="form-label small fw-semibold text-secondary mb-1">
            Topic / Subject
          </label>
          <select
            id="subject"
            name="subject"
            className="form-select"
            value={form.subject}
            onChange={handleChange}
          >
            <option value="General Inquiry">General Inquiry</option>
            <option value="Feedback & Feature Request">Feedback &amp; Feature Request</option>
            <option value="Bug Report">Bug Report</option>
            <option value="Collaboration & Partnership">Collaboration &amp; Partnership</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="message" className="form-label small fw-semibold text-secondary mb-1">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            className="form-control"
            rows="4"
            placeholder="Tell us what you have in mind or describe your inquiry..."
            value={form.message}
            onChange={handleChange}
            required
          />
        </div>

        <Button type="submit" className="w-100 py-2.5 rounded-pill shadow-sm" disabled={submitting}>
          {submitting ? (
            <span className="spinner-border spinner-border-sm me-2" role="status" />
          ) : (
            <i className="bi bi-send me-2" />
          )}
          {submitting ? "Transmitting..." : "Send Message"}
        </Button>
      </form>

      <style>{`
        .contact-form-container {
          width: 100%;
          max-width: 540px;
          background-color: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 24px;
          padding: 2.25rem;
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.06);
        }

        @media (max-width: 575px) {
          .contact-form-container {
            padding: 1.5rem;
            border-radius: 18px;
          }
        }
      `}</style>
    </div>
  );
}
