import express from "express";
import Listing from "../models/Listing.js";
import Category from "../models/Category.js";

const router = express.Router();

const SITE_URL = "https://www.hubethio.com";

function xmlUrl(loc, lastmod) {
  return `
  <url>
    <loc>${loc}</loc>
    ${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ""}
  </url>`;
}

router.get("/sitemap.xml", async (req, res) => {
  try {
    const listings = await Listing.find({ status: "approved" })
      .select("_id updatedAt city state")
      .limit(5000);

    const categories = await Category.find({})
      .select("slug name_en updatedAt")
      .limit(500);

    const locations = await Listing.aggregate([
      { $match: { status: "approved", city: { $ne: "" }, state: { $ne: "" } } },
      {
        $group: {
          _id: {
            city: "$city",
            state: "$state",
          },
          updatedAt: { $max: "$updatedAt" },
        },
      },
      { $limit: 1000 },
    ]);

    const staticUrls = [
      xmlUrl(`${SITE_URL}/`),
      xmlUrl(`${SITE_URL}/pricing`),
      xmlUrl(`${SITE_URL}/contact`),
      xmlUrl(`${SITE_URL}/privacy`),
      xmlUrl(`${SITE_URL}/terms`),
    ];

    const categoryUrls = categories.map((cat) => {
      const slug =
        cat.slug ||
        cat.name_en?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      return xmlUrl(`${SITE_URL}/category/${slug}`, cat.updatedAt);
    });

    const listingUrls = listings.map((listing) =>
      xmlUrl(`${SITE_URL}/listing/${listing._id}`, listing.updatedAt)
    );

    const locationUrls = locations.map((item) => {
      const city = item._id.city.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const state = item._id.state.toLowerCase();

      return xmlUrl(`${SITE_URL}/location/${city}-${state}`, item.updatedAt);
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...categoryUrls, ...locationUrls, ...listingUrls].join("")}
</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (err) {
    console.error("❌ Sitemap generation failed:", err);
    res.status(500).send("Sitemap generation failed");
  }
});

export default router;