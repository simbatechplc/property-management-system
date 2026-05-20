import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { authGuard } from "../../middleware/auth-middleware";
import { tryCatch } from "../../utils/async-handler";

const router = Router();

// Public: get site config (for footer, header)
router.get("/", tryCatch(async (req, res) => {
  let config = await prisma.siteConfig.findFirst({ where: { id: "singleton" } });
  if (!config) {
    config = await prisma.siteConfig.create({ data: { id: "singleton" } });
  }
  res.json(config);
}));

// Admin only: update site config
router.put("/", authGuard({ accessedBy: ["ADMIN"] }), tryCatch(async (req, res) => {
  const {
    siteName, logoUrl, tagline, heroTitle, heroSubtitle,
    youtube, tiktok, telegram, instagram,
    contactPhone, contactEmail, contactAddress, extraSocials,
    bankName, bankAccountHolder, bankAccountNumber, bankInstructions,
  } = req.body;

  // Validate required bank fields if any bank field is provided
  if (bankName !== undefined || bankAccountHolder !== undefined || bankAccountNumber !== undefined) {
    const missing = [];
    if (!bankName) missing.push("bankName");
    if (!bankAccountHolder) missing.push("bankAccountHolder");
    if (!bankAccountNumber) missing.push("bankAccountNumber");
    if (missing.length > 0) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
    }
  }

  const config = await prisma.siteConfig.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      siteName, logoUrl, tagline, heroTitle, heroSubtitle,
      youtube, tiktok, telegram, instagram,
      contactPhone, contactEmail, contactAddress, extraSocials,
      bankName, bankAccountHolder, bankAccountNumber, bankInstructions,
    },
    update: {
      siteName, logoUrl, tagline, heroTitle, heroSubtitle,
      youtube, tiktok, telegram, instagram,
      contactPhone, contactEmail, contactAddress, extraSocials,
      bankName, bankAccountHolder, bankAccountNumber, bankInstructions,
    },
  });
  res.json({ success: true, message: "Site config updated", data: config });
}));

export { router as SiteConfigRouter };
