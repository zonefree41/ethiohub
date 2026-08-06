import React from "react";
import { OWNER_WORKSPACES } from "../../config/ownerWorkspaces.js";

export default function WorkspaceLauncher({
  listings = [],
  requestCounts = {},
}) {
  const availableWorkspaces = React.useMemo(() => {
    const ownedCategorySlugs = new Set(
      listings
        .map((listing) => listing.categoryId?.slug)
        .filter(Boolean)
    );

    return OWNER_WORKSPACES.filter((workspace) =>
      ownedCategorySlugs.has(workspace.categorySlug)
    );
  }, [listings]);

  if (availableWorkspaces.length === 0) {
    return null;
  }

  return (
    <section className="owner-workspace-launcher">
      <div className="owner-workspace-launcher-header">
        <div>
          <p className="owner-workspace-launcher-label">
            Business Tools
          </p>

          <h2>My Business Workspaces</h2>

          <p>
            Open the workspace that matches the business services you manage.
          </p>
        </div>
      </div>

      <div className="owner-workspace-launcher-grid">
        {availableWorkspaces.map((workspace) => {
          const count =
            Number(requestCounts[workspace.id]) || 0;

          return (
            <article
              key={workspace.id}
              className="owner-workspace-launcher-card"
            >
              <div className="owner-workspace-launcher-icon">
                {workspace.icon}
              </div>

              <div className="owner-workspace-launcher-content">
                <div className="owner-workspace-launcher-title-row">
                  <h3>{workspace.title}</h3>

                  {count > 0 && (
                    <span className="owner-workspace-launcher-count">
                      {count}
                    </span>
                  )}
                </div>

                <p>{workspace.description}</p>

                <a href={workspace.route}>
                  Open Workspace →
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}