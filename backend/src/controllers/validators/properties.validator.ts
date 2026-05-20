import { FurnishingStatus, PropertyType } from "@prisma/client";
import z from "zod";

export const createPropertySchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  address: z.string().min(2, "Address must be at least 2 characters"),
  type: z.nativeEnum(PropertyType).optional(),
  furnishingStatus: z.nativeEnum(FurnishingStatus).optional(),
  pricePerNight: z.number().positive().optional(),
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
  images: z
    .array(
      z.object({
        url: z.string().url(),
        name: z.string(),
      })
    )
    .optional(),
});

export const updatePropertySchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  type: z.nativeEnum(PropertyType).optional(),
  furnishingStatus: z.nativeEnum(FurnishingStatus).optional(),
  pricePerNight: z.number().positive().optional(),
  about: z
    .object({
      description: z.string().min(1),
    })
    .optional(),
  location: z
    .object({
      continent: z.string().optional().default("Africa"),
      country: z.string().optional().default("Ethiopia"),
      city: z.string().optional().default(""),
      subcity: z.string().optional().default(""),
      nearby: z.string().optional(),
      latitude: z.string().optional(),
      longitude: z.string().optional(),
    })
    .optional(),
  facilities: z.array(z.object({ name: z.string() })).optional(),
  contact: z
    .object({
      phone: z.string(),
      email: z.string().email(),
    })
    .optional(),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        name: z.string(),
      })
    )
    .optional(),
  policies: z.any().optional(),
});
