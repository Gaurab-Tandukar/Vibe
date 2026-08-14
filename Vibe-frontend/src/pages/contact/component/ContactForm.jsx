import { useState } from "react";
import FormField from "../../../components/FormField";
import Button from "../../../components/Button";

const INITIAL_FORM = { name: "", email: "", message: "" };

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

    if (!form.name || !form.email || !form.message) {
      setFormError("Please fill in all fields.");
      return;
    }

    setSubmitting(true);

    // No backend /contact endpoint exists yet - simulating success for now.
    // Once you add a real route, replace this with an actual API call,
    // e.g. await axiosInstance.post("/contact", form);
    await new Promise((resolve) => setTimeout(resolve, 600));

    setSubmitting(false);
    setSent(true);
    setForm(INITIAL_FORM);
  }

  if (sent) {
    return (
      <div className="text-center" style={{ maxWidth: "400px" }}>
        <h3 className="mb-2">Message sent!</h3>
        <p className="text-muted mb-3">
          Thanks for reaching out - we'll get back to you soon.
        </p>
        <Button onClick={() => setSent(false)}>Send another message</Button>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: "400px" }}>
      <h2 className="mb-4">Get in touch</h2>

      {formError && (
        <div className="alert alert-danger py-2" role="alert">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="Name"
          name="name"
          value={form.name}
          placeholder="Your name"
          onChange={handleChange}
          autoComplete="name"
          required
        />

        <FormField
          label="Email"
          type="email"
          name="email"
          value={form.email}
          placeholder="you@example.com"
          onChange={handleChange}
          autoComplete="email"
          required
        />

        {/* FormField renders <input>, so the multi-line message field is
            built directly here instead, matching the same label/spacing pattern. */}
        <div className="mb-3">
          <label htmlFor="message" className="form-label">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            className="form-control"
            rows="4"
            placeholder="What's on your mind?"
            value={form.message}
            onChange={handleChange}
            required
          />
        </div>

        <Button type="submit" className="w-100" disabled={submitting}>
          {submitting ? "Sending..." : "Send message"}
        </Button>
      </form>
    </div>
  );
}
