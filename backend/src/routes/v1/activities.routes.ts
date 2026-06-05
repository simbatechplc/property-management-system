import { Router } from "express";
import { tryCatch } from "../../utils/async-handler";
import { prisma } from "../../lib/prisma";
import { authGuard } from "../../middleware/auth-middleware";

const router = Router();

// General activities list
router.get(
  "/",
  authGuard({ cantAccessBy: ["GUEST"] }),
  tryCatch(async (req, res) => {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let where: any = {};
    if (userRole === "ADMIN") {
      where = {};
    } else if (userRole === "BROKER") {
      where = { userId };
    } else if (userRole === "OWNER" || userRole === "STAFF") {
      const managed = await prisma.managedProperty.findMany({
        where: { userId, role: { in: [userRole] } },
        select: { propertyId: true },
      });
      const propertyIds = [...new Set(managed.map((m) => m.propertyId))];
      where = propertyIds.length ? { propertyId: { in: propertyIds } } : { userId };
    } else {
      where = { userId };
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { timestamp: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.activity.count({ where }),
    ]);

    res.json({ data: activities, total, page: Number(page), limit: Number(limit) });
  })
);

// Helper: get read notification IDs for a user from DB (stored in user metadata via raw SQL)
async function getReadIds(userId: string): Promise<Set<string>> {
  try {
    // Use a simple key-value approach — store in a dedicated table if it exists, else fallback
    const rows = await prisma.$queryRawUnsafe<Array<{ activityId: string }>>(
      `SELECT "activityId" FROM "notification_read" WHERE "userId" = $1`,
      userId
    );
    return new Set(rows.map(r => r.activityId));
  } catch {
    return new Set<string>();
  }
}

// 🔔 GET notifications with DB-based read status
router.get(
  "/notifications",
  authGuard({ accessedBy: ["ADMIN", "OWNER", "STAFF", "BROKER"] }),
  tryCatch(async (req, res) => {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { limit = 50 } = req.query;

    const notifActions = [
      "BOOKED", "APPROVED_BOOKING", "REJECTED_BOOKING", "CANCELLED_BOOKING",
      "CREATE_GUEST_HOUSE", "REGISTRATION_REQUEST", "PAYMENT_SUCCESS",
      "PAYMENT_FAILED", "REPORT_SUBMITTED",
    ];

    let where: any = {
      action: { in: notifActions },
      NOT: { description: "__DELETED__" },
    };

    if (userRole !== "ADMIN") {
      const managed = await prisma.managedProperty.findMany({
        where: { userId },
        select: { propertyId: true },
      });
      const propertyIds = managed.map((m) => m.propertyId);
      if (propertyIds.length) {
        where = { ...where, propertyId: { in: propertyIds } };
      } else {
        where = { ...where, userId };
      }
    }

    const [activities, readSet] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { timestamp: "desc" },
        take: Number(limit),
      }),
      getReadIds(userId),
    ]);

    const notifications = activities.map(n => ({
      ...n,
      isRead: readSet.has(n.id),
    }));

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.json({ data: notifications, unreadCount });
  })
);

// 🔔 PATCH mark notification as read — persists to DB
router.patch(
  "/notifications/:id/read",
  authGuard({ cantAccessBy: ["GUEST"] }),
  tryCatch(async (req, res) => {
    const userId = (req as any).user.id;
    const { id } = req.params;
    try {
      // Ensure the notification_read table exists and insert
      await prisma.$executeRawUnsafe(
        `INSERT INTO "notification_read" ("id", "userId", "activityId", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, NOW())
         ON CONFLICT ("userId", "activityId") DO NOTHING`,
        userId, id
      );
    } catch (err: any) {
      // Table might not exist yet — create it and retry
      try {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "notification_read" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "activityId" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "notification_read_pkey" PRIMARY KEY ("id"),
            CONSTRAINT "notification_read_userId_activityId_key" UNIQUE ("userId", "activityId")
          )
        `);
        await prisma.$executeRawUnsafe(
          `INSERT INTO "notification_read" ("id", "userId", "activityId", "createdAt")
           VALUES (gen_random_uuid()::text, $1, $2, NOW())
           ON CONFLICT ("userId", "activityId") DO NOTHING`,
          userId, id
        );
      } catch {}
    }
    res.json({ success: true });
  })
);

// 🗑️ DELETE notification
router.delete(
  "/notifications/:id",
  authGuard({ cantAccessBy: ["GUEST"] }),
  tryCatch(async (req, res) => {
    const { id } = req.params;
    try {
      await prisma.activity.delete({ where: { id } });
    } catch {
      try {
        await prisma.activity.update({
          where: { id },
          data: { description: "__DELETED__" },
        });
      } catch {}
    }
    // Also remove from read table
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "notification_read" WHERE "activityId" = $1`, id);
    } catch {}
    res.json({ success: true });
  })
);

export { router as ActivitiesRouter };
