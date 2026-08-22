import express from "express";
import Category from "../models/Category.js";
import Listing from "../models/Listing.js";
import Review from "../models/Review.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { checkSpamSubmission } from "../utils/spamProtection.js";
import { geocodeAddress } from "../utils/geocodeAddress.js";


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

router.get("/listings/near-me", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radiusMiles = Number(req.query.radiusMiles || 25);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return res.status(400).json({
        message: "Valid lat and lng are required",
      });
    }

    const listings = await Listing.find({
      status: "approved",
      "location.lat": { $type: "number" },
      "location.lng": { $type: "number" },
    }).populate("categoryId");

    const toRadians = (value) =>
      (value * Math.PI) / 180;

    const earthRadiusMiles = 3958.8;

    const results = listings
      .map((listing) => {
        const listingLat = Number(
          listing.location?.lat
        );

        const listingLng = Number(
          listing.location?.lng
        );

        const dLat = toRadians(
          listingLat - lat
        );

        const dLng = toRadians(
          listingLng - lng
        );

        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRadians(lat)) *
            Math.cos(
              toRadians(listingLat)
            ) *
            Math.sin(dLng / 2) ** 2;

        const c =
          2 *
          Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
          );

        const distanceMiles =
          earthRadiusMiles * c;

        return {
          ...listing.toObject(),
          distanceMiles:
            Math.round(distanceMiles * 10) /
            10,
        };
      })
      .filter(
        (listing) =>
          listing.distanceMiles <= radiusMiles
      )
      .sort(
        (a, b) =>
          a.distanceMiles -
          b.distanceMiles
      )
      .slice(0, 20);

    res.json(results);
  } catch (err) {
    console.error(
      "Near-me listings failed:",
      err
    );

    res.status(500).json({
      message:
        "Failed to load nearby businesses",
    });
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
  minRent = "",
  maxRent = "",
  bedrooms = "",
  bathrooms = "",
  availableOnly = "",
  petsAllowed = "",
  parking = "",
  utilitiesIncluded = "",
  furnished = "",
  sortBy = "",
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

    if (minRent) {
  filter.monthlyRent = {
    ...(filter.monthlyRent || {}),
    $gte: Number(minRent),
  };
}

if (maxRent) {
  filter.monthlyRent = {
    ...(filter.monthlyRent || {}),
    $lte: Number(maxRent),
  };
}

if (bedrooms) {
  filter.bedrooms = { $gte: Number(bedrooms) };
}

if (bathrooms) {
  filter.bathrooms = { $gte: Number(bathrooms) };
}

if (availableOnly === "true") {
  filter.availabilityStatus = "available";
}

if (petsAllowed === "true") {
  filter.petsAllowed = true;
}

if (parking === "true") {
  filter.parking = true;
}

if (utilitiesIncluded === "true") {
  filter.utilitiesIncluded = true;
}

if (furnished === "true") {
  filter.furnished = true;
}

    const q = search.trim();

    let sort = {
  isFeatured: -1,
  isVerified: -1,
  createdAt: -1,
};

if (sortBy === "priceLow") {
  sort = {
    monthlyRent: 1,
    isFeatured: -1,
    createdAt: -1,
  };
}

if (sortBy === "priceHigh") {
  sort = {
    monthlyRent: -1,
    isFeatured: -1,
    createdAt: -1,
  };
}

if (sortBy === "newest") {
  sort = {
    createdAt: -1,
  };
}

if (sortBy === "featured") {
  sort = {
    isFeatured: -1,
    isVerified: -1,
    createdAt: -1,
  };
}

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


  availabilityStatus = "available",
  availableFrom = null,    
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

  privateEntrance = false,
bathroomType = "",
kitchenAccess = false,
laundryAccess = false,
maximumOccupants = null,
ownerLivesOnProperty = false,
housingNotes = "",
livingEnvironment = [],
idealFor = [],
  
  propertyImages = [],
propertyVideoUrl = "",

transportVehicleTypes = [],
transportServiceArea = "",
transportAvailable24_7 = false,
transportAirportService = false,
transportSameDayService = false,
transportLocalLongDistance = "",
transportMaxLoad = "",
transportCargoLength = "",
transportCargoWidth = "",
transportCargoHeight = "",
transportPalletCapacity = "",
transportResidentialDelivery = false,
transportCommercialDelivery = false,
transportWarehousePickup = false,
transportWarehouseDelivery = false,
transportDockHighDelivery = false,
transportInsideDelivery = false,
transportWhiteGloveService = false,
transportRefrigeratedTransport = false,
transportLiftgateAvailable = false,
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

    if (
  typeof categoryId !== "string" ||
  !mongoose.Types.ObjectId.isValid(
    categoryId.trim()
  )
) {
  return res.status(400).json({
    message: "Invalid categoryId.",
  });
}

   const numberFields = {
  monthlyRent,
  bedrooms,
  bathrooms,
  squareFeet,
  securityDeposit,
  maximumOccupants,
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

if (
  cleanedNumbers.maximumOccupants !== null &&
  cleanedNumbers.maximumOccupants < 1
) {
  return res.status(400).json({
    message: "Maximum occupants must be at least 1.",
  });
}

const cleanedBooleans = {
  parking: parking === true || parking === "true",
  petsAllowed: petsAllowed === true || petsAllowed === "true",
  utilitiesIncluded:
    utilitiesIncluded === true || utilitiesIncluded === "true",
  furnished: furnished === true || furnished === "true",

  privateEntrance:
    privateEntrance === true || privateEntrance === "true",

  kitchenAccess:
    kitchenAccess === true || kitchenAccess === "true",

  laundryAccess:
    laundryAccess === true || laundryAccess === "true",

  ownerLivesOnProperty:
    ownerLivesOnProperty === true ||
    ownerLivesOnProperty === "true",
};

if (
  availabilityStatus &&
  !["available", "rented"].includes(availabilityStatus)
) {
  return res.status(400).json({
    message: "Invalid housing availability status.",
  });
}

if (
  leaseTerm &&
  !["Month-to-Month", "6 Months", "12 Months", "Flexible"].includes(leaseTerm)
) {
  return res.status(400).json({
    message: "Invalid lease term.",
  });
}

if (
  bathroomType &&
  !["Private", "Shared", "None"].includes(bathroomType)
) {
  return res.status(400).json({
    message: "Invalid bathroom type.",
  });
}

    const ownerId = getOptionalOwnerId(req);


const allowedLivingEnvironment = [
  "Quiet Home",
  "Family Home",
  "Professionals Living Here",
  "Students Living Here",
  "Pet-Friendly Home",
];

const allowedIdealFor = [
  "Working Professional",
  "Student",
  "Single Person",
  "Couple",
  "Small Family",
];

if (
  !Array.isArray(livingEnvironment) ||
  livingEnvironment.some(
    (item) => !allowedLivingEnvironment.includes(item)
  )
) {
  return res.status(400).json({
    message: "Invalid living environment.",
  });
}

if (
  !Array.isArray(idealFor) ||
  idealFor.some(
    (item) => !allowedIdealFor.includes(item)
  )
) {
  return res.status(400).json({
    message: "Invalid ideal-for selection.",
  });
}

const geocodedLocation = await geocodeAddress({
  address,
  city,
  state,
  zip,
});

const cleanedSubmittedBy =
  submittedBy &&
  typeof submittedBy === "object" &&
  !Array.isArray(submittedBy)
    ? {
        name:
          typeof submittedBy.name === "string"
            ? submittedBy.name.trim()
            : "",
        contact:
          typeof submittedBy.contact === "string"
            ? submittedBy.contact.trim()
            : "",
      }
    : {
        name: "",
        contact: "",
      };

      const cleanedLanguages = Array.isArray(languages)
  ? languages
      .filter((item) => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 10)
  : [];

const cleanedTags = Array.isArray(tags)
  ? tags
      .filter((item) => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 30)
  : []; 

  const cleanStringArray = (value, maxItems = 20) =>
  Array.isArray(value)
    ? value
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, maxItems)
    : [];

const cleanedBeautyServices = cleanStringArray(
  req.body.beautyServices,
  30
);

const cleanedBeautyServes = cleanStringArray(
  req.body.beautyServes,
  10
);

const cleanedBeautyLanguages = cleanStringArray(
  req.body.beautyLanguages,
  10
);

const cleanedBeautyPhotos = cleanStringArray(
  req.body.beautyPhotos,
  20
);

const cleanedBeautyBooleans = {
  beautyWalkInsWelcome:
    req.body.beautyWalkInsWelcome === true ||
    req.body.beautyWalkInsWelcome === "true",

  beautyAppointmentRequired:
    req.body.beautyAppointmentRequired === true ||
    req.body.beautyAppointmentRequired === "true",

  beautySameDayAppointment:
    req.body.beautySameDayAppointment === true ||
    req.body.beautySameDayAppointment === "true",

  beautyWeekendAvailability:
    req.body.beautyWeekendAvailability === true ||
    req.body.beautyWeekendAvailability === "true",
};

const cleanedBeautyStartingPrice =
  typeof req.body.beautyStartingPrice === "string"
    ? req.body.beautyStartingPrice.trim()
    : "";

const cleanedBeautyInstagram =
  typeof req.body.beautyInstagram === "string"
    ? req.body.beautyInstagram.trim()
    : "";

const cleanedBeautyFacebook =
  typeof req.body.beautyFacebook === "string"
    ? req.body.beautyFacebook.trim()
    : "";

const cleanedBeautyTikTok =
  typeof req.body.beautyTikTok === "string"
    ? req.body.beautyTikTok.trim()
    : "";

const cleanedBeautyVideoUrl =
  typeof req.body.beautyVideoUrl === "string"
    ? req.body.beautyVideoUrl.trim()
    : "";

    const cleanedTransportVehicleTypes =
  Array.isArray(transportVehicleTypes)
    ? transportVehicleTypes
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 20)
    : [];

const cleanedTransportStrings = {
  transportServiceArea:
    typeof transportServiceArea === "string"
      ? transportServiceArea.trim()
      : "",

  transportLocalLongDistance:
    typeof transportLocalLongDistance === "string"
      ? transportLocalLongDistance.trim()
      : "",

  transportMaxLoad:
    typeof transportMaxLoad === "string"
      ? transportMaxLoad.trim()
      : "",

  transportCargoLength:
    typeof transportCargoLength === "string"
      ? transportCargoLength.trim()
      : "",

  transportCargoWidth:
    typeof transportCargoWidth === "string"
      ? transportCargoWidth.trim()
      : "",

  transportCargoHeight:
    typeof transportCargoHeight === "string"
      ? transportCargoHeight.trim()
      : "",

  transportPalletCapacity:
    typeof transportPalletCapacity === "string"
      ? transportPalletCapacity.trim()
      : "",
};

const cleanedLogoUrl =
  typeof req.body.logoUrl === "string"
    ? req.body.logoUrl.trim()
    : "";

const cleanedImageUrl =
  typeof req.body.imageUrl === "string"
    ? req.body.imageUrl.trim()
    : "";

const cleanedPropertyImages =
  Array.isArray(propertyImages)
    ? propertyImages
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 20)
    : [];

const cleanedPropertyVideoUrl =
  typeof propertyVideoUrl === "string"
    ? propertyVideoUrl.trim()
    : "";

const cleanString = (value) =>
  typeof value === "string"
    ? value.trim()
    : "";

const cleanedCoreFields = {
  title: cleanString(title),
  subcategory: cleanString(subcategory),
  phone: cleanString(phone),
  businessHours: cleanString(businessHours),
  whatsapp: cleanString(whatsapp),
  website: cleanString(website),
  address: cleanString(address),
  city: cleanString(city),
  state: cleanString(state),
  zip: cleanString(zip),
  description_en: cleanString(description_en),
  description_am: cleanString(description_am),
};

if (
  !cleanedCoreFields.title ||
  !cleanedCoreFields.phone ||
  !cleanedCoreFields.city ||
  !cleanedCoreFields.state
) {
  return res.status(400).json({
    message: "Missing required fields",
  });
}

    const listing = await Listing.create({
      title: cleanedCoreFields.title,
subcategory: cleanedCoreFields.subcategory,
phone: cleanedCoreFields.phone,
businessHours: cleanedCoreFields.businessHours,
whatsapp: cleanedCoreFields.whatsapp,
website: cleanedCoreFields.website,
address: cleanedCoreFields.address,
city: cleanedCoreFields.city,
state: cleanedCoreFields.state,
zip: cleanedCoreFields.zip,
location: geocodedLocation || undefined,
description_en: cleanedCoreFields.description_en,
description_am: cleanedCoreFields.description_am,
      logoUrl: cleanedLogoUrl,
      imageUrl: cleanedImageUrl,
      languages: cleanedLanguages,
      tags: cleanedTags,
      submittedBy: cleanedSubmittedBy,

      availabilityStatus,
availableFrom:
  availableFrom &&
  !Number.isNaN(new Date(availableFrom).getTime())
    ? new Date(availableFrom)
    : null,

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

privateEntrance: cleanedBooleans.privateEntrance,
bathroomType,
kitchenAccess: cleanedBooleans.kitchenAccess,
laundryAccess: cleanedBooleans.laundryAccess,
maximumOccupants: cleanedNumbers.maximumOccupants,
ownerLivesOnProperty:
  cleanedBooleans.ownerLivesOnProperty,
housingNotes:
  typeof housingNotes === "string"
    ? housingNotes.trim()
    : "",
    livingEnvironment,
idealFor,

beautyServices: cleanedBeautyServices,
beautyWalkInsWelcome: cleanedBeautyBooleans.beautyWalkInsWelcome,
beautyAppointmentRequired: cleanedBeautyBooleans.beautyAppointmentRequired,
beautySameDayAppointment: cleanedBeautyBooleans.beautySameDayAppointment,
beautyWeekendAvailability: cleanedBeautyBooleans.beautyWeekendAvailability,
beautyServes: cleanedBeautyServes,
beautyStartingPrice: cleanedBeautyStartingPrice,
beautyLanguages: cleanedBeautyLanguages,
beautyInstagram: cleanedBeautyInstagram,
beautyFacebook: cleanedBeautyFacebook,
beautyTikTok: cleanedBeautyTikTok,
beautyPhotos: cleanedBeautyPhotos,
beautyVideoUrl: cleanedBeautyVideoUrl,

propertyImages: cleanedPropertyImages,
propertyVideoUrl: cleanedPropertyVideoUrl,

transportVehicleTypes:
  cleanedTransportVehicleTypes,

transportServiceArea:
  cleanedTransportStrings.transportServiceArea,

transportLocalLongDistance:
  cleanedTransportStrings.transportLocalLongDistance,

transportMaxLoad:
  cleanedTransportStrings.transportMaxLoad,

transportCargoLength:
  cleanedTransportStrings.transportCargoLength,

transportCargoWidth:
  cleanedTransportStrings.transportCargoWidth,

transportCargoHeight:
  cleanedTransportStrings.transportCargoHeight,

transportPalletCapacity:
  cleanedTransportStrings.transportPalletCapacity,
transportResidentialDelivery:
  transportResidentialDelivery === true ||
  transportResidentialDelivery === "true",
  transportCommercialDelivery:
  transportCommercialDelivery === true ||
  transportCommercialDelivery === "true",
  transportWarehousePickup:
  transportWarehousePickup === true ||
  transportWarehousePickup === "true",
  transportWarehouseDelivery:
  transportWarehouseDelivery === true ||
  transportWarehouseDelivery === "true",
  transportDockHighDelivery:
  transportDockHighDelivery === true ||
  transportDockHighDelivery === "true",
  transportInsideDelivery:
  transportInsideDelivery === true ||
  transportInsideDelivery === "true",
  transportWhiteGloveService:
  transportWhiteGloveService === true ||
  transportWhiteGloveService === "true",
  transportRefrigeratedTransport:
  transportRefrigeratedTransport === true ||
  transportRefrigeratedTransport === "true",
transportLiftgateAvailable:
  transportLiftgateAvailable === true ||
  transportLiftgateAvailable === "true",
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