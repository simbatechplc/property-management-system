import { Router } from "express";
import { tryCatch } from "../../utils/async-handler";
import { prisma } from "../../lib/prisma";
import { authGuard } from "../../middleware/auth-middleware";

const router = Router();

// General activities list (for admin activities page)
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

// 🔔 GET notifications with persistent DB-based read status
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
      description: { not: "__DELETED__" },
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

    const [activities, readRecords] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { timestamp: "desc" },
        take: Number(limit),
      }),
      // Get all read notification IDs for this user
      (prisma as any).notificationRead.findMany({
        where: { userId },
        select: { activityId: true },
      }),
    ]);

    const readSet = new Set<string>(readRecords.map((r: any) => r.activityId));

    const notifications = activities.map(n => ({
      ...n,
      isRead: readSet.has(n.id),
    }));

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.json({ data: notifications, unreadCount });
  })
);

// 🔔 PATCH mark notification as read — saves to DB
router.patch(
  "/notifications/:id/read",
  authGuard({ cantAccessBy: ["GUEST"] }),
  tryCatch(async (req, res) => {
    const userId = (req as any).user.id;
    const { id } = req.params;
    try {
      await (prisma as any).notificationRead.upsert({
        where: { userId_activityId: { userId, activityId: id } },
        create: { userId, activityId: id },
        update: {},
      });
    } catch {}
    res.json({ success: true });
  })
);

// 🗑️ DELETE notification — soft delete by marking description
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
    res.json({ success: true });
  })
);

export { router as ActivitiesRouter };
