import express from "express";
import mongoose from "mongoose";
import Listing from "../models/Listing.js";
import { sendEmail } from "../utils/sendEmail.js";
import { scoreHousingMatch } from "../utils/housingMatchScore.js";
import Category from "../models/Category.js";

import HousingRequest from "../models/HousingRequest.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

const ALLOWED_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "closed",
];

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parsePositiveInteger(value, fallback, maximum) {
  const number = Number.parseInt(value, 10);

  if (!Number.isFinite(number) || number < 1) {
    return fallback;
  }

  return Math.min(number, maximum);
}

/*
|--------------------------------------------------------------------------
| GET ALL HOUSING REQUESTS
|--------------------------------------------------------------------------
|
| GET /api/admin/housing-requests
|
| Query:
| search
| status
| housingType
| state
| page
| limit
|
*/
router.get("/", requireAdmin, async (req, res) => {
  try {
    const {
      search = "",
      status = "",
      housingType = "",
      state = "",
    } = req.query;

    const page = parsePositiveInteger(req.query.page, 1, 100000);
    const limit = parsePositiveInteger(req.query.limit, 25, 100);

    const query = {};

    const cleanedStatus = cleanText(status).toLowerCase();

    if (
      cleanedStatus &&
      cleanedStatus !== "all" &&
      ALLOWED_STATUSES.includes(cleanedStatus)
    ) {
      query.status = cleanedStatus;
    }

    const cleanedHousingType = cleanText(housingType);

    if (cleanedHousingType && cleanedHousingType !== "All") {
      query.housingTypes = cleanedHousingType;
    }

    const cleanedState = cleanText(state).toUpperCase();

    if (cleanedState) {
      query.preferredState = cleanedState;
    }

    const cleanedSearch = cleanText(search);

    if (cleanedSearch) {
      const searchRegex = new RegExp(
        escapeRegex(cleanedSearch),
        "i"
      );

      query.$or = [
        { requesterName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { preferredCities: searchRegex },
        { preferredState: searchRegex },
        { aboutMe: searchRegex },
        { adminNote: searchRegex },
      ];
    }

    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      HousingRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      HousingRequest.countDocuments(query),
    ]);

    return res.json({
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error(
      "Load admin housing requests failed:",
      error
    );

    return res.status(500).json({
      message: "Failed to load housing requests.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET ONE HOUSING REQUEST
|--------------------------------------------------------------------------
|
| GET /api/admin/housing-requests/:id
|
*/
router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid housing request ID.",
      });
    }

    const request =
  await HousingRequest.findById(id)
    .populate(
      "assistanceTimeline.listingId",
      "title city state monthlyRent bedrooms availabilityStatus petsAllowed"
    );

    if (!request) {
      return res.status(404).json({
        message: "Housing request not found.",
      });
    }

    return res.json({
      request,
    });
  } catch (error) {
    console.error(
      "Load housing request details failed:",
      error
    );

    return res.status(500).json({
      message: "Failed to load housing request details.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| UPDATE HOUSING REQUEST STATUS
|--------------------------------------------------------------------------
|
| PATCH /api/admin/housing-requests/:id/status
|
| Body:
| {
|   "status": "approved",
|   "note": "Approved after review."
| }
|
*/
router.patch(
  "/:id/status",
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        status,
        note = "",
      } = req.body || {};

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: "Invalid housing request ID.",
        });
      }

      const cleanedStatus = cleanText(status).toLowerCase();

      if (!ALLOWED_STATUSES.includes(cleanedStatus)) {
        return res.status(400).json({
          message: "Invalid housing request status.",
        });
      }

      const request = await HousingRequest.findById(id);

      if (!request) {
        return res.status(404).json({
          message: "Housing request not found.",
        });
      }

      request.status = cleanedStatus;

      // Only approved requests are publicly visible.
      request.isPublic = cleanedStatus === "approved";

      request.adminNote = cleanText(note);

      await request.save();

      return res.json({
        message:
          "Housing request status updated successfully.",
        request,
      });
    } catch (error) {
      console.error(
        "Update housing request status failed:",
        error
      );

      if (error?.name === "ValidationError") {
        return res.status(400).json({
          message:
            Object.values(error.errors)
              .map((item) => item.message)
              .join(", ") ||
            "Invalid housing request update.",
        });
      }

      return res.status(500).json({
        message:
          "Failed to update housing request status.",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| AUTOMATIC HOUSING MATCH SUGGESTIONS
|--------------------------------------------------------------------------
|
| GET /api/admin/housing-requests/:id/match-suggestions
|
*/

router.get(
  "/:id/match-suggestions",
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(id)
      ) {
        return res.status(400).json({
          message:
            "Invalid housing request ID.",
        });
      }

      const request =
        await HousingRequest.findById(id);

      if (!request) {
        return res.status(404).json({
          message:
            "Housing request not found.",
        });
      }

      const housingCategory =
  await Category.findOne({
    slug: "housing-rentals",
  }).select("_id");

      if (!housingCategory) {
        return res.status(404).json({
          message:
            "Housing & Rentals category not found.",
        });
      }

      const listings =
        await Listing.find({
          categoryId:
            housingCategory._id,

          status: "approved",

          availabilityStatus:
            "available",
        })
          .select(
            [
              "title",
              "city",
              "state",
              "monthlyRent",
              "bedrooms",
              "bathrooms",
              "leaseTerm",
              "parking",
              "petsAllowed",
              "utilitiesIncluded",
              "furnished",
              "availabilityStatus",
              "availableFrom",
              "subcategory",
              "imageUrl",
            ].join(" ")
          )
          .lean();

      const scoredListings = listings.map(
  (listing) => {
    const result =
      scoreHousingMatch(
        request,
        listing
      );

    return {
      ...listing,

      eligible:
        result.eligible,

      matchScore:
        result.score,

      matchReasons:
        result.reasons,

      disqualifiers:
        result.disqualifiers,
    };
  }
);

const eligibleListings =
  scoredListings
    .filter(
      (listing) =>
        listing.eligible
    )
    .sort(
      (a, b) =>
        b.matchScore -
        a.matchScore
    );

const suggestions =
  eligibleListings.slice(0, 5);

const filteredOut =
  scoredListings
    .filter(
      (listing) =>
        !listing.eligible
    )
    .map((listing) => ({
      _id: listing._id,
      title: listing.title,
      city: listing.city,
      state: listing.state,
      matchScore:
        listing.matchScore,
      disqualifiers:
        listing.disqualifiers,
    }));

      return res.json({
  requestId:
    request._id,

  totalCandidates:
    listings.length,

  eligibleCandidates:
    eligibleListings.length,

  filteredOutCount:
    filteredOut.length,

  suggestions,

  filteredOut,
});
    } catch (error) {
      console.error(
        "Housing match suggestions failed:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to generate housing match suggestions.",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| UPDATE HOUSING ASSISTANCE WORKFLOW
|--------------------------------------------------------------------------
|
| PATCH /api/admin/housing-requests/:id/assistance
|
*/
router.patch(
  "/:id/assistance",
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
  assistanceStatus,
  adminAssistanceNotes = "",
  matchedListingId = "",
} = req.body || {};

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: "Invalid housing request ID.",
        });
      }

      const allowedAssistanceStatuses = [
        "New",
        "Reviewing",
        "Matched",
        "Referred",
        "Closed",
      ];

      if (
        !allowedAssistanceStatuses.includes(
          assistanceStatus
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid housing assistance status.",
        });
      }

      const request =
        await HousingRequest.findById(id);

      if (!request) {
        return res.status(404).json({
          message: "Housing request not found.",
        });
      }

      let matchedListing = null;

if (assistanceStatus === "Matched") {
  const cleanedListingId =
    cleanText(matchedListingId);

  if (
    !cleanedListingId ||
    !mongoose.Types.ObjectId.isValid(
      cleanedListingId
    )
  ) {
    return res.status(400).json({
      message:
        "Please select a valid Housing listing before marking this request as matched.",
    });
  }

  matchedListing = await Listing.findOne({
      _id: cleanedListingId,
      status: "approved",
      availabilityStatus: {
        $ne: "rented",
      },
    }).populate("categoryId", "slug name_en");

  if (
    !matchedListing ||
    matchedListing.categoryId?.slug !==
      "housing-rentals"
  ) {
    return res.status(400).json({
      message:
        "The selected listing is not an available approved Housing listing.",
    });
  }

  request.matchedListingIds = [
    matchedListing._id,
  ];
}

      request.assistanceStatus =
        assistanceStatus;

      request.adminAssistanceNotes =
        cleanText(adminAssistanceNotes);

      const now = new Date();

      request.assistanceTimeline =
  Array.isArray(request.assistanceTimeline)
    ? request.assistanceTimeline
    : [];

request.assistanceTimeline.push({
  status: assistanceStatus,

  note:
    cleanText(adminAssistanceNotes),

  listingId:
    assistanceStatus === "Matched" &&
    matchedListing
      ? matchedListing._id
      : null,

  createdAt: now,
});

      if (assistanceStatus === "Reviewing") {
        request.reviewingAt = now;
      }

      if (assistanceStatus === "Matched") {
        request.matchedAt = now;
      }

      if (assistanceStatus === "Referred") {
        request.referredAt = now;
      }

      if (assistanceStatus === "Closed") {
        request.assistanceClosedAt = now;
      }

      await request.save();

      if (
  assistanceStatus === "Matched" &&
  matchedListing &&
  request.email
) {
  try {
    const clientUrl =
  process.env.CLIENT_URL ||
  "https://www.hubethio.com";

const propertyUrl =
  `${clientUrl}/listing/${matchedListing._id}`;

    const location =
      [
        matchedListing.city,
        matchedListing.state,
      ]
        .filter(Boolean)
        .join(", ") ||
      "Location not provided";

    const rent =
      matchedListing.monthlyRent != null
        ? `$${Number(
            matchedListing.monthlyRent
          ).toLocaleString("en-US")}/month`
        : "Rent not listed";

    const bedrooms =
      matchedListing.bedrooms != null
        ? `${matchedListing.bedrooms} bedroom${
            Number(matchedListing.bedrooms) === 1
              ? ""
              : "s"
          }`
        : "Bedrooms not listed";

    await sendEmail({
      to: request.email,

      subject:
        "HubEthio found a possible housing match",

      html: `
        <div style="
          font-family:Arial,sans-serif;
          max-width:650px;
          margin:auto;
          padding:24px;
          color:#111827;
        ">
          <h1 style="
            color:#1d4ed8;
            margin-bottom:8px;
          ">
            🏠 Possible Housing Match
          </h1>

          <p>
            Hello ${escapeHtml(
              request.requesterName
            )},
          </p>

          <p style="line-height:1.6;">
            HubEthio found a housing listing that
            may match some of the preferences in
            your housing request.
          </p>

          <div style="
            background:#f8fafc;
            border:1px solid #dbe4ef;
            border-radius:14px;
            padding:20px;
            margin:24px 0;
          ">
            <h2 style="
              margin:0 0 14px;
              color:#0f172a;
            ">
              ${escapeHtml(
                matchedListing.title
              )}
            </h2>

            <p>
              <strong>Location:</strong>
              ${escapeHtml(location)}
            </p>

            <p>
              <strong>Rent:</strong>
              ${escapeHtml(rent)}
            </p>

            <p>
              <strong>Bedrooms:</strong>
              ${escapeHtml(bedrooms)}
            </p>

            <p>
              <strong>Pet-Friendly:</strong>
              ${
                matchedListing.petsAllowed
                  ? "Yes"
                  : "Please confirm with the property provider"
              }
            </p>

            <p>
              <strong>Availability:</strong>
              ${escapeHtml(
                matchedListing.availabilityStatus ||
                  "Please confirm availability"
              )}
            </p>
          </div>

          <div style="
            text-align:center;
            margin:28px 0;
          ">
            <a
              href="${propertyUrl}"
              style="
                display:inline-block;
                background:#1d4ed8;
                color:#ffffff;
                text-decoration:none;
                padding:13px 22px;
                border-radius:10px;
                font-weight:bold;
              "
            >
              View Property
            </a>
          </div>

          <p style="
            line-height:1.6;
            color:#475569;
          ">
            This is a possible match, not a housing
            approval or guarantee. Please review the
            property and confirm current availability,
            rent, pet policies, application requirements,
            fees, lease terms, and other details directly
            with the property provider.
          </p>

          <p style="
            color:#64748b;
            font-size:13px;
            margin-top:28px;
          ">
            — The HubEthio Team
          </p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error(
      "Housing match email failed:",
      emailError
    );
  }
}

      return res.json({
        message:
          "Housing assistance status updated successfully.",
        request,
      });
    } catch (error) {
      console.error(
        "Update housing assistance status failed:",
        error
      );

      if (error?.name === "ValidationError") {
        return res.status(400).json({
          message:
            Object.values(error.errors)
              .map((item) => item.message)
              .join(", ") ||
            "Invalid housing assistance update.",
        });
      }

      return res.status(500).json({
        message:
          "Failed to update housing assistance status.",
      });
    }
  }
);

router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid housing request ID.",
      });
    }

    const request = await HousingRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        message: "Housing request not found.",
      });
    }

    const {
      requesterName,
      email,
      phone,
      housingTypes,
      preferredCities,
      preferredState,
      moveInDate,
      budgetMin,
      budgetMax,
      leasePreference,
      aboutMe,
      smokingStatus,
      hasPets,
      petFriendlyRequired,
openToNearbyAreas,
bedroomsNeeded,
urgentHousingNeeded,
securityDepositAssistanceNeeded,
movingAssistanceNeeded,
      needsParking,
      utilitiesPreferred,
      furnishedPreferred,
      contactPreference,
    } = req.body || {};

    if (requesterName !== undefined) {
      request.requesterName = cleanText(requesterName);
    }

    if (email !== undefined) {
      request.email = cleanText(email).toLowerCase();
    }

    if (phone !== undefined) {
      request.phone = cleanText(phone);
    }

    if (Array.isArray(housingTypes)) {
      request.housingTypes = housingTypes;
    }

    if (Array.isArray(preferredCities)) {
      request.preferredCities = preferredCities
        .map((city) => cleanText(city))
        .filter(Boolean);
    }

    if (preferredState !== undefined) {
      request.preferredState =
        cleanText(preferredState).toUpperCase();
    }

    if (moveInDate !== undefined) {
      request.moveInDate = moveInDate;
    }

    if (budgetMin !== undefined) {
      request.budgetMin = Number(budgetMin);
    }

    if (budgetMax !== undefined) {
      request.budgetMax = Number(budgetMax);
    }

    if (leasePreference !== undefined) {
      request.leasePreference = leasePreference;
    }

    if (aboutMe !== undefined) {
      request.aboutMe = cleanText(aboutMe);
    }

    if (smokingStatus !== undefined) {
      request.smokingStatus = smokingStatus;
    }

    if (hasPets !== undefined) {
      request.hasPets = Boolean(hasPets);
    }

    if (petFriendlyRequired !== undefined) {
  request.petFriendlyRequired =
    Boolean(petFriendlyRequired);
}

if (openToNearbyAreas !== undefined) {
  request.openToNearbyAreas =
    Boolean(openToNearbyAreas);
}

if (bedroomsNeeded !== undefined) {
  request.bedroomsNeeded =
    bedroomsNeeded === "" ||
    bedroomsNeeded === null
      ? null
      : Number(bedroomsNeeded);
}

if (urgentHousingNeeded !== undefined) {
  request.urgentHousingNeeded =
    Boolean(urgentHousingNeeded);
}

if (
  securityDepositAssistanceNeeded !== undefined
) {
  request.securityDepositAssistanceNeeded =
    Boolean(securityDepositAssistanceNeeded);
}

if (movingAssistanceNeeded !== undefined) {
  request.movingAssistanceNeeded =
    Boolean(movingAssistanceNeeded);
}

    if (needsParking !== undefined) {
      request.needsParking = Boolean(needsParking);
    }

    if (utilitiesPreferred !== undefined) {
      request.utilitiesPreferred =
        Boolean(utilitiesPreferred);
    }

    if (furnishedPreferred !== undefined) {
      request.furnishedPreferred =
        Boolean(furnishedPreferred);
    }

    if (contactPreference !== undefined) {
      request.contactPreference = contactPreference;
    }

    if (
      Number.isFinite(request.budgetMin) &&
      Number.isFinite(request.budgetMax) &&
      request.budgetMax < request.budgetMin
    ) {
      return res.status(400).json({
        message:
          "Maximum budget must be greater than or equal to minimum budget.",
      });
    }

    await request.save();

    return res.json({
      message: "Housing request updated successfully.",
      request,
    });
  } catch (error) {
    console.error(
      "Update housing request details failed:",
      error
    );

    if (error?.name === "ValidationError") {
      return res.status(400).json({
        message:
          Object.values(error.errors)
            .map((item) => item.message)
            .join(", ") ||
          "Invalid housing request update.",
      });
    }

    return res.status(500).json({
      message: "Failed to update housing request.",
    });
  }
});

export default router;