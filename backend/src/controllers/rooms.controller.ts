import { tryCatch } from "../utils/async-handler";
import {
  createRoomSchema,
  serviceSchema,
  updateServiceSchema,
} from "./validators/rooms.validator";
import { prisma } from "../lib/prisma";
import { dummyRoomsData } from "../data/dummy-rooms";

export default {
  getRooms: tryCatch(async (req, res) => {
    const propertyId = req.params.propertyId;
    const rooms = await prisma.room.findMany({
      where: {
        id: propertyId,
      },
      include: {
        images: true,
        features: true,
      },
    });

    res.status(200).json(rooms);
  }),
  getRoomById: tryCatch(async (req, res) => {
    const roomId = req.params.id;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        images: true,
        features: true,
        services: true,
        property: {
          select: { discountPercent: true, id: true, name: true, type: true, accessType: true },
        },
        bookings: {
          where: { status: { in: ["PENDING", "APPROVED"] } },
          select: { checkIn: true, checkOut: true },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Compute real availability: no active bookings overlapping today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const hasActiveBooking = room.bookings.some(
      (b) => b.checkIn && b.checkOut && new Date(b.checkOut) >= today
    );

    res.status(200).json({
      data: { ...room, availability: !hasActiveBooking },
      success: true,
    });
  }),

  //management
  getRoomsForManagmentList: tryCatch(async (req, res) => {
    const propertyId = req.params.propertyId;

    const rooms = await prisma.room.findMany({
      where: { propertyId },
      select: {
        name: true,
        id: true,
        images: true,
        bookings: true,
        createdAt: true,
        description: true,
        property: {
          select: {
            images: true,
            id: true,
            name: true,
          },
        },
        price: true,
        roomId: true,
        type: true,
      },
    });

    return res.status(200).json(rooms);
  }),
  getRoomsForManagement: tryCatch(async (req, res) => {
    const userId = (req as any).user.id;
    const userRole = req.user.role;

    // Extract query params
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const sortField = (req.query.sortField as string) || "createdAt";
    const sortDirection = (req.query.sortDirection as "asc" | "desc") || "desc";
    const search = (req.query.search as string) || "";
    const type = (req.query.type as string) || "";
    const propertyId = (req.query.propertyId as string) || "";

    // Role-based property access
    let propertyIds: string[] = [];

    switch (userRole) {
      case "ADMIN":
        // Admin sees all properties
        break;

      case "OWNER":
      case "STAFF":
      case "BROKER":
        // Find properties assigned via ManagedProperty
        const managed = await prisma.managedProperty.findMany({
          where: {
            userId,
            role: userRole,
          },
          select: { propertyId: true },
        });
        propertyIds = managed.map((m) => m.propertyId);

        if (propertyIds.length === 0) {
          return res.json([]);
        }
        break;

      default:
        return res.status(403).json({ message: "Access denied" });
    }

    // Build filtering conditions
    const where: any = {};

    if (propertyIds.length) where.propertyId = { in: propertyIds };
    if (propertyId) where.propertyId = propertyId;

    if (type) where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { property: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Pagination
    const totalItems = await prisma.room.count({ where });
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    // Sorting
    const validSortFields = [
      "id",
      "name",
      "type",
      "price",
      "createdAt",
      "updatedAt",
    ];
    const orderBy: any = {};
    orderBy[validSortFields.includes(sortField) ? sortField : "createdAt"] =
      sortDirection;

    // Fetch rooms
    const rooms = await prisma.room.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        features: true,
        services: true,
        images: true,
        bookings: true,
        property: true,
        _count: { select: { bookings: true } },
      },
    });

    // Response
    res.json({
      data: rooms || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit,
        hasMore: page < totalPages,
        previousPage: page > 1 ? page - 1 : null,
        nextPage: page < totalPages ? page + 1 : null,
      },
      sort: { field: sortField, direction: sortDirection },
      filters: { search, type, propertyId },
    });
  }),

  createRoom: tryCatch(async (req, res) => {
    const user = (req.body as any).user;
    const role = user?.role;

    // ✅ Validate request body
    const validatedData = createRoomSchema.parse(req.body);

    // ✅ Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: validatedData.propertyId },
    });

    const roomByRoomId = await prisma.room.findFirst({
      where: {
        roomId: validatedData.roomId,
        propertyId: validatedData.propertyId,
      },
    });

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // 🏠 Villa guard: rooms cannot be added to Villa properties
    if (property.type === "VILLA") {
      return res.status(400).json({
        message: "Rooms cannot be added to Villa properties. Villas are booked as whole units.",
      });
    }

    if (roomByRoomId) {
      return res.status(409).json({
        message: "This room ID is already used in this property. Please use a different room ID.",
      });
    }

    // (Optional) Authorization check
    // if (property.ownerId !== user.id && role !== "ADMIN") {
    //   return res.status(403).json({
    //     message: "You are not authorized to add rooms to this property",
    //   });
    // }

    // ✅ Transform validated data to Prisma-compatible structure
    const transformedData = {
      name: validatedData.name,
      roomId: validatedData.roomId,
      type: validatedData.type || "SINGLE",
      price: validatedData.price,
      description: validatedData.description,
      availability: validatedData.availability ?? true,
      squareMeters: validatedData.squareMeters,
      maxOccupancy: validatedData.maxOccupancy,
      propertyId: validatedData.propertyId,

      // ✅ Nested relational data
      features: validatedData.features?.length
        ? {
            create: validatedData.features.map((feature) => ({
              category: feature.category ?? null,
              name: feature.name,
              value: feature.value ?? null,
            })),
          }
        : undefined,

      images: validatedData.images?.length
        ? {
            create: validatedData.images.map((img) => ({
              url: img.url,
              name: img.name ?? null,
            })),
          }
        : undefined,

      services: validatedData.services?.length
        ? {
            create: validatedData.services.map((service) => ({
              name: service.name,
              description: service.description ?? null,
              price: service.price ?? 0,
              isActive: service.isActive ?? true,
            })),
          }
        : undefined,
    };

    // ✅ Create new room with nested relations
    const newRoom = await prisma.room.create({
      data: transformedData,
      include: {
        features: true,
        images: true,
        services: true,
      },
    });

    res.status(201).json({
      message: "Room created successfully",
      success: true,
      data: newRoom,
    });
  }),
  deleteRoom: tryCatch(async (req, res) => {
    const user = (req as any).user;
    const userId = user?.id;
    const role = user?.role;
    const roomId = req.params.id;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { property: { include: { managers: true } } },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const managed = await prisma.managedProperty.findFirst({
      where: { userId, propertyId: room.property.id, role: { in: ["OWNER", "ADMIN"] } },
    });

    if (!managed && role !== "ADMIN") {
      return res.status(403).json({ message: "You are not authorized to delete rooms in this property" });
    }

    // Delete dependents first to avoid FK violations
    await prisma.$transaction(async (tx) => {
      // Get booking IDs for this room
      const bookings = await tx.booking.findMany({
        where: { roomId },
        select: { id: true },
      });
      const bookingIds = bookings.map((b) => b.id);

      // Delete booking dependents
      if (bookingIds.length) {
        await tx.commission.deleteMany({ where: { bookingId: { in: bookingIds } } });
        await tx.payment.deleteMany({ where: { bookingId: { in: bookingIds } } });
        await tx.activity.deleteMany({ where: { bookingId: { in: bookingIds } } });
      }

      await tx.booking.deleteMany({ where: { roomId } });
      await tx.additionalService.deleteMany({ where: { roomId } });
      await tx.roomFeature.deleteMany({ where: { roomId } });
      await tx.roomImage.deleteMany({ where: { roomId } });
      await tx.favorite.deleteMany({ where: { roomId } });
      await tx.activity.deleteMany({ where: { roomId } });
      await tx.room.delete({ where: { id: roomId } });
    });

    res.status(200).json({ message: "Room deleted successfully", success: true });
  }),

  getRoomDetailForManagement: tryCatch(async (req, res) => {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const roomId = req.params.roomId;

    // Find the room with its property
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        property: { include: { managers: { include: { user: true } } } },
        features: true,
        services: true,
        images: true,
        bookings: true,
        _count: {
          select: { bookings: true, features: true, services: true },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const property = room.property;

    // Check access via ManagedProperty
    let hasAccess = false;

    if (userRole === "ADMIN") {
      hasAccess = true;
    } else {
      const managed = await prisma.managedProperty.findFirst({
        where: {
          userId,
          propertyId: property.id,
          role: { in: ["OWNER", "STAFF", "BROKER"] }, // roles allowed
        },
      });
      hasAccess = !!managed;
    }

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Prepare staffs array for consistency
    const staffs = property.managers
      .filter((m) => m.role === "STAFF")
      .map((m) => m.user);

    // Send response
    res.json({
      ...room,
      property: {
        ...property,
        staffs,
      },
    });
  }),

  getRoomStatsForManagement: tryCatch(async (req, res) => {
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
          where: { userId, role: userRole },
          select: { propertyId: true },
        });
        propertyIds = managed.map((m) => m.propertyId);

        if (!propertyIds.length) {
          return res.json({
            totalRooms: 0,
            availableRooms: 0,
            bookedRooms: 0,
            pendingRooms: 0,
            roomsByType: 0,
          });
        }
        break;

      default:
        return res.json({
          totalRooms: 0,
          availableRooms: 0,
          bookedRooms: 0,
          pendingRooms: 0,
          roomsByType: 0,
        });
    }

    const where = propertyIds.length
      ? { propertyId: { in: propertyIds } }
      : {};

    // Total rooms
    const totalRooms = await prisma.room.count({ where });

    // Example fields — adjust according to your schema
    const availableRooms = await prisma.room.count({
      where: { ...where, availability: true },
    });

    const bookedRooms = await prisma.room.count({
      where: { ...where, bookings: { some: { status: "APPROVED" } } },
    });

    const pendingRooms = await prisma.room.count({
      where: { ...where, bookings: { some: { status: "PENDING" } } },
    });

    // Optional: group by type
    const roomsByType = await prisma.room.groupBy({
      by: ["type"],
      _count: { type: true },
      where,
    });

    res.json({
      totalRooms,
      availableRooms,
      bookedRooms,
      pendingRooms,
      roomsByType,
    });
  }),

  updateRoom: tryCatch(async (req, res) => {
    const roomId = req.params.id;
    const { name, type, price, description, maxOccupancy, squareMeters, availability } = req.body;

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return res.status(404).json({ message: "Room not found" });

    const updated = await prisma.room.update({
      where: { id: roomId },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(price !== undefined && { price: Number(price) }),
        ...(description !== undefined && { description }),
        ...(maxOccupancy !== undefined && { maxOccupancy: Number(maxOccupancy) }),
        ...(squareMeters !== undefined && { squareMeters: Number(squareMeters) }),
        ...(availability !== undefined && { availability: Boolean(availability) }),
      },
    });

    res.json({ success: true, message: "Room updated successfully", data: updated });
  }),
  addRoomImage: tryCatch(async (req, res) => {
    const roomId = req.params.id;
    const { url, name } = req.body;
    if (!url) return res.status(400).json({ message: "url is required" });
    const image = await prisma.roomImage.create({ data: { url, name: name || "", roomId } });
    res.status(201).json({ success: true, message: "Image added", data: image });
  }),

  deleteRoomImage: tryCatch(async (req, res) => {
    const { imageId } = req.params;
    await prisma.roomImage.delete({ where: { id: imageId } });
    res.json({ success: true, message: "Image deleted" });
  }),

  addFeature: tryCatch(async (req, res) => {
    const roomId = req.params.id;
    const features = Array.isArray(req.body) ? req.body : [req.body];
    const created = await Promise.all(
      features.map((f: any) =>
        prisma.roomFeature.create({ data: { roomId, category: f.category || "General", name: f.name, value: f.value || "" } })
      )
    );
    res.status(201).json({ success: true, message: "Feature(s) added", data: created });
  }),

  deleteFeature: tryCatch(async (req, res) => {
    const { featureId } = req.params;
    await prisma.roomFeature.delete({ where: { id: featureId } });
    res.json({ success: true, message: "Feature deleted" });
  }),

  addServices: tryCatch(async (req, res) => {
    const { roomId } = req.params;

    // Ensure room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Handle single or multiple services
    const services = Array.isArray(req.body) ? req.body : [req.body];

    // Validate input
    const validatedServices = services.map((service) =>
      serviceSchema.parse(service)
    );

    // Create multiple services at once
    const createdServices = await prisma.additionalService.createMany({
      data: validatedServices.map((service) => ({
        ...service,
        roomId,
      })),
    });

    res.status(201).json({
      message: "Services added successfully",
      count: createdServices.count,
    });
  }),
  updateService: tryCatch(async (req, res) => {
    const { serviceId } = req.params;
    const validatedData = updateServiceSchema.parse(req.body);

    // 1️⃣ Check if service exists
    const existingService = await prisma.additionalService.findUnique({
      where: { id: serviceId },
    });

    if (!existingService) {
      return res.status(404).json({ error: "Service not found" });
    }

    // 2️⃣ Update service
    const updatedService = await prisma.additionalService.update({
      where: { id: serviceId },
      data: validatedData,
    });

    console.log({ updatedService });

    // 3️⃣ Respond
    return res.status(200).json({
      message: "Service updated successfully",
      success: true,
    });
  }),

  getRoomServices: tryCatch(async (req, res) => {
    const { roomId } = req.params;
    const roomServices = await prisma.additionalService.findMany({
      where: {
        roomId: roomId,
      },
    });
    res.json(roomServices);
  }),

  createDummyRoom: tryCatch(async (req, res) => {
    const propertyId = "17703781-ab43-4801-911a-3f68f63f655a";
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new Error("Property not found");
    }

    // Generate dummy data
    const dummyRoomData = {
      name: `Room ${Math.floor(Math.random() * 1000)}`,
      roomId: `R-${Math.floor(Math.random() * 10000)}`,
      type: "SINGLE", // or "DOUBLE", etc.
      price: Math.floor(Math.random() * 5000) + 1000, // random price
      description: "This is a dummy room created for testing purposes.",
      availability: true,
      squareMeters: Math.floor(Math.random() * 50) + 10,
      maxOccupancy: Math.floor(Math.random() * 4) + 1,
      propertyId,
      features: {
        create: [
          { category: "Comfort", name: "Air Conditioning", value: "Yes" },
          { category: "Entertainment", name: "Smart TV", value: "Yes" },
        ],
      },
      images: {
        create: [
          {
            url: "https://expressinnindia.com/wp-content/uploads/2024/07/Freesia-God-23.jpg",
            name: "Room Image 1",
          },
          {
            url: "https://expressinnindia.com/wp-content/uploads/2024/07/Freesia-God-23.jpg",
            name: "Room Image 2",
          },
        ],
      },
      services: {
        create: [
          {
            name: "Breakfast",
            description: "Buffet breakfast included",
            price: 500,
          },
          {
            name: "Laundry",
            description: "Laundry service available",
            price: 200,
          },
        ],
      },
    };

    // Create room
    const newRoom = await prisma.room.create({
      data: dummyRoomData as any,
      include: {
        features: true,
        images: true,
        services: true,
      },
    });

    res.json("success");
  }),
};
