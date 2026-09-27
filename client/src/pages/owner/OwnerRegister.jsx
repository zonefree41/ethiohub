import React from "react";
import { apiPost } from "../../api/http.js";
import "./OwnerAuth.css";

export default function OwnerRegister() {
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);

  React.useEffect(() => {
    document.title = "Create Business Owner Account | HubEthio";
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

    try {
      const data = await apiPost(
  "/api/owner/auth/register",
  form
);

setMessage(
  data.message ||
    "✅ Account created. Please check your email and verify your account before signing in."
);

setForm({
  name: "",
  email: "",
  password: "",
});
setAcceptedTerms(false);
    } catch (err) {
      setError(err.message || "Registration failed");
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
          <h1>Create Business Owner Account</h1>
          <p>
  Create an account and verify your email before
  managing your HubEthio business listing.
</p>
        </div>

        {message && <div className="owner-auth-success">{message}</div>}
        {error && <div className="owner-auth-error">Error: {error}</div>}

        <form onSubmit={submit} className="owner-auth-form">
          <input
            name="name"
            value={form.name}
            onChange={update}
            placeholder="Full name"
            required
          />

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
            placeholder="Password, minimum 6 characters"
            required
          />

          <label className="owner-auth-terms">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              required
            />
            <span>
              I agree to the{" "}
              <a href="/terms" target="_blank" rel="noreferrer">
                Terms of Service
              </a>{" "}
              and acknowledge HubEthio’s zero-tolerance policy for
              objectionable content and abusive users.
            </span>
          </label>

          <button type="submit" disabled={!acceptedTerms}>
            Create Account
          </button>
        </form>

        <div className="owner-auth-links">
          <a href="/owner/login">Already have an account? Login</a>
        </div>
      </div>
    </main>
  );
}