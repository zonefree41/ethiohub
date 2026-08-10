import React from "react";
import { apiPost } from "../../api/http.js";
import "./OwnerAuth.css";

export default function ActivateOwner() {
  const token =
    window.location.pathname.split("/").pop();

  const [password, setPassword] =
    React.useState("");

  const [confirmPassword, setConfirmPassword] =
    React.useState("");

  const [message, setMessage] =
    React.useState("");

  const [error, setError] =
    React.useState("");

  React.useEffect(() => {
    document.title =
      "Activate Owner Account | HubEthio";
  }, []);

  async function submit(e) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const data = await apiPost(
        "/api/owner/auth/activate-account",
        {
          token,
          password,
        }
      );

      setMessage(
        data.message ||
          "Owner account activated successfully."
      );
    } catch (err) {
      setError(
        err.message ||
          "Failed to activate owner account"
      );
    }
  }

  return (
    <main className="owner-auth-page">
      <div className="owner-auth-card">
        <a
          href="/owner/login"
          className="owner-auth-back"
        >
          ← Back to Login
        </a>

        <div className="owner-auth-header">
          <p className="owner-auth-label">
            Business Owner Invitation
          </p>

          <h1>Activate Your Owner Account</h1>

          <p>
            Choose your password to activate your
            HubEthio business owner account.
          </p>
        </div>

        {message && (
          <div className="owner-auth-success">
            {message}
          </div>
        )}

        {error && (
          <div className="owner-auth-error">
            Error: {error}
          </div>
        )}

        {!message && (
          <form
            onSubmit={submit}
            className="owner-auth-form"
          >
            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Create password"
              required
              minLength={6}
              autoComplete="new-password"
            />

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              placeholder="Confirm password"
              required
              minLength={6}
              autoComplete="new-password"
            />

            <button type="submit">
              Activate My Account
            </button>
          </form>
        )}

        {message && (
          <div className="owner-auth-links">
            <a href="/owner/login">
              Continue to Owner Login
            </a>
          </div>
        )}
      </div>
    </main>
  );
}