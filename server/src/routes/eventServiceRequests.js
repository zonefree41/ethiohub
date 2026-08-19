import express from "express";
import EventServiceRequest from "../models/EventServiceRequest.js";
import Listing from "../models/Listing.js";
import { requireOwner } from "../middleware/ownerAuth.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

/*
  PUBLIC
  Create Events & Entertainment service request
*/
router.post("/", async (req, res) => {
  try {
    const {
      listingId,
      customerName,
      customerEmail,
      customerPhone,
      eventType,
      eventDate,
      startTime = "",
      venue = "",
      city = "",
      state = "",
      guestCount = null,
      servicesNeeded = [],
      budget = "",
      additionalDetails = "",
    } = req.body || {};

    if (
      !listingId ||
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !eventType ||
      !eventDate
    ) {
      return res.status(400).json({
        message:
          "Please provide all required event service request information.",
      });
    }

    const listing = await Listing.findById(listingId)
      .populate("ownerId", "name email")
      .populate("categoryId", "name_en slug");

    if (!listing) {
      return res.status(404).json({
        message:
          "Events & Entertainment listing not found.",
      });
    }

    if (
      listing.categoryId?.slug !==
      "events-entertainment"
    ) {
      return res.status(400).json({
        message:
          "This listing is not an Events & Entertainment listing.",
      });
    }

    if (listing.status !== "approved") {
      return res.status(400).json({
        message:
          "This Events & Entertainment listing is not currently accepting requests.",
      });
    }

    const parsedEventDate = new Date(eventDate);

    if (
      Number.isNaN(parsedEventDate.getTime())
    ) {
      return res.status(400).json({
        message: "Please provide a valid event date.",
      });
    }

    let cleanedGuestCount = null;

    if (
      guestCount !== null &&
      guestCount !== "" &&
      guestCount !== undefined
    ) {
      cleanedGuestCount = Number(guestCount);

      if (
        !Number.isFinite(cleanedGuestCount) ||
        cleanedGuestCount < 1
      ) {
        return res.status(400).json({
          message:
            "Guest count must be at least 1.",
        });
      }
    }

    const cleanedServicesNeeded =
      Array.isArray(servicesNeeded)
        ? servicesNeeded
            .map((item) =>
              String(item || "").trim()
            )
            .filter(Boolean)
        : [];

    const request =
      await EventServiceRequest.create({
        listingId: listing._id,
        ownerId: listing.ownerId?._id || null,
        customerName,
        customerEmail,
        customerPhone,
        eventType,
        eventDate: parsedEventDate,
        startTime,
        venue,
        city,
        state,
        guestCount: cleanedGuestCount,
        servicesNeeded: cleanedServicesNeeded,
        budget,
        additionalDetails,
      });

      try {
  const notificationEmail =
  listing.ownerId?.email ||
  process.env.ADMIN_EMAIL;

if (notificationEmail) {
    const eventDateText =
      parsedEventDate.toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      );

    await sendEmail({
      to: notificationEmail,

      subject:
        `New Event Request: ${eventType} - ${listing.title}`,

      html: `
        <div style="
          margin:0;
          padding:32px 16px;
          background:#f5f3ff;
          font-family:Arial,Helvetica,sans-serif;
          color:#1f2937;
        ">
          <div style="
            max-width:640px;
            margin:0 auto;
            background:#ffffff;
            border-radius:20px;
            overflow:hidden;
            box-shadow:0 10px 30px rgba(0,0,0,0.08);
          ">

            <div style="
              padding:32px 28px;
              text-align:center;
              background:linear-gradient(135deg,#6d28d9,#8b5cf6);
              color:#ffffff;
            ">
              <div style="
                font-size:40px;
                margin-bottom:10px;
              ">
                🎉
              </div>

              <h1 style="
                margin:0;
                font-size:26px;
              ">
                New Event Service Request
              </h1>

              <p style="
                margin:10px 0 0;
                opacity:.95;
              ">
                ${listing.title}
              </p>
            </div>

            <div style="padding:30px 28px;">
              <p style="
                margin-top:0;
                font-size:17px;
              ">
                Hello ${
  listing.ownerId?.name ||
  "HubEthio Admin"
},
              </p>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                A new customer submitted an Events &
                Entertainment service request through HubEthio.
              </p>

              <div style="
                margin:24px 0;
                padding:20px;
                border:1px solid #ddd6fe;
                border-radius:14px;
                background:#faf5ff;
              ">
                <p><strong>Customer:</strong> ${customerName}</p>
                <p><strong>Email:</strong> ${customerEmail}</p>
                <p><strong>Phone:</strong> ${customerPhone}</p>
                <p><strong>Event Type:</strong> ${eventType}</p>
                <p><strong>Event Date:</strong> ${eventDateText}</p>
                <p><strong>Start Time:</strong> ${startTime || "Not provided"}</p>
                <p><strong>Guests:</strong> ${cleanedGuestCount || "Not provided"}</p>
                <p><strong>Venue:</strong> ${venue || "Not provided"}</p>
                <p><strong>Location:</strong> ${
                  [city, state]
                    .filter(Boolean)
                    .join(", ") || "Not provided"
                }</p>
                <p><strong>Budget:</strong> ${budget || "Not provided"}</p>
                <p><strong>Services Needed:</strong> ${
                  cleanedServicesNeeded.length
                    ? cleanedServicesNeeded.join(", ")
                    : "Not provided"
                }</p>
              </div>

              ${
                additionalDetails
                  ? `
                    <div style="
                      margin:20px 0;
                      padding:18px;
                      border-radius:12px;
                      background:#f8fafc;
                    ">
                      <strong>Customer Details</strong>
                      <p style="
                        margin:8px 0 0;
                        line-height:1.6;
                        color:#475569;
                      ">
                        ${additionalDetails}
                      </p>
                    </div>
                  `
                  : ""
              }

              <p style="
                margin:24px 0 0;
                font-size:14px;
                color:#64748b;
              ">
  ${
    listing.ownerId
      ? `Log in to your HubEthio Events & Entertainment Workspace to review and manage this request.`
      : `This Events & Entertainment listing is currently unclaimed. The request has been saved in HubEthio for follow-up until an owner is assigned.`
  }
</p>
            </div>
          </div>
        </div>
      `,
    });
  }
} catch (emailErr) {
  console.error(
    "Event owner notification email failed:",
    emailErr
  );
}

    return res.status(201).json({
      message:
        "Event service request submitted successfully.",
      request,
    });
  } catch (err) {
    console.error(
      "Create Event service request error:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to submit event service request.",
    });
  }
});

/*
  OWNER
  Get Events & Entertainment requests
  for the logged-in owner
*/
router.get(
  "/owner",
  requireOwner,
  async (req, res) => {
    try {
      const requests =
        await EventServiceRequest.find({
          ownerId: req.owner.id,
        })
          .populate(
            "listingId",
            "title city state status"
          )
          .sort({ createdAt: -1 });

      return res.json(requests);
    } catch (err) {
      console.error(
        "Load Event service requests error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to load event service requests.",
      });
    }
  }
);


/*
  OWNER
  Update event request status
*/
router.patch(
  "/owner/:id/status",
  requireOwner,
  async (req, res) => {
    try {
      const {
  status,
  consultationDate = null,
  proposalAmount = null,
} = req.body || {};

      const allowedStatuses = [
        "New",
        "Contacted",
        "Consultation Scheduled",
        "Proposal Sent",
        "Booked",
        "Event Completed",
        "Declined",
        "Closed",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid event request status.",
        });
      }

      const request =
        await EventServiceRequest.findOne({
          _id: req.params.id,
          ownerId: req.owner.id,
        });

      if (!request) {
        return res.status(404).json({
          message:
            "Event service request not found.",
        });
      }

      if (status === "Consultation Scheduled") {
  if (!consultationDate) {
    return res.status(400).json({
      message:
        "Consultation date and time are required.",
    });
  }

  const parsedConsultationDate =
    new Date(consultationDate);

  if (
    Number.isNaN(
      parsedConsultationDate.getTime()
    )
  ) {
    return res.status(400).json({
      message:
        "Please provide a valid consultation date and time.",
    });
  }

  request.consultationDate =
    parsedConsultationDate;
}

if (status === "Proposal Sent") {
  const parsedProposalAmount =
    Number(proposalAmount);

  if (
    !Number.isFinite(parsedProposalAmount) ||
    parsedProposalAmount < 0
  ) {
    return res.status(400).json({
      message:
        "Please provide a valid proposal amount.",
    });
  }

  request.proposalAmount =
    parsedProposalAmount;
}

      request.status = status;
      

      await request.save();

      await request.populate(
        "listingId",
        "title city state status"
      );

      if (
  status === "Contacted" &&
  request.customerEmail
) {
  try {
    const businessTitle =
      request.listingId?.title ||
      "Events & Entertainment Provider";

    await sendEmail({
      to: request.customerEmail,
      subject:
        `Update on Your Event Request: ${businessTitle}`,
      html: `
        <div style="
          margin:0;
          padding:32px 16px;
          background:#f5f3ff;
          font-family:Arial,Helvetica,sans-serif;
          color:#1f2937;
        ">
          <div style="
            max-width:620px;
            margin:0 auto;
            background:#ffffff;
            border-radius:20px;
            overflow:hidden;
            box-shadow:0 10px 30px rgba(0,0,0,0.08);
          ">

            <div style="
              padding:32px 28px;
              text-align:center;
              background:linear-gradient(135deg,#6d28d9,#8b5cf6);
              color:#ffffff;
            ">
              <div style="
                font-size:40px;
                margin-bottom:10px;
              ">
                🎉
              </div>

              <h1 style="
                margin:0;
                font-size:26px;
              ">
                Your Event Request Has Been Reviewed
              </h1>

              <p style="
                margin:10px 0 0;
                opacity:.95;
              ">
                ${businessTitle}
              </p>
            </div>

            <div style="padding:30px 28px;">
              <p style="
                margin-top:0;
                font-size:17px;
              ">
                Hello ${request.customerName},
              </p>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                Thank you for submitting your event service
                request through HubEthio.
              </p>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                ${businessTitle} has reviewed your request
                and marked it as <strong>Contacted</strong>.
              </p>

              <div style="
                margin:24px 0;
                padding:18px;
                border:1px solid #ddd6fe;
                border-radius:14px;
                background:#faf5ff;
              ">
                <p>
                  <strong>Event Type:</strong>
                  ${request.eventType}
                </p>

                <p>
                  <strong>Status:</strong>
                  Contacted
                </p>
              </div>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                The business may contact you directly by
                phone or email to discuss your event and
                next steps.
              </p>

              <p style="
                margin-top:24px;
                color:#64748b;
                font-size:14px;
              ">
                Thank you for using HubEthio.
              </p>
            </div>
          </div>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error(
      "Event Contacted customer email failed:",
      emailErr
    );
  }
}

if (
  status === "Consultation Scheduled" &&
  request.customerEmail &&
  request.consultationDate
) {
  try {
    const businessTitle =
      request.listingId?.title ||
      "Events & Entertainment Provider";

    const consultationDateText =
      new Date(
        request.consultationDate
      ).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      );

    const consultationTimeText =
      new Date(
        request.consultationDate
      ).toLocaleTimeString(
        "en-US",
        {
          hour: "numeric",
          minute: "2-digit",
        }
      );

    await sendEmail({
      to: request.customerEmail,

      subject:
        `Your Event Consultation Is Scheduled: ${businessTitle}`,

      html: `
        <div style="
          margin:0;
          padding:32px 16px;
          background:#f5f3ff;
          font-family:Arial,Helvetica,sans-serif;
          color:#1f2937;
        ">
          <div style="
            max-width:620px;
            margin:0 auto;
            background:#ffffff;
            border-radius:20px;
            overflow:hidden;
            box-shadow:0 10px 30px rgba(0,0,0,0.08);
          ">

            <div style="
              padding:32px 28px;
              text-align:center;
              background:linear-gradient(135deg,#6d28d9,#8b5cf6);
              color:#ffffff;
            ">
              <div style="
                font-size:40px;
                margin-bottom:10px;
              ">
                📅
              </div>

              <h1 style="
                margin:0;
                font-size:26px;
              ">
                Your Event Consultation Is Scheduled
              </h1>

              <p style="
                margin:10px 0 0;
                opacity:.95;
              ">
                ${businessTitle}
              </p>
            </div>

            <div style="padding:30px 28px;">
              <p style="
                margin-top:0;
                font-size:17px;
              ">
                Hello ${request.customerName},
              </p>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                Your event consultation has been scheduled
                with ${businessTitle}.
              </p>

              <div style="
                margin:24px 0;
                padding:20px;
                border:1px solid #ddd6fe;
                border-radius:14px;
                background:#faf5ff;
              ">
                <p>
                  <strong>Event Type:</strong>
                  ${request.eventType}
                </p>

                <p>
                  <strong>Consultation Date:</strong>
                  ${consultationDateText}
                </p>

                <p>
                  <strong>Consultation Time:</strong>
                  ${consultationTimeText}
                </p>

                <p>
                  <strong>Status:</strong>
                  Consultation Scheduled
                </p>
              </div>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                Please keep this date and time available.
                The business may contact you directly with
                any additional consultation instructions.
              </p>

              <p style="
                margin-top:24px;
                color:#64748b;
                font-size:14px;
              ">
                Thank you for using HubEthio.
              </p>
            </div>
          </div>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error(
      "Event Consultation Scheduled customer email failed:",
      emailErr
    );
  }
}

if (
  status === "Proposal Sent" &&
  request.customerEmail
) {
  try {
    const businessTitle =
      request.listingId?.title ||
      "Events & Entertainment Provider";

    const proposalAmountText =
      Number(
        request.proposalAmount || 0
      ).toLocaleString(
        "en-US",
        {
          style: "currency",
          currency: "USD",
        }
      );

    await sendEmail({
      to: request.customerEmail,

      subject:
        `Your Event Proposal Is Ready: ${businessTitle}`,

      html: `
        <div style="
          margin:0;
          padding:32px 16px;
          background:#f5f3ff;
          font-family:Arial,Helvetica,sans-serif;
          color:#1f2937;
        ">
          <div style="
            max-width:620px;
            margin:0 auto;
            background:#ffffff;
            border-radius:20px;
            overflow:hidden;
            box-shadow:0 10px 30px rgba(0,0,0,0.08);
          ">

            <div style="
              padding:32px 28px;
              text-align:center;
              background:linear-gradient(135deg,#6d28d9,#8b5cf6);
              color:#ffffff;
            ">
              <div style="
                font-size:40px;
                margin-bottom:10px;
              ">
                💰
              </div>

              <h1 style="
                margin:0;
                font-size:26px;
              ">
                Your Event Proposal Is Ready
              </h1>

              <p style="
                margin:10px 0 0;
                opacity:.95;
              ">
                ${businessTitle}
              </p>
            </div>

            <div style="padding:30px 28px;">
              <p style="
                margin-top:0;
                font-size:17px;
              ">
                Hello ${request.customerName},
              </p>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                ${businessTitle} has prepared a proposal
                for your event request.
              </p>

              <div style="
                margin:24px 0;
                padding:20px;
                border:1px solid #ddd6fe;
                border-radius:14px;
                background:#faf5ff;
              ">
                <p>
                  <strong>Event Type:</strong>
                  ${request.eventType}
                </p>

                <p style="
                  margin:14px 0;
                  font-size:20px;
                ">
                  <strong>Proposal Amount:</strong>
                  ${proposalAmountText}
                </p>

                <p>
                  <strong>Status:</strong>
                  Proposal Sent
                </p>
              </div>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                Please contact ${businessTitle} directly
                if you have questions about the proposal,
                services included, payment terms, or other
                event details.
              </p>

              <p style="
                margin-top:24px;
                color:#64748b;
                font-size:14px;
              ">
                HubEthio connects customers with
                independent event service providers.
                Pricing and final service agreements are
                handled directly between you and the
                business.
              </p>

              <p style="
                margin-top:20px;
                color:#64748b;
                font-size:14px;
              ">
                Thank you for using HubEthio.
              </p>
            </div>
          </div>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error(
      "Event Proposal Sent customer email failed:",
      emailErr
    );
  }
}

if (
  status === "Booked" &&
  request.customerEmail
) {
  try {
    const businessTitle =
      request.listingId?.title ||
      "Events & Entertainment Provider";

    const bookedAmountText =
      Number(
        request.proposalAmount || 0
      ).toLocaleString(
        "en-US",
        {
          style: "currency",
          currency: "USD",
        }
      );

    await sendEmail({
      to: request.customerEmail,

      subject:
        `Your Event Is Booked: ${businessTitle}`,

      html: `
        <div style="
          margin:0;
          padding:32px 16px;
          background:#f0fdf4;
          font-family:Arial,Helvetica,sans-serif;
          color:#1f2937;
        ">
          <div style="
            max-width:620px;
            margin:0 auto;
            background:#ffffff;
            border-radius:20px;
            overflow:hidden;
            box-shadow:0 10px 30px rgba(0,0,0,0.08);
          ">
            <div style="
              padding:32px 28px;
              text-align:center;
              background:linear-gradient(135deg,#15803d,#22c55e);
              color:#ffffff;
            ">
              <div style="font-size:40px;margin-bottom:10px;">
                ✅
              </div>

              <h1 style="margin:0;font-size:26px;">
                Your Event Is Booked
              </h1>

              <p style="margin:10px 0 0;opacity:.95;">
                ${businessTitle}
              </p>
            </div>

            <div style="padding:30px 28px;">
              <p style="margin-top:0;font-size:17px;">
                Hello ${request.customerName},
              </p>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                Great news! ${businessTitle} has marked your
                event request as <strong>Booked</strong>.
              </p>

              <div style="
                margin:24px 0;
                padding:20px;
                border:1px solid #bbf7d0;
                border-radius:14px;
                background:#f0fdf4;
              ">
                <p>
                  <strong>Event Type:</strong>
                  ${request.eventType}
                </p>

                <p>
                  <strong>Booked Amount:</strong>
                  ${bookedAmountText}
                </p>

                <p>
                  <strong>Status:</strong>
                  Booked
                </p>
              </div>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                Please continue coordinating directly with
                ${businessTitle} regarding contracts,
                deposits, event details, and final arrangements.
              </p>

              <p style="
                margin-top:24px;
                color:#64748b;
                font-size:14px;
              ">
                Thank you for using HubEthio.
              </p>
            </div>
          </div>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error(
      "Event Booked customer email failed:",
      emailErr
    );
  }
}

if (
  status === "Event Completed" &&
  request.customerEmail
) {
  try {
    const businessTitle =
      request.listingId?.title ||
      "Events & Entertainment Provider";

    const finalAmountText =
      Number(
        request.proposalAmount || 0
      ).toLocaleString(
        "en-US",
        {
          style: "currency",
          currency: "USD",
        }
      );

    await sendEmail({
      to: request.customerEmail,

      subject:
        `Your Event Is Complete: ${businessTitle}`,

      html: `
        <div style="
          margin:0;
          padding:32px 16px;
          background:#f0fdf4;
          font-family:Arial,Helvetica,sans-serif;
          color:#1f2937;
        ">
          <div style="
            max-width:620px;
            margin:0 auto;
            background:#ffffff;
            border-radius:20px;
            overflow:hidden;
            box-shadow:0 10px 30px rgba(0,0,0,0.08);
          ">
            <div style="
              padding:32px 28px;
              text-align:center;
              background:linear-gradient(135deg,#15803d,#22c55e);
              color:#ffffff;
            ">
              <div style="font-size:40px;margin-bottom:10px;">
                🎉
              </div>

              <h1 style="margin:0;font-size:26px;">
                Your Event Has Been Completed
              </h1>

              <p style="margin:10px 0 0;opacity:.95;">
                ${businessTitle}
              </p>
            </div>

            <div style="padding:30px 28px;">
              <p style="margin-top:0;font-size:17px;">
                Hello ${request.customerName},
              </p>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                ${businessTitle} has marked your event
                service request as
                <strong>Event Completed</strong>.
              </p>

              <div style="
                margin:24px 0;
                padding:20px;
                border:1px solid #bbf7d0;
                border-radius:14px;
                background:#f0fdf4;
              ">
                <p>
                  <strong>Event Type:</strong>
                  ${request.eventType}
                </p>

                <p>
                  <strong>Final Booked Amount:</strong>
                  ${finalAmountText}
                </p>

                <p>
                  <strong>Status:</strong>
                  Event Completed
                </p>
              </div>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                Thank you for choosing ${businessTitle}
                and for using HubEthio to connect with
                local service providers.
              </p>

              <p style="
                margin-top:24px;
                color:#64748b;
                font-size:14px;
              ">
                We appreciate your support of businesses
                in the HubEthio community.
              </p>
            </div>
          </div>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error(
      "Event Completed customer email failed:",
      emailErr
    );
  }
}

      return res.json({
        message:
          "Event request status updated successfully.",
        request,
      });
    } catch (err) {
      console.error(
        "Update Event request status error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to update event request status.",
      });
    }
  }
);

export default router;
