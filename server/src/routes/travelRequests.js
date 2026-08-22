import express from "express";
import crypto from "crypto";

import Listing from "../models/Listing.js";
import TravelRequest from "../models/TravelRequest.js";
import { requireOwner } from "../middleware/ownerAuth.js";
import { sendEmail } from "../utils/sendEmail.js";
import mongoose from "mongoose";


const router = express.Router();

const ALLOWED_TRIP_TYPES = [
  "One Way",
  "Round Trip",
];

const ALLOWED_CABIN_CLASSES = [
  "Economy",
  "Premium Economy",
  "Business",
  "First",
];

function cleanText(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parsePassengerCount(value, fallback = 0) {
  const number = Number.parseInt(value, 10);

  if (!Number.isFinite(number) || number < 0) {
    return fallback;
  }

  return number;
}

/*
|--------------------------------------------------------------------------
| SUBMIT TRAVEL REQUEST
|--------------------------------------------------------------------------
|
| POST /api/travel-requests
|
*/
router.post("/", async (req, res) => {
  try {
    const {
      listingId,
      customerName,
      customerEmail = "",
      customerPhone,

      tripType = "Round Trip",
      departureCity,
      destinationCity,
      departureDate,
      returnDate = null,

      adults = 1,
      children = 0,
      infants = 0,

      cabinClass = "Economy",
      directFlightPreferred = false,
      flexibleDates = false,

      hotelNeeded = false,
      visaAssistance = false,
      travelInsurance = false,

      budget = null,
      notes = "",
    } = req.body || {};

    const cleanedCustomerName =
      cleanText(customerName);

    const cleanedCustomerEmail =
      cleanText(customerEmail).toLowerCase();

    const cleanedCustomerPhone =
      cleanText(customerPhone);

    const cleanedDepartureCity =
      cleanText(departureCity);

    const cleanedDestinationCity =
      cleanText(destinationCity);

    const cleanedNotes =
      cleanText(notes);

    if (!listingId) {
      return res.status(400).json({
        message: "Travel agency is required.",
      });
    }

    if (!cleanedCustomerName) {
      return res.status(400).json({
        message: "Your name is required.",
      });
    }

    if (!cleanedCustomerPhone) {
      return res.status(400).json({
        message: "Your phone number is required.",
      });
    }

    if (
      cleanedCustomerEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanedCustomerEmail
      )
    ) {
      return res.status(400).json({
        message:
          "Please enter a valid email address.",
      });
    }

    if (!ALLOWED_TRIP_TYPES.includes(tripType)) {
      return res.status(400).json({
        message: "Invalid trip type.",
      });
    }

    if (!cleanedDepartureCity) {
      return res.status(400).json({
        message:
          "Departure city or airport is required.",
      });
    }

    if (!cleanedDestinationCity) {
      return res.status(400).json({
        message:
          "Destination city or airport is required.",
      });
    }

    if (!departureDate) {
      return res.status(400).json({
        message: "Departure date is required.",
      });
    }

    const parsedDepartureDate =
      new Date(departureDate);

    if (
      Number.isNaN(
        parsedDepartureDate.getTime()
      )
    ) {
      return res.status(400).json({
        message:
          "Please enter a valid departure date.",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (parsedDepartureDate < today) {
      return res.status(400).json({
        message:
          "Departure date cannot be in the past.",
      });
    }

    let parsedReturnDate = null;

    if (tripType === "Round Trip") {
      if (!returnDate) {
        return res.status(400).json({
          message:
            "Return date is required for a round trip.",
        });
      }

      parsedReturnDate = new Date(returnDate);

      if (
        Number.isNaN(
          parsedReturnDate.getTime()
        )
      ) {
        return res.status(400).json({
          message:
            "Please enter a valid return date.",
        });
      }

      if (
        parsedReturnDate <
        parsedDepartureDate
      ) {
        return res.status(400).json({
          message:
            "Return date cannot be before departure date.",
        });
      }
    }

    if (
      !ALLOWED_CABIN_CLASSES.includes(
        cabinClass
      )
    ) {
      return res.status(400).json({
        message: "Invalid cabin class.",
      });
    }

    const parsedAdults =
      parsePassengerCount(adults, 1);

    const parsedChildren =
      parsePassengerCount(children, 0);

    const parsedInfants =
      parsePassengerCount(infants, 0);

    if (parsedAdults < 1) {
      return res.status(400).json({
        message:
          "At least one adult traveler is required.",
      });
    }

    if (
      parsedAdults +
        parsedChildren +
        parsedInfants >
      20
    ) {
      return res.status(400).json({
        message:
          "A maximum of 20 travelers is allowed per request.",
      });
    }

    let parsedBudget = null;

    if (
      budget !== null &&
      budget !== undefined &&
      budget !== ""
    ) {
      parsedBudget = Number(budget);

      if (
        !Number.isFinite(parsedBudget) ||
        parsedBudget < 0
      ) {
        return res.status(400).json({
          message:
            "Please enter a valid travel budget.",
        });
      }
    }

    if (
  typeof listingId !== "string" ||
  !mongoose.Types.ObjectId.isValid(
    listingId.trim()
  )
) {
  return res.status(400).json({
    message: "Invalid listing ID.",
  });
}

    const listing = await Listing.findOne({
  _id: listingId,
  status: "approved",
})
  .populate(
    "ownerId",
    "name email"
  )
  .populate(
    "categoryId",
    "name_en slug"
  );

    if (!listing) {
      return res.status(404).json({
        message:
          "Travel agency listing not found.",
      });
    }

    const isTravelListing =
      listing.categoryId?.slug ===
        "travel-tours" ||
      listing.categoryId?.name_en ===
        "Travel & Tours" ||
      [
        "Travel Agencies",
        "Holy Land & Pilgrimage Tours",
        "Flight Booking",
        "Visa Assistance",
        "Hotels & Accommodation",
        "Tour Operators",
        "Hajj & Umrah",
        "Vacation Packages",
      ].includes(listing.subcategory);

    if (!isTravelListing) {
      return res.status(400).json({
        message:
          "The selected listing is not a travel business.",
      });
    }

    if (!listing.ownerId) {
      return res.status(400).json({
        message:
          "This travel agency is not currently accepting travel requests.",
      });
    }

    const request =
      await TravelRequest.create({
        listingId: listing._id,
        ownerId: listing.ownerId._id,

        customerName:
          cleanedCustomerName,

        customerEmail:
          cleanedCustomerEmail,

        customerPhone:
          cleanedCustomerPhone,

        tripType,

        departureCity:
          cleanedDepartureCity,

        destinationCity:
          cleanedDestinationCity,

        departureDate:
          parsedDepartureDate,

        returnDate:
          parsedReturnDate,

        adults:
          parsedAdults,

        children:
          parsedChildren,

        infants:
          parsedInfants,

        cabinClass,

        directFlightPreferred:
          directFlightPreferred === true ||
          directFlightPreferred === "true",

        flexibleDates:
          flexibleDates === true ||
          flexibleDates === "true",

        hotelNeeded:
          hotelNeeded === true ||
          hotelNeeded === "true",

        visaAssistance:
          visaAssistance === true ||
          visaAssistance === "true",

        travelInsurance:
          travelInsurance === true ||
          travelInsurance === "true",

        budget:
          parsedBudget,

        notes:
          cleanedNotes,

        status: "New",
      });

    const ownerEmail =
      listing.ownerId.email;

    if (ownerEmail) {
      try {
        await sendEmail({
          to: ownerEmail,

          subject:
            `New travel request: ${listing.title}`,

          html: `
            <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:24px;color:#111827;">
              <h1 style="color:#0f172a;">
                New Travel Request
              </h1>

              <p>
                You received a new travel request for
                <strong>${escapeHtml(
                  listing.title
                )}</strong>.
              </p>

              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:24px 0;">
                <p><strong>Traveler:</strong> ${escapeHtml(
                  cleanedCustomerName
                )}</p>

                <p><strong>Phone:</strong> ${escapeHtml(
                  cleanedCustomerPhone
                )}</p>

                <p><strong>Email:</strong> ${
                  cleanedCustomerEmail
                    ? escapeHtml(
                        cleanedCustomerEmail
                      )
                    : "Not provided"
                }</p>

                <p><strong>Trip:</strong> ${escapeHtml(
                  tripType
                )}</p>

                <p><strong>From:</strong> ${escapeHtml(
                  cleanedDepartureCity
                )}</p>

                <p><strong>To:</strong> ${escapeHtml(
                  cleanedDestinationCity
                )}</p>

                <p><strong>Departure:</strong> ${escapeHtml(
                  parsedDepartureDate.toLocaleDateString()
                )}</p>

                <p><strong>Return:</strong> ${
                  parsedReturnDate
                    ? escapeHtml(
                        parsedReturnDate.toLocaleDateString()
                      )
                    : "One-way trip"
                }</p>

                <p><strong>Travelers:</strong>
                  ${parsedAdults} adult(s),
                  ${parsedChildren} child(ren),
                  ${parsedInfants} infant(s)
                </p>

                <p><strong>Cabin:</strong> ${escapeHtml(
                  cabinClass
                )}</p>

                <p><strong>Budget:</strong> ${
                  parsedBudget !== null
                    ? `$${parsedBudget.toLocaleString()}`
                    : "Not provided"
                }</p>

                ${
                  cleanedNotes
                    ? `
                      <p>
                        <strong>Notes:</strong><br/>
                        ${escapeHtml(
                          cleanedNotes
                        ).replaceAll(
                          "\n",
                          "<br/>"
                        )}
                      </p>
                    `
                    : ""
                }
              </div>

              <div style="text-align:center;margin:30px 0;">
                <a
                  href="https://www.hubethio.com/owner/dashboard"
                  style="background:#f59e0b;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:8px;display:inline-block;font-weight:bold;"
                >
                  View Request in Owner Dashboard
                </a>
              </div>

              <p style="color:#6b7280;">
                — HubEthio Team
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error(
          "Travel request owner email failed:",
          emailError
        );
      }
    }

    return res.status(201).json({
      message:
        "Your travel request was submitted successfully.",

      requestId:
        request._id,
    });
  } catch (error) {
    console.error(
      "Create travel request failed:",
      error
    );

    if (
      error?.name === "ValidationError"
    ) {
      return res.status(400).json({
        message:
          Object.values(error.errors)
            .map(
              (item) =>
                item.message
            )
            .join(", ") ||
          "Invalid travel request.",
      });
    }

    return res.status(500).json({
      message:
        "Failed to submit travel request.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| OWNER TRAVEL REQUESTS
|--------------------------------------------------------------------------
|
| GET /api/travel-requests/owner
|
*/
router.get(
  "/owner",
  requireOwner,
  async (req, res) => {
    try {
      const requests =
        await TravelRequest.find({
          ownerId: req.owner.id,
        })
          .sort({
            createdAt: -1,
          })
          .populate(
            "listingId",
            "title logoUrl imageUrl"
          );

      return res.json(requests);
    } catch (error) {
      console.error(
        "Load owner travel requests failed:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load travel requests.",
      });
    }
  }
);

router.patch(
  "/:id/status",
  requireOwner,
  async (req, res) => {
    try {
      const {
        status,
        quoteAmount,
        airline = "",
        flightItinerary = "",
        stops = "",
        baggageAllowance = "",
        quoteExpiresAt = null,
        ownerNotes = "",
      } = req.body || {};

      const allowedStatuses = [
        "New",
        "Quoted",
        "Accepted",
        "Declined",
        "Booked",
        "Completed",
        "Cancelled",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid travel request status.",
        });
      }

      const existingRequest =
        await TravelRequest.findOne({
          _id: req.params.id,
          ownerId: req.owner.id,
        });

      if (!existingRequest) {
        return res.status(404).json({
          message: "Travel request not found.",
        });
      }

      if (
        status === "Quoted" &&
        existingRequest.customerRespondedAt
      ) {
        return res.status(400).json({
          message:
            "The customer has already responded. The quote can no longer be modified.",
        });
      }

      if (
        status === "Booked" &&
        existingRequest.status !== "Accepted"
      ) {
        return res.status(400).json({
          message:
            "The customer must accept the quote before the trip can be marked booked.",
        });
      }

      if (
        status === "Completed" &&
        existingRequest.status !== "Booked"
      ) {
        return res.status(400).json({
          message:
            "The trip must be booked before it can be marked completed.",
        });
      }

      const previousStatus =
        existingRequest.status;

      const statusChanged =
        previousStatus !== status;

      const updateData = {
        status,
      };

      if (status === "Quoted") {
        const parsedQuoteAmount =
          Number(quoteAmount);

        if (
          !Number.isFinite(parsedQuoteAmount) ||
          parsedQuoteAmount <= 0
        ) {
          return res.status(400).json({
            message:
              "Please enter a valid quote amount.",
          });
        }

        let parsedQuoteExpiresAt = null;

        if (quoteExpiresAt) {
          parsedQuoteExpiresAt =
            new Date(quoteExpiresAt);

          if (
            Number.isNaN(
              parsedQuoteExpiresAt.getTime()
            )
          ) {
            return res.status(400).json({
              message:
                "Please enter a valid quote expiration date.",
            });
          }
        }

        updateData.quoteAmount =
          parsedQuoteAmount;

        updateData.airline =
          cleanText(airline);

        updateData.flightItinerary =
          cleanText(flightItinerary);

        updateData.stops =
          cleanText(stops);

        updateData.baggageAllowance =
          cleanText(baggageAllowance);

        updateData.quoteExpiresAt =
          parsedQuoteExpiresAt;

        updateData.ownerNotes =
          cleanText(ownerNotes);

        updateData.quotedAt =
          new Date();

        const tokenIsStillValid =
          existingRequest.quoteAccessToken &&
          existingRequest
            .quoteAccessTokenExpiresAt &&
          existingRequest
            .quoteAccessTokenExpiresAt >
            new Date();

        if (tokenIsStillValid) {
          updateData.quoteAccessToken =
            existingRequest.quoteAccessToken;

          updateData.quoteAccessTokenExpiresAt =
            existingRequest
              .quoteAccessTokenExpiresAt;
        } else {
          updateData.quoteAccessToken =
            crypto
              .randomBytes(32)
              .toString("hex");

          updateData.quoteAccessTokenExpiresAt =
            new Date(
              Date.now() +
                30 *
                  24 *
                  60 *
                  60 *
                  1000
            );
        }
      }

      if (
        status === "Booked" &&
        !existingRequest.bookedAt
      ) {
        updateData.bookedAt = new Date();
      }

      if (
        status === "Completed" &&
        !existingRequest.completedAt
      ) {
        updateData.completedAt = new Date();
      }

      if (
        status === "Cancelled" &&
        !existingRequest.cancelledAt
      ) {
        updateData.cancelledAt = new Date();
      }

      const request =
  await TravelRequest.findOneAndUpdate(
    {
      _id: req.params.id,
      ownerId: req.owner.id,
    },
    {
      $set: updateData,
    },
    {
      new: true,
    }
  )
          .populate(
            "listingId",
            "title logoUrl imageUrl"
          )
          .lean();

      if (!request) {
        return res.status(404).json({
          message: "Travel request not found.",
        });
      }

      if (
        status === "Quoted" &&
        request.customerEmail &&
        request.quoteAccessToken
      ) {
        const quoteUrl =
          `${process.env.CLIENT_ORIGIN}` +
          `/travel-quote/${request.quoteAccessToken}`;

        try {
          await sendEmail({
            to: request.customerEmail,
            subject:
              "✈️ Your HubEthio Travel Quote Is Ready",
            html: `
              <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:30px;color:#111827;">
                <h2 style="color:#f59e0b;">
                  Your Travel Quote Is Ready
                </h2>

                <p>
                  Hello ${escapeHtml(
                    request.customerName
                  )},
                </p>

                <p>
                  Your selected travel agency has prepared a quote.
                </p>

                <table style="width:100%;border-collapse:collapse;margin:25px 0;">
                  <tr>
                    <td><strong>Quote Amount</strong></td>
                    <td>$${Number(
                      request.quoteAmount
                    ).toLocaleString()}</td>
                  </tr>

                  <tr>
                    <td><strong>Airline</strong></td>
                    <td>${escapeHtml(
                      request.airline ||
                        "Not specified"
                    )}</td>
                  </tr>

                  <tr>
                    <td><strong>Stops</strong></td>
                    <td>${escapeHtml(
                      request.stops ||
                        "Not specified"
                    )}</td>
                  </tr>

                  <tr>
                    <td><strong>Baggage</strong></td>
                    <td>${escapeHtml(
                      request.baggageAllowance ||
                        "Not specified"
                    )}</td>
                  </tr>

                  <tr>
                    <td><strong>Itinerary</strong></td>
                    <td>${escapeHtml(
                      request.flightItinerary ||
                        "Not specified"
                    ).replaceAll(
                      "\n",
                      "<br/>"
                    )}</td>
                  </tr>

                  <tr>
                    <td><strong>Notes</strong></td>
                    <td>${escapeHtml(
                      request.ownerNotes ||
                        "No additional notes"
                    ).replaceAll(
                      "\n",
                      "<br/>"
                    )}</td>
                  </tr>
                </table>

                <div style="text-align:center;margin:35px 0;">
                  <a
                    href="${quoteUrl}"
                    style="display:inline-block;background:#f59e0b;color:white;padding:15px 28px;border-radius:8px;text-decoration:none;font-weight:bold;"
                  >
                    View My Travel Quote
                  </a>
                </div>

                <p>
                  This secure quote link expires in 30 days.
                </p>
              </div>
            `,
          });

          await TravelRequest.findOneAndUpdate(
  {
    _id: request._id,
    ownerId: req.owner.id,
  },
  {
    $set: {
      customerQuoteEmailSentAt:
        new Date(),
    },
  }
);
        } catch (emailError) {
          console.error(
            "Travel quote email failed:",
            emailError
          );
        }
      }

      if (
        statusChanged &&
        request.customerEmail &&
        ["Booked", "Completed", "Cancelled"].includes(
          request.status
        )
      ) {
        try {
          const messages = {
            Booked: {
              subject:
                "✈️ Your HubEthio Trip Has Been Booked",
              heading: "Trip Booked",
              text:
                "Your travel agency has marked your trip as booked.",
            },

            Completed: {
              subject:
                "✅ Your HubEthio Travel Request Is Complete",
              heading: "Travel Request Completed",
              text:
                "Your travel request has been completed. Thank you for using HubEthio.",
            },

            Cancelled: {
              subject:
                "❌ Your HubEthio Travel Request Was Cancelled",
              heading: "Travel Request Cancelled",
              text:
                "Your travel request has been cancelled. Please contact the agency if you have questions.",
            },
          };

          const content =
            messages[request.status];

          await sendEmail({
            to: request.customerEmail,
            subject: content.subject,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:30px;color:#111827;">
                <h2 style="color:#f59e0b;">
                  ${content.heading}
                </h2>

                <p>
                  Hello ${escapeHtml(
                    request.customerName
                  )},
                </p>

                <p>${content.text}</p>

                <p>
                  <strong>Status:</strong>
                  ${escapeHtml(
                    request.status
                  )}
                </p>
              </div>
            `,
          });
        } catch (emailError) {
          console.error(
            "Travel status email failed:",
            emailError
          );
        }
      }

      return res.json(request);
    } catch (error) {
      console.error(
        "Update travel request failed:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to update travel request.",
      });
    }
  }
);

router.get("/quote/:token", async (req, res) => {
  try {
    const token = cleanText(req.params.token);

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        message: "This travel quote link is invalid.",
      });
    }

    const request = await TravelRequest.findOne({
      quoteAccessToken: token,
    }).populate("listingId", "title logoUrl imageUrl phone");

    if (!request) {
      return res.status(404).json({
        message: "This travel quote could not be found.",
      });
    }

    if (
      !request.quoteAccessTokenExpiresAt ||
      request.quoteAccessTokenExpiresAt < new Date()
    ) {
      return res.status(410).json({
        message: "This travel quote link has expired.",
      });
    }

    return res.json({
      id: request._id,
      agencyName:
        request.listingId?.title || "Travel Agency",

      customerName: request.customerName,
      tripType: request.tripType,
      departureCity: request.departureCity,
      destinationCity: request.destinationCity,
      departureDate: request.departureDate,
      returnDate: request.returnDate,

      adults: request.adults,
      children: request.children,
      infants: request.infants,
      cabinClass: request.cabinClass,

      quoteAmount: request.quoteAmount,
      airline: request.airline,
      flightItinerary: request.flightItinerary,
      stops: request.stops,
      baggageAllowance: request.baggageAllowance,
      quoteExpiresAt: request.quoteExpiresAt,
      ownerNotes: request.ownerNotes,

      status: request.status,
      createdAt: request.createdAt,
      quotedAt: request.quotedAt,
      customerRespondedAt:
        request.customerRespondedAt,
      bookedAt: request.bookedAt,
      completedAt: request.completedAt,
      cancelledAt: request.cancelledAt,
    });
  } catch (error) {
    console.error(
      "Load travel quote failed:",
      error
    );

    return res.status(500).json({
      message: "Failed to load travel quote.",
    });
  }
});

router.patch(
  "/quote/:token/respond",
  async (req, res) => {
    try {
      const token = cleanText(req.params.token);
      const { decision } = req.body || {};

      if (
        !["Accepted", "Declined"].includes(decision)
      ) {
        return res.status(400).json({
          message: "Invalid response.",
        });
      }

      const request = await TravelRequest.findOne({
        quoteAccessToken: token,
      }).populate("listingId", "title");

      if (!request) {
        return res.status(404).json({
          message: "Travel quote not found.",
        });
      }

      if (
        !request.quoteAccessTokenExpiresAt ||
        request.quoteAccessTokenExpiresAt <
          new Date()
      ) {
        return res.status(410).json({
          message:
            "This travel quote link has expired.",
        });
      }

      if (request.customerRespondedAt) {
        return res.status(400).json({
          message:
            "You have already responded to this quote.",
        });
      }

      if (request.status !== "Quoted") {
        return res.status(400).json({
          message:
            "This quote is no longer awaiting a response.",
        });
      }

      request.status = decision;
      request.customerRespondedAt =
        new Date();

      await request.save();

      return res.json({
        message:
          decision === "Accepted"
            ? "Travel quote accepted successfully."
            : "Travel quote declined successfully.",
        request: {
          id: request._id,
          status: request.status,
          customerRespondedAt:
            request.customerRespondedAt,
        },
      });
    } catch (error) {
      console.error(
        "Respond to travel quote failed:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to respond to the travel quote.",
      });
    }
  }
);

export default router;