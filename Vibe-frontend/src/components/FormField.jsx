import { useState } from "react";

export default function FormInput({
  label,
  type = "text",
  name,
  value,
  onChange,
  autoComplete,
  required = false,
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="mb-3">
      <label htmlFor={name} className="form-label">
        {label}
      </label>

      <div className="position-relative">
        <input
          type={inputType}
          className="form-control"
          id={name}
          name={name}
          value={value}
          onChange={onChange}
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
            <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
          </button>
        )}
      </div>
    </div>
  );
}
