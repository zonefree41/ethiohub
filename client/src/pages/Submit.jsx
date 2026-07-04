import React from "react";
import { apiGet, apiPost } from "../api/http.js";
import "./Submit.css";

const emptyForm = {
  title: "",
  categoryId: "",
  subcategory: "",
  phone: "",
  whatsapp: "",
  website: "",
  address: "", 
  city: "",
  state: "",
  zip: "",
  description_en: "",
  description_am: "",
  submittedByName: "",
  submittedByContact: "",
  logoUrl: "",
  imageUrl: "",
  businessHours: "",
  monthlyRent: "",
bedrooms: "",
bathrooms: "",
squareFeet: "",
securityDeposit: "",
leaseTerm: "",
parking: false,
petsAllowed: false,
utilitiesIncluded: false,
furnished: false,
availabilityStatus: "available",
availableFrom: "",
propertyImages: [],
propertyVideoUrl: "",

transportVehicleTypes: [],
transportServiceArea: "",
transportAvailable24_7: false,
transportAirportService: false,
transportSameDayService: false,
transportLocalLongDistance: "",
transportMaxLoad: "",

beautyServices: [],
beautyWalkInsWelcome: false,
beautyAppointmentRequired: false,
beautySameDayAppointment: false,
beautyWeekendAvailability: false,
beautyServes: [],
beautyStartingPrice: "",
beautyLanguages: [],
beautyInstagram: "",
beautyFacebook: "",
beautyTikTok: "",
beautyPhotos: [],
beautyVideoUrl: "",
};

export default function Submit() {
  const [categories, setCategories] = React.useState([]);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const [uploadingLogo, setUploadingLogo] = React.useState(false);
  const [uploadingBanner, setUploadingBanner] = React.useState(false);
  const [uploadingPropertyPhotos, setUploadingPropertyPhotos] = React.useState(false);
  const [uploadingPropertyVideo, setUploadingPropertyVideo] = React.useState(false);
  const [form, setForm] = React.useState(emptyForm);

  React.useEffect(() => {
    document.title = "Submit Business | HubEthio";

    apiGet("/api/categories")
      .then((data) => setCategories(data || []))
      .catch((err) => setError(err.message || "Failed to load categories"));
  }, []);

  function update(e) {
  const { name, value } = e.target;

  setForm((prev) => {
    const next = { ...prev, [name]: value };

    if (name === "categoryId") {
      next.subcategory = "";
    }

    return next;
  });
}

function updateCheckbox(e) {
  const { name, checked } = e.target;

  setForm((prev) => ({
    ...prev,
    [name]: checked,
  }));
}

  async function uploadImage(file, fieldName) {
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Image upload failed");
    }

    setForm((prev) => ({
      ...prev,
      [fieldName]: data.url,
    }));
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setError("");

    try {
      await uploadImage(file, "logoUrl");
    } catch (err) {
      setError(err.message || "Logo upload failed");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleBannerUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    setError("");

    try {
      await uploadImage(file, "imageUrl");
    } catch (err) {
      setError(err.message || "Banner upload failed");
    } finally {
      setUploadingBanner(false);
    }
  }

  async function handlePropertyPhotosUpload(e) {
  const files = Array.from(e.target.files || []);
  if (files.length === 0) return;

  const currentPhotos = Array.isArray(form.propertyImages)
    ? form.propertyImages
    : [];

  const remainingSlots = 10 - currentPhotos.length;
  const filesToUpload = files.slice(0, remainingSlots);

  if (filesToUpload.length === 0) {
    setError("You can upload up to 10 property photos.");
    return;
  }

  setUploadingPropertyPhotos(true);
  setError("");

  try {
    const uploadedUrls = [];

    for (const file of filesToUpload) {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Property photo upload failed");
      }

      uploadedUrls.push(data.url);
    }

    setForm((prev) => ({
      ...prev,
      propertyImages: [...(prev.propertyImages || []), ...uploadedUrls].slice(0, 10),
    }));
  } catch (err) {
    setError(err.message || "Property photo upload failed");
  } finally {
    setUploadingPropertyPhotos(false);
  }
}

function removePropertyPhoto(indexToRemove) {
  setForm((prev) => ({
    ...prev,
    propertyImages: (prev.propertyImages || []).filter(
      (_url, index) => index !== indexToRemove
    ),
  }));
}

async function handlePropertyVideoUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.type !== "video/mp4") {
    setError("Only MP4 video files are allowed.");
    return;
  }

  setUploadingPropertyVideo(true);
  setError("");

  try {
    const formData = new FormData();
    formData.append("video", file);

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/upload/video`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Video upload failed");
    }

    setForm((prev) => ({
      ...prev,
      propertyVideoUrl: data.url,
    }));
  } catch (err) {
    setError(err.message || "Video upload failed");
  } finally {
    setUploadingPropertyVideo(false);
  }
}

function removePropertyVideo() {
  setForm((prev) => ({
    ...prev,
    propertyVideoUrl: "",
  }));
}

  async function submit(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const ownerToken = localStorage.getItem("ownerToken");

      await apiPost(
        "/api/submissions",
        {
          title: form.title,
          categoryId: form.categoryId,
          subcategory: form.subcategory,
          businessHours: form.businessHours,
          phone: form.phone,
          whatsapp: form.whatsapp,
          website: form.website,
          address: form.address,
          city: form.city,
          state: form.state,
          zip: form.zip,
          description_en: form.description_en,
          description_am: form.description_am,
          logoUrl: form.logoUrl,
          imageUrl: form.imageUrl,
          monthlyRent: form.monthlyRent,
bedrooms: form.bedrooms,
bathrooms: form.bathrooms,
squareFeet: form.squareFeet,
securityDeposit: form.securityDeposit,
leaseTerm: form.leaseTerm,
parking: form.parking,
petsAllowed: form.petsAllowed,
utilitiesIncluded: form.utilitiesIncluded,
furnished: form.furnished,
availabilityStatus: form.availabilityStatus,
availableFrom: form.availableFrom,
propertyImages: form.propertyImages,

transportVehicleTypes: form.transportVehicleTypes,
transportServiceArea: form.transportServiceArea,
transportAvailable24_7: form.transportAvailable24_7,
transportAirportService: form.transportAirportService,
transportSameDayService: form.transportSameDayService,
transportLocalLongDistance: form.transportLocalLongDistance,
transportMaxLoad: form.transportMaxLoad,

propertyVideoUrl: form.propertyVideoUrl,
          submittedBy: {
            name: form.submittedByName,
            contact: form.submittedByContact,
          },
        },
        ownerToken
      );

      setMessage("✅ Listing submitted successfully. Waiting for admin approval.");
      setForm(emptyForm);
    } catch (err) {
      setError(err.message || "Submit failed");
    }
  }

  const isUploading =
  uploadingLogo ||
  uploadingBanner ||
  uploadingPropertyPhotos ||
  uploadingPropertyVideo;

  const selectedCategory = categories.find((c) => c._id === form.categoryId);

const availableSubcategories = Array.isArray(selectedCategory?.subcategories)
  ? selectedCategory.subcategories
  : [];

  const isHousingCategory = selectedCategory?.name_en === "Housing & Rentals";

  const isTransportationCategory =
  selectedCategory?.name_en === "Transportation";

  const isBeautyCategory =
  selectedCategory?.name_en === "Beauty & Wellness";

  return (
    <main className="submit-page">
      <div className="submit-container">
        <a href="/" className="submit-back-btn">
  ← Back Home
</a>

        <section className="submit-hero">
  <p className="submit-label">Business Submission</p>
  <h1>Submit Ethiopian Business / Service</h1>
  <p>
    Add your Ethiopian business or community service to HubEthio. After
    submission, your listing will be reviewed before it appears publicly.
  </p>
</section>

<div className="submit-benefits">
  <div className="submit-benefit">✅ Free Business Listing</div>
  <div className="submit-benefit">📍 Reach Ethiopian Customers</div>
  <div className="submit-benefit">📱 Mobile App Coming Soon</div>
  <div className="submit-benefit">⭐ Featured Listings Available</div>
</div>

<div className="submit-stats">
  <div className="submit-stat">
    <strong>7+</strong>
    <span>Businesses Listed</span>
  </div>

  <div className="submit-stat">
    <strong>10+</strong>
    <span>Business Owners</span>
  </div>

  <div className="submit-stat">
    <strong>30K+</strong>
    <span>People Reached</span>
  </div>
</div>

<div className="submit-trust">
  <h3>Why List on HubEthio?</h3>

  <ul>
    <li>✓ Free business listing</li>
    <li>✓ Reach Ethiopian customers across the USA</li>
    <li>✓ Google Maps directions included</li>
    <li>✓ WhatsApp contact support</li>
    <li>✓ Featured listing upgrades available</li>
  </ul>
</div>

{message && <div className="submit-success">{message}</div>}
        {error && <div className="submit-error">Error: {error}</div>}

        <form onSubmit={submit} className="submit-form">
          <section className="submit-section">
            <h2>Business Information</h2>

            <input
              name="title"
              value={form.title}
              onChange={update}
              placeholder="Business / Service Name *"
              required
            />

               <textarea
      name="businessHours"
      value={form.businessHours}
      onChange={update}
      placeholder="Business Hours: Mon–Fri 9AM–5PM, Sat 10AM–3PM"
    />

            <select
              name="categoryId"
              value={form.categoryId}
              onChange={update}
              required
            >
              <option value="">Select Category *</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.icon} {c.name_en}
                </option>
              ))}
            </select>

            {availableSubcategories.length > 0 && (
  <select
    name="subcategory"
    value={form.subcategory}
    onChange={update}
    required
  >
    <option value="">Select Subcategory *</option>
    {availableSubcategories.map((sub) => (
      <option key={sub} value={sub}>
        {sub}
      </option>
    ))}
  </select>
)}

{isHousingCategory && (
  <section className="submit-section">
    <h2>Rental Information</h2>

    <div className="submit-two-col">
      <input
        type="number"
        name="monthlyRent"
        value={form.monthlyRent}
        onChange={update}
        placeholder="Monthly Rent"
      />

      <input
        type="number"
        name="securityDeposit"
        value={form.securityDeposit}
        onChange={update}
        placeholder="Security Deposit"
      />
    </div>

    <div className="submit-three-col">
      <input
        type="number"
        name="bedrooms"
        value={form.bedrooms}
        onChange={update}
        placeholder="Bedrooms"
      />

      <input
        type="number"
        name="bathrooms"
        value={form.bathrooms}
        onChange={update}
        placeholder="Bathrooms"
        step="0.5"
      />

      <input
        type="number"
        name="squareFeet"
        value={form.squareFeet}
        onChange={update}
        placeholder="Square Feet"
      />
    </div>

    <select name="leaseTerm" value={form.leaseTerm} onChange={update}>
      <option value="">Lease Term</option>
      <option value="Month-to-Month">Month-to-Month</option>
      <option value="6 Months">6 Months</option>
      <option value="12 Months">12 Months</option>
      <option value="Flexible">Flexible</option>
    </select>

    <div className="submit-two-col">
      <select
        name="availabilityStatus"
        value={form.availabilityStatus}
        onChange={update}
      >
        <option value="available">🟢 Available</option>
        <option value="rented">🔴 Rented</option>
      </select>

      <input
        type="date"
        name="availableFrom"
        value={form.availableFrom}
        onChange={update}
      />
    </div>

    <div className="submit-checkboxes">
      <label>
        <input
          type="checkbox"
          name="parking"
          checked={form.parking}
          onChange={updateCheckbox}
        />
        Parking
      </label>

      <label>
        <input
          type="checkbox"
          name="petsAllowed"
          checked={form.petsAllowed}
          onChange={updateCheckbox}
        />
        Pets Allowed
      </label>

      <label>
        <input
          type="checkbox"
          name="utilitiesIncluded"
          checked={form.utilitiesIncluded}
          onChange={updateCheckbox}
        />
        Utilities Included
      </label>

      <label>
        <input
          type="checkbox"
          name="furnished"
          checked={form.furnished}
          onChange={updateCheckbox}
        />
        Furnished
      </label>
    </div>
  </section>
)}

{isTransportationCategory && (
  <section className="submit-section">
    <h2>Transportation Information</h2>

    <div className="submit-transport-banner">
  <h3>🚚 Join HubEthio Transport</h3>

  <p>
    Promote your transportation business to customers looking for
    airport transportation, movers, cargo, furniture delivery,
    and charter services across the DMV.
  </p>

  <ul>
    <li>✅ Upload vehicle photos & videos</li>
    <li>✅ Show your service area</li>
    <li>✅ Receive customer calls directly</li>
    <li>✅ Get featured across HubEthio</li>
  </ul>
</div>

    <div className="submit-two-col">
      <input
        name="transportServiceArea"
        value={form.transportServiceArea}
        onChange={update}
        placeholder="Service Area (e.g. DMV, Northern VA, Maryland)"
      />

      <input
        name="transportMaxLoad"
        value={form.transportMaxLoad}
        onChange={update}
        placeholder="Vehicle Capacity (e.g. 26-ft Truck, 3 Tons)"
      />
    </div>

    <h3 className="submit-subtitle">Vehicle Types</h3>

<div className="submit-vehicle-grid">
  {[
    { value: "Sedan", label: "🚗 Sedan" },
    { value: "SUV", label: "🚙 SUV" },
    { value: "Passenger Van", label: "🚌 Passenger Van" },
    { value: "Cargo Van", label: "🚛 Cargo Van" },
    { value: "Sprinter Van", label: "🚐 Sprinter Van" },
    { value: "Box Truck", label: "📦 Box Truck" },
    { value: "Pickup Truck", label: "🛻 Pickup Truck" },
  ].map((vehicle) => (
    <label key={vehicle.value}>
      <input
        type="checkbox"
        checked={form.transportVehicleTypes.includes(vehicle.value)}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            transportVehicleTypes: e.target.checked
              ? [...prev.transportVehicleTypes, vehicle.value]
              : prev.transportVehicleTypes.filter(
                  (v) => v !== vehicle.value
                ),
          }))
        }
      />
      {vehicle.label}
    </label>
  ))}
</div>

    <select
      name="transportLocalLongDistance"
      value={form.transportLocalLongDistance}
      onChange={update}
    >
      <option value="">Service Type</option>
      <option value="Local">Local</option>
      <option value="Long Distance">Long Distance</option>
      <option value="Both">Both</option>
    </select>

    <div className="submit-checkboxes">
      <label>
        <input
          type="checkbox"
          name="transportAvailable24_7"
          checked={form.transportAvailable24_7}
          onChange={updateCheckbox}
        />
        24/7 Service
      </label>

      <label>
        <input
          type="checkbox"
          name="transportAirportService"
          checked={form.transportAirportService}
          onChange={updateCheckbox}
        />
        Airport Service
      </label>

      <label>
        <input
          type="checkbox"
          name="transportSameDayService"
          checked={form.transportSameDayService}
          onChange={updateCheckbox}
        />
        Same-Day Service
      </label>
    </div>
  </section>
)}

{isBeautyCategory && (
  <section className="submit-section">
    <h2>Beauty & Wellness Information</h2>

    <div className="submit-transport-banner">
      <h3>💄 Join HubEthio Beauty & Wellness</h3>

      <p>
        Promote your salon, barber shop, makeup, spa, massage, skincare,
        wellness, or beauty service to Ethiopian customers near you.
      </p>

      <ul>
        <li>✅ Show your beauty services</li>
        <li>✅ Let customers know if walk-ins are welcome</li>
        <li>✅ Add appointment and weekend availability</li>
        <li>✅ Upload salon or service photos</li>
      </ul>
    </div>

    <h3 className="submit-subtitle">Services Offered</h3>

    <div className="submit-vehicle-grid">
      {[
        "Hair Styling",
        "Hair Braiding",
        "Haircut",
        "Makeup",
        "Nails",
        "Spa",
        "Massage",
        "Skincare",
        "Waxing",
        "Eyelashes",
        "Eyebrows",
        "Cosmetic Tattoo",
        "Wellness Coaching",
      ].map((service) => (
        <label key={service}>
          <input
            type="checkbox"
            checked={form.beautyServices.includes(service)}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                beautyServices: e.target.checked
                  ? [...prev.beautyServices, service]
                  : prev.beautyServices.filter((s) => s !== service),
              }))
            }
          />
          {service}
        </label>
      ))}
    </div>

    <h3 className="submit-subtitle">Availability</h3>

    <div className="submit-checkboxes">
      <label>
        <input
          type="checkbox"
          name="beautyWalkInsWelcome"
          checked={form.beautyWalkInsWelcome}
          onChange={updateCheckbox}
        />
        Walk-ins Welcome
      </label>

      <label>
        <input
          type="checkbox"
          name="beautyAppointmentRequired"
          checked={form.beautyAppointmentRequired}
          onChange={updateCheckbox}
        />
        Appointment Required
      </label>

      <label>
        <input
          type="checkbox"
          name="beautySameDayAppointment"
          checked={form.beautySameDayAppointment}
          onChange={updateCheckbox}
        />
        Same-Day Appointment
      </label>

      <label>
        <input
          type="checkbox"
          name="beautyWeekendAvailability"
          checked={form.beautyWeekendAvailability}
          onChange={updateCheckbox}
        />
        Weekend Availability
      </label>
    </div>

    <h3 className="submit-subtitle">Pricing</h3>

    <input
      name="beautyStartingPrice"
      value={form.beautyStartingPrice}
      onChange={update}
      placeholder="Starting Price (Example: $25)"
    />

    <h3 className="submit-subtitle">Customers</h3>

    <div className="submit-checkboxes">
      {["Women", "Men", "Kids", "Unisex"].map((customer) => (
        <label key={customer}>
          <input
            type="checkbox"
            checked={form.beautyServes.includes(customer)}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                beautyServes: e.target.checked
                  ? [...prev.beautyServes, customer]
                  : prev.beautyServes.filter((c) => c !== customer),
              }))
            }
          />
          {customer}
        </label>
      ))}
    </div>
  </section>
)}

            <div className="submit-two-col">
              <input
                name="phone"
                value={form.phone}
                onChange={update}
                placeholder="Phone *"
                required
              />

              <input
                name="whatsapp"
                value={form.whatsapp}
                onChange={update}
                placeholder="WhatsApp optional"
              />
            </div>

            <input
              name="website"
              value={form.website}
              onChange={update}
              placeholder="Website optional"
            />
          </section>

          <section className="submit-section">
            <h2>Location</h2>

            <input
              name="address"
              value={form.address}
              onChange={update}
              placeholder="Address"
            />

            <div className="submit-three-col">
              <input
                name="city"
                value={form.city}
                onChange={update}
                placeholder="City *"
                required
              />

              <input
  type="text"
  placeholder="State * ex: VA"
  value={form.state}
  maxLength={2}
  onChange={(e) =>
    setForm({
      ...form,
      state: e.target.value.toUpperCase(),
    })
  }
  required
/>

              <input
                name="zip"
                value={form.zip}
                onChange={update}
                placeholder="ZIP"
              />
            </div>
          </section>

          <section className="submit-section">
            <h2>Images</h2>

            <div className="submit-upload-card">
              <label>Business Logo</label>
              <p>Recommended: square image, like 500x500.</p>

              <input type="file" accept="image/*" onChange={handleLogoUpload} />

              {uploadingLogo && <p className="submit-uploading">Uploading logo...</p>}

              {form.logoUrl && (
                <img
                  src={form.logoUrl}
                  alt="Business logo preview"
                  className="submit-logo-preview"
                />
              )}
            </div>

            <div className="submit-upload-card">
              <label>Business Banner Image</label>
              <p>Recommended: wide landscape image, like 1200x600.</p>

              <input type="file" accept="image/*" onChange={handleBannerUpload} />

              {uploadingBanner && (
                <p className="submit-uploading">Uploading banner...</p>
              )}

              {form.imageUrl && (
                <img
                  src={form.imageUrl}
                  alt="Business banner preview"
                  className="submit-banner-preview"
                />
              )}
            </div>

              {(isHousingCategory || isTransportationCategory) && (
  <div className="submit-upload-card">
    <label>
  {isHousingCategory ? "Property Photos" : "Vehicle Photos"}
</label>

<p>
  {isHousingCategory
    ? "Upload up to 10 rental photos: bedroom, kitchen, bathroom, living room, exterior, parking, and more."
    : "Upload up to 10 vehicle photos: front, rear, interior, cargo area, passenger seating, equipment, and more."}
</p>

    <input
      type="file"
      accept="image/*"
      multiple
      onChange={handlePropertyPhotosUpload}
    />

    {uploadingPropertyPhotos && (
      <p className="submit-uploading">Uploading property photos...</p>
    )}

    {form.propertyImages?.length > 0 && (
      <div className="submit-property-grid">
        {form.propertyImages.map((url, index) => (
          <div key={`${url}-${index}`} className="submit-property-photo">
            <img src={url} alt={`Property photo ${index + 1}`} />

            <button type="button" onClick={() => removePropertyPhoto(index)}>
              Remove
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
)}

{(isHousingCategory || isTransportationCategory) && (
  <div className="submit-upload-card">
    <label>{isHousingCategory ? "Property Video" : "Vehicle Video"}</label>

<p>
  {isHousingCategory
    ? "Upload one MP4 walkthrough video. Recommended length: 60–90 seconds."
    : "Upload one MP4 vehicle video: exterior, interior, cargo space, passenger seating, and equipment."}
</p>

    <input
      type="file"
      accept="video/mp4"
      onChange={handlePropertyVideoUpload}
    />

    {uploadingPropertyVideo && (
      <p className="submit-uploading">Uploading property video...</p>
    )}

    {form.propertyVideoUrl && (
      <div className="submit-video-preview">
        <video src={form.propertyVideoUrl} controls />

        <button type="button" onClick={removePropertyVideo}>
          Remove Video
        </button>
      </div>
    )}
  </div>
)}

          </section>

          <section className="submit-section">
            <h2>Description</h2>

            <textarea
              name="description_en"
              value={form.description_en}
              onChange={update}
              placeholder="Description English"
              rows="4"
            />

            <textarea
              name="description_am"
              value={form.description_am}
              onChange={update}
              placeholder="Description Amharic"
              rows="4"
            />
          </section>

          <section className="submit-section">
            <h2>Submitted By</h2>

            <div className="submit-two-col">
              <input
                name="submittedByName"
                value={form.submittedByName}
                onChange={update}
                placeholder="Your name"
              />

              <input
                name="submittedByContact"
                value={form.submittedByContact}
                onChange={update}
                placeholder="Your email or phone"
              />
            </div>
          </section>

          <button type="submit" className="submit-button" disabled={isUploading}>
            {isUploading ? "Uploading..." : "Submit Listing"}
          </button>
        </form>
      </div>
    </main>
  );
}