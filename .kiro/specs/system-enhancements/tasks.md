# Implementation Plan: System Enhancements

## Overview

Implement all 11 system enhancements across the backend (Express/TypeScript/Prisma), admin dashboard (Next.js), and guest web app (Vite/React). Tasks are ordered to front-load database/schema changes and backend logic before frontend work, ensuring each step builds on a stable foundation.

## Tasks

- [x] 1. Database schema migrations and Prisma model updates
  - Add `bankName`, `bankAccountHolder`, `bankAccountNumber`, `bankInstructions` fields to `SiteConfig` model in `backend/prisma/models/`
  - Add `FurnishingStatus` enum and optional `furnishingStatus` field to `Property` model
  - Add `PaymentSubmission` model and `PaymentSubmissionStatus` enum to `backend/prisma/models/payment.schema.prisma`
  - Add `paymentSubmission PaymentSubmission?` relation to `Booking` model
  - Enable `pg_trgm` extension and create trigram GIN indexes on `Property.name`, `Property.address`, `Location.city`, `Location.subcity` in a new migration file
  - Run `npx prisma migrate dev` to apply all schema changes and regenerate the Prisma client
  - _Requirements: 1.2, 3.2, 4.2, 10.4, 11.7_

- [-] 2. Backend — bank account customization and address validation
  - [x] 2.1 Extend `PUT /api/v1/site-config` validator and controller to accept and persist `bankName`, `bankAccountHolder`, `bankAccountNumber`, `bankInstructions`; return 400 when any required bank field is missing
    - _Requirements: 1.2, 1.3_
  - [ ]* 2.2 Write property test for bank account configuration round-trip (Property 1)
    - **Property 1: Bank Account Configuration Round-Trip**
    - **Validates: Requirements 1.2, 1.4**
  - [ ]* 2.3 Write property test for bank account validation rejects incomplete submissions (Property 2)
    - **Property 2: Bank Account Validation Rejects Incomplete Submissions**
    - **Validates: Requirements 1.3**
  - [x] 2.4 Change `createPropertySchema.address` minimum length from 5 to 3 in `backend/src/controllers/validators/properties.validator.ts`
    - _Requirements: 2.1, 2.3, 2.4_
  - [ ]* 2.5 Write property test for address length boundary (Property 3)
    - **Property 3: Address Length Boundary**
    - **Validates: Requirements 2.1, 2.3, 2.4**

- [ ] 3. Backend — furnishing status and villa logic
  - [x] 3.1 Extend `createPropertySchema` and `updatePropertySchema` to accept optional `furnishingStatus` enum value
    - _Requirements: 3.2, 3.5_
  - [ ]* 3.2 Write property test for furnishing status round-trip on APARTMENT/VILLA (Property 4)
    - **Property 4: Furnishing Status Round-Trip for APARTMENT and VILLA**
    - **Validates: Requirements 3.2**
  - [ ]* 3.3 Write property test for non-APARTMENT/VILLA types accept absent furnishing status (Property 5)
    - **Property 5: Non-APARTMENT/VILLA Types Accept Absent Furnishing Status**
    - **Validates: Requirements 3.3, 3.5**
  - [x] 3.4 Extend `createPropertySchema` and `updatePropertySchema` to accept optional `pricePerNight` float; ensure it is persisted on the `Property` record
    - _Requirements: 4.2_
  - [ ]* 3.5 Write property test for villa pricePerNight round-trip (Property 6)
    - **Property 6: Villa Price Per Night Round-Trip**
    - **Validates: Requirements 4.2**
  - [x] 3.6 In `rooms.controller.ts` `createRoom`, add a guard that returns `400 { message: "Rooms cannot be added to Villa properties" }` when the parent property type is `VILLA`
    - _Requirements: 4.3_
  - [ ]* 3.7 Write property test for villa room creation blocked (Property 7)
    - **Property 7: Villa Room Creation Blocked**
    - **Validates: Requirements 4.3**

- [ ] 4. Checkpoint — ensure all backend schema and validation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Backend — filter properties without rooms and smart fuzzy search
  - [x] 5.1 In `properties.controller.ts` `getProperties` (public listing), add an `OR` filter: include properties where `type === "VILLA"` OR `rooms: { some: {} }`; leave the admin management endpoint unchanged
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - [ ]* 5.2 Write property test for public listing excludes non-villa properties without rooms (Property 14)
    - **Property 14: Public Listing Excludes Non-Villa Properties Without Rooms**
    - **Validates: Requirements 9.1, 9.2, 9.3**
  - [x] 5.3 In `properties.controller.ts` `getProperties`, normalize the search query with `query = search.trim().replace(/\s+/g, ' ')` and treat a blank result as no search filter
    - _Requirements: 11.1, 11.9_
  - [x] 5.4 Add the two-phase fuzzy search: first run the existing Prisma `contains` filter, then run the raw `pg_trgm` SQL query with similarity threshold 0.2; merge and deduplicate results by property ID, sorted by relevance score descending; wrap the trigram query in a try/catch that falls back to substring search on error
    - _Requirements: 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_
  - [ ]* 5.5 Write property test for search query whitespace normalization (Property 19)
    - **Property 19: Search Query Whitespace Normalization**
    - **Validates: Requirements 11.1, 11.9**
  - [ ]* 5.6 Write property test for fuzzy search relevance ordering (Property 20)
    - **Property 20: Fuzzy Search Relevance Ordering**
    - **Validates: Requirements 11.5**

- [ ] 6. Backend — manual bank transfer payment routes
  - [x] 6.1 Create `POST /api/v1/payments/submit` route and controller: validate `referenceNumber`, `amountPaid`, `fullName`, `screenshotUrl` (all required); create `PaymentSubmission` with status `PENDING`; return 400 listing missing fields on validation failure; return 409 if a submission already exists for the booking
    - _Requirements: 10.3, 10.4, 10.5_
  - [ ]* 6.2 Write property test for manual payment submission validation (Property 15)
    - **Property 15: Manual Payment Submission Validation**
    - **Validates: Requirements 10.3, 10.5**
  - [ ]* 6.3 Write property test for valid payment submission creates PENDING record (Property 16)
    - **Property 16: Valid Payment Submission Creates PENDING Record**
    - **Validates: Requirements 10.4**
  - [x] 6.4 Create `GET /api/v1/payments/submissions` route (admin auth): return all `PaymentSubmission` records with booking details, reference number, amount, full name, and screenshot URL
    - _Requirements: 10.9_
  - [x] 6.5 Create `POST /api/v1/payments/submissions/:id/approve` route (admin auth): set `PaymentSubmission.status = APPROVED`, `Booking.status = APPROVED`, `Payment.status = SUCCESS`; send SMS to guest phone
    - _Requirements: 10.6, 10.7_
  - [ ]* 6.6 Write property test for payment submission approval transitions state correctly (Property 17)
    - **Property 17: Payment Submission Approval Transitions State Correctly**
    - **Validates: Requirements 10.6**
  - [x] 6.7 Create `POST /api/v1/payments/submissions/:id/reject` route (admin auth): set `PaymentSubmission.status = REJECTED`; notify guest via SMS
    - _Requirements: 10.8_
  - [ ]* 6.8 Write property test for payment submission rejection transitions state correctly (Property 18)
    - **Property 18: Payment Submission Rejection Transitions State Correctly**
    - **Validates: Requirements 10.8**
  - [x] 6.9 In `bookings.controller.ts` `bookNow`, add a `CHAPA_ENABLED` feature flag check: when `CHAPA_ENABLED=false` (default), skip Chapa initialization and return `{ success: true, paymentMethod: "MANUAL_BANK_TRANSFER" }`; keep the Chapa webhook and verify endpoints functional
    - _Requirements: 10.1_

- [ ] 7. Checkpoint — ensure all backend payment and search tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Admin dashboard — bank account settings and address validation
  - [x] 8.1 Add a "Bank Account" card to `admin/src/app/admin/customization/page.tsx` with fields: Bank Name (required), Account Holder Name (required), Account Number (required), Additional Instructions (optional textarea); load existing values on mount; save via `PUT /api/v1/site-config`
    - _Requirements: 1.1, 1.5_
  - [x] 8.2 Update the address field validation in the property creation/edit form to use `minLength: 3`
    - _Requirements: 2.2_

- [ ] 9. Admin dashboard — furnishing status, villa logic, and image upload UX
  - [x] 9.1 In the property create/edit form, conditionally render a `<Select>` for `furnishingStatus` (FURNISHED / UNFURNISHED / PARTIALLY_FURNISHED) when `type === "APARTMENT" || type === "VILLA"`
    - _Requirements: 3.1_
  - [x] 9.2 In the property create/edit form, conditionally render a `pricePerNight` number input when `type === "VILLA"`
    - _Requirements: 4.1_
  - [x] 9.3 In the rooms management page for a VILLA property, disable the "Add Room" button and display a tooltip: "Rooms cannot be added to Villa properties"
    - _Requirements: 4.4_
  - [x] 9.4 In the image upload component used in property create/edit: rename the button label from "Add Image" to "Upload Image"; add `multiple` attribute to the file input; validate each selected file's MIME type (`file.type.startsWith("image/")`) and display an inline error for non-images; generate `URL.createObjectURL(file)` thumbnails for accepted files; show a per-image loading spinner during upload; add a remove (×) button on each thumbnail that removes the file without uploading; display a per-file error message on upload failure
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  - [ ]* 9.5 Write property test for image preview count matches file selection (Property 10)
    - **Property 10: Image Preview Count Matches File Selection**
    - **Validates: Requirements 7.2**
  - [ ]* 9.6 Write property test for non-image files rejected in upload (Property 11)
    - **Property 11: Non-Image Files Rejected in Upload**
    - **Validates: Requirements 7.3**
  - [ ]* 9.7 Write property test for preview removal reduces list by one (Property 12)
    - **Property 12: Preview Removal Reduces List by One**
    - **Validates: Requirements 7.7**

- [ ] 10. Admin dashboard — pending payment submissions tab
  - [x] 10.1 In `admin/src/app/admin/payments/`, add a "Pending Submissions" tab that fetches from `GET /api/v1/payments/submissions` and displays each submission with: reference number, amount, full name, screenshot link, and booking details
    - _Requirements: 10.9_
  - [x] 10.2 Add Approve and Reject action buttons per submission row; call the respective approve/reject endpoints and refresh the list on success
    - _Requirements: 10.6, 10.8_

- [ ] 11. Checkpoint — ensure admin dashboard changes compile and render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Guest app — hide owner contact info and show admin contact
  - [x] 12.1 Add or reuse a `useGetSiteConfig()` hook in the GuestApp to fetch `GET /api/v1/site-config` on the property detail page
    - _Requirements: 6.2, 6.3_
  - [x] 12.2 In `web/src/pages/client/properties/id/data-container.tsx`, remove rendering of `property.contact.phone` and `property.contact.email`; replace with `siteConfig.contactPhone` and `siteConfig.contactEmail`; display a generic "Contact us" prompt when SiteConfig contact fields are empty
    - _Requirements: 6.1, 6.2, 6.3_
  - [ ]* 12.3 Write property test for owner contact info hidden from guest view (Property 8)
    - **Property 8: Owner Contact Info Hidden from Guest View**
    - **Validates: Requirements 6.1**
  - [ ]* 12.4 Write property test for admin contact shown on guest property pages (Property 9)
    - **Property 9: Admin Contact Shown on Guest Property Pages**
    - **Validates: Requirements 6.2**

- [ ] 13. Guest app — furnishing status display and villa booking price
  - [x] 13.1 In `web/src/pages/client/properties/id/data-container.tsx`, display a `furnishingStatus` badge in the Overview section when the property type is APARTMENT or VILLA and the field is set
    - _Requirements: 3.4_
  - [x] 13.2 Verify and update the booking card in `data-container.tsx` to display `pricePerNight` as the booking price for VILLA type properties; ensure the booking dialog uses `pricePerNight` as the room price for VILLA bookings
    - _Requirements: 4.5, 4.6_

- [ ] 14. Guest app — property gallery 4×2 grid with navigation
  - [x] 14.1 Create a `PropertyGallery` component that displays images in a 4-column × 2-row grid (8 per page); manage `galleryPage` state; compute `pageImages = allImages.slice(galleryPage * 8, galleryPage * 8 + 8)`; show Previous/Next buttons only when `allImages.length > 8`; clicking any image opens the existing lightbox/fullscreen viewer
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [x] 14.2 Replace the current hero image + thumbnail grid in `data-container.tsx` with the new `PropertyGallery` component
    - _Requirements: 8.1, 8.3_
  - [ ]* 14.3 Write property test for gallery navigation visibility based on image count (Property 13)
    - **Property 13: Gallery Navigation Visibility Based on Image Count**
    - **Validates: Requirements 8.2, 8.4**
  - [x] 14.4 Replace the auto-scrolling marquee in the homepage `properties-section.tsx` with a static responsive grid (2 columns mobile, 4 columns desktop); add Previous/Next pagination buttons to page through sets of 8 cards; make each card fully clickable (entire card navigates to property detail); add `e.stopPropagation()` to the "Book" / "Check availability" button to prevent double navigation
    - _Requirements: 8.5, 8.6, 8.7_

- [ ] 15. Guest app — manual bank transfer payment flow
  - [x] 15.1 In the booking flow, after the review step, display a manual bank transfer instructions card reading `bankName`, `bankAccountHolder`, `bankAccountNumber`, `bankInstructions` from SiteConfig; hide the Chapa "Pay Online" button (controlled by `VITE_CHAPA_ENABLED` env var defaulting to `false`)
    - _Requirements: 10.1, 10.2_
  - [x] 15.2 Create a `PaymentSubmissionForm` component with fields: reference number (required), amount paid (required, numeric), full name (required), screenshot upload (required, image only); validate screenshot MIME type client-side before upload; upload screenshot to Cloudinary; POST to `/api/v1/payments/submit`; display field-level errors on 400 response
    - _Requirements: 10.3, 10.5, 10.10_

- [ ] 16. Guest app — Android bug fixes for date picker and Book Now button
  - [x] 16.1 In the booking dialog date picker (`web/src/pages/client/rooms/id/`), replace the "Done" button's `onClick` with `onPointerDown`/`onTouchEnd` to prevent Android event propagation issues; add `onOpenAutoFocus` and `onInteractOutside` handlers to the Popover to prevent unintended close on touch devices
    - _Requirements: 5.1, 5.3, 5.4_
  - [x] 16.2 Update the "Book Now" button to use `onPointerDown` or `onTouchStart` in addition to `onClick`; wrap the booking dialog open logic in a try/catch; on failure, render a fallback `<a href="/properties/{id}#booking">Book Now</a>` link and log the error to `console.error`
    - _Requirements: 5.2, 5.5_

- [ ] 17. Final checkpoint — ensure all tests pass across all three apps
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Property tests use **fast-check** with a minimum of 100 iterations; each test is tagged with a comment: `// Feature: system-enhancements, Property N: <property_text>`
- Chapa is **hidden** (not removed): set `CHAPA_ENABLED=false` in `backend/.env` and `VITE_CHAPA_ENABLED=false` in `web/.env`; existing webhook/verify endpoints remain functional
- The 4×2 gallery grid applies to both the property detail page AND the homepage trending section
- Smart search must trim and collapse whitespace before processing any query
- The admin property management endpoint must continue returning all properties regardless of room count
