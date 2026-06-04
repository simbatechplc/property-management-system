# Kuru Rent — Property Management System

A full-stack property booking and management platform for hotels, guest houses, apartments, and villas.

<div align="center">

[![Client Site](https://img.shields.io/badge/🌐%20Client%20Site-Live%20Demo-4CAF50?style=for-the-badge)](https://property-management-system-gules.vercel.app/)
[![Admin Panel](https://img.shields.io/badge/🛠️%20Admin%20Panel-Live%20Demo-1a4a2e?style=for-the-badge)](https://property-management-system-admin.vercel.app)

</div>

---

## What it does

**Client site** — browse and book properties, manage bookings, register as an owner or broker, and chat with the AI assistant.

**Admin panel** — manage properties, rooms, bookings, users, payments, commissions, registration requests, messaging, and site customization.

## Tech Stack

- **Frontend** — React / Next.js 15, TypeScript, TailwindCSS, shadcn/ui, TanStack Query
- **Backend** — Node.js, Express 5, Prisma ORM, PostgreSQL (Neon)
- **Auth** — Better Auth
- **Payments** — Chapa
- **Storage** — Cloudinary
- **AI** — Google Gemini
- **Realtime** — Socket.io

## Project Structure

```
├── admin/      # Next.js admin panel
├── web/        # React client site (Vite)
└── backend/    # Express API + Prisma
```

## Deployment

Admin and client are deployed on **Vercel**, backend on **Render**, database on **Neon**.
