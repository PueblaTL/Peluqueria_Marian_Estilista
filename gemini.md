# PROJECT: MARIAN ESTILISTA — PROFESSIONAL HAIR SALON WEB PORTAL

## 1. BUSINESS INFORMATION

- **Business Name:** Marian Estilista
- **Main Professional:** Mariano (the only professional currently working at the salon).
- **Target Audience:** Women.
- **Business Focus:** Professional hairdressing, hair coloring, hair treatments, straightening services, and hairstyling.
- **Location:** Galería La Catedral, San Carlos de Bariloche — Marian Estilista Salon.
- **Experience:** 15+ years of professional experience.
- **Specialization:** Hair coloring, balayage, babylights, hair treatments, straightening techniques, and hairstyling.

### STRICT BUSINESS RULES

- The salon is 100% focused on women's hairdressing and beauty services.
- DO NOT include barbering, men's haircuts, beard services, or masculine-oriented services.
- DO NOT invent additional fictional professionals. Mariano is the only stylist.
- DO NOT invent testimonials, awards, certifications, reviews, achievements, or business claims that were not explicitly provided.
- The official location is:
  **Galería La Catedral, San Carlos de Bariloche — Salón Marian Estilista.**
- Preserve all business information accurately throughout the website.
- Do not alter or fabricate prices, durations, course information, or service descriptions unless explicitly instructed.

---

# 2. OFFICIAL SERVICE CATALOG

The website must contain the following 7 official services:

1. **Babylights**
   Subtle highlighting technique that adds brightness and dimension through delicate, natural-looking highlights.

2. **Balayage**
   A professional coloring technique that creates progressive, natural-looking illumination adapted to each client's hair.

3. **Keratin Treatment**
   Professional treatment designed to improve the appearance, softness, manageability, and overall look of the hair.

4. **5D Straightening**
   Advanced professional hair straightening service.

5. **6D Laser Straightening**
   High-precision professional straightening service focused on smoothness and shine.

6. **Hairstyling**
   Professional hairstyles for events, special occasions, and different personal styles.

7. **Hair Coloring**
   Personalized professional coloring services adapted to the client's hair and desired result.

---

# 3. PROFESSIONAL HAIRDRESSING COURSE

## Course Information

- **Title:** ✨ OPEN ENROLLMENT — COMPLETE PROFESSIONAL HAIRDRESSING COURSE
- **Start Date:** July 10
- **Location:** Galería La Catedral, San Carlos de Bariloche — Marian Estilista Salon
- **Format:** In-person
- **Method:** Complete and 100% practical
- **Duration:** 5 months
- **Frequency:** Once per week
- **Training:** Professional theory and practice
- **Investment:** ARS $350,000 per month
- **Certification:** A certificate will be provided upon course completion.

## Course Curriculum

### Color & Colorimetry
- Complete colorimetry
- Professional hair dye and color formulation
- Root touch-ups
- Gray coverage
- Color correction
- Professional bleaching
- Toners and tonalization
- Beige, butter, ash, pearl, and other tones

### Highlighting Techniques
- Balayage
- Babylights
- Highlights
- Traditional highlighting techniques

### Straightening & Hair Treatments
- Hair straightening
- Hair Botox
- Keratin shock treatments
- Hydration treatments
- Nutrition treatments
- Hair reconstruction

### Professional Diagnosis & Client Care
- Hair diagnosis
- Client consultation
- Professional advice
- Personalized recommendations

## Enrollment

The course section must contain a clear CTA button:

**"I WANT TO ENROLL"**

Clicking the button must open a modal or form containing:

- First Name
- Last Name
- Phone
- Email

Enrollment data must persist using:

`localStorage`

---

# 4. APPOINTMENT BOOKING SYSTEM — 6 STEPS

Marian Estilista currently has only one professional:

**Mariano**

Therefore, there must NOT be a professional-selection step.

The booking flow must contain exactly 6 steps:

## Step 1 — Select Service

Display all 7 available services.

Each service must clearly show:

- Service name
- Description
- Price
- Duration
- Visual representation when available

## Step 2 — Select Date

Use an interactive calendar.

Requirements:

- Current month and future months
- No past dates
- Highlight available dates
- Disable unavailable dates
- Clear visual distinction between selected, available, unavailable, and past dates

## Step 3 — Available Time Slots

Display available appointment times dynamically.

Requirements:

- Clear time-slot buttons
- Disabled unavailable times
- Visual distinction between selected and unavailable slots
- Clean and easy-to-scan interface

## Step 4 — Client Information

Collect:

- First Name
- Last Name
- Phone
- Email

All fields must include appropriate validation and useful error messages.

## Step 5 — Appointment Summary

Display a complete appointment summary including:

- Selected service
- Price
- Duration
- Date
- Time
- Client information
- Professional: Mariano

Include:

**"CONFIRM APPOINTMENT"**

## Step 6 — Confirmation

After successful booking:

- Display a clear success state
- Show the complete appointment summary
- Provide a **"BACK TO HOME"** button
- Persist appointment data in `localStorage`

---

# 5. ADMINISTRATION PANEL

Admin panel location:

`/pages/admin.html`

Authentication is NOT required in this frontend-only version.

## Dashboard

Display key metrics:

- Today's appointments
- Pending appointments
- Completed appointments
- Registered clients
- Estimated revenue
- Course enrollments

## Appointments

Provide:

- Appointment table
- Filtering
- Appointment details
- Status management

Available actions:

- Confirm
- Cancel
- Mark as completed

## Clients

Automatically generate a client directory from appointment records.

## Services

Provide a complete CRUD interface for:

- Create
- Read
- Update
- Delete

services.

## Course & Enrollments

Display course applicants and allow status management.

Possible states:

- Pending
- Contacted
- Enrolled

## Settings

Provide:

- General salon configuration
- Demo data reset functionality

---

# 6. TECHNOLOGY & ARCHITECTURE

## Frontend Stack

Use:

- Semantic HTML5
- Vanilla CSS3
- Vanilla JavaScript ES6+

Do NOT use:

- React
- Vue
- Angular
- Bootstrap
- Tailwind
- Heavy frontend frameworks

The project should remain lightweight, understandable, maintainable, and easy to extend.

## Data Persistence

Use:

`localStorage`

All local persistence must be centralized through:

`storage.js`

Avoid duplicating localStorage logic across multiple components.

## Backend Preparation

The frontend architecture must be structured so that it can later be migrated to:

- Java
- Spring Boot
- PostgreSQL

Use clear entities, IDs, structured objects, and DTO-like data structures.

Avoid tightly coupling UI components with storage logic.

---

# 7. DESIGN SYSTEM — CRITICAL REQUIREMENT

The visual design is one of the highest priorities of this project.

The website must feel:

- Minimalist
- Premium
- Elegant
- Feminine
- Sophisticated
- Modern
- Professional
- Clean
- High-end

## COLOR PALETTE

The entire interface must be primarily based on a **BLACK & WHITE color palette**.

### Primary colors

- Pure White
- Off-white
- Soft light gray
- Charcoal
- Deep black

### Important rule

DO NOT use Champagne Gold, Rose Nude, colorful gradients, saturated colors, or excessive decorative colors.

The design should rely mainly on:

**Black + White + Neutral Grays**

Use contrast, spacing, typography, borders, and subtle shadows to create visual hierarchy instead of relying on multiple colors.

Accent colors should be avoided unless absolutely necessary for states such as success, warning, or error.

---

# 8. MINIMALIST UI PRINCIPLES

Follow a strong minimalist design philosophy.

Avoid:

- Visual clutter
- Excessive shadows
- Excessive gradients
- Large decorative elements
- Too many cards
- Unnecessary borders
- Excessive animations
- Overly rounded components
- Large blocks of text
- Redundant UI elements

Prefer:

- Generous whitespace
- Strong typography hierarchy
- Clean layouts
- Simple buttons
- Thin borders
- Subtle shadows
- Carefully chosen spacing
- Large editorial-style headings
- Clear CTAs
- Simple iconography
- Consistent alignment

Every component should have a clear purpose.

---

# 9. TYPOGRAPHY

Use an elegant typography combination such as:

- **Playfair Display** for major headings and editorial accents
- **Plus Jakarta Sans** for body text, navigation, buttons, forms, and UI elements

Typography must create a strong visual hierarchy without becoming oversized.

Headings should feel luxurious and editorial.

Body text should remain highly readable and clean.

Avoid excessive font weights and unnecessary typographic decoration.

---

# 10. RESPONSIVE DESIGN — EXTREMELY IMPORTANT

Responsive design is a CORE REQUIREMENT of the project.

The entire website must work correctly on:

- Small mobile phones
- Large mobile phones
- Tablets
- Laptops
- Desktop monitors
- Large screens

Use a **mobile-first approach**.

## Mobile-first requirements

The design must not simply shrink the desktop layout.

Instead, components must intelligently adapt to smaller screens.

Pay special attention to:

- Header
- Navigation
- Logo
- CTA buttons
- Service cards
- Booking wizard
- Calendar
- Time slots
- Forms
- Modals
- Course section
- Gallery
- Dashboard
- Tables
- Admin navigation

## Mobile layout requirements

On small screens:

- Navigation should collapse cleanly.
- Important actions must remain visible.
- Buttons must remain easy to tap.
- Text must never overflow horizontally.
- Cards should stack vertically when necessary.
- Multi-column layouts should automatically become single-column layouts.
- Forms should use full available width.
- Images must remain properly cropped and responsive.
- Tables should transform into mobile-friendly layouts when necessary.
- Modals must fit within the viewport.
- No horizontal scrolling should be required for normal user interaction.
- Important CTAs such as **Book Appointment**, **Admin**, and **Enroll** must remain accessible.

## Header responsiveness

The header must remain visually clean at every breakpoint.

On desktop:

- Display branding clearly.
- Use a horizontal navigation layout.

On mobile:

- Reduce visual scale.
- Keep the logo/brand visible.
- Use a compact menu.
- Keep important actions accessible.
- Do not allow the header to become overcrowded.

The branding should remain recognizable without consuming excessive screen space.

---

# 11. BREAKPOINT & LAYOUT GUIDELINES

Use sensible responsive breakpoints rather than designing for a single screen size.

The layout should smoothly adapt between:

- Mobile
- Tablet
- Desktop
- Large desktop

Do not rely on fixed pixel dimensions for major containers.

Prefer:

- `%`
- `rem`
- `em`
- `clamp()`
- `min()`
- `max()`
- CSS Grid
- Flexbox

Use `max-width` containers and fluid spacing.

Typography and spacing should scale naturally using responsive CSS techniques.

---

# 12. ACCESSIBILITY & UX

The interface must be accessible and intuitive.

Requirements:

- Semantic HTML
- Proper heading hierarchy
- Descriptive button labels
- Accessible form labels
- Keyboard-friendly navigation
- Visible focus states
- Sufficient text contrast
- Proper alt text for meaningful images
- Clear validation messages
- Clear success/error states
- Avoid relying only on color to communicate status

Interactive elements must provide obvious feedback.

---

# 13. MICROINTERACTIONS & ANIMATION

Animations should be subtle and sophisticated.

Use animations only when they improve UX.

Preferred:

- Soft hover transitions
- Subtle button feedback
- Gentle card interactions
- Smooth modal transitions
- Fade/slide transitions
- Small navigation transitions

Avoid:

- Excessive motion
- Large bouncing animations
- Flashing elements
- Distracting effects

Animations must remain performant, especially on mobile devices.

Respect:

`prefers-reduced-motion`

when appropriate.

---

# 14. CODE QUALITY REQUIREMENTS

Write clean, production-oriented code.

Requirements:

- Modular JavaScript
- Reusable functions
- Clear naming conventions
- Minimal duplication
- Organized CSS
- Reusable design tokens
- Centralized configuration where appropriate
- Clear separation between UI, data, and storage logic
- Useful comments only where necessary

Do NOT rewrite working functionality unnecessarily.

When modifying an existing component:

1. Preserve its existing functionality.
2. Preserve existing data structures unless there is a clear reason to change them.
3. Avoid introducing regressions.
4. Modify only the necessary files.
5. Do not break other sections of the website.

---

# 15. DESIGN CONSISTENCY

Every page and component must feel like part of the same product.

Maintain consistency in:

- Typography
- Spacing
- Buttons
- Border radius
- Borders
- Icons
- Form fields
- Cards
- Modals
- Navigation
- Responsive behavior

Create reusable CSS variables/design tokens where appropriate.

For example:

- `--color-black`
- `--color-white`
- `--color-gray`
- `--spacing-*`
- `--radius-*`
- `--shadow-*`
- `--transition-*`

Avoid creating arbitrary styles for individual components when a reusable pattern already exists.

---

# 16. IMPORTANT IMPLEMENTATION PRINCIPLES

Before modifying the project:

- Inspect the existing structure.
- Understand the current HTML/CSS/JS architecture.
- Reuse existing components and patterns whenever possible.
- Do not introduce unnecessary dependencies.
- Do not replace functional systems without a reason.
- Do not change business rules.
- Do not invent missing information.

When implementing UI improvements, prioritize:

1. Responsive behavior
2. Usability
3. Visual hierarchy
4. Minimalism
5. Accessibility
6. Performance
7. Maintainability

The website should look like a **premium modern hair salon brand**, not like a generic template.

The final result should feel:

**Minimal. Elegant. Black and white. Feminine. Sophisticated. Professional. Responsive. Premium.**