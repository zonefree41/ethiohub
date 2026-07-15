import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const db = mongoose.connection.db;

await db.collection("categories").updateOne(
  { slug: "transportation" },
  {
    $set: {
      name_en: "Transportation",
      name_am: "መጓጓዣ",
      slug: "transportation",
      icon: "🚚",
      subcategories: [
        "Airport Transportation",
        "Ethiopian Movers",
        "Furniture Delivery",
        "Package Delivery",
        "Cargo & Freight (Sprinter Van)",
        "Charter & Group Transportation",
      ],
    },
  },
  { upsert: true }
);

console.log("✅ Transportation category added.");

await mongoose.disconnect();