import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name_en: { type: String, required: true, trim: true },
    name_am: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    icon: { type: String, default: "📌" }
  },
  { timestamps: true }
);

export default mongoose.model("Category", CategorySchema);
