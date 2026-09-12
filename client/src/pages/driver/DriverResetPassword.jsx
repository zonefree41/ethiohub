import React from "react";
import { apiPost } from "../../api/http.js";
import "./DriverAuth.css";

export default function DriverResetPassword() {
  const [password, setPassword] =
    React.useState("");
  const [confirmPassword, setConfirmPassword] =
    React.useState("");
  const [error, setError] =
    React.useState("");
  const [message, setMessage] =
    React.useState("");
  const [submitting, setSubmitting] =
    React.useState(false);

  React.useEffect(() => {
    document.title =
      "Driver Reset Password | HubEthio";
  }, []);

  const token =
    window.location.pathname
      .split("/driver/reset-password/")[1]
      ?.split("/")[0] || "";

  async function submit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError(
        "Password reset link is invalid or missing."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const data = await apiPost(
        "/api/driver/auth/reset-password",
        {
          token,
          password,
        }
      );

      setMessage(
        data.message ||
          "Password reset successfully. You can now sign in."
      );

      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err.message ||
          "Unable to reset driver password."
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

          <h1>Reset Password</h1>

          <p>
            Enter a new password for your
            HubEthio Driver account.
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

        {!message && (
          <form
            onSubmit={submit}
            className="driver-auth-form"
          >
            <input
              name="password"
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="New Password"
              required
              minLength={8}
              autoComplete="new-password"
            />

            <input
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              placeholder="Confirm New Password"
              required
              minLength={8}
              autoComplete="new-password"
            />

            <button
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? "Resetting..."
                : "Reset Password"}
            </button>
          </form>
        )}

        {message && (
          <div className="driver-auth-links">
            <a href="/driver/login">
              Continue to Driver Login
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
