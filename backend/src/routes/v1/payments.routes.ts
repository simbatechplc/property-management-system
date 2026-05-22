import { Router } from "express";
import paymentController from "../../controllers/payments.controller";
import { authGuard } from "../../middleware/auth-middleware";
import { prisma } from "../../lib/prisma";
import { tryCatch } from "../../utils/async-handler";
const router = Router();

// /payments
router.get("/banks", paymentController.getBanks);
router.post(
  "/subaccount",
  authGuard({ accessedBy: ["ADMIN", "BROKER", "OWNER"] }),
  paymentController.createSubAccount
);
router.get(
  "/subaccount",
  authGuard({ accessedBy: ["ADMIN", "BROKER", "OWNER"] }),
  paymentController.getSubaccountDetail
);
router.get(
  "/subaccount/get-all",
  authGuard({ accessedBy: ["ADMIN"] }),
  paymentController.getSubaccounts
);
router.get(
  "/",
  authGuard({ accessedBy: ["ADMIN", "BROKER", "OWNER"] }),
  paymentController.getPayments
);
router.get(
  "/stats",
  authGuard({ accessedBy: ["ADMIN", "BROKER", "OWNER"] }),
  paymentController.getPaymentStats
);
router.post("/webhook", paymentController.chapaWebhook);
router.get("/verify/:txRef", paymentController.verifyPayment);
router.post(
  "/init",
  paymentController.init
);

// 🏦 Manual bank transfer payment submission routes
router.post(
  "/submit",
  authGuard({ accessedBy: ["GUEST", "ADMIN", "OWNER", "BROKER", "STAFF"] }),
  tryCatch(async (req, res) => {
    const { bookingId, referenceNumber, amountPaid, fullName, screenshotUrl, paymentMethod } = req.body;
    const missing = [];
    if (!bookingId) missing.push("bookingId");
    if (!referenceNumber) missing.push("referenceNumber");
    if (!amountPaid) missing.push("amountPaid");
    if (!fullName) missing.push("fullName");
    if (!screenshotUrl) missing.push("screenshotUrl");
    if (missing.length > 0) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
    }
    if (isNaN(Number(amountPaid)) || Number(amountPaid) <= 0) {
      return res.status(400).json({ message: "amountPaid must be a positive number" });
    }
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    const existing = await (prisma as any).paymentSubmission.findUnique({ where: { bookingId } });
    if (existing) return res.status(409).json({ message: "A payment submission already exists for this booking" });
    const submission = await (prisma as any).paymentSubmission.create({
      data: { bookingId, referenceNumber, amountPaid: Number(amountPaid), fullName, screenshotUrl, paymentMethod: paymentMethod || null, status: "PENDING" },
    });
    res.status(201).json({ success: true, message: "Payment submission created", data: submission });
  })
);

router.get(
  "/submissions",
  authGuard({ accessedBy: ["ADMIN"] }),
  tryCatch(async (req, res) => {
    const submissions = await (prisma as any).paymentSubmission.findMany({
      include: {
        booking: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            property: { select: { id: true, name: true } },
            room: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: submissions });
  })
);

router.post(
  "/submissions/:id/approve",
  authGuard({ accessedBy: ["ADMIN"] }),
  tryCatch(async (req, res) => {
    const { id } = req.params;
    const submission = await (prisma as any).paymentSubmission.findUnique({
      where: { id },
      include: { booking: { include: { payment: true, user: true } } },
    });
    if (!submission) return res.status(404).json({ message: "Submission not found" });
    if (submission.status !== "PENDING") return res.status(400).json({ message: "Submission is not pending" });
    await prisma.$transaction(async (tx) => {
      await (tx as any).paymentSubmission.update({
        where: { id },
        data: { status: "APPROVED", reviewedBy: req.user?.id, reviewedAt: new Date() },
      });
      await tx.booking.update({ where: { id: submission.bookingId }, data: { status: "APPROVED" } });
      if (submission.booking?.payment) {
        await tx.payment.update({
          where: { id: submission.booking.payment.id },
          data: { status: "SUCCESS", amount: submission.amountPaid },
        });
      }
    });
    res.json({ success: true, message: "Payment submission approved" });
  })
);

router.post(
  "/submissions/:id/reject",
  authGuard({ accessedBy: ["ADMIN"] }),
  tryCatch(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const submission = await (prisma as any).paymentSubmission.findUnique({ where: { id } });
    if (!submission) return res.status(404).json({ message: "Submission not found" });
    if (submission.status !== "PENDING") return res.status(400).json({ message: "Submission is not pending" });
    await (prisma as any).paymentSubmission.update({
      where: { id },
      data: { status: "REJECTED", reviewedBy: req.user?.id, reviewedAt: new Date() },
    });
    res.json({ success: true, message: "Payment submission rejected" });
  })
);

export { router as PaymentsRouter };
