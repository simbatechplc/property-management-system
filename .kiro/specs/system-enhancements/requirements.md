# Requirements Document

## Introduction

This document captures the requirements for a set of system enhancements to the Kuru Rent property management platform. The platform consists of three components: an Admin dashboard (Next.js), a guest-facing web app (Vite/React), and a backend API (Express/TypeScript/Prisma with PostgreSQL). The enhancements span payment flow changes, property management improvements, UI/UX upgrades, bug fixes, and search improvements.

## Glossary

- **Admin**: The platform administrator who manages properties, payments, and site configuration via the admin dashboard.
- **Owner/Broker**: A property owner or broker who registers and manages properties through the admin dashboard.
- **Guest**: An end user who browses and books properties through the guest-facing web app.
- **Property**: A listing on the platform (Hotel, Apartment, Villa, Guest House, Resort, Hostel, Lodge).
- **Villa**: A property of type VILLA that is rented as a whole unit, not by individual rooms.
- **Apartment**: A property of type APARTMENT that may have furnished/unfurnished options.
- **Room**: An individual bookable unit within a property.
- **SiteConfig**: A singleton database record storing platform-wide configuration including contact details.
- **BankAccount**: Admin-configured bank account details used for manual bank transfer payments.
- **ManualBankTransfer**: A payment method where guests transfer money to the Admin's bank account and submit proof for Admin approval.
- **PaymentSubmission**: A guest-submitted record containing payment reference number, amount, full name, and screenshot for Admin review.
- **Chapa**: The third-party online payment gateway currently integrated (to be temporarily disabled).
- **FuzzySearch**: A search algorithm that matches approximate or partial text, tolerating minor spelling differences.
- **PropertyGallery**: The image display section on a property detail page.
- **ImagePreview**: A thumbnail display of a selected image before it is uploaded to the server.
- **System**: The Kuru Rent platform (backend API + admin dashboard + guest web app collectively).
- **Backend**: The Express/TypeScript/Prisma API server.
- **AdminDashboard**: The Next.js admin frontend application.
- **GuestApp**: The Vite/React guest-facing frontend application.

---

## Requirements

### Requirement 1: Admin Bank Account Customization

**User Story:** As an Admin, I want to configure the bank account details that guests use for manual payments, so that I can manage which bank account receives transfers without requiring a code deployment.

#### Acceptance Criteria

1. THE AdminDashboard SHALL provide a form in the site settings section where the Admin can enter bank account details including: bank name, account holder name, account number, and optional additional instructions.
2. WHEN the Admin submits valid bank account details, THE Backend SHALL persist the bank account configuration in the SiteConfig record.
3. WHEN the Admin submits bank account details with missing required fields (bank name, account holder name, or account number), THE Backend SHALL return a 400 error with a descriptive validation message.
4. WHEN a Guest requests the site configuration, THE Backend SHALL include the bank account details in the response so the GuestApp can display payment instructions.
5. THE AdminDashboard SHALL display the currently saved bank account details and allow the Admin to update them at any time.

---

### Requirement 2: Property Address Validation

**User Story:** As an Owner, I want to enter short local property addresses, so that I am not blocked by overly restrictive minimum-length validation.

#### Acceptance Criteria

1. THE Backend SHALL accept property addresses with a minimum length of 3 characters (reduced from 5).
2. THE AdminDashboard property creation form SHALL accept address inputs with a minimum length of 3 characters.
3. WHEN an address shorter than 3 characters is submitted, THE Backend SHALL return a 400 error indicating the address is too short.
4. WHEN a valid address of 3 or more characters is submitted, THE Backend SHALL accept and persist the address without error.

---

### Requirement 3: Furnished/Unfurnished Options for Apartment and Villa

**User Story:** As an Owner, I want to specify whether my Apartment or Villa is furnished or unfurnished, so that guests can make informed booking decisions.

#### Acceptance Criteria

1. WHEN a property of type APARTMENT or VILLA is created or updated, THE AdminDashboard SHALL display a furnished/unfurnished selector field.
2. THE Backend SHALL accept and persist a `furnishingStatus` field (values: `FURNISHED`, `UNFURNISHED`, `PARTIALLY_FURNISHED`) on properties of type APARTMENT or VILLA.
3. WHEN a property of a type other than APARTMENT or VILLA is created or updated, THE System SHALL not display or require the furnishing status field.
4. WHEN a Guest views a property detail page for an APARTMENT or VILLA, THE GuestApp SHALL display the furnishing status if it has been set.
5. THE Backend SHALL accept `furnishingStatus` as an optional field; properties without it set SHALL remain valid.

---

### Requirement 4: Villa Property Logic

**User Story:** As an Admin or Owner, I want Villa properties to support direct pricing and prevent room creation, so that villas are correctly rented as whole units rather than by individual rooms.

#### Acceptance Criteria

1. WHEN a property of type VILLA is created or updated, THE AdminDashboard SHALL display a `pricePerNight` input field for setting the whole-property price.
2. WHEN a property of type VILLA is created or updated with a `pricePerNight` value, THE Backend SHALL persist the `pricePerNight` on the property record.
3. WHEN a user attempts to create a Room for a property of type VILLA, THE Backend SHALL return a 400 error indicating that rooms cannot be added to Villa properties.
4. WHEN a user attempts to create a Room for a property of type VILLA, THE AdminDashboard SHALL disable the "Add Room" action and display an explanatory message.
5. WHEN a Guest views a Villa property, THE GuestApp SHALL display the `pricePerNight` as the booking price instead of room-level prices.
6. WHEN a Guest books a Villa property, THE System SHALL create a property-level booking using the `pricePerNight` value.

---

### Requirement 5: Android Bug Fixes — Date Selection and Book Now Button

**User Story:** As a Guest using an Android device, I want the date selection "Done" button and the "Book Now" button to work correctly, so that I can complete bookings on my mobile device.

#### Acceptance Criteria

1. WHEN a Guest on an Android device taps the "Done" button in the date picker popover, THE GuestApp SHALL close the date picker and retain the selected date.
2. WHEN a Guest on an Android device taps the "Book Now" button on the booking card, THE GuestApp SHALL open the booking dialog without requiring a second tap.
3. WHEN the date picker popover is open on a touch device, THE GuestApp SHALL prevent the popover from closing due to unintended touch events outside the popover.
4. WHEN a Guest selects a check-in date on Android, THE GuestApp SHALL correctly propagate the selected date to the booking form state.
5. IF the booking dialog fails to open on a touch device, THEN THE GuestApp SHALL log the error and display a fallback "Book Now" button that navigates to the booking form.

---

### Requirement 6: Hide Owner Contact Info from Guest Pages

**User Story:** As an Admin, I want property owner contact information to be hidden from guests, so that all guest inquiries are directed through the Admin's contact details.

#### Acceptance Criteria

1. WHEN a Guest views a property detail page, THE GuestApp SHALL NOT display the property owner's phone number or email from the property's Contact record.
2. WHEN a Guest views a property detail page, THE GuestApp SHALL display the Admin's contact details (phone, email) from the SiteConfig record in place of the owner's contact information.
3. WHEN the SiteConfig does not contain contact details, THE GuestApp SHALL display a generic "Contact us" prompt without exposing owner information.
4. THE Backend property detail endpoint SHALL continue to return the property Contact record for use by the AdminDashboard, but the GuestApp SHALL not render it.

---

### Requirement 7: Property Image Upload UX

**User Story:** As an Owner, I want a user-friendly image upload experience with previews, so that I can verify images before uploading them to the server.

#### Acceptance Criteria

1. THE AdminDashboard image upload component SHALL label the upload action as "Upload Image" instead of "Add Image".
2. WHEN an Owner selects one or more image files using the file picker, THE AdminDashboard SHALL display a thumbnail preview of each selected image before upload begins.
3. WHEN an Owner selects a file that is not an image (e.g., PDF, video), THE AdminDashboard SHALL display an error message and reject the file.
4. WHEN an Owner clicks "Upload Image", THE AdminDashboard SHALL allow selection of multiple image files simultaneously via the file input.
5. WHEN an image upload fails, THE AdminDashboard SHALL display a user-friendly error message identifying which file failed and allow the Owner to retry.
6. WHILE an image is uploading, THE AdminDashboard SHALL display a loading indicator on the specific image being uploaded.
7. WHEN an Owner removes a previewed image before upload, THE AdminDashboard SHALL remove it from the preview list without uploading it.

---

### Requirement 8: Property Gallery Layout — 4×2 Grid with Navigation

**User Story:** As a Guest, I want to browse property images in a structured 4×2 grid with navigation controls on the property detail page and the homepage trending section, so that I can easily view all property photos.

#### Acceptance Criteria

1. THE GuestApp property detail page SHALL display property images in a 4-column by 2-row grid layout (showing up to 8 images per page).
2. WHEN a property has more than 8 images, THE GuestApp SHALL display "Previous" and "Next" navigation buttons to page through sets of 8 images.
3. WHEN a Guest clicks on any image in the gallery grid, THE GuestApp SHALL open a full-screen image viewer for that image.
4. WHEN a property has 8 or fewer images, THE GuestApp SHALL hide the navigation buttons.
5. THE GuestApp property card on the listing page SHALL be fully clickable — clicking anywhere on the card SHALL navigate to the property detail page.
6. WHEN a Guest clicks the "Book" or "Check availability" button on a property card, THE GuestApp SHALL navigate to the property detail page without triggering duplicate navigation events.
7. THE GuestApp homepage trending properties section SHALL display property cards in a fully clickable grid layout with next/previous navigation, consistent with the property detail gallery layout.

---

### Requirement 9: Filter Properties Without Rooms (Except Villas)

**User Story:** As a Guest, I want to see only bookable properties in search results, so that I am not shown properties that have no available rooms.

#### Acceptance Criteria

1. WHEN the GuestApp requests the property listing, THE Backend SHALL exclude properties that have zero rooms, EXCEPT for properties of type VILLA.
2. WHEN a property of type VILLA has zero rooms, THE Backend SHALL include it in the listing results because villas are booked as whole units.
3. WHEN a property of any other type (HOTEL, APARTMENT, GUEST_HOUSE, RESORT, HOSTEL, LODGE) has zero rooms, THE Backend SHALL exclude it from the public listing endpoint.
4. THE Backend admin property management endpoint SHALL continue to return all properties regardless of room count, so Admins can manage incomplete listings.

---

### Requirement 10: Manual Bank Transfer Payment

**User Story:** As a Guest, I want to pay by manual bank transfer and submit proof of payment, so that I can complete a booking while Chapa online payments are temporarily unavailable.

#### Acceptance Criteria

1. THE System SHALL hide the Chapa online payment UI for new bookings (not remove the integration code, so it can be re-enabled later); existing Chapa webhook and verification endpoints SHALL remain functional for previously initiated transactions.
2. WHEN a Guest completes the booking review step, THE GuestApp SHALL display manual bank transfer instructions including the Admin's configured bank name, account holder name, account number, and any additional instructions from SiteConfig.
3. WHEN a Guest submits a manual payment, THE GuestApp SHALL collect and validate the following fields: payment reference number (required), amount paid (required, numeric), full name (required), and payment screenshot (required, image file).
4. WHEN a Guest submits a valid manual payment submission, THE Backend SHALL create a PaymentSubmission record with status PENDING and associate it with the booking.
5. WHEN a Guest submits a manual payment submission with missing required fields, THE Backend SHALL return a 400 error listing the missing fields.
6. WHEN the Admin approves a PaymentSubmission, THE Backend SHALL update the associated Booking status to APPROVED and the Payment status to SUCCESS.
7. WHEN the Admin approves a PaymentSubmission, THE Backend SHALL send an SMS confirmation to the guest's registered phone number.
8. WHEN the Admin rejects a PaymentSubmission, THE Backend SHALL update the PaymentSubmission status to REJECTED and notify the guest.
9. THE AdminDashboard payments section SHALL display all pending PaymentSubmissions with the submitted reference number, amount, full name, and a link to view the screenshot.
10. IF a guest submits a payment screenshot that is not a valid image file, THEN THE GuestApp SHALL display an error and reject the submission.

---

### Requirement 11: Smart Search — Fuzzy/Approximate Matching

**User Story:** As a Guest, I want to find properties using partial words or approximate spellings, so that I can discover relevant results even when I don't know the exact property name or location.

#### Acceptance Criteria

1. WHEN a Guest enters a search query, THE Backend SHALL trim leading and trailing whitespace and collapse multiple consecutive spaces into a single space before processing the query.
2. WHEN a Guest enters a search query, THE Backend SHALL return properties whose name, city, subcity, or address approximately matches the query using fuzzy/trigram matching, in addition to exact substring matches.
3. WHEN a Guest enters a partial word (e.g., "Bole" matching "Bole Medhanialem"), THE Backend SHALL include matching properties in the results.
4. WHEN a Guest enters a query with a minor spelling variation (e.g., "Adis" instead of "Addis"), THE Backend SHALL include properties in Addis Ababa in the results.
5. WHEN a search query produces no exact matches but has approximate matches, THE Backend SHALL return the approximate matches ordered by relevance score descending.
6. WHEN a search query produces no matches at all (exact or approximate), THE Backend SHALL return an empty result set with a 200 status.
7. THE Backend fuzzy search SHALL use PostgreSQL trigram similarity (pg_trgm extension) with a similarity threshold of 0.2 or greater.
8. WHEN the pg_trgm extension is not available, THE Backend SHALL fall back to the existing case-insensitive substring search without error.
9. WHEN a Guest enters a query consisting only of whitespace, THE Backend SHALL treat it as an empty query and return all properties (or the default listing).
