import { Router } from "express";
import { tryCatch } from "../../utils/async-handler";
import { prisma } from "../../lib/prisma";
import { authGuard } from "../../middleware/auth-middleware";

const router = Router();

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
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { timestamp: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.activity.count({ where }),
    ]);

    res.json({ data: activities, total, page: Number(page), limit: Number(limit) });
  })
);

// 🔔 Admin notifications endpoint — returns recent important activities
router.get(
  "/notifications",
  authGuard({ accessedBy: ["ADMIN", "OWNER", "STAFF", "BROKER"] }),
  tryCatch(async (req, res) => {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { limit = 20 } = req.query;

    // Notification-worthy actions
    const notifActions = ["BOOKED", "APPROVED_BOOKING", "REJECTED_BOOKING", "CANCELLED_BOOKING", "CREATE_GUEST_HOUSE", "REGISTRATION_REQUEST"];

    let where: any = { action: { in: notifActions } };

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

    const notifications = await prisma.activity.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { timestamp: "desc" },
      take: Number(limit),
    });

    // Count unread (created in last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const unreadCount = notifications.filter(n => new Date(n.timestamp) > oneDayAgo).length;

    res.json({ data: notifications, unreadCount });
  })
);

export { router as ActivitiesRouter };
