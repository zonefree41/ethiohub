import express from "express";
import Category from "../models/Category.js";
import Listing from "../models/Listing.js";

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

// Listings search — approved only
router.get("/listings", async (req, res) => {
  try {
    const { search = "", category = "", city = "", state = "", featured = "" } = req.query;

    const filter = { status: "approved" };

    if (category) filter.categoryId = category;
    if (city) filter.city = new RegExp(`^${escapeRegex(city)}$`, "i");
    if (state) filter.state = new RegExp(`^${escapeRegex(state)}$`, "i");
    if (featured === "true") filter.isFeatured = true;

    const q = search.trim();
    const sort = { isFeatured: -1, createdAt: -1 };

    let listings;

    if (q) {
      listings = await Listing.find({
        ...filter,
        $text: { $search: q }
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

    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: "Failed to load listings" });
  }
});

// Listing details
router.get("/listings/:id", async (req, res) => {
  try {
    const listing = await Listing.findOne({
      _id: req.params.id,
      status: "approved"
    }).populate("categoryId");

    if (!listing) return res.status(404).json({ message: "Not found" });

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
      $inc: { [`clicks.${type}`]: 1 }
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
      phone,
      whatsapp = "",
      website = "",
      address = "",
      city,
      state,
      zip = "",
      languages = ["en", "am"],
      tags = [],
      submittedBy = {}
    } = req.body || {};

    if (!title || !categoryId || !phone || !city || !state) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const listing = await Listing.create({
      title,
      description_en,
      description_am,
      categoryId,
      phone,
      whatsapp,
      website,
      address,
      city,
      state,
      zip,
      languages,
      tags,
      status: "pending",
      submittedBy: {
        name: submittedBy?.name || "",
        contact: submittedBy?.contact || ""
      }
    });

    res.status(201).json({
      message: "Submitted for approval",
      id: listing._id
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to submit listing" });
  }
});

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default router;