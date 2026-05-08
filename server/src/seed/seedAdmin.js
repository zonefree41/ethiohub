import "dotenv/config";

import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import AdminUser from "../models/AdminUser.js";

try {
  await connectDB(process.env.MONGO_URI);

  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL or ADMIN_PASSWORD missing in .env");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await AdminUser.findOneAndUpdate(
    { email },
    {
      name: "Admin",
      email,
      passwordHash,
      role: "admin"
    },
    { upsert: true, new: true }
  );

  console.log("✅ Admin user created/updated:", email);
  process.exit(0);
} catch (err) {
  console.error("❌ Seed admin failed:", err.message);
  process.exit(1);
}