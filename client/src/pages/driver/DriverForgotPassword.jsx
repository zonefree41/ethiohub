import React from "react";
import { apiPost } from "../../api/http.js";
import "./DriverAuth.css";

export default function DriverForgotPassword() {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    document.title = "Driver Forgot Password | HubEthio";
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const data = await apiPost(
        "/api/driver/auth/forgot-password",
        { email }
      );

      setMessage(
        data.message ||
          "If a driver account exists, a reset link has been sent."
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to process password reset request."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="driver-auth-page">
      <div className="driver-auth-card">
        <a
          href="/driver/login"
          className="driver-auth-back"
        >
          ‹ Back to Driver Login
        </a>

        <div className="driver-auth-header">
          <p className="driver-auth-label">
            Driver Portal
          </p>

          <h1>Forgot Password</h1>

          <p>
            Enter your driver account email and
            we&apos;ll send you a password reset link.
          </p>
        </div>

        {message && (
          <div className="driver-auth-success">
            {message}
          </div>
        )}

        {error && (
          <div className="driver-auth-error">
            Error: {error}
          </div>
        )}

        <form
          onSubmit={submit}
          className="driver-auth-form"
        >
          <input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            autoComplete="email"
          />

          <button
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Sending..."
              : "Send Reset Link"}
          </button>
        </form>
      </div>
    </main>
  );
}
