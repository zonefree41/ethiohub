import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    resetPasswordToken: {
  type: String,
  default: "",
},

resetPasswordExpires: {
  type: Date,
  default: null,
},

accountStatus: {
  type: String,
  enum: ["active", "invited"],
  default: "active",
},

activationToken: {
  type: String,
  default: "",
},

activationExpires: {
  type: Date,
  default: null,
},

    role: {
      type: String,
      enum: ["owner", "admin"],
      default: "owner",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);