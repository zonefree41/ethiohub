import React from "react";
import { apiPost } from "../../api/http.js";
import "./OwnerAuth.css";

export default function OwnerLogin() {
  const [form, setForm] = React.useState({
    email: "",
    password: "",
  });

  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [needsVerification, setNeedsVerification] =
  React.useState(false);

const [resendingVerification, setResendingVerification] =
  React.useState(false);

  React.useEffect(() => {
  document.title = "Business Owner Login | HubEthio";

  const params = new URLSearchParams(
    window.location.search
  );

  if (params.get("verified") === "1") {
    setMessage(
      "✅ Email verified successfully. You can now sign in."
    );
  }
}, []);

function update(e) {
  setForm((prev) => ({
    ...prev,
    [e.target.name]: e.target.value,
  }));
}

  async function submit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setNeedsVerification(false);

    try {
      const data = await apiPost("/api/owner/auth/login", form);

      localStorage.setItem("ownerToken", data.token);
      localStorage.setItem("ownerUser", JSON.stringify(data.user));

      setMessage("✅ Login successful");
      const params =
  new URLSearchParams(
    window.location.search
  );

const redirect =
  params.get("redirect") ||
  "/owner/dashboard";

window.location.href = redirect;
    } catch (err) {
  const message =
    err.message || "Login failed";

  setError(message);

  if (
    message
      .toLowerCase()
      .includes("verify your email")
  ) {
    setNeedsVerification(true);
  }
}
  }

  return (
    <main className="owner-auth-page">
      <div className="owner-auth-card">
        <a href="/" className="owner-auth-back">
  ‹ Back to HubEthio
</a>

        <div className="owner-auth-header">
          <p className="owner-auth-label">Business Portal</p>
          <h1>Business Owner Login</h1>
          <p>Login to manage your HubEthio business listing.</p>
        </div>

        {message && <div className="owner-auth-success">{message}</div>}
        {error && <div className="owner-auth-error">Error: {error}</div>}

        {needsVerification && (
  <button
    type="button"
    onClick={resendVerification}
    disabled={
      resendingVerification ||
      !form.email
    }
  >
    {resendingVerification
      ? "Sending..."
      : "Resend Verification Email"}
  </button>
)}

        <form onSubmit={submit} className="owner-auth-form">
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={update}
            placeholder="Email"
            required
          />

          <input
            name="password"
            type="password"
            value={form.password}
            onChange={update}
            placeholder="Password"
            required
          />

          <button type="submit">Login</button>
        </form>

        <div className="owner-auth-links">
          <a href="/owner/forgot-password">Forgot password?</a>
          <span>•</span>
          <a href="/owner/register">Create account</a>
        </div>
      </div>
    </main>
  );
}