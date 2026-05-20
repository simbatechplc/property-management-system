import z from "zod";

export enum PropertyType {
  APARTMENT = "APARTMENT",
  HOTEL = "HOTEL",
  RESORT = "RESORT",
  VILLA = "VILLA",
  GUEST_HOUSE = "GUEST_HOUSE",
  HOSTEL = "HOSTEL",
  LODGE = "LODGE",
}

export const createPropertySchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  address: z.string().min(2, "Address must be at least 2 characters"),
  type: z.nativeEnum(PropertyType).optional(),
  about: z
    .object({
      description: z
        .string()
        .min(10, "Description must be at least 10 characters"),
    })
    .optional(),
  location: z
    .object({
      continent: z.string(),
      country: z.string(),
      city: z.string(),
      subcity: z.string(),
      neighborhood: z.string().optional(),
      nearby: z.string().optional(),
      longitude: z.string().optional(),
      latitude: z.string().optional(),
    })
    .optional(),

  facilities: z.array(z.object({ name: z.string() })).optional(),
  contact: z
    .object({
      phone: z.string(),
      email: z.string().email(),
    })
    .optional(),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

import * as yup from "yup";
import { RoomType } from "@/types";

// Yup validation schema converted from Zod
export const createRoomValidationSchema = yup.object({
  name: yup
    .string()
    .required("Room name is required")
    .min(2, "Room name must be at least 2 characters"),
  roomId: yup
    .string()
    .required("Room ID is required")
    .min(2, "Room ID must be at least 2 characters"),
  type: yup.mixed<RoomType>().oneOf(Object.values(RoomType)).optional(),
  price: yup
    .number()
    .transform((v) => (isNaN(v) ? 0 : v))
    .optional()
    .integer("Price must be a whole number")
    .min(0, "Price must be non-negative")
    .default(0),
  description: yup
    .string()
    .optional()
    .default(""),
  availability: yup.boolean().optional(),
  squareMeters: yup
    .number()
    .transform((v) => (isNaN(v) ? 0 : v))
    .optional()
    .integer("Square meters must be a whole number")
    .min(0, "Square meters must be non-negative")
    .default(0),
  maxOccupancy: yup
    .number()
    .transform((v) => (isNaN(v) ? 1 : v))
    .optional()
    .integer("Max occupancy must be a whole number")
    .min(0, "Max occupancy must be non-negative")
    .default(1),
  propertyId: yup
    .string()
    .required("Property ID is required")
    .uuid("Property ID must be a valid UUID"),
  features: yup
    .array()
    .of(
      yup.object({
        category: yup.string().optional(),
        name: yup.string().required("Feature name is required"),
        value: yup.string().optional(),
      })
    )
    .optional(),
  images: yup
    .array()
    .of(
      yup.object({
        url: yup
          .string()
          .required("Image URL is required")
          .url("Must be a valid URL"),
        name: yup.string().optional(),
      })
    )
    .optional(),
  services: yup
    .array()
    .of(
      yup.object({
        name: yup
          .string()
          .required("Service name is required")
          .min(2, "Service name must be at least 2 characters"),
        description: yup.string().optional(),
        price: yup
          .number()
          .optional()
          .integer("Service price must be a whole number")
          .min(0, "Service price must be non-negative")
          .typeError("Service price must be a number"),
        isActive: yup.boolean().optional(),
      })
    )
    .optional(),
});

export * from "./booking-schema";
