import express from "express";
import mongoose from "mongoose";

import TravelRequest from "../models/TravelRequest.js";
import {
  requireAdmin,
  requireRole,
} from "../middleware/auth.js";

const router = express.Router();

const ALLOWED_STATUSES = [
  "New",
  "Quoted",
  "Accepted",
  "Declined",
  "Booked",
  "Completed",
  "Cancelled",
];

const ALLOWED_TRIP_TYPES = [
  "One Way",
  "Round Trip",
];

const ALLOWED_SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  departureNewest: {
    departureDate: -1,
    createdAt: -1,
  },
  departureOldest: {
    departureDate: 1,
    createdAt: -1,
  },
  status: {
    status: 1,
    createdAt: -1,
  },
  amountHigh: {
    quoteAmount: -1,
    createdAt: -1,
  },
  amountLow: {
    quoteAmount: 1,
    createdAt: -1,
  },
};

function cleanText(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function escapeRegex(value) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function parsePositiveInteger(
  value,
  fallback,
  maximum
) {
  const number = Number.parseInt(value, 10);

  if (
    !Number.isFinite(number) ||
    number < 1
  ) {
    return fallback;
  }

  return Math.min(number, maximum);
}

function createDateRange(
  startDate,
  endDate
) {
  const range = {};

  if (startDate) {
    const parsedStartDate =
      new Date(startDate);

    if (
      !Number.isNaN(
        parsedStartDate.getTime()
      )
    ) {
      parsedStartDate.setHours(
        0,
        0,
        0,
        0
      );

      range.$gte = parsedStartDate;
    }
  }

  if (endDate) {
    const parsedEndDate =
      new Date(endDate);

    if (
      !Number.isNaN(
        parsedEndDate.getTime()
      )
    ) {
      parsedEndDate.setHours(
        23,
        59,
        59,
        999
      );

      range.$lte = parsedEndDate;
    }
  }

  return Object.keys(range).length
    ? range
    : null;
}

function getAdminIdentity(req) {
  return {
    adminId:
      req.admin?.id ||
      req.admin?._id,

    adminEmail:
      req.admin?.email || "",
  };
}

async function populateTravelRequest(id) {
  return TravelRequest.findById(id)
    .populate(
      "listingId",
      [
        "title",
        "description_en",
        "logoUrl",
        "imageUrl",
        "phone",
        "whatsapp",
        "website",
        "address",
        "city",
        "state",
        "zip",
        "status",
        "isVerified",
        "ownerId",
      ].join(" ")
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
}

/*
|--------------------------------------------------------------------------
| GET ALL TRAVEL REQUESTS
|--------------------------------------------------------------------------
|
| Query parameters:
|
| search
| status
| businessId
| ownerId
| tripType
| airline
| destination
| startDate
| endDate
| sort
| page
| limit
|
*/
router.get(
  "/",
  requireAdmin,
  async (req, res) => {
    try {
      const {
        search,
        status,
        businessId,
        ownerId,
        tripType,
        airline,
        destination,
        startDate,
        endDate,
        sort = "newest",
      } = req.query;

      const page =
        parsePositiveInteger(
          req.query.page,
          1,
          100000
        );

      const limit =
        parsePositiveInteger(
          req.query.limit,
          25,
          100
        );

      const query = {};

      const cleanedStatus =
        cleanText(status);

      if (
        cleanedStatus &&
        cleanedStatus !== "All" &&
        ALLOWED_STATUSES.includes(
          cleanedStatus
        )
      ) {
        query.status = cleanedStatus;
      }

      const cleanedTripType =
        cleanText(tripType);

      if (
        cleanedTripType &&
        cleanedTripType !== "All" &&
        ALLOWED_TRIP_TYPES.includes(
          cleanedTripType
        )
      ) {
        query.tripType =
          cleanedTripType;
      }

      if (
        businessId &&
        mongoose.Types.ObjectId.isValid(
          businessId
        )
      ) {
        query.listingId =
          businessId;
      }

      if (
        ownerId &&
        mongoose.Types.ObjectId.isValid(
          ownerId
        )
      ) {
        query.ownerId = ownerId;
      }

      const departureDateRange =
        createDateRange(
          startDate,
          endDate
        );

      if (departureDateRange) {
        query.departureDate =
          departureDateRange;
      }

      const cleanedAirline =
        cleanText(airline);

      if (
        cleanedAirline &&
        cleanedAirline !== "All"
      ) {
        query.airline = new RegExp(
          escapeRegex(cleanedAirline),
          "i"
        );
      }

      const cleanedDestination =
        cleanText(destination);

      if (cleanedDestination) {
        query.destinationCity =
          new RegExp(
            escapeRegex(
              cleanedDestination
            ),
            "i"
          );
      }

      const cleanedSearch =
        cleanText(search);

      if (cleanedSearch) {
        const safeSearch =
          escapeRegex(cleanedSearch);

        const searchRegex =
          new RegExp(
            safeSearch,
            "i"
          );

        query.$or = [
          {
            customerName:
              searchRegex,
          },
          {
            customerEmail:
              searchRegex,
          },
          {
            customerPhone:
              searchRegex,
          },
          {
            departureCity:
              searchRegex,
          },
          {
            destinationCity:
              searchRegex,
          },
          {
            tripType:
              searchRegex,
          },
          {
            cabinClass:
              searchRegex,
          },
          {
            airline:
              searchRegex,
          },
          {
            flightItinerary:
              searchRegex,
          },
          {
            stops:
              searchRegex,
          },
          {
            baggageAllowance:
              searchRegex,
          },
          {
            notes:
              searchRegex,
          },
          {
            ownerNotes:
              searchRegex,
          },
          {
            adminNotes:
              searchRegex,
          },
        ];
      }

      const selectedSort =
        ALLOWED_SORTS[sort] ||
        ALLOWED_SORTS.newest;

      const skip =
        (page - 1) * limit;

      const [requests, total] =
        await Promise.all([
          TravelRequest.find(query)
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

          TravelRequest.countDocuments(
            query
          ),
        ]);

      return res.json({
        requests,

        pagination: {
          page,
          limit,
          total,

          totalPages: Math.max(
            1,
            Math.ceil(
              total / limit
            )
          ),

          hasNextPage:
            page * limit < total,

          hasPreviousPage:
            page > 1,
        },

        filters: {
          search:
            cleanedSearch,

          status:
            cleanedStatus ||
            "All",

          businessId:
            businessId || "",

          ownerId:
            ownerId || "",

          tripType:
            cleanedTripType ||
            "All",

          airline:
            cleanedAirline ||
            "All",

          destination:
            cleanedDestination,

          startDate:
            startDate || "",

          endDate:
            endDate || "",

          sort,
        },
      });
    } catch (error) {
      console.error(
        "Admin travel requests load failed:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load travel requests.",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| TRAVEL ANALYTICS
|--------------------------------------------------------------------------
*/
router.get(
  "/analytics",
  requireAdmin,
  async (_req, res) => {
    try {
      const now = new Date();

      const startOfToday =
        new Date(now);

      startOfToday.setHours(
        0,
        0,
        0,
        0
      );

      const startOfMonth =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        );

      const [
        total,
        today,
        thisMonth,
        statusCounts,
        tripTypeCounts,
        destinationCounts,
        airlineCounts,
        financialTotals,
        businessCounts,
      ] = await Promise.all([
        TravelRequest.countDocuments(),

        TravelRequest.countDocuments({
          createdAt: {
            $gte: startOfToday,
          },
        }),

        TravelRequest.countDocuments({
          createdAt: {
            $gte: startOfMonth,
          },
        }),

        TravelRequest.aggregate([
          {
            $group: {
              _id: "$status",
              count: {
                $sum: 1,
              },
            },
          },
        ]),

        TravelRequest.aggregate([
          {
            $group: {
              _id: "$tripType",
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

        TravelRequest.aggregate([
          {
            $match: {
              destinationCity: {
                $nin: [
                  null,
                  "",
                ],
              },
            },
          },
          {
            $group: {
              _id: "$destinationCity",
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
          {
            $limit: 10,
          },
        ]),

        TravelRequest.aggregate([
          {
            $match: {
              airline: {
                $nin: [
                  null,
                  "",
                ],
              },
            },
          },
          {
            $group: {
              _id: "$airline",
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
          {
            $limit: 10,
          },
        ]),

        TravelRequest.aggregate([
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
                $sum:
                  "$quoteAmount",
              },

              averageQuoteAmount: {
                $avg:
                  "$quoteAmount",
              },

              quotedRequestCount: {
                $sum: 1,
              },
            },
          },
        ]),

        TravelRequest.aggregate([
          {
            $group: {
              _id: "$listingId",

              requestCount: {
                $sum: 1,
              },

              completedCount: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$status",
                        "Completed",
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },

              quotedValue: {
                $sum: {
                  $ifNull: [
                    "$quoteAmount",
                    0,
                  ],
                },
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
              preserveNullAndEmptyArrays:
                true,
            },
          },
          {
            $project: {
              _id: 1,
              requestCount: 1,
              completedCount: 1,
              quotedValue: 1,

              businessName:
                "$listing.title",

              logoUrl:
                "$listing.logoUrl",
            },
          },
        ]),
      ]);

      const byStatus =
        ALLOWED_STATUSES.reduce(
          (
            result,
            currentStatus
          ) => {
            result[currentStatus] = 0;
            return result;
          },
          {}
        );

      statusCounts.forEach(
        (item) => {
          if (item._id) {
            byStatus[item._id] =
              item.count;
          }
        }
      );

      const quotedFinancials =
        financialTotals[0] || {
          totalQuotedValue: 0,
          averageQuoteAmount: 0,
          quotedRequestCount: 0,
        };

      const acceptedOrLater =
        (byStatus.Accepted || 0) +
        (byStatus.Booked || 0) +
        (byStatus.Completed || 0);

      const respondedQuotes =
        acceptedOrLater +
        (byStatus.Declined || 0);

      const acceptanceRate =
        respondedQuotes > 0
          ? Number(
              (
                (
                  acceptedOrLater /
                  respondedQuotes
                ) *
                100
              ).toFixed(1)
            )
          : 0;

      const bookingRate =
        respondedQuotes > 0
          ? Number(
              (
                (
                  (
                    (byStatus.Booked ||
                      0) +
                    (byStatus.Completed ||
                      0)
                  ) /
                  respondedQuotes
                ) *
                100
              ).toFixed(1)
            )
          : 0;

      const completionRate =
        total > 0
          ? Number(
              (
                (
                  (byStatus.Completed ||
                    0) /
                  total
                ) *
                100
              ).toFixed(1)
            )
          : 0;

      return res.json({
        summary: {
          total,
          today,
          thisMonth,

          active:
            (byStatus.New || 0) +
            (byStatus.Quoted || 0) +
            (byStatus.Accepted || 0) +
            (byStatus.Booked || 0),

          completed:
            byStatus.Completed || 0,

          cancelled:
            byStatus.Cancelled || 0,

          declined:
            byStatus.Declined || 0,
        },

        statusCounts:
          byStatus,

        tripTypeCounts:
          tripTypeCounts.map(
            (item) => ({
              tripType:
                item._id ||
                "Not specified",

              count:
                item.count,
            })
          ),

        popularDestinations:
          destinationCounts.map(
            (item) => ({
              destination:
                item._id,

              count:
                item.count,
            })
          ),

        popularAirlines:
          airlineCounts.map(
            (item) => ({
              airline:
                item._id,

              count:
                item.count,
            })
          ),

        financials: {
          totalQuotedValue:
            quotedFinancials
              .totalQuotedValue ||
            0,

          averageQuoteAmount:
            Number(
              (
                quotedFinancials
                  .averageQuoteAmount ||
                0
              ).toFixed(2)
            ),

          quotedRequestCount:
            quotedFinancials
              .quotedRequestCount ||
            0,
        },

        performance: {
          acceptanceRate,
          bookingRate,
          completionRate,
        },

        topBusinesses:
          businessCounts,
      });
    } catch (error) {
      console.error(
        "Admin travel analytics failed:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load travel analytics.",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| TRAVEL AGENCY FILTER OPTIONS
|--------------------------------------------------------------------------
*/
router.get(
  "/businesses",
  requireAdmin,
  async (_req, res) => {
    try {
      const businesses =
        await TravelRequest.aggregate([
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
            $unwind: {
              path: "$listing",
              preserveNullAndEmptyArrays:
                false,
            },
          },
          {
            $project: {
              _id:
                "$listing._id",

              title:
                "$listing.title",

              logoUrl:
                "$listing.logoUrl",

              city:
                "$listing.city",

              state:
                "$listing.state",

              ownerId:
                "$listing.ownerId",

              requestCount: 1,
            },
          },
          {
            $sort: {
              title: 1,
            },
          },
        ]);

      return res.json(
        businesses
      );
    } catch (error) {
      console.error(
        "Load travel agencies failed:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load travel agencies.",
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
  requireRole(
    "super_admin",
    "operations_admin"
  ),
  async (req, res) => {
    try {
      const {
        status,
        note = "",
      } = req.body || {};

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid travel request ID.",
        });
      }

      if (
        !ALLOWED_STATUSES.includes(
          status
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid travel request status.",
        });
      }

      const request =
        await TravelRequest.findById(
          req.params.id
        );

      if (!request) {
        return res.status(404).json({
          message:
            "Travel request not found.",
        });
      }

      const {
        adminId,
        adminEmail,
      } = getAdminIdentity(req);

      if (!adminId) {
        return res.status(401).json({
          message:
            "Admin authentication is required.",
        });
      }

      const previousStatus =
        request.status;

      request.status = status;

      request.lastAdminUpdatedBy =
        adminId;

      request.lastAdminUpdatedAt =
        new Date();

      if (
        status === "Booked" &&
        !request.bookedAt
      ) {
        request.bookedAt =
          new Date();
      }

      if (
        status === "Completed" &&
        !request.completedAt
      ) {
        request.completedAt =
          new Date();
      }

      if (
        status === "Cancelled" &&
        !request.cancelledAt
      ) {
        request.cancelledAt =
          new Date();
      }

      request.adminAuditLog.push({
        action:
          "Status Updated",

        previousStatus,
        newStatus:
          status,

        note:
          cleanText(note),

        adminId,
        adminEmail,
      });

      await request.save();

      const updatedRequest =
        await populateTravelRequest(
          request._id
        );

      return res.json({
        message:
          "Travel request status updated successfully.",

        request:
          updatedRequest,
      });
    } catch (error) {
      console.error(
        "Update travel request status failed:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to update travel request status.",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| UPDATE TRAVEL QUOTE
|--------------------------------------------------------------------------
*/
router.patch(
  "/:id/quote",
  requireAdmin,
  requireRole(
    "super_admin",
    "operations_admin"
  ),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid travel request ID.",
        });
      }

      const request =
        await TravelRequest.findById(
          id
        );

      if (!request) {
        return res.status(404).json({
          message:
            "Travel request not found.",
        });
      }

      const {
        quoteAmount,
        airline = "",
        flightItinerary = "",
        stops = "",
        baggageAllowance = "",
        quoteExpiresAt = null,
        ownerNotes = "",
        adminNote = "",
      } = req.body || {};

      let parsedQuoteAmount = null;

      if (
        quoteAmount !== "" &&
        quoteAmount !== null &&
        quoteAmount !== undefined
      ) {
        parsedQuoteAmount =
          Number(quoteAmount);

        if (
          !Number.isFinite(
            parsedQuoteAmount
          ) ||
          parsedQuoteAmount < 0
        ) {
          return res.status(400).json({
            message:
              "Invalid quote amount.",
          });
        }
      }

      let parsedQuoteExpiresAt =
        null;

      if (quoteExpiresAt) {
        parsedQuoteExpiresAt =
          new Date(
            quoteExpiresAt
          );

        if (
          Number.isNaN(
            parsedQuoteExpiresAt.getTime()
          )
        ) {
          return res.status(400).json({
            message:
              "Invalid quote expiration date.",
          });
        }
      }

      const {
        adminId,
        adminEmail,
      } = getAdminIdentity(req);

      if (!adminId) {
        return res.status(401).json({
          message:
            "Admin authentication is required.",
        });
      }

      request.quoteAmount =
        parsedQuoteAmount;

      request.airline =
        cleanText(airline);

      request.flightItinerary =
        cleanText(
          flightItinerary
        );

      request.stops =
        cleanText(stops);

      request.baggageAllowance =
        cleanText(
          baggageAllowance
        );

      request.quoteExpiresAt =
        parsedQuoteExpiresAt;

      request.ownerNotes =
        cleanText(ownerNotes);

      request.lastAdminUpdatedBy =
        adminId;

      request.lastAdminUpdatedAt =
        new Date();

      request.adminAuditLog.push({
        action:
          "Quote Updated",

        previousStatus:
          request.status,

        newStatus:
          request.status,

        note:
          cleanText(adminNote) ||
          "Travel quote details updated by admin.",

        adminId,
        adminEmail,
      });

      await request.save();

      const updatedRequest =
        await populateTravelRequest(
          request._id
        );

      return res.json({
        message:
          "Travel quote updated successfully.",

        request:
          updatedRequest,
      });
    } catch (error) {
      console.error(
        "Update travel quote failed:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to update travel quote.",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET ONE TRAVEL REQUEST
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
            "Invalid travel request ID.",
        });
      }

      const request =
        await populateTravelRequest(
          req.params.id
        );

      if (!request) {
        return res.status(404).json({
          message:
            "Travel request not found.",
        });
      }

      return res.json(request);
    } catch (error) {
      console.error(
        "Load admin travel request failed:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load travel request.",
      });
    }
  }
);

export default router;