import express from "express";
import Category from "../models/Category.js";
import Listing from "../models/Listing.js";
import Review from "../models/Review.js";
import jwt from "jsonwebtoken";
import { checkSpamSubmission } from "../utils/spamProtection.js";

const router = express.Router();

// Categories
router.get("/categories", async (_req, res) => {
  try {
    const cats = await Category.find().sort({ name_en: 1 });
    res.json(cats);
  } catch (err) {
    res.status(500).json({ message: "Failed to load categories" });
  }
});

// Nearby listings
router.get("/listings/:id/nearby", async (req, res) => {
  try {
    const current = await Listing.findOne({
      _id: req.params.id,
      status: "approved",
    });

    if (!current) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const nearby = await Listing.find({
      _id: { $ne: current._id },
      status: "approved",
      city: new RegExp(`^${escapeRegex(current.city)}$`, "i"),
      state: new RegExp(`^${escapeRegex(current.state)}$`, "i"),
    })
      .populate("categoryId")
      .sort({
        isFeatured: -1,
        isVerified: -1,
        createdAt: -1,
      })
      .limit(4);

    res.json(nearby);
  } catch (err) {
    console.error("Nearby listings failed:", err);
    res.status(500).json({ message: "Failed to load nearby listings" });
  }
});

// Related listings by category
router.get("/listings/:id/related", async (req, res) => {
  try {
    const current = await Listing.findOne({
      _id: req.params.id,
      status: "approved",
    });

    if (!current) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const related = await Listing.find({
      _id: { $ne: current._id },
      status: "approved",
      categoryId: current.categoryId,
    })
      .populate("categoryId")
      .sort({
        isFeatured: -1,
        isVerified: -1,
        createdAt: -1,
      })
      .limit(4);

    res.json(related);
  } catch (err) {
    console.error("Related listings failed:", err);
    res.status(500).json({ message: "Failed to load related listings" });
  }
});

// Listings search — approved only
router.get("/listings", async (req, res) => {
  try {
    const {
      search = "",
      category = "",
      subcategory = "",
      city = "",
      state = "",
      featured = "",
    } = req.query;

    const filter = { status: "approved" };

    if (category && category !== "all") {
      filter.categoryId = category;
    }

    if (subcategory) {
  filter.subcategory = subcategory;
}

    if (city) {
      filter.city = new RegExp(`^${escapeRegex(city.trim())}$`, "i");
    }

    if (state) {
      const normalizedState = normalizeState(state);
      filter.state = new RegExp(`^${escapeRegex(normalizedState)}$`, "i");
    }

    if (featured === "true") {
      filter.isFeatured = true;
    }

    const q = search.trim();

    const sort = {
      isFeatured: -1,
      isVerified: -1,
      createdAt: -1,
    };

    let listings;

    if (q) {
      const expandedTerms = expandSearchTerms(q);
      const regexes = expandedTerms.map(
        (term) => new RegExp(escapeRegex(term), "i")
      );

      listings = await Listing.find({
        ...filter,
        $or: [
          { title: { $in: regexes } },
          { description_en: { $in: regexes } },
          { description_am: { $in: regexes } },
          { city: { $in: regexes } },
          { state: { $in: regexes } },
          { tags: { $in: regexes } },
        ],
      })
        .populate("categoryId")
        .sort(sort)
        .limit(100);
    } else {
      listings = await Listing.find(filter)
        .populate("categoryId")
        .sort(sort)
        .limit(100);
    }

    const listingIds = listings.map((l) => l._id);

    const reviewStats = await Review.aggregate([
      {
        $match: {
          listingId: { $in: listingIds },
          approved: true,
        },
      },
      {
        $group: {
          _id: "$listingId",
          totalReviews: { $sum: 1 },
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    const statsMap = new Map(
      reviewStats.map((s) => [
        String(s._id),
        {
          totalReviews: s.totalReviews,
          averageRating: Number(s.averageRating.toFixed(1)),
        },
      ])
    );

    const listingsWithReviews = listings.map((listing) => {
      const obj = listing.toObject();
      const stats = statsMap.get(String(listing._id));

      return {
        ...obj,
        totalReviews: stats?.totalReviews || 0,
        averageRating: stats?.averageRating || 0,
      };
    });

    res.json(listingsWithReviews);
  } catch (err) {
    console.error("Listings search failed:", err);
    res.status(500).json({ message: "Failed to load listings" });
  }
});

// Listing details
router.get("/listings/:id", async (req, res) => {
  try {
    const listing = await Listing.findOne({
      _id: req.params.id,
      status: "approved",
    }).populate("categoryId");

    if (!listing) {
      return res.status(404).json({ message: "Not found" });
    }

    await Listing.findByIdAndUpdate(listing._id, {
  $inc: { "clicks.views": 1 },
});

    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: "Failed to load listing" });
  }
});

// Track clicks
router.post("/track/:id", async (req, res) => {
  try {
    const { type } = req.body;

    const valid = ["call", "whatsapp", "website", "directions"];

    if (!valid.includes(type)) {
      return res.status(400).json({ message: "Invalid type" });
    }

    await Listing.findByIdAndUpdate(req.params.id, {
      $inc: { [`clicks.${type}`]: 1 },
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Tracking failed" });
  }
});

// Submit a new listing — creates pending listing
router.post("/submissions", async (req, res) => {
  console.log("SUBMISSION BODY:", req.body);

  try {
    const {
  title,
  description_en = "",
  description_am = "",
  categoryId,
  subcategory = "",
  phone,
  businessHours,
  whatsapp = "",
  website = "",
  address = "",
  city,
  state,
  zip = "",
  languages = ["en", "am"],
  tags = [],
  submittedBy = {},

  monthlyRent = null,
  bedrooms = null,
  bathrooms = null,
  squareFeet = null,
  securityDeposit = null,
  leaseTerm = "",
  parking = false,
  petsAllowed = false,
  utilitiesIncluded = false,
  furnished = false,
} = req.body || {};

    const spamError = checkSpamSubmission({
  title,
  description_en,
  description_am,
  subcategory,
  phone,
  businessHours,
  whatsapp,
  website,
  address,
  city,
  state,
  zip,
  submittedBy,
});

if (spamError) {
  return res.status(400).json({
    message: spamError,
  });
}

    if (!title || !categoryId || !phone || !city || !state) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const numberFields = {
  monthlyRent,
  bedrooms,
  bathrooms,
  squareFeet,
  securityDeposit,
};

const cleanedNumbers = {};

for (const [field, value] of Object.entries(numberFields)) {
  cleanedNumbers[field] =
    value === "" || value === null || value === undefined
      ? null
      : Number(value);

  if (
    cleanedNumbers[field] !== null &&
    Number.isNaN(cleanedNumbers[field])
  ) {
    return res.status(400).json({
      message: `Invalid number for ${field}.`,
    });
  }
}

const cleanedBooleans = {
  parking: parking === true || parking === "true",
  petsAllowed: petsAllowed === true || petsAllowed === "true",
  utilitiesIncluded:
    utilitiesIncluded === true || utilitiesIncluded === "true",
  furnished: furnished === true || furnished === "true",
};

if (
  leaseTerm &&
  !["Month-to-Month", "6 Months", "12 Months", "Flexible"].includes(leaseTerm)
) {
  return res.status(400).json({
    message: "Invalid lease term.",
  });
}

    const ownerId = getOptionalOwnerId(req);

    const listing = await Listing.create({
      title,
      categoryId,
      ownerId,
      subcategory,
      phone,
      businessHours: businessHours || "",
      whatsapp,
      website,
      address,
      city,
      state,
      zip,
      description_en,
      description_am,
      logoUrl: req.body.logoUrl || "",
      imageUrl: req.body.imageUrl || "",
      languages,
      tags,
      submittedBy,

      monthlyRent: cleanedNumbers.monthlyRent,
bedrooms: cleanedNumbers.bedrooms,
bathrooms: cleanedNumbers.bathrooms,
squareFeet: cleanedNumbers.squareFeet,
securityDeposit: cleanedNumbers.securityDeposit,
leaseTerm,
parking: cleanedBooleans.parking,
petsAllowed: cleanedBooleans.petsAllowed,
utilitiesIncluded: cleanedBooleans.utilitiesIncluded,
furnished: cleanedBooleans.furnished,
      status: "pending",
    });

    res.status(201).json({
      message: "Submitted for approval",
      id: listing._id,
    });
  } catch (err) {
    console.error("Submit listing failed:", err);
    res.status(500).json({ message: "Failed to submit listing" });
  }
});

function getOptionalOwnerId(req) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return decoded?.id || null;
  } catch {
    return null;
  }
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeState(value) {
  const state = String(value || "").trim().toLowerCase();

  const map = {
    virginia: "VA",
    va: "VA",
    maryland: "MD",
    md: "MD",
    "washington dc": "DC",
    washington: "DC",
    dc: "DC",
    "district of columbia": "DC",
  };

  return map[state] || value;
}

function expandSearchTerms(value) {
  const q = String(value || "").trim().toLowerCase();

  const synonyms = {
    tax: ["tax", "tax preparer", "accounting", "accountant", "cpa"],
    lawyer: ["lawyer", "attorney", "legal", "immigration"],
    immigration: ["immigration", "lawyer", "attorney", "legal"],
    mechanic: ["mechanic", "auto", "auto repair", "car repair"],
    restaurant: ["restaurant", "food", "cuisine", "ethiopian food"],
    notary: ["notary", "document", "paperwork"],
    insurance: ["insurance", "agent"],
    tutor: ["tutor", "education", "school", "learning"],
    church: ["church", "community", "ministry"],
    salon: ["salon", "hair", "beauty"],
  };

  const terms = new Set([q]);

  Object.entries(synonyms).forEach(([key, values]) => {
    if (q.includes(key)) {
      values.forEach((item) => terms.add(item));
    }
  });

  return [...terms];
}

export default router;