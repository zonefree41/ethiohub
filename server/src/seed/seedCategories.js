import "dotenv/config";

import { connectDB } from "../config/db.js";
import Category from "../models/Category.js";

const categories = [
  { name_en: "Immigration Lawyer", name_am: "የኢሚግሬሽን ጠበቃ", slug: "immigration-lawyer", icon: "⚖️" },
  { name_en: "Tax Preparer", name_am: "ታክስ አዘጋጅ", slug: "tax-preparer", icon: "🧾" },
  { name_en: "Auto Repair", name_am: "የመኪና ጥገና", slug: "auto-repair", icon: "🚗" },
  { name_en: "Translator", name_am: "ተርጓሚ", slug: "translator", icon: "🗣️" },
  { name_en: "Restaurant", name_am: "ምግብ ቤት", slug: "restaurant", icon: "🍽️" },
  { name_en: "Church / Community", name_am: "ቤተክርስቲያን / ማህበር", slug: "church-community", icon: "⛪" },
  { name_en: "Tutor", name_am: "አስተማሪ", slug: "tutor", icon: "📚" },
  { name_en: "Notary", name_am: "ኖተሪ", slug: "notary", icon: "🖊️" },
  { name_en: "Real Estate Agent", name_am: "የቤት ሽያጭ ወኪል", slug: "real-estate-agent", icon: "🏠" },
  { name_en: "Insurance Agent", name_am: "የኢንሹራንስ ወኪል", slug: "insurance-agent", icon: "🛡️" }
];

try {
  await connectDB(process.env.MONGO_URI);

  await Category.deleteMany({});
  await Category.insertMany(categories);

  console.log("✅ Categories seeded successfully");
  process.exit(0);
} catch (err) {
  console.error("❌ Seed categories failed:", err.message);
  process.exit(1);
}