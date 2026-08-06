import React from "react";
import "./WorkspaceStats.css";

export default function WorkspaceStats({
  items = [],
}) {
  if (!items.length) return null;

  return (
    <section className="workspace-stats-grid">
      {items.map((item) => (
        <article
          key={item.label}
          className="workspace-stat-card"
        >
          <strong>{item.value}</strong>

          <span>{item.label}</span>
        </article>
      ))}
    </section>
  );
}