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
      const data = await apiPost("/api/owner/auth/register", form);

      localStorage.setItem("ownerToken", data.token);
      localStorage.setItem("ownerUser", JSON.stringify(data.user));

      setMessage("✅ Account created successfully");
      window.location.href = "/owner/dashboard";
    } catch (err) {
      setError(err.message || "Registration failed");
    }
  }

  return (
    <main className="owner-auth-page">
      <div className="owner-auth-card">
        <a href="/" className="owner-auth-back">
          ← Back Home
        </a>

        <div className="owner-auth-header">
          <p className="owner-auth-label">Business Portal</p>
          <h1>Create Business Owner Account</h1>
          <p>Create an account to manage your HubEthio business listing.</p>
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

          <button type="submit">Create Account</button>
        </form>

        <div className="owner-auth-links">
          <a href="/owner/login">Already have an account? Login</a>
        </div>
      </div>
    </main>
  );
}