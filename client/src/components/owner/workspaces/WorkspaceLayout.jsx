import React from "react";
import "./WorkspaceLayout.css";

export default function WorkspaceLayout({
  label,
  title,
  icon,
  description,
  children,
  actions,
}) {
  return (
    <main className="owner-workspace-page">
      <div className="owner-workspace-container">
        <header className="owner-workspace-header">
          <div className="owner-workspace-header-content">
            <a
              href="/owner/dashboard"
              className="owner-workspace-back"
            >
              ← Back to Owner Dashboard
            </a>

            <p className="owner-workspace-label">
              {label}
            </p>

            <h1>
              <span aria-hidden="true">
                {icon}
              </span>{" "}
              {title}
            </h1>

            <p className="owner-workspace-description">
              {description}
            </p>
          </div>

          {actions && (
            <div className="owner-workspace-actions">
              {actions}
            </div>
          )}
        </header>

        {children}
      </div>
    </main>
  );
}