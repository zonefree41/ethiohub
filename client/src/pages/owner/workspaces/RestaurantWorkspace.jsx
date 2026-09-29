import React from "react";
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiUpload,
} from "../../../api/http.js";
import WorkspaceLayout from "../../../components/owner/workspaces/WorkspaceLayout.jsx";
import WorkspaceStats from "../../../components/owner/workspaces/WorkspaceStats.jsx";
import "./RestaurantWorkspace.css";

export default function RestaurantWorkspace() {
  const isIOSBuild = __IOS_BUILD__;
  const token = localStorage.getItem("ownerToken");

  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [menuItems, setMenuItems] = React.useState([]);
  const [menuLoading, setMenuLoading] = React.useState(false);
  const [menuSaving, setMenuSaving] = React.useState(false);
  const [menuUploading, setMenuUploading] = React.useState(false);
  const [menuMessage, setMenuMessage] = React.useState("");
  const [editingMenuItemId, setEditingMenuItemId] = React.useState("");

  const [menuForm, setMenuForm] = React.useState({
    listingId: "",
    category: "",
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    imageUrls: [],
    isAvailable: true,
    dietaryTags: [],
    spicyLevel: "None",
    displayOrder: 0,
  });

  React.useEffect(() => {
    document.title = "Restaurant Workspace | HubEthio";

    if (!token) {
      window.location.href =
        "/owner/login?redirect=/owner/workspaces/restaurant";
      return;
    }

    async function loadRestaurantListings() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          "/api/owner/listings/my-listings",
          token
        );

        const restaurantListings = (
          Array.isArray(data) ? data : []
        ).filter(
          (listing) =>
            listing.categoryId?.slug ===
            "restaurant"
        );

        setListings(restaurantListings);

        if (restaurantListings.length > 0) {
          setMenuForm((current) => ({
            ...current,
            listingId:
              current.listingId ||
              restaurantListings[0]._id,
          }));

          setMenuLoading(true);

          const menuData = await apiGet(
            "/api/restaurant-menu-items/owner",
            token
          );

          setMenuItems(
            Array.isArray(menuData) ? menuData : []
          );

          setMenuLoading(false);
        }
      } catch (err) {
        const message =
          err.message ||
          "Failed to load Restaurant workspace.";

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
          localStorage.removeItem(
            "ownerToken"
          );

          localStorage.removeItem(
            "ownerUser"
          );

          window.location.href =
            "/owner/login?redirect=/owner/workspaces/restaurant";

          return;
        }

        setError(message);
      } finally {
        setLoading(false);
        setMenuLoading(false);
      }
    }

    loadRestaurantListings();
  }, [token]);

  function handleMenuFormChange(event) {
    const { name, value, type, checked } =
      event.target;

    setMenuForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    setMenuMessage("");
  }

  function handleDietaryTagChange(tag) {
    setMenuForm((current) => {
      const selected =
        current.dietaryTags.includes(tag);

      return {
        ...current,
        dietaryTags: selected
          ? current.dietaryTags.filter(
              (item) => item !== tag
            )
          : [...current.dietaryTags, tag],
      };
    });

    setMenuMessage("");
  }

  async function handleMenuImageUpload(event) {
    const files = Array.from(
      event.target.files || []
    );

    if (!files.length || menuUploading) {
      return;
    }

    const existingPhotos =
      menuForm.imageUrls.length > 0
        ? menuForm.imageUrls
        : menuForm.imageUrl
          ? [menuForm.imageUrl]
          : [];

    const remainingSlots =
      5 - existingPhotos.length;

    if (remainingSlots <= 0) {
      setMenuMessage(
        "A menu item can have up to 5 photos."
      );
      event.target.value = "";
      return;
    }

    if (files.length > remainingSlots) {
      setMenuMessage(
        `You can add only ${remainingSlots} more photo${
          remainingSlots === 1 ? "" : "s"
        }.`
      );
      event.target.value = "";
      return;
    }

    try {
      setMenuUploading(true);
      setMenuMessage("");
      setError("");

      const uploadedUrls = [];

      for (const file of files) {
        const data = await apiUpload(
          "/api/upload",
          file,
          token
        );

        if (!data?.url) {
          throw new Error(
            "Menu image upload did not return an image URL."
          );
        }

        uploadedUrls.push(data.url);
      }

      setMenuForm((current) => {
        const currentPhotos =
          current.imageUrls.length > 0
            ? current.imageUrls
            : current.imageUrl
              ? [current.imageUrl]
              : [];

        const nextPhotos = [
          ...currentPhotos,
          ...uploadedUrls,
        ].slice(0, 5);

        return {
          ...current,
          imageUrl: nextPhotos[0] || "",
          imageUrls: nextPhotos,
        };
      });

      setMenuMessage(
        `${uploadedUrls.length} menu photo${
          uploadedUrls.length === 1 ? "" : "s"
        } uploaded successfully.`
      );
    } catch (err) {
      setMenuMessage(
        err.message ||
          "Failed to upload menu item photo."
      );
    } finally {
      setMenuUploading(false);
      event.target.value = "";
    }
  }

  async function handleMenuSubmit(event) {
    event.preventDefault();

    if (menuSaving) {
      return;
    }

    const category = menuForm.category.trim();
    const name = menuForm.name.trim();
    const numericPrice = Number(menuForm.price);
    const numericDisplayOrder =
      Number(menuForm.displayOrder);

    if (
      !menuForm.listingId ||
      !category ||
      !name ||
      menuForm.price === ""
    ) {
      setMenuMessage(
        "Restaurant, category, item name, and price are required."
      );
      return;
    }

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      setMenuMessage(
        "Please enter a valid menu item price."
      );
      return;
    }

    if (
      !Number.isFinite(numericDisplayOrder) ||
      numericDisplayOrder < 0
    ) {
      setMenuMessage(
        "Display order must be zero or greater."
      );
      return;
    }

    const payload = {
      listingId: menuForm.listingId,
      category,
      name,
      description:
        menuForm.description.trim(),
      price: numericPrice,
      imageUrl: menuForm.imageUrl.trim(),
      imageUrls:
        menuForm.imageUrls.length > 0
          ? menuForm.imageUrls
          : menuForm.imageUrl
            ? [menuForm.imageUrl.trim()]
            : [],
      isAvailable: menuForm.isAvailable,
      dietaryTags: menuForm.dietaryTags,
      spicyLevel: menuForm.spicyLevel,
      displayOrder: numericDisplayOrder,
    };

    try {
      setMenuSaving(true);
      setMenuMessage("");
      setError("");

      let savedItem;

      if (editingMenuItemId) {
        savedItem = await apiPatch(
          `/api/restaurant-menu-items/${editingMenuItemId}`,
          payload,
          token
        );

        setMenuItems((current) =>
          current.map((item) =>
            item._id === savedItem._id
              ? savedItem
              : item
          )
        );
      } else {
        savedItem = await apiPost(
          "/api/restaurant-menu-items",
          payload,
          token
        );

        setMenuItems((current) => [
          ...current,
          savedItem,
        ]);
      }

      const selectedListingId =
        menuForm.listingId;

      setMenuForm({
        listingId: selectedListingId,
        category: "",
        name: "",
        description: "",
        price: "",
        imageUrl: "",
        imageUrls: [],
        isAvailable: true,
        dietaryTags: [],
        spicyLevel: "None",
        displayOrder: 0,
      });

      setEditingMenuItemId("");

      setMenuMessage(
        editingMenuItemId
          ? "Menu item updated successfully."
          : "Menu item added successfully."
      );
    } catch (err) {
      setMenuMessage(
        err.message ||
          "Failed to save menu item."
      );
    } finally {
      setMenuSaving(false);
    }
  }

  function handleEditMenuItem(item) {
    const listingId =
      typeof item.listingId === "object"
        ? item.listingId?._id
        : item.listingId;

    setEditingMenuItemId(item._id);

    setMenuForm({
      listingId: listingId || "",
      category: item.category || "",
      name: item.name || "",
      description: item.description || "",
      price:
        item.price !== undefined &&
        item.price !== null
          ? String(item.price)
          : "",
      imageUrl:
        item.imageUrls?.[0] ||
        item.imageUrl ||
        "",
      imageUrls:
        Array.isArray(item.imageUrls) &&
        item.imageUrls.length > 0
          ? item.imageUrls.slice(0, 5)
          : item.imageUrl
            ? [item.imageUrl]
            : [],
      isAvailable:
        item.isAvailable !== false,
      dietaryTags: Array.isArray(
        item.dietaryTags
      )
        ? item.dietaryTags
        : [],
      spicyLevel:
        item.spicyLevel || "None",
      displayOrder:
        item.displayOrder ?? 0,
    });

    setMenuMessage(
      "Editing menu item. Update the fields and save your changes."
    );
  }

  function resetMenuForm() {
    setEditingMenuItemId("");

    setMenuForm({
      listingId:
        menuForm.listingId ||
        listings[0]?._id ||
        "",
      category: "",
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      imageUrls: [],
      isAvailable: true,
      dietaryTags: [],
      spicyLevel: "None",
      displayOrder: 0,
    });

    setMenuMessage("");
  }

  async function handleDeleteMenuItem(item) {
    const confirmed = window.confirm(
      `Delete "${item.name}" from the menu?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setMenuMessage("");
      setError("");

      await apiDelete(
        `/api/restaurant-menu-items/${item._id}`,
        token
      );

      setMenuItems((current) =>
        current.filter(
          (menuItem) =>
            menuItem._id !== item._id
        )
      );

      if (editingMenuItemId === item._id) {
        resetMenuForm();
      }

      setMenuMessage(
        "Menu item deleted successfully."
      );
    } catch (err) {
      setMenuMessage(
        err.message ||
          "Failed to delete menu item."
      );
    }
  }

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
      label="Restaurant Business Workspace"
      title="Restaurant"
      icon="🍽️"
      description="Manage restaurant listings, menus, customer contact options, business information, and activity."
    >
      {error && (
        <div className="restaurant-workspace-error">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="restaurant-workspace-state">
          Loading Restaurant workspace...
        </div>
      )}

      {!loading &&
        listings.length === 0 && (
          <div className="restaurant-workspace-state">
            <h2>
              No Restaurant listings found
            </h2>

            <p>
              This workspace is available only
              to owners with a Restaurant listing.
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
                    "Restaurant Listings",
                  value:
                    listings.length,
                },
                {
                  label:
                    "Approved Listings",
                  value:
                    approvedCount,
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

            <section className="restaurant-menu-manager">
              <div className="restaurant-menu-manager-header">
                <div>
                  <h2>Manage Your Menu</h2>
                  <p>
                    Add dishes and drinks customers can view
                    directly from your Restaurant listing.
                  </p>
                </div>

                <span className="restaurant-menu-count">
                  {menuItems.length}{" "}
                  {menuItems.length === 1
                    ? "item"
                    : "items"}
                </span>
              </div>

              {menuMessage && (
                <div className="restaurant-menu-message">
                  {menuMessage}
                </div>
              )}

              <form
                className="restaurant-menu-form"
                onSubmit={handleMenuSubmit}
              >
                <div className="restaurant-menu-form-heading">
                  <h3>
                    {editingMenuItemId
                      ? "Edit Menu Item"
                      : "Add Menu Item"}
                  </h3>

                  {editingMenuItemId && (
                    <button
                      type="button"
                      onClick={resetMenuForm}
                      className="restaurant-menu-cancel"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="restaurant-menu-form-grid">
                  <label>
                    <span>Restaurant *</span>
                    <select
                      name="listingId"
                      value={menuForm.listingId}
                      onChange={handleMenuFormChange}
                      required
                    >
                      <option value="">
                        Select restaurant
                      </option>

                      {listings.map((listing) => (
                        <option
                          key={listing._id}
                          value={listing._id}
                        >
                          {listing.title}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Menu Category *</span>
                    <input
                      type="text"
                      name="category"
                      value={menuForm.category}
                      onChange={handleMenuFormChange}
                      placeholder="Example: Breakfast, Entrees, Coffee"
                      maxLength={80}
                      required
                    />
                  </label>

                  <label>
                    <span>Item Name *</span>
                    <input
                      type="text"
                      name="name"
                      value={menuForm.name}
                      onChange={handleMenuFormChange}
                      placeholder="Example: Doro Wot"
                      maxLength={120}
                      required
                    />
                  </label>

                  <label>
                    <span>Price *</span>
                    <input
                      type="number"
                      name="price"
                      value={menuForm.price}
                      onChange={handleMenuFormChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      required
                    />
                  </label>

                  <label className="restaurant-menu-full-field">
                    <span>Description</span>
                    <textarea
                      name="description"
                      value={menuForm.description}
                      onChange={handleMenuFormChange}
                      placeholder="Describe the dish, ingredients, or serving."
                      maxLength={1000}
                      rows={4}
                    />
                  </label>

                  <label>
                    <span>Spicy Level</span>
                    <select
                      name="spicyLevel"
                      value={menuForm.spicyLevel}
                      onChange={handleMenuFormChange}
                    >
                      <option value="None">None</option>
                      <option value="Mild">Mild</option>
                      <option value="Medium">Medium</option>
                      <option value="Hot">Hot</option>
                      <option value="Extra Hot">
                        Extra Hot
                      </option>
                    </select>
                  </label>

                  <label>
                    <span>Display Order</span>
                    <input
                      type="number"
                      name="displayOrder"
                      value={menuForm.displayOrder}
                      onChange={handleMenuFormChange}
                      min="0"
                      step="1"
                    />
                  </label>

                  <div className="restaurant-menu-full-field">
                    <span className="restaurant-menu-field-label">
                      Dietary Options
                    </span>

                    <div className="restaurant-menu-tags">
                      {[
                        "Vegetarian",
                        "Vegan",
                        "Gluten-Free",
                        "Halal",
                      ].map((tag) => (
                        <label
                          key={tag}
                          className="restaurant-menu-tag-option"
                        >
                          <input
                            type="checkbox"
                            checked={menuForm.dietaryTags.includes(
                              tag
                            )}
                            onChange={() =>
                              handleDietaryTagChange(tag)
                            }
                          />
                          <span>{tag}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <label className="restaurant-menu-full-field">
                    <span>
                      Menu Item Photos — up to 5
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                      multiple
                      onChange={handleMenuImageUpload}
                      disabled={
                        menuUploading ||
                        menuForm.imageUrls.length >= 5
                      }
                    />
                  </label>

                  {menuForm.imageUrls.length > 0 && (
                    <div className="restaurant-menu-image-preview restaurant-menu-full-field">
                      <p>
                        {menuForm.imageUrls.length} of 5 photos
                        {" · "}
                        First photo is the main photo.
                      </p>

                      <div className="restaurant-menu-image-preview-grid">
                        {menuForm.imageUrls.map(
                          (photoUrl, photoIndex) => (
                            <div
                              key={`${photoUrl}-${photoIndex}`}
                              className="restaurant-menu-image-preview-item"
                            >
                              <img
                                src={photoUrl}
                                alt={
                                  menuForm.name
                                    ? `${menuForm.name} photo ${photoIndex + 1}`
                                    : `Menu item photo ${photoIndex + 1}`
                                }
                              />

                              {photoIndex === 0 && (
                                <span className="restaurant-menu-primary-photo">
                                  Main
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  setMenuForm((current) => {
                                    const nextPhotos =
                                      current.imageUrls.filter(
                                        (_, index) =>
                                          index !== photoIndex
                                      );

                                    return {
                                      ...current,
                                      imageUrl:
                                        nextPhotos[0] || "",
                                      imageUrls: nextPhotos,
                                    };
                                  })
                                }
                              >
                                Remove
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <label className="restaurant-menu-availability restaurant-menu-full-field">
                    <input
                      type="checkbox"
                      name="isAvailable"
                      checked={menuForm.isAvailable}
                      onChange={handleMenuFormChange}
                    />

                    <span>
                      Available — show this item to customers
                    </span>
                  </label>
                </div>

                <div className="restaurant-menu-form-actions">
                  <button
                    type="submit"
                    disabled={
                      menuSaving ||
                      menuUploading
                    }
                  >
                    {menuSaving
                      ? "Saving..."
                      : editingMenuItemId
                        ? "Save Changes"
                        : "Add to Menu"}
                  </button>

                  {editingMenuItemId && (
                    <button
                      type="button"
                      onClick={resetMenuForm}
                      className="restaurant-menu-secondary-button"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="restaurant-menu-items-section">
                <div className="restaurant-menu-items-heading">
                  <div>
                    <h3>Your Menu</h3>
                    <p>
                      Review, edit, or remove the items
                      customers can see.
                    </p>
                  </div>
                </div>

                {menuLoading ? (
                  <div className="restaurant-workspace-state">
                    Loading menu...
                  </div>
                ) : (
                  (() => {
                    const selectedMenuItems =
                      menuItems.filter((item) => {
                        const itemListingId =
                          typeof item.listingId ===
                          "object"
                            ? item.listingId?._id
                            : item.listingId;

                        return (
                          String(itemListingId || "") ===
                          String(
                            menuForm.listingId || ""
                          )
                        );
                      });

                    if (
                      selectedMenuItems.length === 0
                    ) {
                      return (
                        <div className="restaurant-menu-empty">
                          No menu items yet. Add your
                          first item above.
                        </div>
                      );
                    }

                    return (
                      <div className="restaurant-menu-items-grid">
                        {selectedMenuItems
                          .slice()
                          .sort((a, b) => {
                            const categoryCompare =
                              String(
                                a.category || ""
                              ).localeCompare(
                                String(
                                  b.category || ""
                                )
                              );

                            if (categoryCompare !== 0) {
                              return categoryCompare;
                            }

                            return (
                              Number(
                                a.displayOrder || 0
                              ) -
                              Number(
                                b.displayOrder || 0
                              )
                            );
                          })
                          .map((item) => (
                            <article
                              key={item._id}
                              className="restaurant-menu-item-card"
                            >
                              {(item.imageUrls?.[0] ||
                                item.imageUrl) && (
                                <div className="restaurant-menu-item-image-wrap">
                                  <img
                                    src={
                                      item.imageUrls?.[0] ||
                                      item.imageUrl
                                    }
                                    alt={item.name}
                                    className="restaurant-menu-item-image"
                                  />

                                  {Array.isArray(
                                    item.imageUrls
                                  ) &&
                                    item.imageUrls.length > 1 && (
                                      <span className="restaurant-menu-photo-count">
                                        {item.imageUrls.length} photos
                                      </span>
                                    )}
                                </div>
                              )}

                              <div className="restaurant-menu-item-content">
                                <div className="restaurant-menu-item-top">
                                  <div>
                                    <span className="restaurant-menu-item-category">
                                      {item.category}
                                    </span>

                                    <h4>
                                      {item.name}
                                    </h4>
                                  </div>

                                  <strong>
                                    $
                                    {Number(
                                      item.price || 0
                                    ).toFixed(2)}
                                  </strong>
                                </div>

                                {item.description && (
                                  <p>
                                    {item.description}
                                  </p>
                                )}

                                <div className="restaurant-menu-item-meta">
                                  <span>
                                    {item.isAvailable
                                      ? "Available"
                                      : "Unavailable"}
                                  </span>

                                  {item.spicyLevel &&
                                    item.spicyLevel !==
                                      "None" && (
                                      <span>
                                        {
                                          item.spicyLevel
                                        }
                                      </span>
                                    )}

                                  {Array.isArray(
                                    item.dietaryTags
                                  ) &&
                                    item.dietaryTags.map(
                                      (tag) => (
                                        <span key={tag}>
                                          {tag}
                                        </span>
                                      )
                                    )}
                                </div>

                                <div className="restaurant-menu-item-actions">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleEditMenuItem(
                                        item
                                      )
                                    }
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteMenuItem(
                                        item
                                      )
                                    }
                                    className="restaurant-menu-delete-button"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </article>
                          ))}
                      </div>
                    );
                  })()
                )}
              </div>
            </section>

            <section className="restaurant-workspace-grid">
              {listings.map(
                (listing) => (
                  <article
                    key={listing._id}
                    className="restaurant-workspace-card"
                  >
                    <div className="restaurant-workspace-card-header">
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

                      <span className="restaurant-workspace-status">
                        {listing.status ||
                          "pending"}
                      </span>
                    </div>

                    <div className="restaurant-workspace-info">
                      <div>
                        <strong>
                          Category
                        </strong>

                        <p>
                          {listing.categoryId
                            ?.name_en ||
                            "Restaurant"}
                        </p>
                      </div>

                      <div>
                        <strong>
                          Phone
                        </strong>

                        <p>
                          {listing.phone ||
                            "Not provided"}
                        </p>
                      </div>

                      <div>
                        <strong>
                          Website
                        </strong>

                        <p>
                          {listing.website ||
                            "Not provided"}
                        </p>
                      </div>

                      <div>
                        <strong>
                          Description
                        </strong>

                        <p>
                          {listing.description_en ||
                            "No restaurant description added yet."}
                        </p>
                      </div>
                    </div>

                    <div className="restaurant-workspace-actions">
                      <a
                        href={`/owner/listings/edit/${listing._id}`}
                      >
                        Edit Restaurant Listing
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