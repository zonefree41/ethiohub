import express from "express";
import mongoose from "mongoose";

import TransportationRequest from "../models/TransportationRequest.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

const ALLOWED_STATUSES = [
  "New",
  "Quoted",
  "Accepted",
  "Declined",
  "In Progress",
  "Completed",
  "Cancelled",
];

const ALLOWED_SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  requestedNewest: { requestedDate: -1 },
  requestedOldest: { requestedDate: 1 },
  status: { status: 1, createdAt: -1 },
  amountHigh: { quoteAmount: -1, createdAt: -1 },
  amountLow: { quoteAmount: 1, createdAt: -1 },
};

function cleanText(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parsePositiveInteger(value, fallback, maximum) {
  const number = Number.parseInt(value, 10);

  if (!Number.isFinite(number) || number < 1) {
    return fallback;
  }

  return Math.min(number, maximum);
}

function createDateRange(startDate, endDate) {
  const range = {};

  if (startDate) {
    const parsedStartDate = new Date(startDate);

    if (!Number.isNaN(parsedStartDate.getTime())) {
      parsedStartDate.setHours(0, 0, 0, 0);
      range.$gte = parsedStartDate;
    }
  }

  if (endDate) {
    const parsedEndDate = new Date(endDate);

    if (!Number.isNaN(parsedEndDate.getTime())) {
      parsedEndDate.setHours(23, 59, 59, 999);
      range.$lte = parsedEndDate;
    }
  }

  return Object.keys(range).length ? range : null;
}

/*
|--------------------------------------------------------------------------
| GET ALL TRANSPORTATION REQUESTS
|--------------------------------------------------------------------------
|
| Query parameters:
|
| search
| status
| businessId
| ownerId
| serviceType
| startDate
| endDate
| sort
| page
| limit
|
*/
router.get("/", requireAdmin, async (req, res) => {
  try {
    const {
      search,
      status,
      businessId,
      ownerId,
      serviceType,
      startDate,
      endDate,
      sort = "newest",
    } = req.query;

    const page = parsePositiveInteger(
      req.query.page,
      1,
      100000
    );

    const limit = parsePositiveInteger(
      req.query.limit,
      25,
      100
    );

    const query = {};

    const cleanedStatus = cleanText(status);

    if (
      cleanedStatus &&
      cleanedStatus !== "All" &&
      ALLOWED_STATUSES.includes(cleanedStatus)
    ) {
      query.status = cleanedStatus;
    }

    const cleanedServiceType = cleanText(serviceType);

    if (
      cleanedServiceType &&
      cleanedServiceType !== "All"
    ) {
      query.serviceType = cleanedServiceType;
    }

    if (
      businessId &&
      mongoose.Types.ObjectId.isValid(businessId)
    ) {
      query.listingId = businessId;
    }

    if (
      ownerId &&
      mongoose.Types.ObjectId.isValid(ownerId)
    ) {
      query.ownerId = ownerId;
    }

    const requestedDateRange = createDateRange(
      startDate,
      endDate
    );

    if (requestedDateRange) {
      query.requestedDate = requestedDateRange;
    }

    const cleanedSearch = cleanText(search);

    if (cleanedSearch) {
      const safeSearch = escapeRegex(cleanedSearch);
      const searchRegex = new RegExp(safeSearch, "i");

      query.$or = [
        { customerName: searchRegex },
        { customerEmail: searchRegex },
        { customerPhone: searchRegex },
        { pickupAddress: searchRegex },
        { deliveryAddress: searchRegex },
        { cargoDetails: searchRegex },
        { serviceType: searchRegex },
        { driverName: searchRegex },
        { driverPhone: searchRegex },
        { vehicleDescription: searchRegex },
        { licensePlate: searchRegex },
        { adminNotes: searchRegex },
      ];
    }

    const selectedSort =
      ALLOWED_SORTS[sort] ||
      ALLOWED_SORTS.newest;

    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      TransportationRequest.find(query)
        .populate(
          "listingId",
          "title logoUrl imageUrl phone city state status ownerId"
        )
        .populate(
          "ownerId",
          "name email phone role"
        )
        .populate(
          "lastAdminUpdatedBy",
          "email role"
        )
        .sort(selectedSort)
        .skip(skip)
        .limit(limit)
        .lean(),

      TransportationRequest.countDocuments(query),
    ]);

    res.json({
      requests,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(
          1,
          Math.ceil(total / limit)
        ),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },

      filters: {
        search: cleanedSearch,
        status: cleanedStatus || "All",
        businessId: businessId || "",
        ownerId: ownerId || "",
        serviceType: cleanedServiceType || "All",
        startDate: startDate || "",
        endDate: endDate || "",
        sort,
      },
    });
  } catch (error) {
    console.error(
      "Admin transportation requests load failed:",
      error
    );

    res.status(500).json({
      message:
        "Failed to load transportation requests.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| ANALYTICS
|--------------------------------------------------------------------------
*/
router.get(
  "/analytics",
  requireAdmin,
  async (req, res) => {
    try {
      const now = new Date();

      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

      const [
        total,
        today,
        thisMonth,
        statusCounts,
        serviceTypeCounts,
        financialTotals,
        businessCounts,
      ] = await Promise.all([
        TransportationRequest.countDocuments(),

        TransportationRequest.countDocuments({
          createdAt: {
            $gte: startOfToday,
          },
        }),

        TransportationRequest.countDocuments({
          createdAt: {
            $gte: startOfMonth,
          },
        }),

        TransportationRequest.aggregate([
          {
            $group: {
              _id: "$status",
              count: {
                $sum: 1,
              },
            },
          },
        ]),

        TransportationRequest.aggregate([
          {
            $group: {
              _id: "$serviceType",
              count: {
                $sum: 1,
              },
            },
          },
          {
            $sort: {
              count: -1,
            },
          },
        ]),

        TransportationRequest.aggregate([
          {
            $match: {
              quoteAmount: {
                $ne: null,
              },
            },
          },
          {
            $group: {
              _id: null,

              totalQuotedValue: {
                $sum: "$quoteAmount",
              },

              averageQuoteAmount: {
                $avg: "$quoteAmount",
              },

              quotedRequestCount: {
                $sum: 1,
              },
            },
          },
        ]),

        TransportationRequest.aggregate([
          {
            $group: {
              _id: "$listingId",
              requestCount: {
                $sum: 1,
              },
            },
          },
          {
            $sort: {
              requestCount: -1,
            },
          },
          {
            $limit: 10,
          },
          {
            $lookup: {
              from: "listings",
              localField: "_id",
              foreignField: "_id",
              as: "listing",
            },
          },
          {
            $unwind: {
              path: "$listing",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 1,
              requestCount: 1,
              businessName: "$listing.title",
              logoUrl: "$listing.logoUrl",
            },
          },
        ]),
      ]);

      const byStatus = ALLOWED_STATUSES.reduce(
        (result, currentStatus) => {
          result[currentStatus] = 0;
          return result;
        },
        {}
      );

      statusCounts.forEach((item) => {
        if (item._id) {
          byStatus[item._id] = item.count;
        }
      });

      const quotedFinancials =
        financialTotals[0] || {
          totalQuotedValue: 0,
          averageQuoteAmount: 0,
          quotedRequestCount: 0,
        };

      const acceptedOrLater =
        (byStatus.Accepted || 0) +
        (byStatus["In Progress"] || 0) +
        (byStatus.Completed || 0);

      const respondedQuotes =
        acceptedOrLater +
        (byStatus.Declined || 0);

      const acceptanceRate =
        respondedQuotes > 0
          ? Number(
              (
                (acceptedOrLater /
                  respondedQuotes) *
                100
              ).toFixed(1)
            )
          : 0;

      const completionRate =
        total > 0
          ? Number(
              (
                ((byStatus.Completed || 0) /
                  total) *
                100
              ).toFixed(1)
            )
          : 0;

      res.json({
        summary: {
          total,
          today,
          thisMonth,

          active:
            (byStatus.New || 0) +
            (byStatus.Quoted || 0) +
            (byStatus.Accepted || 0) +
            (byStatus["In Progress"] || 0),

          completed:
            byStatus.Completed || 0,

          cancelled:
            byStatus.Cancelled || 0,

          declined:
            byStatus.Declined || 0,
        },

        statusCounts: byStatus,

        serviceTypeCounts: serviceTypeCounts.map(
          (item) => ({
            serviceType: item._id || "Other",
            count: item.count,
          })
        ),

        financials: {
          totalQuotedValue:
            quotedFinancials.totalQuotedValue || 0,

          averageQuoteAmount: Number(
            (
              quotedFinancials.averageQuoteAmount ||
              0
            ).toFixed(2)
          ),

          quotedRequestCount:
            quotedFinancials.quotedRequestCount ||
            0,
        },

        performance: {
          acceptanceRate,
          completionRate,
        },

        topBusinesses: businessCounts,
      });
    } catch (error) {
      console.error(
        "Admin transportation analytics failed:",
        error
      );

      res.status(500).json({
        message:
          "Failed to load transportation analytics.",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| BUSINESS FILTER OPTIONS
|--------------------------------------------------------------------------
*/
router.get(
  "/businesses",
  requireAdmin,
  async (_req, res) => {
    try {
      const businesses =
        await TransportationRequest.aggregate([
          {
            $group: {
              _id: "$listingId",

              requestCount: {
                $sum: 1,
              },
            },
          },
          {
            $lookup: {
              from: "listings",
              localField: "_id",
              foreignField: "_id",
              as: "listing",
            },
          },
          {
            $unwind: "$listing",
          },
          {
            $project: {
              _id: "$listing._id",
              title: "$listing.title",
              logoUrl: "$listing.logoUrl",
              city: "$listing.city",
              state: "$listing.state",
              requestCount: 1,
            },
          },
          {
            $sort: {
              title: 1,
            },
          },
        ]);

      res.json(businesses);
    } catch (error) {
      console.error(
        "Load transportation businesses failed:",
        error
      );

      res.status(500).json({
        message:
          "Failed to load transportation businesses.",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| UPDATE REQUEST STATUS
|--------------------------------------------------------------------------
*/
router.patch(
  "/:id/status",
  requireAdmin,
  async (req, res) => {
    try {
      const { status, note = "" } = req.body || {};

      const allowedStatuses = [
        "New",
        "Quoted",
        "Accepted",
        "Declined",
        "In Progress",
        "Completed",
        "Cancelled",
      ];

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid transportation request ID.",
        });
      }

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message:
            "Invalid transportation request status.",
        });
      }

      const request =
        await TransportationRequest.findById(
          req.params.id
        );

      if (!request) {
        return res.status(404).json({
          message:
            "Transportation request not found.",
        });
      }

      const previousStatus = request.status;

      request.status = status;
      request.lastAdminUpdatedBy = req.admin.id;
      request.lastAdminUpdatedAt = new Date();

      request.adminAuditLog.push({
        action: "Status Updated",
        previousStatus,
        newStatus: status,
        note: String(note || "").trim(),
        adminId: req.admin.id,
        adminEmail: req.admin.email || "",
      });

      await request.save();

      const updatedRequest =
        await TransportationRequest.findById(
          request._id
        )
          .populate(
            "listingId",
            "title description_en logoUrl imageUrl phone whatsapp website address city state zip status isVerified ownerId"
          )
          .populate(
            "ownerId",
            "name email phone role createdAt"
          )
          .populate(
            "lastAdminUpdatedBy",
            "email role"
          )
          .populate(
            "adminAuditLog.adminId",
            "email role"
          )
          .lean();

      res.json({
        message:
          "Transportation request status updated successfully.",
        request: updatedRequest,
      });
    } catch (error) {
      console.error(
        "Update transportation request status failed:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update transportation request status.",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| ASSIGN OR UPDATE DRIVER
|--------------------------------------------------------------------------
*/
router.patch(
  "/:id/driver",
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: "Invalid transportation request ID.",
        });
      }

      const request =
        await TransportationRequest.findById(id);

      if (!request) {
        return res.status(404).json({
          message: "Transportation request not found.",
        });
      }

      const {
        driverName,
        driverPhone,
        vehicleDescription,
        licensePlate,
      } = req.body || {};

      request.driverName = cleanText(driverName);
      request.driverPhone = cleanText(driverPhone);
      request.vehicleDescription = cleanText(
        vehicleDescription
      );
      request.licensePlate = cleanText(licensePlate);

      request.lastAdminUpdatedBy = req.admin.id;
      request.lastAdminUpdatedAt = new Date();

      request.adminAuditLog.push({
        action: "Driver Assigned",
        note: request.driverName
          ? `Driver assigned: ${request.driverName}`
          : "Driver information cleared.",
        adminId: req.admin.id,
        adminEmail: req.admin.email || "",
      });

      await request.save();

      const updatedRequest =
        await TransportationRequest.findById(
          request._id
        )
          .populate(
            "listingId",
            "title description_en logoUrl imageUrl phone whatsapp website address city state zip status isVerified ownerId"
          )
          .populate(
            "ownerId",
            "name email phone role createdAt"
          )
          .populate(
            "lastAdminUpdatedBy",
            "email role"
          )
          .populate(
            "adminAuditLog.adminId",
            "email role"
          )
          .lean();

      res.json({
        message:
          "Driver information updated successfully.",
        request: updatedRequest,
      });
    } catch (error) {
      console.error(
        "Update transportation driver failed:",
        error
      );

      res.status(500).json({
        message:
          "Unable to update driver information.",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET ONE REQUEST
|--------------------------------------------------------------------------
|
| Keep this route after /analytics and /businesses.
|
*/
router.get(
  "/:id",
  requireAdmin,
  async (req, res) => {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid transportation request ID.",
        });
      }

      const request =
        await TransportationRequest.findById(
          req.params.id
        )
          .populate(
            "listingId",
            "title description_en logoUrl imageUrl phone whatsapp website address city state zip status isVerified ownerId"
          )
          .populate(
            "ownerId",
            "name email phone role createdAt"
          )
          .populate(
            "lastAdminUpdatedBy",
            "email role"
          )
          .populate(
            "adminAuditLog.adminId",
            "email role"
          )
          .lean();

      if (!request) {
        return res.status(404).json({
          message:
            "Transportation request not found.",
        });
      }

      res.json(request);
    } catch (error) {
      console.error(
        "Load admin transportation request failed:",
        error
      );

      res.status(500).json({
        message:
          "Failed to load transportation request.",
      });
    }
  }
);

export default router;