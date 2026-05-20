# Design Document: System Enhancements

## Overview

This document describes the technical design for a set of system enhancements to the Kuru Rent property management platform. The enhancements span eleven requirement areas: bank account customization, address validation relaxation, furnished/unfurnished property options, villa-specific logic, Android bug fixes, owner contact info hiding, image upload UX improvements, a 4×2 property gallery grid, filtering properties without rooms, manual bank transfer payments (with Chapa hidden), and smart fuzzy search.

The platform consists of three components:
- **Backend**: Express/TypeScript/Prisma API on PostgreSQL (Neon), deployed on Render
- **AdminDashboard**: Next.js admin frontend, deployed on Vercel
- **GuestApp**: Vite/React guest-facing frontend, deployed on Vercel

---

## Architecture

The enhancements follow the existing layered architecture without introducing new services or infrastructure:

```
GuestApp (Vite/React)          AdminDashboard (Next.js)
        │                               │
        └──────────────┬────────────────┘
                       │ HTTPS REST API
                       ▼
              Backend (Express/TS)
                       │
              ┌────────┴────────┐
              │                 │
           Prisma ORM      Cloudinary
              │             (images)
           PostgreSQL
            (Neon)
```

All eleven enhancements are implemented within this existing architecture. No new external services are added. The SMS notification for payment approval (Req 10.7) uses an existing or newly integrated SMS utility.

---

## Components and Interfaces

### Requirement 1: Admin Bank Account Customization

**Backend changes:**
- Extend `SiteConfig` model with bank account fields: `bankName`, `bankAccountHolder`, `bankAccountNumber`, `bankInstructions` (optional)
- Extend `PUT /api/v1/site-config` to accept and validate these fields
- `GET /api/v1/site-config` already returns the full SiteConfig — no route change needed

**AdminDashboard changes:**
- Add a "Bank Account" card to the existing `CustomizationPage` (`admin/src/app/admin/customization/page.tsx`)
- Fields: Bank Name (required), Account Holder Name (required), Account Number (required), Additional Instructions (optional textarea)
- Load existing values on mount; save via the existing `PUT /api/v1/site-config` call

**GuestApp changes:**
- The `GET /api/v1/site-config` response already flows to the GuestApp; the booking payment step reads `bankName`, `bankAccountHolder`, `bankAccountNumber`, `bankInstructions` from the config

---

### Requirement 2: Property Address Validation

**Backend changes:**
- In `backend/src/controllers/validators/properties.validator.ts`, change `createPropertySchema.address` from `min(5)` to `min(3)`
- The `updatePropertySchema.address` already uses `min(1)` — no change needed

**AdminDashboard changes:**
- Update the address field validation in the property creation/edit form to use `minLength: 3`

---

### Requirement 3: Furnished/Unfurnished Options

**Backend changes:**
- Add `FurnishingStatus` enum to `backend/prisma/models/property.schema.prisma`:
  ```
  enum FurnishingStatus {
    FURNISHED
    UNFURNISHED
    PARTIALLY_FURNISHED
  }
  ```
- Add optional `furnishingStatus FurnishingStatus?` field to the `Property` model
- Extend `createPropertySchema` and `updatePropertySchema` to accept optional `furnishingStatus`
- The field is only meaningful for APARTMENT and VILLA types; the backend accepts it for any type but the frontend only shows it for APARTMENT/VILLA

**AdminDashboard changes:**
- In the property create/edit form, conditionally render a `<Select>` for `furnishingStatus` when `type === "APARTMENT" || type === "VILLA"`

**GuestApp changes:**
- In the property detail page (`web/src/pages/client/properties/id/data-container.tsx`), display `furnishingStatus` badge in the Overview section when the property is APARTMENT or VILLA and the field is set

---

### Requirement 4: Villa Property Logic

**Backend changes:**
- `pricePerNight` already exists on the `Property` model — no schema change needed
- Extend `createPropertySchema` and `updatePropertySchema` to accept `pricePerNight` (optional Float)
- In `rooms.controller.ts` `createRoom`, add a check: if the property's `type === "VILLA"`, return `400 { message: "Rooms cannot be added to Villa properties" }`
- The `bookNow` endpoint in `bookings.controller.ts` already handles `pricePerNight` for private properties via the `bookingRoom` synthetic object pattern in the frontend; the backend booking creation uses `roomId` — for Villa bookings, the frontend passes a synthetic room ID derived from the property. The backend should accept a `propertyId`-level booking when `roomId` is absent and `propertyId` is a VILLA

**AdminDashboard changes:**
- In the property create/edit form, conditionally render a `pricePerNight` number input when `type === "VILLA"`
- In the rooms management page for a VILLA property, disable the "Add Room" button and show a tooltip: "Rooms cannot be added to Villa properties"

**GuestApp changes:**
- The existing `data-container.tsx` already handles `isPrivate` and `pricePerNight` display — verify and ensure the booking card shows `pricePerNight` for VILLA type
- The booking dialog should use `pricePerNight` as the room price for VILLA bookings

---

### Requirement 5: Android Bug Fixes

**GuestApp changes** (all in `web/src/pages/client/rooms/id/` booking dialog and date picker):
- Replace the Popover-based date picker with a controlled component that uses `onPointerDown` / `onTouchEnd` instead of `onClick` for the "Done" button to prevent event propagation issues on Android
- Add `onOpenAutoFocus` and `onInteractOutside` handlers to the Popover to prevent unintended close on touch devices
- Ensure the "Book Now" button uses `onPointerDown` or `onTouchStart` in addition to `onClick` to handle Android's touch event model
- Add a `try/catch` around the booking dialog open logic; on failure, render a fallback `<a href="/properties/{id}#booking">Book Now</a>` link
- Propagate date selection through a controlled state update that fires synchronously (avoid async state batching issues)

---

### Requirement 6: Hide Owner Contact Info from Guest Pages

**GuestApp changes:**
- In `web/src/pages/client/properties/id/data-container.tsx`, remove the rendering of `property.contact.phone` and `property.contact.email`
- Instead, read `siteConfig.contactPhone` and `siteConfig.contactEmail` from the SiteConfig (fetched via `GET /api/v1/site-config`)
- If SiteConfig contact fields are empty, display a generic "Contact us" prompt
- The backend API continues to return `contact` in the property detail response (for AdminDashboard use)

**New hook/query:**
- Add or reuse a `useGetSiteConfig()` hook in the GuestApp to fetch SiteConfig on the property detail page

---

### Requirement 7: Property Image Upload UX

**AdminDashboard changes** (in the image upload component used in property create/edit):
- Rename button label from "Add Image" to "Upload Image"
- Add `multiple` attribute to the `<input type="file" accept="image/*">`
- On file selection, validate each file's MIME type (`file.type.startsWith("image/")`); reject non-images with an inline error
- For accepted files, generate `URL.createObjectURL(file)` previews and display them as thumbnails before upload
- Show a per-image loading spinner while each file is uploading to Cloudinary
- Add a remove button (×) on each preview thumbnail; clicking it removes the file from the pending list without uploading
- On upload failure, display an error message identifying the failed filename

---

### Requirement 8: Property Gallery — 4×2 Grid with Navigation

**GuestApp changes — Property Detail Page:**
- Replace the current hero image + 2×2 thumbnail grid in `data-container.tsx` with a `PropertyGallery` component
- `PropertyGallery` displays images in a 4-column × 2-row grid (8 images per page)
- State: `galleryPage` (0-indexed), computed `pageImages = allImages.slice(galleryPage * 8, galleryPage * 8 + 8)`
- Show "Previous" / "Next" buttons only when `allImages.length > 8`
- Clicking any image opens the existing lightbox/fullscreen viewer
- The entire card area is clickable (no nested click traps)

**GuestApp changes — Homepage Trending Section:**
- Replace the auto-scrolling marquee in `properties-section.tsx` with a static grid layout
- Display property cards in a responsive grid (2 columns on mobile, 4 columns on desktop)
- Add "Previous" / "Next" pagination buttons to page through sets of 8 cards
- Each card is fully clickable (the entire card navigates to the property detail page)
- The "Book" / "Check availability" button on a card uses `e.stopPropagation()` to prevent double navigation

---

### Requirement 9: Filter Properties Without Rooms (Except Villas)

**Backend changes:**
- In `properties.controller.ts` `getProperties`, add a filter condition to the public listing query:
  ```
  {
    OR: [
      { type: "VILLA" },
      { rooms: { some: {} } }
    ]
  }
  ```
- This excludes non-VILLA properties with zero rooms from the public listing
- The admin endpoint `getPropertiesForManagement` is unchanged — it returns all properties

---

### Requirement 10: Manual Bank Transfer Payment

**Backend — new model:**
- Add `PaymentSubmission` model to `backend/prisma/models/payment.schema.prisma`:
  ```
  model PaymentSubmission {
    id            String   @id @default(uuid())
    booking       Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
    bookingId     String   @unique
    referenceNumber String
    amountPaid    Float
    fullName      String
    screenshotUrl String
    status        PaymentSubmissionStatus @default(PENDING)
    reviewedBy    String?
    reviewedAt    DateTime?
    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt
  }

  enum PaymentSubmissionStatus {
    PENDING
    APPROVED
    REJECTED
  }
  ```
- Add `paymentSubmission PaymentSubmission?` relation to `Booking` model

**Backend — new routes:**
- `POST /api/v1/payments/submit` — guest submits manual payment (auth required)
  - Validates: `referenceNumber` (required string), `amountPaid` (required positive number), `fullName` (required string), `screenshotUrl` (required string/URL)
  - Creates `PaymentSubmission` with status `PENDING`
- `GET /api/v1/payments/submissions` — admin lists all pending submissions (admin auth)
- `POST /api/v1/payments/submissions/:id/approve` — admin approves a submission (admin auth)
  - Updates `PaymentSubmission.status = APPROVED`
  - Updates `Booking.status = APPROVED`
  - Updates `Payment.status = SUCCESS`
  - Sends SMS to guest phone
- `POST /api/v1/payments/submissions/:id/reject` — admin rejects a submission (admin auth)
  - Updates `PaymentSubmission.status = REJECTED`
  - Notifies guest (SMS or in-app)

**Backend — Chapa hiding:**
- The `bookNow` endpoint in `bookings.controller.ts` is modified to skip Chapa initialization and instead return a `{ success: true, paymentMethod: "MANUAL_BANK_TRANSFER" }` response
- The Chapa webhook (`POST /api/v1/payments/chapa/webhook`) and verify (`GET /api/v1/payments/verify/:txRef`) endpoints remain functional for previously initiated transactions
- A feature flag `CHAPA_ENABLED=false` in the backend `.env` controls this behavior, making it easy to re-enable

**GuestApp changes:**
- In the booking flow, after the review step, show the manual bank transfer instructions card (bank name, account holder, account number, instructions from SiteConfig)
- Add a `PaymentSubmissionForm` component with fields: reference number, amount paid, full name, screenshot upload
- Validate screenshot file is an image before upload
- Upload screenshot to Cloudinary, then POST to `/api/v1/payments/submit`
- Hide the Chapa "Pay Online" button (controlled by a `VITE_CHAPA_ENABLED` env var defaulting to `false`)

**AdminDashboard changes:**
- In the payments page (`admin/src/app/admin/payments/`), add a "Pending Submissions" tab
- Display each submission with: reference number, amount, full name, screenshot link, booking details
- Approve/Reject action buttons per submission

---

### Requirement 11: Smart Search — Fuzzy/Approximate Matching

**Backend changes:**
- Enable `pg_trgm` extension via a Prisma migration: `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
- Create trigram indexes on `Property.name`, `Location.city`, `Location.subcity`, `Property.address`
- In `properties.controller.ts` `getProperties`, replace the current `search` filter block with a two-phase approach:
  1. **Normalize query**: `query = search.trim().replace(/\s+/g, ' ')`; if empty after normalization, skip search filter
  2. **Exact/substring match** (existing Prisma `contains` filter) — fast path
  3. **Fuzzy match** via raw SQL using `similarity()` and `word_similarity()` from `pg_trgm` with threshold `0.2`
  4. Merge results, deduplicate by property ID, sort by relevance score descending
- Fallback: wrap the trigram query in a try/catch; on error (extension not available), fall back to the existing substring search

**SQL for fuzzy search:**
```sql
SELECT p.id,
       GREATEST(
         similarity(p.name, $1),
         similarity(l.city, $1),
         similarity(l.subcity, $1),
         similarity(p.address, $1)
       ) AS score
FROM "Property" p
LEFT JOIN "Location" l ON l."propertyId" = p.id
WHERE p.status = 'APPROVED' AND p.visibility = true
  AND GREATEST(
        similarity(p.name, $1),
        similarity(l.city, $1),
        similarity(l.subcity, $1),
        similarity(p.address, $1)
      ) >= 0.2
ORDER BY score DESC;
```

---

## Data Models

### SiteConfig (extended)

```prisma
model SiteConfig {
  id               String   @id @default("singleton")
  siteName         String   @default("Kuru Rent")
  logoUrl          String?
  tagline          String?
  heroTitle        String?
  heroSubtitle     String?
  youtube          String?
  tiktok           String?
  telegram         String?
  instagram        String?
  contactPhone     String?
  contactEmail     String?
  contactAddress   String?
  extraSocials     Json?
  // NEW: Bank account fields
  bankName         String?
  bankAccountHolder String?
  bankAccountNumber String?
  bankInstructions String?
  updatedAt        DateTime @updatedAt
}
```

### Property (extended)

```prisma
model Property {
  // ... existing fields ...
  pricePerNight    Float?           // already exists
  furnishingStatus FurnishingStatus? // NEW
  // ... rest of existing fields ...
}

enum FurnishingStatus {
  FURNISHED
  UNFURNISHED
  PARTIALLY_FURNISHED
}
```

### PaymentSubmission (new)

```prisma
model PaymentSubmission {
  id              String                  @id @default(uuid())
  booking         Booking                 @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  bookingId       String                  @unique
  referenceNumber String
  amountPaid      Float
  fullName        String
  screenshotUrl   String
  status          PaymentSubmissionStatus @default(PENDING)
  reviewedBy      String?
  reviewedAt      DateTime?
  createdAt       DateTime                @default(now())
  updatedAt       DateTime                @updatedAt
}

enum PaymentSubmissionStatus {
  PENDING
  APPROVED
  REJECTED
}
```

### Booking (extended)

```prisma
model Booking {
  // ... existing fields ...
  paymentSubmission PaymentSubmission? // NEW relation
}
```

### Database Migrations Required

1. `ALTER TABLE "SiteConfig" ADD COLUMN "bankName" TEXT, ADD COLUMN "bankAccountHolder" TEXT, ADD COLUMN "bankAccountNumber" TEXT, ADD COLUMN "bankInstructions" TEXT;`
2. `CREATE TYPE "FurnishingStatus" AS ENUM ('FURNISHED', 'UNFURNISHED', 'PARTIALLY_FURNISHED'); ALTER TABLE "Property" ADD COLUMN "furnishingStatus" "FurnishingStatus";`
3. `CREATE TABLE "PaymentSubmission" (...);`
4. `CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE INDEX ON "Property" USING gin(name gin_trgm_ops); CREATE INDEX ON "Location" USING gin(city gin_trgm_ops); CREATE INDEX ON "Location" USING gin(subcity gin_trgm_ops); CREATE INDEX ON "Property" USING gin(address gin_trgm_ops);`

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Bank Account Configuration Round-Trip

*For any* valid bank account configuration (bank name, account holder name, account number, and optional instructions), saving it via the Admin API and then retrieving the site configuration SHALL return the exact same bank account values.

**Validates: Requirements 1.2, 1.4**

---

### Property 2: Bank Account Validation Rejects Incomplete Submissions

*For any* bank account submission that is missing at least one required field (bank name, account holder name, or account number), the Backend SHALL return a 400 error response.

**Validates: Requirements 1.3**

---

### Property 3: Address Length Boundary

*For any* property address string, the Backend SHALL accept it if and only if its length is 3 or more characters, and SHALL reject it with a 400 error if its length is less than 3 characters.

**Validates: Requirements 2.1, 2.3, 2.4**

---

### Property 4: Furnishing Status Round-Trip for APARTMENT and VILLA

*For any* property of type APARTMENT or VILLA with a `furnishingStatus` value set, creating or updating the property and then retrieving it SHALL return the same `furnishingStatus` value.

**Validates: Requirements 3.2**

---

### Property 5: Non-APARTMENT/VILLA Types Accept Absent Furnishing Status

*For any* property of a type other than APARTMENT or VILLA, creating or updating the property without a `furnishingStatus` field SHALL succeed without error.

**Validates: Requirements 3.3, 3.5**

---

### Property 6: Villa Price Per Night Round-Trip

*For any* positive `pricePerNight` value, creating or updating a VILLA property with that value and then retrieving the property SHALL return the same `pricePerNight` value.

**Validates: Requirements 4.2**

---

### Property 7: Villa Room Creation Blocked

*For any* property of type VILLA, attempting to create a room for that property SHALL always return a 400 error.

**Validates: Requirements 4.3**

---

### Property 8: Owner Contact Info Hidden from Guest View

*For any* property that has a `contact` record with a phone number and email, the rendered guest-facing property detail page SHALL NOT contain the owner's phone number or email address in its output.

**Validates: Requirements 6.1**

---

### Property 9: Admin Contact Shown on Guest Property Pages

*For any* property detail page rendered in the GuestApp, when the SiteConfig has `contactPhone` or `contactEmail` set, those values SHALL appear in the contact section of the page.

**Validates: Requirements 6.2**

---

### Property 10: Image Preview Count Matches File Selection

*For any* array of valid image files selected by the user, the number of preview thumbnails displayed SHALL equal the number of selected image files.

**Validates: Requirements 7.2**

---

### Property 11: Non-Image Files Rejected in Upload

*For any* file whose MIME type does not start with `"image/"`, selecting it in the image upload component SHALL result in an error message being displayed and the file NOT being added to the preview list.

**Validates: Requirements 7.3**

---

### Property 12: Preview Removal Reduces List by One

*For any* preview list of N images, removing one image from the list SHALL result in a preview list of exactly N-1 images, with no upload triggered for the removed image.

**Validates: Requirements 7.7**

---

### Property 13: Gallery Navigation Visibility Based on Image Count

*For any* property, the gallery navigation buttons (Previous/Next) SHALL be visible if and only if the total number of images exceeds 8.

**Validates: Requirements 8.2, 8.4**

---

### Property 14: Public Listing Excludes Non-Villa Properties Without Rooms

*For any* result set returned by the public property listing endpoint, no property in the result SHALL have zero rooms unless its type is VILLA.

**Validates: Requirements 9.1, 9.2, 9.3**

---

### Property 15: Manual Payment Submission Validation

*For any* manual payment submission request that is missing at least one required field (referenceNumber, amountPaid, fullName, or screenshotUrl), the Backend SHALL return a 400 error response.

**Validates: Requirements 10.3, 10.5**

---

### Property 16: Valid Payment Submission Creates PENDING Record

*For any* valid manual payment submission (all required fields present), the Backend SHALL create a `PaymentSubmission` record with status `PENDING` associated with the correct booking.

**Validates: Requirements 10.4**

---

### Property 17: Payment Submission Approval Transitions State Correctly

*For any* `PaymentSubmission` with status `PENDING`, approving it SHALL result in: the `PaymentSubmission.status` becoming `APPROVED`, the associated `Booking.status` becoming `APPROVED`, and the associated `Payment.status` becoming `SUCCESS`.

**Validates: Requirements 10.6**

---

### Property 18: Payment Submission Rejection Transitions State Correctly

*For any* `PaymentSubmission` with status `PENDING`, rejecting it SHALL result in the `PaymentSubmission.status` becoming `REJECTED`.

**Validates: Requirements 10.8**

---

### Property 19: Search Query Whitespace Normalization

*For any* search query string Q, the search results returned for Q SHALL be identical to the results returned for `Q.trim().replace(/\s+/g, ' ')`. In particular, a query consisting entirely of whitespace SHALL return the same results as an empty query (all properties).

**Validates: Requirements 11.1, 11.9**

---

### Property 20: Fuzzy Search Relevance Ordering

*For any* set of properties that match a search query with varying similarity scores, the results SHALL be ordered such that properties with higher similarity scores appear before properties with lower similarity scores.

**Validates: Requirements 11.5**

---

## Error Handling

### Backend Validation Errors
- All validation errors return `400` with `{ message: string, errors?: string[] }`
- Missing required fields in bank account config: `400 { message: "Missing required fields: bankName, bankAccountHolder, bankAccountNumber" }`
- Address too short: `400 { message: "Address must be at least 3 characters" }`
- Room creation on VILLA: `400 { message: "Rooms cannot be added to Villa properties" }`
- Missing payment submission fields: `400 { message: "Missing required fields: ..." }`

### Payment Submission Errors
- Non-image screenshot file: rejected client-side before upload; if bypassed, the backend validates the `screenshotUrl` is a valid URL
- Duplicate submission for same booking: `409 { message: "A payment submission already exists for this booking" }`

### Fuzzy Search Fallback
- If `pg_trgm` extension is unavailable, the search falls back to the existing `ILIKE` substring search silently (no error exposed to the client)
- The fallback is triggered by catching the PostgreSQL error code `42883` (undefined function) or `42704` (undefined object)

### Android Touch Event Errors
- If the booking dialog fails to open (caught in try/catch), a fallback "Book Now" link is rendered pointing to `/properties/{id}#booking`
- The error is logged to `console.error` for debugging

### Image Upload Errors
- Per-file upload failures show an inline error: `"Failed to upload {filename}. Please try again."`
- The failed file remains in the preview list with an error state indicator, allowing retry

---

## Testing Strategy

### Unit Tests

Unit tests cover specific examples, edge cases, and pure logic:

- **Address validation**: test boundary values (length 1, 2, 3, 4, 5)
- **Villa room creation block**: test that the check fires correctly for VILLA type and not for other types
- **Search query normalization**: test `trim()` and whitespace collapse with various inputs
- **Payment submission validation**: test each required field missing individually
- **Furnishing status**: test that the field is accepted for APARTMENT/VILLA and ignored for other types
- **Gallery pagination**: test `pageImages` slice logic for various image counts and page numbers
- **Image file type validation**: test MIME type check with image and non-image types

### Property-Based Tests

Property-based testing is appropriate for this feature because it involves data transformation logic, validation rules, state transitions, and search algorithms where input variation reveals edge cases. The project should use **fast-check** (TypeScript-compatible PBT library) with a minimum of **100 iterations** per property test.

Each property test is tagged with a comment referencing the design property:
```typescript
// Feature: system-enhancements, Property N: <property_text>
```

**Properties to implement as PBT:**

- **Property 1** (Bank account round-trip): Generate random `{ bankName, bankAccountHolder, bankAccountNumber, bankInstructions? }` objects, save and retrieve
- **Property 2** (Bank account validation): Generate objects with at least one required field missing
- **Property 3** (Address length boundary): Generate strings of varying lengths, verify accept/reject behavior
- **Property 4** (Furnishing status round-trip): Generate random `FurnishingStatus` values for APARTMENT/VILLA properties
- **Property 5** (Non-APARTMENT/VILLA types): Generate random non-APARTMENT/VILLA property types without furnishingStatus
- **Property 6** (Villa pricePerNight round-trip): Generate random positive floats as pricePerNight
- **Property 7** (Villa room creation blocked): Generate VILLA property IDs, attempt room creation
- **Property 8** (Owner contact hidden): Generate random contact data, verify it doesn't appear in rendered output
- **Property 9** (Admin contact shown): Generate random SiteConfig contact data, verify it appears in rendered output
- **Property 10** (Image preview count): Generate arrays of 1–20 image files, verify preview count matches
- **Property 11** (Non-image rejection): Generate files with non-image MIME types
- **Property 12** (Preview removal): Generate preview lists of varying sizes, remove one item
- **Property 13** (Gallery navigation visibility): Generate image counts from 0 to 20, verify button visibility
- **Property 14** (Public listing filter): Generate mixed property sets (VILLA with 0 rooms, non-VILLA with 0 rooms, non-VILLA with rooms), verify filter
- **Property 15** (Payment submission validation): Generate submissions with at least one missing field
- **Property 16** (Valid submission creates PENDING): Generate valid submission data
- **Property 17** (Approval state transition): Generate PENDING submissions, approve them
- **Property 18** (Rejection state transition): Generate PENDING submissions, reject them
- **Property 19** (Search normalization): Generate query strings with leading/trailing/multiple spaces
- **Property 20** (Fuzzy search ordering): Generate property sets with known similarity scores, verify ordering

### Integration Tests

Integration tests verify end-to-end flows with the real database (test database):

- Bank account config save and retrieve via the full HTTP stack
- Property creation with furnishingStatus persisted to PostgreSQL
- Villa room creation rejection via the full HTTP stack
- Manual payment submission flow: submit → admin approve → booking status change
- Fuzzy search with `pg_trgm` extension enabled on the test database
- Public listing endpoint excludes zero-room non-VILLA properties

### Manual / Device Tests

- Android date picker "Done" button behavior (Req 5.1)
- Android "Book Now" button single-tap behavior (Req 5.2)
- Touch device popover close prevention (Req 5.3)
- Visual verification of 4×2 gallery grid layout on mobile and desktop
- Visual verification of trending properties grid on homepage
