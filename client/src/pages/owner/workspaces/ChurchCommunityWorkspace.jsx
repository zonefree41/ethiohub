import React from "react";
import { apiGet } from "../../../api/http.js";
import WorkspaceLayout from "../../../components/owner/workspaces/WorkspaceLayout.jsx";
import WorkspaceStats from "../../../components/owner/workspaces/WorkspaceStats.jsx";
import "./ChurchCommunityWorkspace.css";

export default function ChurchCommunityWorkspace() {
  const isIOSBuild = __IOS_BUILD__;
  const token = localStorage.getItem("ownerToken");

  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [inquiries, setInquiries] = React.useState([]);
  const [loadingInquiries, setLoadingInquiries] =
    React.useState(true);
  const [inquiryError, setInquiryError] = React.useState("");

  React.useEffect(() => {
    document.title =
      "Church / Community Workspace | HubEthio";

    if (!token) {
      window.location.href =
        "/owner/login?redirect=/owner/workspaces/church-community";
      return;
    }

    async function loadChurchCommunityListings() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          "/api/owner/listings/my-listings",
          token
        );

        const churchCommunityListings = (
          Array.isArray(data) ? data : []
        ).filter(
          (listing) =>
            listing.categoryId?.slug ===
            "church-community"
        );

        setListings(churchCommunityListings);
      } catch (err) {
        const message =
          err.message ||
          "Failed to load Church / Community workspace.";

        const normalizedMessage =
          message.toLowerCase();

        const unauthorized =
          normalizedMessage.includes(
            "invalid or expired token"
          ) ||
          normalizedMessage.includes(
            "unauthorized"
          ) ||
          message.includes("401");

        if (unauthorized) {
          localStorage.removeItem("ownerToken");
          localStorage.removeItem("ownerUser");

          window.location.href =
            "/owner/login?redirect=/owner/workspaces/church-community";

          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    Promise.all([
      loadChurchCommunityListings(),
      loadInquiries(),
    ]);
  }, [token]);

  async function loadInquiries() {
    try {
      setLoadingInquiries(true);
      setInquiryError("");

      const data = await apiGet(
        "/api/church-community-inquiries/owner",
        token
      );

      setInquiries(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "Failed to load Church / Community inquiries:",
        err
      );

      setInquiryError(
        err.message ||
          "Failed to load community inquiries."
      );

      setInquiries([]);
    } finally {
      setLoadingInquiries(false);
    }
  }

  async function updateInquiryStatus(inquiryId, status) {
    try {
      setInquiryError("");

      const baseUrl =
        import.meta.env.VITE_API_URL ||
        ("http:" + "//localhost:5001");

      const response = await fetch(
        `${baseUrl}/api/church-community-inquiries/${inquiryId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update community inquiry."
        );
      }

      setInquiries((current) =>
        current.map((inquiry) =>
          inquiry._id === inquiryId
            ? data.inquiry
            : inquiry
        )
      );
    } catch (err) {
      console.error(
        "Church / Community inquiry update failed:",
        err
      );

      setInquiryError(
        err.message ||
          "Failed to update community inquiry."
      );
    }
  }

  const totalInquiries = inquiries.length;

  const newInquiries = inquiries.filter(
    (inquiry) => inquiry.status === "New"
  ).length;

  const contactedInquiries = inquiries.filter(
    (inquiry) => inquiry.status === "Contacted"
  ).length;

  const resolvedInquiries = inquiries.filter(
    (inquiry) => inquiry.status === "Resolved"
  ).length;

  const approvedCount = listings.filter(
    (listing) =>
      listing.status === "approved"
  ).length;

  const featuredCount = listings.filter(
    (listing) =>
      listing.isFeatured
  ).length;

  const totalViews = listings.reduce(
    (total, listing) =>
      total +
      Number(
        listing.clicks?.views || 0
      ),
    0
  );

  return (
    <WorkspaceLayout
      label="Church & Community Workspace"
      title="Church / Community"
      icon="⛪"
      description="Manage church or community organization listings, contact information, announcements, and activity."
    >
      {error && (
        <div className="church-community-workspace-error">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="church-community-workspace-state">
          Loading Church / Community workspace...
        </div>
      )}

      {!loading &&
        listings.length === 0 && (
          <div className="church-community-workspace-state">
            <h2>
              No Church / Community listings found
            </h2>

            <p>
              This workspace is available only
              to owners with a Church / Community
              listing.
            </p>
          </div>
        )}

      {!loading &&
        listings.length > 0 && (
          <>
            <WorkspaceStats
              items={[
                {
                  label:
                    "Church / Community Listings",
                  value:
                    listings.length,
                },
                {
                  label:
                    "Approved Listings",
                  value:
                    approvedCount,
                },
                {
                  label: "Inquiries",
                  value: totalInquiries,
                },
                {
                  label: "New Inquiries",
                  value: newInquiries,
                },
                {
                  label: "Contacted",
                  value: contactedInquiries,
                },
                {
                  label: "Resolved",
                  value: resolvedInquiries,
                },
                ...(!isIOSBuild
                  ? [
                      {
                        label:
                          "Featured Listings",
                        value:
                          featuredCount,
                      },
                    ]
                  : []),
                {
                  label:
                    "Total Views",
                  value:
                    totalViews,
                },
              ]}
            />

            <section className="church-community-inquiries-section">
              <div className="church-community-inquiries-header">
                <div>
                  <h2>Recent Community Inquiries</h2>
                  <p>
                    Review customer questions and requests
                    sent to your organization.
                  </p>
                </div>
              </div>

              {inquiryError && (
                <div className="church-community-workspace-error">
                  Error: {inquiryError}
                </div>
              )}

              {loadingInquiries ? (
                <div className="church-community-workspace-state">
                  Loading community inquiries...
                </div>
              ) : inquiries.length === 0 ? (
                <div className="church-community-workspace-state">
                  <h3>No community inquiries yet</h3>
                  <p>
                    New customer Church / Community
                    inquiries will appear here.
                  </p>
                </div>
              ) : (
                <div className="church-community-inquiries-list">
                  {inquiries.slice(0, 5).map((inquiry) => (
                    <article
                      key={inquiry._id}
                      className="church-community-inquiry-card"
                    >
                      <div className="church-community-inquiry-card-top">
                        <div>
                          <h3>
                            {inquiry.customerName ||
                              "Unknown Customer"}
                          </h3>

                          <p>
                            {inquiry.inquiryType ||
                              "General Inquiry"}
                          </p>
                        </div>

                        <span
                          className={`church-community-inquiry-status status-${String(
                            inquiry.status || "New"
                          )
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {inquiry.status || "New"}
                        </span>
                      </div>

                      <div className="church-community-inquiry-details">
                        <div>
                          <strong>Listing</strong>
                          <span>
                            {inquiry.listingId?.title ||
                              "Church / Community"}
                          </span>
                        </div>

                        <div>
                          <strong>Phone</strong>
                          <span>
                            {inquiry.customerPhone ||
                              "Not provided"}
                          </span>
                        </div>

                        <div>
                          <strong>Email</strong>
                          <span>
                            {inquiry.customerEmail ||
                              "Not provided"}
                          </span>
                        </div>

                        <div>
                          <strong>Preferred Contact</strong>
                          <span>
                            {inquiry.preferredContactMethod ||
                              "Either"}
                          </span>
                        </div>
                      </div>

                      <div className="church-community-inquiry-notes">
                        <strong>Message</strong>
                        <p>
                          {inquiry.message ||
                            "No message provided"}
                        </p>
                      </div>

                      {inquiry.ownerNotes && (
                        <div className="church-community-inquiry-notes">
                          <strong>Owner Notes</strong>
                          <p>{inquiry.ownerNotes}</p>
                        </div>
                      )}

                      <div className="church-community-inquiry-actions">
                        {inquiry.status === "New" && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                updateInquiryStatus(
                                  inquiry._id,
                                  "Contacted"
                                )
                              }
                            >
                              Mark Contacted
                            </button>

                            <button
                              type="button"
                              className="secondary"
                              onClick={() =>
                                updateInquiryStatus(
                                  inquiry._id,
                                  "Closed"
                                )
                              }
                            >
                              Close
                            </button>
                          </>
                        )}

                        {inquiry.status === "Contacted" && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                updateInquiryStatus(
                                  inquiry._id,
                                  "Resolved"
                                )
                              }
                            >
                              Mark Resolved
                            </button>

                            <button
                              type="button"
                              className="secondary"
                              onClick={() =>
                                updateInquiryStatus(
                                  inquiry._id,
                                  "Closed"
                                )
                              }
                            >
                              Close
                            </button>
                          </>
                        )}

                        {inquiry.status === "Resolved" && (
                          <span className="church-community-inquiry-final-state">
                            Inquiry resolved
                          </span>
                        )}

                        {inquiry.status === "Closed" && (
                          <span className="church-community-inquiry-final-state">
                            Inquiry closed
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="church-community-workspace-grid">
              {listings.map(
                (listing) => (
                  <article
                    key={listing._id}
                    className="church-community-workspace-card"
                  >
                    <div className="church-community-workspace-card-header">
                      <div>
                        <h2>
                          {listing.title}
                        </h2>

                        <p>
                          {[
                            listing.city,
                            listing.state,
                          ]
                            .filter(Boolean)
                            .join(", ") ||
                            "Location unavailable"}
                        </p>
                      </div>

                      <span className="church-community-workspace-status">
                        {listing.status ||
                          "pending"}
                      </span>
                    </div>

                    <div className="church-community-workspace-info">
                      <div>
                        <strong>Category</strong>

                        <p>
                          {listing.categoryId
                            ?.name_en ||
                            "Church / Community"}
                        </p>
                      </div>

                      <div>
                        <strong>Phone</strong>

                        <p>
                          {listing.phone ||
                            "Not provided"}
                        </p>
                      </div>

                      <div>
                        <strong>Website</strong>

                        <p>
                          {listing.website ||
                            "Not provided"}
                        </p>
                      </div>

                      <div>
                        <strong>Description</strong>

                        <p>
                          {listing.description_en ||
                            "No church or community description added yet."}
                        </p>
                      </div>
                    </div>

                    <div className="church-community-workspace-actions">
                      <a
                        href={`/owner/listings/edit/${listing._id}`}
                      >
                        Edit Church / Community Listing
                      </a>

                      {listing.status ===
                        "approved" && (
                        <a
                          href={`/listing/${listing._id}`}
                        >
                          View Public Listing
                        </a>
                      )}
                    </div>
                  </article>
                )
              )}
            </section>
          </>
        )}
    </WorkspaceLayout>
  );
}