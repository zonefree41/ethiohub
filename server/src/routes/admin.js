import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AdminUser from "../models/AdminUser.js";
import Listing from "../models/Listing.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "Email/password required" });

  const admin = await AdminUser.findOne({ email: email.toLowerCase() });
  if (!admin) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: admin._id, email: admin.email, role: admin.role }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });

  res.json({ token });
});

// Pending submissions
router.get("/submissions", requireAdmin, async (req, res) => {
  const status = req.query.status || "pending";
  const items = await Listing.find({ status }).populate("categoryId").sort({ createdAt: -1 }).limit(200);
  res.json(items);
});

// Approve / reject / edit
router.patch("/listings/:id", requireAdmin, async (req, res) => {
  const patch = req.body || {};
  const updated = await Listing.findByIdAndUpdate(req.params.id, patch, { new: true }).populate("categoryId");
  if (!updated) return res.status(404).json({ message: "Not found" });
  res.json(updated);
});

// Delete
router.delete("/listings/:id", requireAdmin, async (req, res) => {
  const deleted = await Listing.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Not found" });
  res.json({ message: "Deleted" });
});

export default router;
