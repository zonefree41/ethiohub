import express from "express";
import mongoose from "mongoose";

import multer from "multer";

import { fileTypeFromBuffer } from "file-type";

import cloudinary from "../config/cloudinary.js";

import TransportationDriver from "../models/TransportationDriver.js";
import TransportationRequest from "../models/TransportationRequest.js";
import { sendTransportationStatusEmail } from "../utils/sendTransportationStatusEmail.js";
import { autoDispatchTransportationDriver } from "../utils/autoDispatchTransportationDriver.js";
import { sendTransportationDispatchFallbackEmail } from "../utils/sendTransportationDispatchFallbackEmail.js";
import { requireDriver } from "../middleware/driverAuth.js";

const router = express.Router();

const driverVerificationUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ];

    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Only JPEG, PNG, WebP, HEIC, and HEIF images are allowed"
        )
      );
    }

    return cb(null, true);
  },
});

function uploadDriverVerificationDocument(buffer, driverId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `hubethio/driver-verification/${driverId}`,
        resource_type: "image",
        type: "authenticated",
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );

    stream.end(buffer);
  });
}

router.use(requireDriver);

router.post(
  "/verification/document",
  (req, res, next) => {
    if (
      ["pending", "approved"].includes(
        req.driver.verificationStatus
      )
    ) {
      return res.status(409).json({
        message:
          "Verification documents cannot be uploaded while verification is pending or already approved.",
      });
    }

    return next();
  },
  driverVerificationUpload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "No verification document uploaded.",
        });
      }

      const detectedType = await fileTypeFromBuffer(
        req.file.buffer
      );

      const allowedImageTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
        "image/heif",
      ];

      if (
        !detectedType ||
        !allowedImageTypes.includes(detectedType.mime)
      ) {
        return res.status(400).json({
          message:
            "Uploaded file content is not a supported image.",
        });
      }

      const result =
        await uploadDriverVerificationDocument(
          req.file.buffer,
          req.driver.id
        );

      return res.json({
        publicId: result.public_id,
      });
    } catch (err) {
      console.error(
        "Driver verification document upload error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to upload driver verification document.",
      });
    }
  }
);

router.get("/me", async (req, res) => {
  try {
    const driver = await TransportationDriver.findById(
      req.driver.id
    ).select(
      "_id ownerId businessListingId fullName email phone serviceTypes driverAccountStatus status verificationStatus driverLicenseNumber driverLicenseState driverLicenseExpirationDate driverLicenseFrontPublicId driverLicenseBackPublicId verificationSubmittedAt verificationRejectionReason availabilityStatus createdAt updatedAt"
    );

    if (!driver) {
      return res.status(404).json({
        message: "Transportation driver not found.",
      });
    }

    return res.json({
      driver,
    });
  } catch (err) {
    console.error(
      "Get Transportation driver profile error:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to load Transportation driver profile.",
    });
  }
});

router.patch("/verification", async (req, res) => {
  try {
    const {
      driverLicenseNumber,
      driverLicenseState,
      driverLicenseExpirationDate,
      driverLicenseFrontPublicId,
      driverLicenseBackPublicId,
    } = req.body || {};

    const cleanLicenseNumber =
      typeof driverLicenseNumber === "string"
        ? driverLicenseNumber.trim()
        : "";

    const cleanLicenseState =
      typeof driverLicenseState === "string"
        ? driverLicenseState.trim()
        : "";

    const cleanFrontPublicId =
      typeof driverLicenseFrontPublicId === "string"
        ? driverLicenseFrontPublicId.trim()
        : "";

    const cleanBackPublicId =
      typeof driverLicenseBackPublicId === "string"
        ? driverLicenseBackPublicId.trim()
        : "";

    if (
      !cleanLicenseNumber ||
      !cleanLicenseState ||
      !driverLicenseExpirationDate ||
      !cleanFrontPublicId ||
      !cleanBackPublicId
    ) {
      return res.status(400).json({
        message:
          "Driver license number, state, expiration date, and front/back images are required.",
      });
    }

    const expectedDocumentPrefix =
      `hubethio/driver-verification/${req.driver.id}/`;

    if (
      !cleanFrontPublicId.startsWith(expectedDocumentPrefix) ||
      !cleanBackPublicId.startsWith(expectedDocumentPrefix)
    ) {
      return res.status(400).json({
        message:
          "Verification documents must belong to the signed-in driver.",
      });
    }

    if (cleanLicenseNumber.length > 80) {
      return res.status(400).json({
        message:
          "Driver license number must be 80 characters or fewer.",
      });
    }

    if (cleanLicenseState.length > 40) {
      return res.status(400).json({
        message:
          "Driver license state must be 40 characters or fewer.",
      });
    }

    const expirationDate = new Date(
      driverLicenseExpirationDate
    );

    if (Number.isNaN(expirationDate.getTime())) {
      return res.status(400).json({
        message:
          "A valid driver license expiration date is required.",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expirationDay = new Date(expirationDate);
    expirationDay.setHours(0, 0, 0, 0);

    if (expirationDay < today) {
      return res.status(400).json({
        message:
          "Driver license must not be expired.",
      });
    }

    const driver =
      await TransportationDriver.findById(
        req.driver.id
      );

    if (!driver) {
      return res.status(404).json({
        message: "Transportation driver not found.",
      });
    }

    if (
      ["pending", "approved"].includes(
        driver.verificationStatus
      )
    ) {
      return res.status(409).json({
        message:
          "Driver verification cannot be resubmitted while pending or already approved.",
      });
    }

    driver.driverLicenseNumber = cleanLicenseNumber;
    driver.driverLicenseState = cleanLicenseState;
    driver.driverLicenseExpirationDate =
      expirationDate;
    driver.driverLicenseFrontPublicId = cleanFrontPublicId;
    driver.driverLicenseBackPublicId = cleanBackPublicId;
    driver.verificationStatus = "pending";
    driver.verificationSubmittedAt = new Date();
    driver.verificationRejectionReason = "";

    await driver.save();

    return res.json({
      message:
        "Driver verification submitted for review.",
      driver: {
        _id: driver._id,
        verificationStatus:
          driver.verificationStatus,
        driverLicenseNumber:
          driver.driverLicenseNumber,
        driverLicenseState:
          driver.driverLicenseState,
        driverLicenseExpirationDate:
          driver.driverLicenseExpirationDate,
        driverLicenseFrontPublicId:
          driver.driverLicenseFrontPublicId,
        driverLicenseBackPublicId:
          driver.driverLicenseBackPublicId,
        verificationSubmittedAt:
          driver.verificationSubmittedAt,
        verificationRejectionReason:
          driver.verificationRejectionReason,
      },
    });
  } catch (err) {
    console.error(
      "Submit Transportation driver verification error:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to submit driver verification.",
    });
  }
});

router.get("/jobs", async (req, res) => {
  try {
    const requests = await TransportationRequest.find({
      driverId: req.driver.id,
    })
      .select(
        "_id listingId customerName customerPhone pickupAddress deliveryAddress requestedDate requestedTime cargoDetails cargoPhotos serviceType status quoteAmount estimatedArrival driverName driverPhone vehicleDescription licensePlate driverAssignedAt inProgressAt completedAt cancelledAt createdAt updatedAt"
      )
      .sort({ createdAt: -1 })
      .populate("listingId", "title");

    return res.json(requests);
  } catch (err) {
    console.error(
      "Load Transportation driver jobs error:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to load assigned Transportation jobs.",
    });
  }
});

router.patch("/jobs/:requestId/accept", async (req, res) => {
  try {
    const { requestId } = req.params;

    if (
      typeof requestId !== "string" ||
      !mongoose.Types.ObjectId.isValid(requestId)
    ) {
      return res.status(400).json({
        message: "Valid Transportation request ID is required.",
      });
    }

    const request = await TransportationRequest.findOne({
      _id: requestId,
      driverId: req.driver.id,
    });

    if (!request) {
      return res.status(404).json({
        message: "Assigned Transportation job not found.",
      });
    }

    if (request.status !== "Accepted") {
      return res.status(400).json({
        message:
          "Only an Accepted Transportation job can be accepted by the driver.",
      });
    }

    request.status = "In Progress";

    if (!request.inProgressAt) {
      request.inProgressAt = new Date();
    }

    await request.save();

    await TransportationDriver.updateOne(
      {
        _id: req.driver.id,
      },
      {
        $set: {
          availabilityStatus: "busy",
        },
      }
    );

    try {
  if (request.customerEmail) {
    await sendTransportationStatusEmail(request);
  }
} catch (err) {
  console.error(
    "Transportation status email failed:",
    err
  );
}

    return res.json({
      request: {
        _id: request._id,
        status: request.status,
        inProgressAt: request.inProgressAt,
      },
    });
  } catch (err) {
    console.error(
      "Accept Transportation driver job error:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to accept assigned Transportation job.",
    });
  }
});

router.patch("/jobs/:requestId/decline", async (req, res) => {
  try {
    const { requestId } = req.params;

    if (
      typeof requestId !== "string" ||
      !mongoose.Types.ObjectId.isValid(requestId)
    ) {
      return res.status(400).json({
        message: "Valid Transportation request ID is required.",
      });
    }

    const request = await TransportationRequest.findOne({
      _id: requestId,
      driverId: req.driver.id,
    });

    if (!request) {
      return res.status(404).json({
        message: "Assigned Transportation job not found.",
      });
    }

    if (request.status !== "Accepted") {
      return res.status(400).json({
        message:
          "Only an Accepted Transportation job can be declined by the driver.",
      });
    }

    if (
      !request.declinedDriverIds.some(
        (driverId) => String(driverId) === String(req.driver.id)
      )
    ) {
      request.declinedDriverIds.push(req.driver.id);
    }

    request.driverId = null;
    request.driverName = "";
    request.driverPhone = "";
    request.vehicleDescription = "";
    request.licensePlate = "";
    request.driverAssignedAt = null;

    await request.save();

    await TransportationDriver.updateOne(
      {
        _id: req.driver.id,
      },
      {
        $set: {
          availabilityStatus: "available",
        },
      }
    );

    try {
      const reassignedDriver =
        await autoDispatchTransportationDriver(request, {
          excludeDriverIds: [req.driver.id],
        });

      if (!reassignedDriver) {
        try {
          await sendTransportationDispatchFallbackEmail(request);
        } catch (emailError) {
          console.error(
            "Transportation dispatch fallback email failed:",
            emailError
          );
        }
      }
    } catch (dispatchError) {
      console.error(
        "Transportation driver redispatch failed:",
        dispatchError
      );
    }

    return res.json({
      request: {
        _id: request._id,
        status: request.status,
        driverId: request.driverId,
        driverName: request.driverName,
        driverPhone: request.driverPhone,
        vehicleDescription: request.vehicleDescription,
        licensePlate: request.licensePlate,
        driverAssignedAt: request.driverAssignedAt,
      },
    });
  } catch (err) {
    console.error(
      "Decline Transportation driver job error:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to decline assigned Transportation job.",
    });
  }
});


router.patch("/jobs/:requestId/complete", async (req, res) => {
  try {
    const { requestId } = req.params;

    if (
      typeof requestId !== "string" ||
      !mongoose.Types.ObjectId.isValid(requestId)
    ) {
      return res.status(400).json({
        message: "Valid Transportation request ID is required.",
      });
    }

    const request = await TransportationRequest.findOne({
      _id: requestId,
      driverId: req.driver.id,
    });

    if (!request) {
      return res.status(404).json({
        message: "Assigned Transportation job not found.",
      });
    }

    if (request.status !== "In Progress") {
      return res.status(400).json({
        message:
          "Only an In Progress Transportation job can be completed.",
      });
    }

    request.status = "Completed";

    if (!request.completedAt) {
      request.completedAt = new Date();
    }

    await request.save();

    try {
      await TransportationDriver.updateOne(
        {
          _id: req.driver.id,
          availabilityStatus: "busy",
        },
        {
          $set: {
            availabilityStatus: "available",
          },
        }
      );
    } catch (err) {
      console.error(
        "Transportation driver available update failed:",
        err
      );
    }

    try {
      await sendTransportationStatusEmail(request);
    } catch (err) {
      console.error(
        "Transportation driver completion email failed:",
        err
      );
    }

    return res.json({
      request: {
        _id: request._id,
        status: request.status,
        completedAt: request.completedAt,
      },
    });
  } catch (err) {
    console.error(
      "Complete Transportation driver job error:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to complete assigned Transportation job.",
    });
  }
});
router.patch("/availability", async (req, res) => {
  try {
    const { availabilityStatus } = req.body || {};

    if (
      !["available", "offline"].includes(
        availabilityStatus
      )
    ) {
      return res.status(400).json({
        message:
          "Availability must be available or offline.",
      });
    }

    const driver = await TransportationDriver.findById(
      req.driver.id
    ).select(
      "_id ownerId businessListingId fullName email phone serviceTypes driverAccountStatus status verificationStatus availabilityStatus createdAt updatedAt"
    );

    if (!driver) {
      return res.status(404).json({
        message: "Transportation driver not found.",
      });
    }

    if (driver.availabilityStatus === "busy") {
      return res.status(409).json({
        message:
          "Availability cannot be changed while a Transportation job is in progress.",
      });
    }

    if (
      availabilityStatus === "available" &&
      (
        driver.status !== "active" ||
        driver.verificationStatus !== "approved"
      )
    ) {
      return res.status(403).json({
        message:
          "Driver must be active and approved to go available.",
      });
    }

    driver.availabilityStatus = availabilityStatus;
    await driver.save();

    return res.json({
      driver,
    });
  } catch (err) {
    console.error(
      "Update Transportation driver availability error:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to update Transportation driver availability.",
    });
  }
});


router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: "Uploaded verification document is too large.",
      });
    }

    return res.status(400).json({
      message: err.message || "Verification upload failed.",
    });
  }

  if (
    err?.message?.includes(
      "Only JPEG, PNG, WebP, HEIC, and HEIF images are allowed"
    )
  ) {
    return res.status(400).json({
      message: err.message,
    });
  }

  return next(err);
});

export default router;
