import mongoose from "mongoose";

const AdminUserSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Admin" },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
  type: String,
  enum: [
    "super_admin",
    "engineer",
    "operations_admin",
    "verification_agent",
    "support_agent",
  ],
  required: true,
},
  },
  { timestamps: true }
);

export default mongoose.model("AdminUser", AdminUserSchema);
