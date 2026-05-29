import express from "express";
import Listing from "../models/Listing.js";
import Category from "../models/Category.js";

const router = express.Router();

const SITE_URL = "https://www.hubethio.com";

function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(loc, priority = "0.8", changefreq = "weekly") {
  return `
  <url>
    <loc>${escapeXml(loc)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

router.get("/sitemap.xml", async (_req, res) => {
  try {
    const [categories, listings] = await Promise.all([
      Category.find({}).select("slug updatedAt").lean(),
      Listing.find({}).select("_id updatedAt").lean(),
    ]);

    const staticUrls = [
      urlEntry(`${SITE_URL}/`, "1.0", "daily"),
      urlEntry(`${SITE_URL}/submit`, "0.7", "monthly"),
      urlEntry(`${SITE_URL}/category/all`, "0.8", "weekly"),
      urlEntry(`${SITE_URL}/location/alexandria-va`, "0.9", "weekly"),
      urlEntry(`${SITE_URL}/location/silver-spring-md`, "0.9", "weekly"),
      urlEntry(`${SITE_URL}/location/washington-dc`, "0.9", "weekly"),
      urlEntry(`${SITE_URL}/location/falls-church-va`, "0.8", "weekly"),
      urlEntry(`${SITE_URL}/location/arlington-va`, "0.8", "weekly"),
    ];

    const categoryUrls = categories
      .filter((category) => category.slug)
      .map((category) =>
        urlEntry(`${SITE_URL}/category/${category.slug}`, "0.8", "weekly")
      );

    const listingUrls = listings.map((listing) =>
      urlEntry(`${SITE_URL}/listing/${listing._id}`, "0.9", "weekly")
    );

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...categoryUrls, ...listingUrls].join("")}
</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(sitemap);
  } catch (err) {
    console.error("Sitemap generation failed:", err);
    res.status(500).send("Sitemap generation failed");
  }
});

export default router;