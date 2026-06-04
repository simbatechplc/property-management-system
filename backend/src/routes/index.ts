import { Router } from "express";
import { PropertyRouter } from "./v1/property.routes";
import { AuthRouter } from "./v1/auth.routes";
import { UsersRouter } from "./v1/users.routes";
import { RoomsRouter } from "./v1/rooms.routes";
import { BookingsRouter } from "./v1/bookings.routes";
import { FavoriteRouter } from "./v1/favorites.routes";
import { DashboardRouter } from "./v1/dashboard.routes";
import { RegistrationRequestRouter } from "./v1/registration-request.routes";
import { CommisionRouter } from "./v1/commision.routes";
import { PaymentsRouter } from "./v1/payments.routes";
import { AiRouter } from "./v1/ai.routes";
import { ActivitiesRouter } from "./v1/activities.routes";
import { SiteConfigRouter } from "./v1/site-config.routes";
import { ChatRouter } from "./v1/chat.routes";

const rootRouter = Router();

rootRouter.get("/", (req, res) => {
  res.json({ message: "Server is running successfully" });
});

rootRouter.get("/api/v1/health", (req, res) => {
  res.json({ ok: true });
});

// Change password endpoint — works with Bearer token (mobile) and cookies (desktop)
rootRouter.post("/api/v1/auth/change-password", async (req, res) => {
  try {
    const { prisma } = await import("../lib/prisma");
    const { auth } = await import("../lib/auth");
    const { fromNodeHeaders } = await import("better-auth/node");
    let userId: string | null = null;

    // Try cookie session first
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) }).catch(() => null);
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      // Try Bearer token
      const token = req.headers["authorization"]?.replace("Bearer ", "");
      if (token) {
        const sessionDoc = await prisma.session.findFirst({ where: { token }, select: { userId: true } });
        if (sessionDoc?.userId) userId = sessionDoc.userId;
      }
    }

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "currentPassword and newPassword are required" });
    if (newPassword.length < 4) return res.status(400).json({ message: "New password must be at least 4 characters" });

    // Use better-auth's built-in password verification and hashing
    const ctx = await auth.$context;
    const account = await prisma.account.findFirst({ where: { userId, providerId: "credential" } });
    if (!account?.password) return res.status(400).json({ message: "No password set for this account" });

    const valid = await ctx.password.verify({ hash: account.password, password: currentPassword });
    if (!valid) return res.status(400).json({ message: "Current password is incorrect" });

    const hashed = await ctx.password.hash(newPassword);
    await prisma.account.update({ where: { id: account.id }, data: { password: hashed } });

    return res.json({ success: true, message: "Password changed successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: err?.message || "Failed to change password" });
  }
});

// ── Forgot Password flow ──────────────────────────────────────────────────────

// Helper: mark all expired codes as inactive
async function expireOldCodes(prisma: any) {
  await prisma.$executeRawUnsafe(
    `UPDATE "password_reset_code" SET "active" = false, "updatedAt" = NOW()
     WHERE "active" = true AND "expiresAt" < NOW()`
  );
}

// Scheduled job: expire codes every 60 seconds automatically (no endpoint call needed)
import("../lib/prisma").then(({ prisma }) => {
  setInterval(() => {
    expireOldCodes(prisma).catch((e: any) =>
      console.error("expireOldCodes scheduler error:", e?.message)
    );
  }, 60 * 1000); // every 1 minute
});

// Step 1: Send reset code to email
rootRouter.post("/api/v1/auth/forgot-password", async (req, res) => {
  try {
    const { prisma } = await import("../lib/prisma");
    await expireOldCodes(prisma);
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    // Check user exists and is approved
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return res.status(404).json({ message: "This email is not registered in the system" });
    if ((user as any).status && (user as any).status !== "APPROVED") {
      return res.status(403).json({ message: "This account is not approved to use the system" });
    }

    // Expire any existing active codes for this email
    await (prisma as any).$executeRawUnsafe(
      `UPDATE "password_reset_code" SET "active" = false, "updatedAt" = NOW() WHERE "email" = $1 AND "active" = true`,
      email
    );

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO "password_reset_code" ("id","email","code","active","expiresAt","createdAt","updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, true, $3, NOW(), NOW())`,
      email, code, expiresAt
    );

    // Send email — await it so errors surface to the user
    const { sendEmail } = await import("../utils/email");
    try {
      await sendEmail({
        to: email,
        subject: "Kuru Rent — Password Reset Code",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:10px;">
            <h2 style="color:#1a4a2e;margin-bottom:8px;">Password Reset</h2>
            <p style="color:#374151;margin-bottom:20px;">Use the code below to reset your password. It expires in <strong>5 minutes</strong>.</p>
            <div style="background:#1a4a2e;color:#fff;font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;padding:18px 24px;border-radius:8px;">${code}</div>
            <p style="color:#6b7280;font-size:13px;margin-top:20px;">If you didn't request this, ignore this email. Your password won't change.</p>
          </div>
        `,
      });
    } catch (emailErr: any) {
      console.error("Reset email send failed:", emailErr?.message);
      return res.status(500).json({ message: `Failed to send email: ${emailErr?.message || "SMTP error"}` });
    }

    return res.json({ success: true, message: "Reset code sent to your email" });

  } catch (err: any) {
    return res.status(500).json({ message: err?.message || "Failed to send reset code" });
  }
});

// Step 2: Verify the reset code
rootRouter.post("/api/v1/auth/verify-reset-code", async (req, res) => {
  try {
    const { prisma } = await import("../lib/prisma");
    await expireOldCodes(prisma);
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: "Email and code are required" });

    const rows: any[] = await (prisma as any).$queryRawUnsafe(
      `SELECT * FROM "password_reset_code" WHERE "email" = $1 AND "code" = $2 AND "active" = true ORDER BY "createdAt" DESC LIMIT 1`,
      email, code
    );

    if (!rows.length) return res.status(400).json({ message: "Invalid or expired code" });

    const record = rows[0];
    if (new Date(record.expiresAt) < new Date()) {
      // Mark as inactive
      await (prisma as any).$executeRawUnsafe(
        `UPDATE "password_reset_code" SET "active" = false, "updatedAt" = NOW() WHERE "id" = $1`,
        record.id
      );
      return res.status(400).json({ message: "Code has expired. Please request a new one." });
    }

    return res.json({ success: true, message: "Code verified" });
  } catch (err: any) {
    return res.status(500).json({ message: err?.message || "Failed to verify code" });
  }
});

// Step 3: Reset password using verified code
rootRouter.post("/api/v1/auth/reset-password", async (req, res) => {
  try {
    const { prisma } = await import("../lib/prisma");
    const { auth } = await import("../lib/auth");
    await expireOldCodes(prisma);
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) return res.status(400).json({ message: "email, code and newPassword are required" });
    if (newPassword.length < 4) return res.status(400).json({ message: "Password must be at least 4 characters" });

    const rows: any[] = await (prisma as any).$queryRawUnsafe(
      `SELECT * FROM "password_reset_code" WHERE "email" = $1 AND "code" = $2 AND "active" = true ORDER BY "createdAt" DESC LIMIT 1`,
      email, code
    );

    if (!rows.length) return res.status(400).json({ message: "Invalid or expired code" });

    const record = rows[0];
    if (new Date(record.expiresAt) < new Date()) {
      await (prisma as any).$executeRawUnsafe(
        `UPDATE "password_reset_code" SET "active" = false, "updatedAt" = NOW() WHERE "id" = $1`,
        record.id
      );
      return res.status(400).json({ message: "Code has expired. Please request a new one." });
    }

    // Hash new password using better-auth's scrypt
    const ctx = await auth.$context;
    const hashed = await ctx.password.hash(newPassword);

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const account = await prisma.account.findFirst({ where: { userId: user.id, providerId: "credential" } });
    if (!account) return res.status(400).json({ message: "No password account found" });

    await prisma.account.update({ where: { id: account.id }, data: { password: hashed } });

    // Mark code as used and inactive
    await (prisma as any).$executeRawUnsafe(
      `UPDATE "password_reset_code" SET "active" = false, "usedAt" = NOW(), "updatedAt" = NOW() WHERE "id" = $1`,
      record.id
    );

    return res.json({ success: true, message: "Password reset successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: err?.message || "Failed to reset password" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────

// Public stats endpoint — no auth required
rootRouter.get("/api/v1/public/stats", async (req, res) => {
  try {
    const { prisma } = await import("../lib/prisma");
    const [totalProperties, totalBookings, totalReviews] = await Promise.all([
      prisma.property.count({ where: { status: "APPROVED", visibility: true } }),
      prisma.booking.count({ where: { status: "APPROVED" } }),
      prisma.review.count(),
    ]);
    res.json({ totalProperties, totalBookings, totalReviews });
  } catch {
    res.json({ totalProperties: 0, totalBookings: 0, totalReviews: 0 });
  }
});

rootRouter.use("/api/v1/properties", PropertyRouter);
rootRouter.use("/api/v1/auth", AuthRouter);
rootRouter.use("/api/v1/users", UsersRouter);
rootRouter.use("/api/v1/rooms", RoomsRouter);
rootRouter.use("/api/v1/dashboard", DashboardRouter);
rootRouter.use("/api/v1/bookings", BookingsRouter);
rootRouter.use("/api/v1/favorites", FavoriteRouter);
rootRouter.use("/api/v1/payments", PaymentsRouter);
rootRouter.use("/api/v1/commision-settings", CommisionRouter);
rootRouter.use("/api/v1/registration-requests", RegistrationRequestRouter);
rootRouter.use("/api/v1/ai", AiRouter);
rootRouter.use("/api/v1/activities", ActivitiesRouter);
rootRouter.use("/api/v1/site-config", SiteConfigRouter);
rootRouter.use("/api/v1/chat", ChatRouter);

// Diagnostic: test email sending (admin only in production)
rootRouter.post("/api/v1/test-email", async (req, res) => {
  try {
    const { to, subject } = req.body;
    const target = to || "simbatechtradingplc@gmail.com";
    
    // Show which env vars are present
    const envStatus = {
      BREVO_API_KEY: process.env.BREVO_API_KEY ? `set (${process.env.BREVO_API_KEY.substring(0, 10)}...)` : "NOT SET",
      RESEND_API_KEY: process.env.RESEND_API_KEY ? "set" : "NOT SET",
      SMTP_USER: process.env.SMTP_USER || "NOT SET",
      SMTP_PASS: process.env.SMTP_PASS ? "set" : "NOT SET",
    };

    const { sendEmail } = await import("../utils/email");
    await sendEmail({
      to: target,
      subject: subject || "Test Email from Kuru Rent Backend",
      html: `<p>This is a test email sent at ${new Date().toISOString()}</p><p>Env: ${JSON.stringify(envStatus)}</p>`,
    });

    res.json({ success: true, sentTo: target, envStatus });
  } catch (err: any) {
    res.status(500).json({ 
      success: false, 
      error: err?.message,
      details: err?.response?.data || err?.code,
      envStatus: {
        BREVO_API_KEY: process.env.BREVO_API_KEY ? `set (${process.env.BREVO_API_KEY.substring(0, 10)}...)` : "NOT SET",
        RESEND_API_KEY: process.env.RESEND_API_KEY ? "set" : "NOT SET",
        SMTP_USER: process.env.SMTP_USER || "NOT SET",
        SMTP_PASS: process.env.SMTP_PASS ? "set" : "NOT SET",
      }
    });
  }
});

export default rootRouter;
