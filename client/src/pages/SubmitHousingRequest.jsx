import React from "react";
import { apiPost } from "../api/http.js";
import "./SubmitHousingRequest.css";

const HOUSING_TYPES = [
  "Room",
  "Basement",
  "Apartment",
  "House",
  "Shared Housing",
];

const LEASE_OPTIONS = [
  "Month-to-Month",
  "Short-Term",
  "6 Months",
  "12 Months",
  "Flexible",
];

export default function SubmitHousingRequest() {
  const [form, setForm] = React.useState({
    requesterName: "",
    email: "",
    phone: "",
    housingTypes: [],
    preferredCities: "",
    preferredState: "",
    moveInDate: "",
    budgetMin: "",
    budgetMax: "",
    leasePreference: "Flexible",
    aboutMe: "",
    smokingStatus: "Prefer not to say",
    hasPets: false,
    petFriendlyRequired: false,
openToNearbyAreas: false,
bedroomsNeeded: "",
urgentHousingNeeded: false,
securityDepositAssistanceNeeded: false,
movingAssistanceNeeded: false,
    needsParking: false,
    utilitiesPreferred: false,
    furnishedPreferred: false,
    contactPreference: "Either",
  });

  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    document.title = "Post Housing Request | HubEthio";
  }, []);

  function updateField(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function toggleHousingType(type) {
    setForm((current) => {
      const exists = current.housingTypes.includes(type);

      return {
        ...current,
        housingTypes: exists
          ? current.housingTypes.filter((item) => item !== type)
          : [...current.housingTypes, type],
      };
    });
  }

  async function submitRequest(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (form.housingTypes.length === 0) {
      setError("Please select at least one housing type.");
      return;
    }

    if (Number(form.budgetMax) < Number(form.budgetMin)) {
      setError(
        "Maximum budget must be greater than or equal to minimum budget."
      );
      return;
    }

    try {
      setSubmitting(true);

      const data = await apiPost("/api/housing-requests", {
        requesterName: form.requesterName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        housingTypes: form.housingTypes,
        preferredCities: form.preferredCities
          .split(",")
          .map((city) => city.trim())
          .filter(Boolean),
        preferredState: form.preferredState.trim().toUpperCase(),
        moveInDate: form.moveInDate,
        budgetMin: Number(form.budgetMin),
        budgetMax: Number(form.budgetMax),
        leasePreference: form.leasePreference,
        aboutMe: form.aboutMe.trim(),
        smokingStatus: form.smokingStatus,
        hasPets: form.hasPets,
        petFriendlyRequired:
  form.petFriendlyRequired,

openToNearbyAreas:
  form.openToNearbyAreas,

bedroomsNeeded:
  form.bedroomsNeeded === ""
    ? null
    : Number(form.bedroomsNeeded),

urgentHousingNeeded:
  form.urgentHousingNeeded,

securityDepositAssistanceNeeded:
  form.securityDepositAssistanceNeeded,

movingAssistanceNeeded:
  form.movingAssistanceNeeded,
        needsParking: form.needsParking,
        utilitiesPreferred: form.utilitiesPreferred,
        furnishedPreferred: form.furnishedPreferred,
        contactPreference: form.contactPreference,
      });

      setMessage(
        data?.message ||
          "Housing request submitted successfully and is pending review."
      );

      setForm({
        requesterName: "",
        email: "",
        phone: "",
        housingTypes: [],
        preferredCities: "",
        preferredState: "",
        moveInDate: "",
        budgetMin: "",
        budgetMax: "",
        leasePreference: "Flexible",
        aboutMe: "",
        smokingStatus: "Prefer not to say",
        hasPets: false,
        needsParking: false,
        utilitiesPreferred: false,
        furnishedPreferred: false,
        contactPreference: "Either",
      });
    } catch (err) {
      setError(
        err.message || "Failed to submit housing request."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="submit-housing-page">
      <section className="submit-housing-hero">
        <div>
          <p className="submit-housing-kicker">
            🏠 HubEthio Housing Marketplace
          </p>

          <h1>Post a Housing Request</h1>

          <p>
            Looking for a room, basement, apartment, house,
            or shared housing? Submit your request and let
            approved homeowners or landlords contact you.
          </p>
        </div>
      </section>

      <section className="submit-housing-content">
        <form
          className="submit-housing-form"
          onSubmit={submitRequest}
        >
          <div className="submit-housing-grid">
            <label>
              Name *
              <input
                name="requesterName"
                value={form.requesterName}
                onChange={updateField}
                required
              />
            </label>

            <label>
              Phone *
              <input
                name="phone"
                value={form.phone}
                onChange={updateField}
                required
              />
            </label>

            <label>
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
              />
            </label>

            <label>
              Preferred State *
              <input
                name="preferredState"
                value={form.preferredState}
                onChange={updateField}
                maxLength="2"
                placeholder="VA"
                required
              />
            </label>

            <label className="submit-housing-wide">
              Preferred Cities *
              <input
                name="preferredCities"
                value={form.preferredCities}
                onChange={updateField}
                placeholder="Herndon, Silver Spring"
                required
              />
            </label>

            <label>
              Move-in Date *
              <input
                name="moveInDate"
                type="date"
                value={form.moveInDate}
                onChange={updateField}
                required
              />
            </label>

            <label>
              Minimum Budget *
              <input
                name="budgetMin"
                type="number"
                min="0"
                value={form.budgetMin}
                onChange={updateField}
                required
              />
            </label>

            <label>
              Maximum Budget *
              <input
                name="budgetMax"
                type="number"
                min="0"
                value={form.budgetMax}
                onChange={updateField}
                required
              />
            </label>

            <label>
  Bedrooms Needed
  <input
    name="bedroomsNeeded"
    type="number"
    min="0"
    step="1"
    value={form.bedroomsNeeded}
    onChange={updateField}
    placeholder="Example: 1"
  />
</label>

            <label>
              Lease Preference
              <select
                name="leasePreference"
                value={form.leasePreference}
                onChange={updateField}
              >
                {LEASE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Smoking Status
              <select
                name="smokingStatus"
                value={form.smokingStatus}
                onChange={updateField}
              >
                <option value="Non-Smoker">
                  Non-Smoker
                </option>
                <option value="Smoker">
                  Smoker
                </option>
                <option value="Prefer not to say">
                  Prefer not to say
                </option>
              </select>
            </label>

            <label>
              Contact Preference
              <select
                name="contactPreference"
                value={form.contactPreference}
                onChange={updateField}
              >
                <option value="Phone">Phone</option>
                <option value="Email">Email</option>
                <option value="Either">Either</option>
              </select>
            </label>
          </div>

          <div className="submit-housing-section">
            <h2>What type of housing are you looking for? *</h2>

            <div className="submit-housing-types">
              {HOUSING_TYPES.map((type) => (
                <label key={type}>
                  <input
                    type="checkbox"
                    checked={form.housingTypes.includes(type)}
                    onChange={() => toggleHousingType(type)}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <div className="submit-housing-section">
            <h2>Preferences</h2>

            <div className="submit-housing-checks">
              <label>
                <input
                  type="checkbox"
                  name="hasPets"
                  checked={form.hasPets}
                  onChange={updateField}
                />
                I have pets
              </label>

              <label>
  <input
    type="checkbox"
    name="petFriendlyRequired"
    checked={form.petFriendlyRequired}
    onChange={updateField}
  />
  Pet-friendly housing required
</label>

<label>
  <input
    type="checkbox"
    name="openToNearbyAreas"
    checked={form.openToNearbyAreas}
    onChange={updateField}
  />
  I am open to nearby areas
</label>

<label>
  <input
    type="checkbox"
    name="urgentHousingNeeded"
    checked={form.urgentHousingNeeded}
    onChange={updateField}
  />
  I need housing as soon as possible
</label>

<label>
  <input
    type="checkbox"
    name="securityDepositAssistanceNeeded"
    checked={
      form.securityDepositAssistanceNeeded
    }
    onChange={updateField}
  />
  I may need security deposit assistance
</label>

<label>
  <input
    type="checkbox"
    name="movingAssistanceNeeded"
    checked={form.movingAssistanceNeeded}
    onChange={updateField}
  />
  I may need moving assistance
</label>

              <label>
                <input
                  type="checkbox"
                  name="needsParking"
                  checked={form.needsParking}
                  onChange={updateField}
                />
                I need parking
              </label>

              <label>
                <input
                  type="checkbox"
                  name="utilitiesPreferred"
                  checked={form.utilitiesPreferred}
                  onChange={updateField}
                />
                Utilities included preferred
              </label>

              <label>
                <input
                  type="checkbox"
                  name="furnishedPreferred"
                  checked={form.furnishedPreferred}
                  onChange={updateField}
                />
                Furnished preferred
              </label>
            </div>
          </div>

          <label className="submit-housing-about">
            About You *
            <textarea
              name="aboutMe"
              value={form.aboutMe}
              onChange={updateField}
              rows="6"
              placeholder="Example: Professional worker, non-smoker, no pets, looking for a clean and quiet place."
              required
            />
          </label>

          <div className="submit-housing-notice">
  Your request will be reviewed by HubEthio.
  We may use the information you provide to help
  identify possible housing matches and legitimate
  assistance resources. Housing availability,
  approval, deposits, lease terms, and financial
  assistance are determined by the relevant
  property provider or assistance program.
</div>

          {error && (
            <div className="submit-housing-error">
              {error}
            </div>
          )}

          {message && (
            <div className="submit-housing-success">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="submit-housing-button"
            disabled={submitting}
          >
            {submitting
              ? "Submitting..."
              : "Submit Housing Request"}
          </button>
        </form>
      </section>
    </main>
  );
}