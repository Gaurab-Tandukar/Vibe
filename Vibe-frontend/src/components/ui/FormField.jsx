import { useState } from "react";

export default function FormInput({
  label,
  type = "text",
  name,
  value,
  placeholder,
  onChange,
  onBlur,
  autoComplete,
  required = false,
  error,
  touched,
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  let validationClass = "";
  if (touched !== undefined && touched) {
    validationClass = error ? "is-invalid-custom" : "is-valid-custom";
  }

  return (
    <div className="mb-3">
      <label htmlFor={name} className="form-label">
        {label}
      </label>

      <div className="position-relative">
        <input
          type={inputType}
          className={`form-control ${validationClass}`}
          id={name}
          name={name}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete={autoComplete}
          required={required}
          style={isPassword ? { paddingRight: "2.5rem" } : undefined}
          {...rest}
        />

        {isPassword && value && (
          <button
            type="button"
            className="btn btn-link position-absolute end-0 top-50 translate-middle-y pe-3 text-secondary"
            style={{
              border: "none",
              background: "none",
              padding: 0,
              zIndex: 5,
            }}
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
          >
            <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} />
          </button>
        )}
      </div>

      {touched && error && (
        <div className="field-error-msg">
          <i className="bi bi-exclamation-circle-fill" style={{ fontSize: "0.72rem" }} />
          {error}
        </div>
      )}
    </div>
  );
}
