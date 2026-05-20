import { tryCatch } from "../utils/async-handler";
import { prisma } from "../lib/prisma";
import {
  registrationStatusEmailTemplate,
  underReviewTemplate,
} from "../templates";
import { sendEmail } from "../utils/email";
import { auth } from "../lib/auth";
import { decryptData, encryptData } from "../utils/encryption";

export default {
  makeRegistrationRequest: tryCatch(async (req, res, next) => {
    const {
      companyName,
      companyDescription,
      businessFileUrl,
      contactName,
      email,
      password,
      phone,
      registrationType,
      nationalId,
    } = req.body;

    if (!contactName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const existing = await prisma.registrationRequest.findFirst({
      where: { email, status: { not: "REJECTED" } },
    });

    if (existing) {
      // If there's already an approved request, check if user actually exists
      if (existing.status === "APPROVED") {
        const userExists = await prisma.user.findFirst({ where: { email } });
        if (userExists) {
          return res.status(409).json({ success: false, message: "Email already in use" });
        }
        // User wasn't created despite approval — allow re-submission by deleting old request
        await prisma.registrationRequest.delete({ where: { id: existing.id } });
      } else if (existing.status === "PENDING") {
        // Allow re-submission if the pending request is older than 5 minutes (likely abandoned)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (existing.createdAt < fiveMinutesAgo) {
          await prisma.registrationRequest.delete({ where: { id: existing.id } });
        } else {
          return res.status(409).json({ success: false, message: "A registration request with this email is already pending. Please wait a few minutes before trying again." });
        }
      }
    }

    // Also check if user already exists in the system
    const userAlreadyExists = await prisma.user.findFirst({ where: { email } });
    if (userAlreadyExists) {
      return res.status(409).json({ success: false, message: "Email already in use" });
    }

    // Hashing Password👇🏼
    const encryptedPassword = encryptData(password);
    let savedRegistration;

    if (registrationType === "OWNER") {
      savedRegistration = await prisma.registrationRequest.create({
        data: {
          contactName,
          email,
          phone,
          registrationType: "OWNER",
          json: {
            companyName,
            companyDescription,
            businessFileUrl,
            password: encryptedPassword,
          },
        },
      });
    } else {
      savedRegistration = await prisma.registrationRequest.create({
        data: {
          contactName,
          email,
          phone,
          nationalId,
          registrationType: "BROKER",
          json: {
            password: encryptedPassword,
          },
        },
      });
    }

    // const encryptId = encryptData(savedRegistration.id);

    let redirectUrl = `${process.env.FRONTEND_URL}/registrations/status/${savedRegistration.id}`;

    // ✅ Send Email Notification
    try {
      await sendEmail({
        to: email,
        subject: "Your Registration Request is Under Review",
        html: underReviewTemplate(contactName, companyName, redirectUrl),
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError.message);
    }

    // 🔔 Create admin notification activity
    await prisma.activity.create({
      data: {
        action: "REGISTRATION_REQUEST",
        description: `New ${registrationType} registration request from ${contactName} (${email}). Awaiting admin review.`,
        status: "INFO",
      },
    }).catch(() => {});

    res.json({
      success: true,
      message: "Registration request submitted successfully",
    });
  }),

  getRegistrationRequests: tryCatch(async (req, res) => {
    const requests = await prisma.registrationRequest.findMany({
      orderBy: { createdAt: "desc" },
    });

    const flattened = requests.map(({ json, ...rest }) => ({
      ...rest,
      ...(json as object),
    }));

    res.json(flattened);
  }),
  getRegistrationRequestById: tryCatch(async (req, res) => {
    const { id } = req.params;
    const request = await prisma.registrationRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }

    const { json, ...rest } = request;
    res.json({ success: true, request: { ...rest, ...(json as object) } });
  }),
  updateRegistrationRequestStatus: tryCatch(async (req, res) => {
    const { id } = req.params;
    const { newStatus } = req.body;

    if (!["PENDING", "APPROVED", "REJECTED"].includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be PENDING, APPROVED, or REJECTED.",
      });
    }

    const request = await prisma.registrationRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }

    const updated = await prisma.registrationRequest.update({
      where: { id },
      data: { status: newStatus },
    });

    const jsonData = updated.json as any;
    const decryptPassword = decryptData(jsonData.password);

    if (updated.status === "APPROVED") {
      // Create the user account
      const signUpResult = await auth.api.signUpEmail({
        body: {
          email: updated.email,
          name: updated.contactName,
          password: decryptPassword,
          role: updated.registrationType,
          phone: updated.phone,
          image: "",
        },
      });

      // Ensure role is set correctly (better-auth may not persist custom fields)
      try {
        await prisma.user.update({
          where: { email: updated.email },
          data: {
            role: updated.registrationType,
            phone: updated.phone,
            status: "APPROVED",
          },
        });
      } catch {
        // user update failed but account was created — non-fatal
      }
    }
    // const encryptId = encryptData(updated.id);
    let redirectUrl = `${process.env.FRONTEND_URL}/registrations/status/${updated.id}`;

    // Send email notification
    await sendEmail({
      from: `"Property Portal" <${process.env.SMTP_USER}>`,
      to: request.email,
      subject: `Your Registration Request Has Been ${newStatus}`,
      html: registrationStatusEmailTemplate(
        newStatus,
        request.contactName,
        redirectUrl
      ),
    });
    res.json({
      success: true,
      message: "Status updated and email sent successfully",
      request: updated,
    });
  }),
  getStats: tryCatch(async (req, res, next) => {
    const [
      brokersCount,
      ownersCount,
      pendingCount,
      approvedCount,
      rejectedCount,
      total,
    ] = await Promise.all([
      prisma.registrationRequest.count({
        where: { registrationType: "BROKER" },
      }),
      prisma.registrationRequest.count({
        where: { registrationType: "OWNER" },
      }),
      prisma.registrationRequest.count({ where: { status: "PENDING" } }),
      prisma.registrationRequest.count({ where: { status: "APPROVED" } }),
      prisma.registrationRequest.count({ where: { status: "REJECTED" } }),
      prisma.registrationRequest.count(),
    ]);

    return res.json({
      brokersCount,
      ownersCount,
      total,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
    });
  }),
  getRegistrationStatusForClient: tryCatch(async (req, res) => {
    const encryptedRegistrationId = req.params.encryptedId;
    // const decryptId = decryptData(encryptedRegistrationId);

    const registrationRequestDoc = await prisma.registrationRequest.findFirst({
      where: {
        id: encryptedRegistrationId,
      },
    });

    res.json({
      status: registrationRequestDoc.status,
    });
  }),
};
