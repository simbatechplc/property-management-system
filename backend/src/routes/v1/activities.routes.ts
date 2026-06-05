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

// 🔔 GET notifications
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

    const activities = await prisma.activity.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { timestamp: "desc" },
      take: Number(limit),
    });

    const unreadCount = activities.filter(n => !n.isRead).length;

    res.json({ data: activities, unreadCount });
  })
);

// 🔔 POST mark notification as read
router.post(
  "/notifications/:id/read",
  authGuard({ cantAccessBy: ["GUEST"] }),
  tryCatch(async (req, res) => {
    const { id } = req.params;
    
    await prisma.activity.update({
      where: { id },
      data: { isRead: true },
    });

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
