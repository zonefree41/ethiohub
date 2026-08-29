import mongoose from "mongoose";

const AdminUserSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Admin" },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
  type: String,
  enum: [
    "admin",
    "super_admin",
    "engineer",
    "operations_admin",
    "verification_agent",
    "support_agent",
  ],
  default: "admin",
},
  },
  { timestamps: true }
);

export default mongoose.model("AdminUser", AdminUserSchema);
