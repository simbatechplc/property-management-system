import { Router } from "express";
import propertiesController from "../../controllers/properties.controller";
import staffController from "../../controllers/management.controller";
import { authGuard } from "../../middleware/auth-middleware";
import reviewsController from "../../controllers/reviews.controller";

const router = Router();

// @/api/v1/properties/
// client
router.get("/", propertiesController.getProperties);
router.get("/trendings", propertiesController.getTrendingProperties);
router.get("/nearby", propertiesController.getNearbyProperties);
router.get("/location-stats", propertiesController.getLocationStats);

router.post("/reviews", authGuard(), reviewsController.createReview);
router.get("/reviews/:propertyId", reviewsController.getReviews);

router.get(
  "/management",
  authGuard({ cantAccessBy: ["GUEST"] }),
  propertiesController.getPropertiesForManagement
);
router.get(
  "/management/stats",
  authGuard({ cantAccessBy: ["GUEST"] }),
  propertiesController.getPropertiesStatsForManagement
);
router.get(
  "/management/for-list",
  authGuard({ cantAccessBy: ["GUEST"] }),
  propertiesController.getPropertiesForList
);
router.get(
  "/management/:id",
  authGuard({ cantAccessBy: ["GUEST"] }),
  propertiesController.getPropertyByIdForManagement
);

// staffs management
router.get(
  "/staff/for-list",
  authGuard({ cantAccessBy: ["GUEST"] }),
  staffController.getStaffsForList
);
router.post(
  "/staff/add-staff",
  authGuard({ cantAccessBy: ["GUEST"] }),
  staffController.addStaffToProperty
);
router.post(
  "/staff/add-broker",
  authGuard({ cantAccessBy: ["GUEST"] }),
  staffController.addBrokerToProperty
);
router.post(
  "/staff/remove-staff",
  authGuard({ cantAccessBy: ["GUEST"] }),
  staffController.removeStaffFromProperty
);
router.get(
  "/staff/get-staffs/:propertyId",
  authGuard({ cantAccessBy: ["GUEST"] }),
  staffController.getPropertyStaffs
);

router.get("/:id", propertiesController.getPropertyById);
router.put("/:id", authGuard({ cantAccessBy: ["GUEST"] }), propertiesController.updateProperty);
router.post("/:id/status", authGuard({ cantAccessBy: ["GUEST"] }), propertiesController.changePropertyStatus);
router.post("/:id/void", authGuard({ cantAccessBy: ["GUEST"] }), propertiesController.voidProperty);
router.post("/:id/restore", authGuard({ cantAccessBy: ["GUEST"] }), propertiesController.restoreProperty);
router.post("/:id/facilities", authGuard({ cantAccessBy: ["GUEST"] }), propertiesController.addFacility);
router.post("/:id/images", authGuard({ cantAccessBy: ["GUEST"] }), propertiesController.addPropertyImage);
router.delete("/:id/images", propertiesController.deletePropertyImage);
router.post("/:id/discount", authGuard({ cantAccessBy: ["GUEST"] }), propertiesController.setPropertyDiscount);
// Set price per night for private properties (villa/guest house)
router.post("/:id/price", authGuard({ cantAccessBy: ["GUEST"] }), async (req, res) => {
  const { prisma } = await import("../../lib/prisma");
  const { id: propertyId } = req.params;
  const { pricePerNight } = req.body;
  if (pricePerNight === undefined || pricePerNight === null) return res.status(400).json({ message: "pricePerNight is required" });
  const updated = await prisma.property.update({
    where: { id: propertyId },
    data: { pricePerNight: Number(pricePerNight) },
  });
  res.json({ success: true, message: "Property price updated", data: updated });
});

// Book a private property as a whole (villa/guest house)
router.post("/:id/book", authGuard(), async (req: any, res) => {
  const { prisma } = await import("../../lib/prisma");
  const { id: propertyId } = req.params;
  const { checkIn, checkOut, guests, userId } = req.body;
  const user = req.user;
  const bookingUserId = userId || user.id;

  try {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { rooms: { take: 1 } },
    });

    if (!property) return res.status(404).json({ message: "Property not found" });
    if (!property.pricePerNight) return res.status(400).json({ message: "Property price not set. Please contact admin." });

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (checkOutDate <= checkInDate) return res.status(400).json({ message: "Check-out must be after check-in" });

    const totalNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    const userDoc = await prisma.user.findUnique({ where: { id: bookingUserId } });
    if (!userDoc) return res.status(401).json({ message: "User not found" });

    // Price calculation using pricePerNight
    const propDiscount = property.discountPercent ?? 0;
    const effectivePrice = propDiscount > 0 ? property.pricePerNight * (1 - propDiscount / 100) : property.pricePerNight;
    const discountAmount = (property.pricePerNight - effectivePrice) * totalNights;
    const totalAmount = effectivePrice * totalNights;

    // 🏦 CHAPA_ENABLED=false — use manual bank transfer
    // Find or create a synthetic room for property-level bookings
    let room = property.rooms[0];
    if (!room) {
      room = await (prisma.room.create as any)({
        data: {
          name: `${property.name} - Main`,
          roomId: `${propertyId}-main`,
          price: property.pricePerNight,
          propertyId,
          availability: true,
          maxOccupancy: 10,
          squareMeters: 0,
        },
      });
    }

    const newBooking = await prisma.booking.create({
      data: {
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: Number(guests) || 1,
        totalAmount,
        subTotal: effectivePrice * totalNights,
        basePrice: property.pricePerNight,
        taxAmount: 0,
        discount: discountAmount,
        currency: "ETB",
        user: { connect: { id: bookingUserId } },
        room: { connect: { id: room.id } },
        property: { connect: { id: propertyId } },
        payment: {
          create: {
            status: "PENDING",
            method: "CASH",
            pendingAmount: totalAmount,
          },
        },
      },
    });

    await prisma.activity.create({
      data: {
        action: "BOOKED",
        description: `Property booking by ${userDoc.name} for "${property.name}". Check-in: ${checkInDate.toLocaleDateString()}, Check-out: ${checkOutDate.toLocaleDateString()}. Total: ETB ${totalAmount}. Awaiting manual bank transfer.`,
        userId: bookingUserId,
        bookingId: newBooking.id,
        roomId: room.id,
        propertyId,
        status: "INFO",
      },
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      paymentMethod: "MANUAL_BANK_TRANSFER",
      bookingId: newBooking.id,
      totalAmount,
    });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Booking failed" });
  }
});
router.post("/:id/license", authGuard({ cantAccessBy: ["GUEST"] }), async (req, res) => {
  const { prisma } = await import("../../lib/prisma");
  const { id: propertyId } = req.params;
  const { fileUrl } = req.body;
  if (!fileUrl) return res.status(400).json({ message: "fileUrl required" });
  await prisma.license.upsert({
    where: { propertyId },
    create: { propertyId, fileUrl, status: "PENDING" },
    update: { fileUrl, status: "PENDING" },
  });
  res.json({ success: true, message: "License added" });
});
router.delete("/:id/license", authGuard({ cantAccessBy: ["GUEST"] }), async (req, res) => {
  const { prisma } = await import("../../lib/prisma");
  const { id: propertyId } = req.params;
  await prisma.license.deleteMany({ where: { propertyId } });
  res.json({ success: true, message: "License removed" });
});
router.delete(
  "/:id",
  authGuard({ cantAccessBy: ["GUEST"] }),
  propertiesController.deleteProperty
);
router.post(
  "/",
  authGuard({ cantAccessBy: ["GUEST"] }),
  propertiesController.createProperty
);
router.post("/dummy", propertiesController.createDummyProperty);

export { router as PropertyRouter };
