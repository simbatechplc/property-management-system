import { tryCatch } from "../utils/async-handler";
import { prisma } from "../lib/prisma";
import {
  bookingSchema,
  manualBookingSchema,
} from "./validators/booking.validator";
import { initializeChapaPayment } from "../services/payments.service";
import { chapaConfig } from "../config/chapa";

export default {
  bookNow: tryCatch(async (req, res, next) => {
    const validated = req.body;
    const { checkIn, checkOut, roomId, userId, additionalServices, guests } =
      validated;
    const userDoc = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    console.log({ validated });

    if (!userDoc) {
      res.status(401).json({
        message: "User not found please login again",
      });

      return;
    }

    // Parse dates safely
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        success: false,
        message: "Check-out date must be after check-in date",
      });
    }

    // Calculate total nights
    const oneDay = 1000 * 60 * 60 * 24;
    const totalNights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / oneDay
    );

    const roomDoc = await prisma.room.findFirst({ where: { id: roomId } });
    if (guests > roomDoc?.maxOccupancy) {
      return res.status(400).json({
        success: false,
        message: "You have add",
      });
    }

    if (!roomDoc) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Check room availability
    const overlapping = await prisma.booking.findFirst({
      where: {
        roomId,
        status: { notIn: ["CANCELLED", "REJECTED"] },
        OR: [
          { checkIn: { lte: checkOutDate }, checkOut: { gte: checkInDate } },
        ],
      },
    });

    if (overlapping) {
      return res.status(409).json({
        success: false,
        message: "Room is not available for the selected dates",
      });
    }

    // Validate additional services
    const validServiceIds = validated.additionalServices.map((s) => s.id);
    let additionalServicesTotal = 0;

    if (validServiceIds.length > 0) {
      const services = await prisma.additionalService.findMany({
        where: { id: { in: validServiceIds }, isActive: true },
        select: { id: true, price: true },
      });

      const foundIds = services.map((s) => s.id);
      const invalidIds = validServiceIds.filter((id) => !foundIds.includes(id));

      if (invalidIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid or inactive additional service(s): ${invalidIds.join(
            ", "
          )}`,
        });
      }

      // Sum additional service prices
      additionalServicesTotal = services.reduce(
        (sum, s) => sum + (s.price || 0),
        0
      );
    }

    // Compute total price with discounts applied
    // Priority: room discount > property discount (take the higher one, or combine)
    const roomDiscount = (roomDoc as any).discountPercent ?? 0;
    const propertyDoc = await prisma.property.findUnique({
      where: { id: roomDoc.propertyId },
      select: { discountPercent: true },
    });
    const propertyDiscount = (propertyDoc as any)?.discountPercent ?? 0;

    // Use the higher of room or property discount (or combine: property applies to base, room applies on top)
    // Logic: apply property discount first, then room discount on top
    const basePrice = roomDoc.price;
    const afterPropertyDiscount = propertyDiscount > 0
      ? basePrice * (1 - propertyDiscount / 100)
      : basePrice;
    const effectivePrice = roomDiscount > 0
      ? afterPropertyDiscount * (1 - roomDiscount / 100)
      : afterPropertyDiscount;
    const effectivePriceRounded = Math.round(effectivePrice * 100) / 100;

    const totalDiscountAmount = (basePrice - effectivePriceRounded) * totalNights;
    const perNightTotal = effectivePriceRounded;
    const totalAmount = perNightTotal * totalNights + additionalServicesTotal;
    const txRef = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const CLIENT_FRONTEND_URL = process.env.CLIENT_FRONTEND_URL;

    // Find broker assigned to this property (if any)
    const brokerRecord = await prisma.managedProperty.findFirst({
      where: { propertyId: roomDoc.propertyId, role: "BROKER" },
      select: { userId: true },
    });
    const brokerId = brokerRecord?.userId || "";

    // 🏦 CHAPA_ENABLED flag — when false, use manual bank transfer
    const CHAPA_ENABLED = process.env.CHAPA_ENABLED === "true";

    if (!CHAPA_ENABLED) {
      // Create booking without Chapa payment
      const newBooking = await prisma.booking.create({
        data: {
          checkIn: checkInDate,
          checkOut: checkOutDate,
          guests: validated.guests,
          manualBooked: false,
          totalAmount,
          subTotal: effectivePriceRounded * totalNights,
          basePrice: roomDoc.price,
          taxAmount: 0,
          discount: totalDiscountAmount,
          currency: "ETB",
          user: { connect: { id: validated.userId } },
          room: { connect: { id: validated.roomId } },
          property: { connect: { id: roomDoc.propertyId } },
          additionalServices: {
            connect: validated.additionalServices.map((s) => ({ id: s.id })),
          },
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
          description: `New booking by user ${userDoc.name} (${userDoc.email}) for room "${roomDoc.name}". Check-in: ${checkInDate.toLocaleDateString()}, Check-out: ${checkOutDate.toLocaleDateString()}. Total: ETB ${totalAmount}. Awaiting manual bank transfer.`,
          userId: validated.userId,
          bookingId: newBooking.id,
          roomId: validated.roomId,
          propertyId: roomDoc.propertyId,
          status: "INFO",
        },
      }).catch(() => {});

      return res.status(201).json({
        success: true,
        paymentMethod: "MANUAL_BANK_TRANSFER",
        bookingId: newBooking.id,
        totalAmount,
      });
    }

    const { chapaResponse, commission, subaccounts } =
      await initializeChapaPayment({
        data: {
          amount: totalAmount,
          customerName: userDoc.name,
          email: userDoc.email,
          phoneNumber: userDoc.phone,
          txRef,
          callbackUrl: `${CLIENT_FRONTEND_URL}/account/bookings?txRef=${txRef}`,
          returnUrl: `${CLIENT_FRONTEND_URL}/account/bookings?txRef=${txRef}`,
        },
        propertyId: roomDoc.propertyId,
        brokerId,
      });

    if (!chapaResponse?.checkout_url && !chapaResponse?.data?.checkout_url) {
      return res.status(502).json({
        success: false,
        message: "Payment initialization failed. Please try again.",
      });
    }

    // Create booking and log activity
    const newBooking = await prisma.booking.create({
      data: {
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: validated.guests,
        manualBooked: false,
        totalAmount,
        subTotal: effectivePriceRounded * totalNights,
        basePrice: roomDoc.price,
        taxAmount: 0,
        discount: totalDiscountAmount,
        currency: "ETB",
        user: { connect: { id: validated.userId } },
        room: { connect: { id: validated.roomId } },
        property: { connect: { id: roomDoc.propertyId } },
        additionalServices: {
          connect: validated.additionalServices.map((s) => ({ id: s.id })),
        },
        payment: {
          create: {
            transactionRef: txRef,
            status: "PENDING",
            method: "ONLINE",
            pendingAmount: totalAmount,
          },
        },
      },
    });

    // Log BOOKED activity so it appears in admin activities tab
    await prisma.activity.create({
      data: {
        action: "BOOKED",
        description: `New booking by user ${userDoc.name} (${userDoc.email}) for room "${roomDoc.name}". Check-in: ${checkInDate.toLocaleDateString()}, Check-out: ${checkOutDate.toLocaleDateString()}. Total: ETB ${totalAmount}`,
        userId: validated.userId,
        bookingId: newBooking.id,
        roomId: validated.roomId,
        propertyId: roomDoc.propertyId,
        status: "INFO",
      },
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      checkoutUrl: chapaResponse?.checkout_url ?? chapaResponse?.data?.checkout_url,
    });
  }),

  getUserBookings: tryCatch(async (req, res, next) => {
    const userId = (req as any).user.id;
    console.log({ userId });

    const userBookings = await prisma.booking.findMany({
      where: {
        userId,
      },
      include: {
        room: {
          select: {
            images: true,
            id: true,
            name: true,
            description: true,
            price: true,
            roomId: true,
          },
        },
        property: {
          select: {
            name: true,
            id: true,
            images: true,
            about: { select: { description: true } },
          },
        },
        payment: {
          select: { status: true, id: true, amount: true, pendingAmount: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ data: userBookings, success: true });
  }),
  getUserBookingDetailById: tryCatch(async (req, res, next) => {
    const bookingId = req.params.bookingId;
    const bookingDoc = await prisma.booking.findFirst({
      where: {
        id: bookingId,
      },
      include: {
        payment: {
          select: {
            amount: true,
            pendingAmount: true,
            method: true,
            transactionRef: true,
            phoneNumber: true,
            status: true,
          },
        },
        room: {
          select: {
            images: true,
            id: true,
            name: true,
            description: true,
            roomId: true,
          },
        },
        property: {
          select: {
            name: true,
            id: true,
            images: true,
            about: { select: { description: true } },
          },
        },
        additionalServices: true,
      },
    });

    console.log({ payment: bookingDoc.payment });
    res.json({
      data: bookingDoc,
      success: true,
    });
  }),

  // management
  manualBooking: tryCatch(async (req, res) => {
    const user = req.user;
    const userId = user?.id;
    const userRole = user?.role;

    try {
      const validated = manualBookingSchema.parse(req.body);

      // Check if room exists
      const room = await prisma.room.findUnique({
        where: { id: validated.roomId },
        include: { property: { include: { managers: true } } },
      });

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      // Check access via ManagedProperty
      let hasAccess = false;

      if (userRole === "ADMIN") {
        hasAccess = true;
      } else {
        const managed = await prisma.managedProperty.findFirst({
          where: {
            userId,
            propertyId: room.propertyId,
            role: { in: ["OWNER", "STAFF", "BROKER"] },
          },
        });
        hasAccess = !!managed;
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to create bookings for this room",
        });
      }

      const checkInDate = new Date(validated.checkIn);
      const checkOutDate = new Date(validated.checkOut);

      if (checkOutDate <= checkInDate) {
        return res.status(400).json({
          success: false,
          message: "Check-out date must be after check-in date",
        });
      }

      // Find overlapping bookings
      const overlappingBookings = await prisma.booking.findMany({
        where: {
          roomId: validated.roomId,
          status: { in: ["PENDING", "APPROVED"] },
          OR: [
            {
              checkIn: { lte: checkOutDate },
              checkOut: { gte: checkInDate },
            },
          ],
        },
        select: { checkIn: true, checkOut: true, guestName: true },
      });

      if (overlappingBookings.length > 0) {
        const takenDates: string[] = [];
        overlappingBookings.forEach((booking) => {
          let current = new Date(booking.checkIn);
          const end = new Date(booking.checkOut);
          while (current <= end) {
            takenDates.push(current.toISOString().split("T")[0]);
            current.setDate(current.getDate() + 1);
          }
        });

        return res.status(400).json({
          success: false,
          message: "Some dates are already taken",
          takenDates,
          overlappingBookings,
        });
      }

      // Create booking
      const booking = await prisma.$transaction(async (tx) => {
        const created = await tx.booking.create({
          data: {
            manualBooked: true,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            guests: validated.guests,
            guestName: validated.guestName,
            guestPhone: validated.guestPhone,
            guestEmail: validated.guestEmail,
            status: "APPROVED",
            totalAmount: validated.totalAmount,
            subTotal: validated.basePrice,
            basePrice: validated.basePrice,
            taxAmount: validated.taxAmount,
            discount: validated.discount || 0,
            currency: validated.currency,
            roomId: validated.roomId,
            propertyId: validated.propertyId || room.propertyId,
            approvedById: userId,
            payment: {
              create: {
                method: validated.paymentMethod,
                status: "SUCCESS",
                amount: validated.totalAmount,
                phoneNumber: validated.guestPhone,
              },
            },
          },
          include: { payment: true, room: true },
        });

        // Log manual booking activity
        await tx.activity.create({
          data: {
            action: "APPROVED_BOOKING",
            description: `Manual booking RESERVED by ${userRole} for guest "${validated.guestName}" in room "${room.name}". Check-in: ${checkInDate.toLocaleDateString()}, Check-out: ${checkOutDate.toLocaleDateString()}. Total: ETB ${validated.totalAmount}`,
            userId,
            bookingId: created.id,
            roomId: validated.roomId,
            propertyId: validated.propertyId || room.propertyId,
            status: "INFO",
          },
        });

        return created;
      });

      res.json({
        success: true,
        message: "Manual booking created successfully",
        data: booking,
      });
    } catch (error: any) {
      console.error("Manual booking error:", error);
      res.status(500).json({
        success: false,
        message: error?.message || "Something went wrong",
      });
    }
  }),

  bookDummy: tryCatch(async (req, res) => {
    const { roomId, userId } = req.body;
    const roomDoc = await prisma.room.findFirst({ where: { id: roomId } });

    if (!roomId || !userId) {
      return res.status(400).json({
        success: false,
        message: "roomId and userId are required",
      });
    }

    // Just for testing — fixed dummy data
    const now = new Date();
    const checkIn = new Date(now);
    const checkOut = new Date(now);
    checkOut.setDate(checkOut.getDate() + 2); // 2-day stay

    const booking = await prisma.booking.create({
      data: {
        checkIn,
        checkOut,
        guests: 2,
        manualBooked: true,
        status: "PENDING",
        totalAmount: 200.0,
        subTotal: 150.0,
        basePrice: 150.0,
        taxAmount: 30.0,
        discount: 0.0,
        property: { connect: { id: roomDoc.propertyId } },
        currency: "USD",
        user: { connect: { id: userId } },
        room: { connect: { id: roomId } },
        payment: {
          create: {
            method: "ONLINE",
            status: "PENDING",
            transactionRef: "tx-23jksddsl",
          },
        },
      },
      include: {
        user: true,
        room: true,
        payment: true,
      },
    } as any);

    return res.status(201).json({
      success: true,
      message: "Dummy booking created successfully",
      data: booking,
    });
  }),

  // admins
  getBookingsForManagement: tryCatch(async (req, res) => {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    // Determine properties the user can access
    let propertyIds: string[] = [];

    switch (userRole) {
      case "ADMIN":
        // Admin can access all properties
        break;

      case "OWNER":
      case "STAFF":
      case "BROKER":
        const managed = await prisma.managedProperty.findMany({
          where: { userId, role: userRole as any },
          select: { propertyId: true },
        });

        propertyIds = [...new Set(managed.map((m) => m.propertyId))];

        if (!propertyIds.length) {
          return res.status(200).json([]);
        }
        break;

      default:
        return res.status(403).json({ message: "Access denied" });
    }

    // Fetch bookings with authorization
    const bookings = await prisma.booking.findMany({
      where: propertyIds.length
        ? { room: { propertyId: { in: propertyIds } } }
        : {},
      include: {
        user: true,
        room: true,
        property: { select: { id: true, name: true } },
        payment: true,
        additionalServices: true,
        approvedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(bookings);
  }),
  getBookingStatsForManagement: tryCatch(async (req, res) => {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    // Determine properties the user can access
    let propertyIds: string[] = [];

    switch (userRole) {
      case "ADMIN":
        // Admin can access all properties
        break;

      case "OWNER":
      case "STAFF":
      case "BROKER":
        const managed = await prisma.managedProperty.findMany({
          where: { userId, role: { in: [userRole, "STAFF", "BROKER", "OWNER"] } },
          select: { propertyId: true },
        });

        propertyIds = managed.map((m) => m.propertyId);

        if (!propertyIds.length) {
          return res.json({
            totalBookings: 0,
            upcomingBookings: 0,
            pastBookings: 0,
            totalGuests: 0,
            totalRevenue: 0,
          });
        }
        break;

      default:
        return res.status(403).json({ message: "Access denied" });
    }

    // Base filter
    const bookingWhere = propertyIds.length
      ? { room: { propertyId: { in: propertyIds } } }
      : {};

    // Fetch booking stats
    const [
      totalBookings,
      upcomingBookings,
      pastBookings,
      totalGuests,
      totalRevenue,
    ] = await Promise.all([
      prisma.booking.count({ where: bookingWhere }),

      prisma.booking.count({
        where: { ...bookingWhere, checkIn: { gte: new Date() } },
      }),

      prisma.booking.count({
        where: { ...bookingWhere, checkOut: { lt: new Date() } },
      }),

      prisma.booking
        .aggregate({
          _sum: { guests: true },
          where: bookingWhere,
        })
        .then((res) => res._sum.guests ?? 0),

      prisma.booking
        .aggregate({
          _sum: { totalAmount: true }, // make sure you have `totalAmount` on booking/payment
          where: bookingWhere,
        })
        .then((res) => res._sum.totalAmount ?? 0),
    ]);

    return res.json({
      totalBookings,
      upcomingBookings,
      pastBookings,
      totalGuests,
      totalRevenue,
    });
  }),

  getRecentBookingForManagement: tryCatch(async (req, res) => {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    // Determine properties the user can access
    let propertyIds: string[] = [];

    switch (userRole) {
      case "ADMIN":
        // Admin can access all properties
        break;

      case "OWNER":
      case "STAFF":
      case "BROKER":
        const managed = await prisma.managedProperty.findMany({
          where: { userId, role: { in: [userRole, "STAFF", "BROKER", "OWNER"] } },
          select: { propertyId: true },
        });

        propertyIds = managed.map((m) => m.propertyId);

        if (!propertyIds.length) {
          return res.json([]);
        }
        break;

      default:
        return res.status(403).json({ message: "Access denied" });
    }

    // Fetch bookings with authorization
    const bookings = await prisma.booking.findMany({
      where: propertyIds.length
        ? { room: { propertyId: { in: propertyIds } } }
        : {},
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        room: {
          select: {
            name: true,
            id: true,
            roomId: true,
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      take: 8,
      orderBy: { createdAt: "desc" },
    });

    res.json(bookings);
  }),

  getBookingDetailForManagement: tryCatch(async (req, res) => {
    const { bookingId } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            roomId: true,
            price: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            method: true,
            amount: true,
            transactionRef: true,
            phoneNumber: true,
          },
        },
        activities: {
          select: {
            id: true,
            action: true,
            timestamp: true,
            description: true,
          },
          orderBy: { timestamp: "desc" },
        },
        additionalServices: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    return res.json(booking);
  }),
  changeBookingStatus: tryCatch(async (req, res) => {
    const { bookingId } = req.params;
    const { status, reason } = req.body;

    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const validStatuses = ["APPROVED", "REJECTED", "CANCELLED", "PENDING_OWNER_APPROVAL", "PENDING_OWNER_REJECTION", "PENDING"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status update.", success: false });
    }

    // BROKER cannot cancel bookings
    if (userRole === "BROKER" && status === "CANCELLED") {
      return res.status(403).json({ message: "Brokers cannot cancel bookings.", success: false });
    }

    // Determine which properties the user can access
    let propertyIds: string[] = [];

    switch (userRole) {
      case "ADMIN":
        break;
      case "OWNER":
      case "STAFF":
      case "BROKER":
        const managed = await prisma.managedProperty.findMany({
          where: { userId, role: { in: [userRole] } },
          select: { propertyId: true },
        });
        propertyIds = managed.map((m) => m.propertyId);
        if (!propertyIds.length) {
          return res.status(403).json({ message: "Access denied. No assigned properties.", success: false });
        }
        break;
      default:
        return res.status(403).json({ message: "Access denied.", success: false });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, propertyId: true, status: true, checkIn: true, checkOut: true, roomId: true },
    });

    if (!booking) return res.status(404).json({ message: "Booking not found.", success: false });

    if (propertyIds.length && !propertyIds.includes(booking.propertyId)) {
      return res.status(403).json({ message: "Unauthorized property.", success: false });
    }

    if (booking.status === "APPROVED" && status === "APPROVED") {
      return res.status(400).json({ message: "Booking already approved.", success: false });
    }
    if (booking.status === "CANCELLED" && status !== "CANCELLED") {
      return res.status(400).json({ message: "Booking already cancelled.", success: false });
    }

    // Broker approve/reject → set to PENDING_OWNER_APPROVAL or PENDING_OWNER_REJECTION
    const isBrokerAction = userRole === "BROKER" && ["APPROVED", "REJECTED"].includes(status);
    const effectiveStatus = isBrokerAction
      ? (status === "APPROVED" ? "PENDING_OWNER_APPROVAL" : "PENDING_OWNER_REJECTION")
      : status;

    // Owner: cancel broker rejection → back to PENDING
    const isOwnerCancelRejection = userRole === "OWNER" && status === "PENDING" && booking.status === "PENDING_OWNER_REJECTION";

    const now = new Date();
    const activityDesc = isBrokerAction
      ? `Broker pre-${status.toLowerCase()} booking #${bookingId.slice(0, 8)} on ${now.toLocaleString()}. Waiting for owner response.`
      : isOwnerCancelRejection
      ? `Owner cancelled broker rejection for booking #${bookingId.slice(0, 8)} on ${now.toLocaleString()}. Booking returned to PENDING.`
      : `Booking ${status.toLowerCase()} by ${userRole} on ${now.toLocaleString()}. Booking ID: ${bookingId.slice(0, 8)}.${reason ? ` Reason: ${reason}` : ""}`;

    await prisma.$transaction(async (tx) => {
      if (["CANCELLED", "REJECTED"].includes(effectiveStatus)) {
        await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: effectiveStatus as any,
            cancelledCheckIn: booking.checkIn,
            cancelledCheckOut: booking.checkOut,
            approvedById: null,
            rejectionReason: reason || null,
            updatedAt: now,
          },
        });

        const payment = await tx.payment.findUnique({ where: { bookingId: booking.id } });
        if (payment) {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: payment.status === "SUCCESS" ? "REFUNDED" : "CANCELLED" },
          });
        }

        await tx.activity.create({
          data: {
            bookingId: booking.id,
            propertyId: booking.propertyId,
            roomId: booking.roomId,
            userId,
            action: effectiveStatus === "REJECTED" ? "REJECTED_BOOKING" : "CANCELLED_BOOKING",
            description: activityDesc,
          },
        });
      } else if (effectiveStatus === "PENDING_OWNER_APPROVAL" || effectiveStatus === "PENDING_OWNER_REJECTION") {
        await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: effectiveStatus as any,
            brokerApprovedAt: now,
            rejectionReason: effectiveStatus === "PENDING_OWNER_REJECTION" ? (reason || null) : null,
            updatedAt: now,
          },
        });
        await tx.activity.create({
          data: {
            bookingId: booking.id,
            propertyId: booking.propertyId,
            roomId: booking.roomId,
            userId,
            action: "UPDATED_BOOKING",
            description: activityDesc,
          },
        });
      } else if (effectiveStatus === "PENDING" && isOwnerCancelRejection) {
        // Owner cancels broker rejection → back to PENDING
        await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: "PENDING" as any,
            rejectionReason: null,
            brokerApprovedAt: null,
            updatedAt: now,
          },
        });
        await tx.activity.create({
          data: {
            bookingId: booking.id,
            propertyId: booking.propertyId,
            roomId: booking.roomId,
            userId,
            action: "UPDATED_BOOKING",
            description: activityDesc,
          },
        });
      } else {
        // APPROVED by owner/staff
        await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: effectiveStatus as any,
            approvedById: effectiveStatus === "APPROVED" ? userId : null,
            updatedAt: now,
          },
        });

        if (effectiveStatus === "APPROVED") {
          const payment = await tx.payment.findUnique({ where: { bookingId: booking.id } });
          if (payment && payment.status === "PENDING") {
            await tx.payment.update({
              where: { id: payment.id },
              data: { status: "SUCCESS", amount: payment.pendingAmount ?? payment.amount },
            });
          }
        }

        await tx.activity.create({
          data: {
            bookingId: booking.id,
            propertyId: booking.propertyId,
            roomId: booking.roomId,
            userId,
            action: "APPROVED_BOOKING",
            description: activityDesc,
          },
        });
      }
    });

    const responseMessage = isBrokerAction
      ? `Booking sent to owner for ${status.toLowerCase()} approval.`
      : isOwnerCancelRejection
      ? "Broker rejection cancelled. Booking returned to pending."
      : `Booking ${effectiveStatus.toLowerCase()} successfully.`;

    return res.status(200).json({ message: responseMessage, success: true });
  }),
};

