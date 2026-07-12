# Public Website Frontend Tasks — HR / Careers

> Scope: The customer-facing website (autostrad.com or careers.autostrad.com).
> Goal: Deliver the public careers experience — job browsing, applications, and shareable job pages.

---

## 1. Routes to Build

| Path | Purpose |
|---|---|
| `/careers` | Browse all open jobs |
| `/careers/:slug` | Job detail + apply CTA (slug-or-id supported) |
| `/careers/:slug/apply` | Application form |
| `/careers/thank-you/:applicationId` | Post-submit confirmation |

Confirm the canonical pattern with backend; admin currently defaults to:
```
REACT_APP_CAREERS_PUBLIC_URL=https://autostrad.com/careers
```
Change this env var if the path differs.

---

## 2. `/careers` Listing Page

- Calls `GET /public/career/job?page=1&page_size=12&search=&location=`
- Cards show: title, location pill, experience pill, days-left badge, "View & Apply" button
- Filter bar: search input, location dropdown, experience slider
- Pagination
- Empty state when no roles
- Bilingual EN/AR toggle (use `title_ae` / `description_ae` when locale=ar, with `dir="rtl"`)
- Mobile-responsive grid

---

## 3. `/careers/:slug` Job Detail Page

### Content sections
- Hero: title, location, experience, posted date, expiry countdown
- Sticky "Apply Now" CTA
- Description (sanitized HTML, EN + collapsible AR)
- "Share this job" buttons (LinkedIn, Facebook, X, WhatsApp, Telegram, Email, Copy link) — same channels as admin
- Related jobs (3 most recent active)

### CRITICAL — Open Graph & SEO meta in `<head>`
Without these, every link shared to LinkedIn / Facebook / X / WhatsApp will look broken.

```html
<title>{title_en} — Autostrad Careers</title>
<meta name="description" content="{description_excerpt}" />

<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:title" content="{title_en}" />
<meta property="og:description" content="{description_excerpt}" />
<meta property="og:image" content="{image_url || default_banner}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="https://autostrad.com/careers/{slug}" />
<meta property="og:site_name" content="Autostrad Careers" />

<!-- Twitter / X -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{title_en}" />
<meta name="twitter:description" content="{description_excerpt}" />
<meta name="twitter:image" content="{image_url || default_banner}" />
```

### JSON-LD for Google Jobs (organic SEO win)
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": "{title_en}",
  "description": "{description_en}",
  "datePosted": "{created_at}",
  "validThrough": "{expiry_date}",
  "employmentType": "FULL_TIME",
  "hiringOrganization": {
    "@type": "Organization",
    "name": "Autostrad Rent A Car",
    "sameAs": "https://autostrad.com",
    "logo": "https://autostrad.com/logo.png"
  },
  "jobLocation": {
    "@type": "Place",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "{location_en}",
      "addressCountry": "AE"
    }
  },
  "experienceRequirements": "{experience_years} years"
}
</script>
```

> **Server-side rendering is required** for OG tags to work — social crawlers don't run JavaScript.
> Use Next.js (`getServerSideProps` / `generateMetadata`) or Nuxt or pre-rendering. A pure SPA will NOT work for share previews.

---

## 4. Application Form

### Steps (single page or wizard)
1. **Personal info** — first_name, last_name, email, country_code + phone
2. **Background** — current_location, expected_salary, notice_period_days
3. **CV upload** — drag-and-drop, .pdf/.doc/.docx, max 5 MB, show file name + size, preview if PDF
4. **Optional attachments** — up to 3 files (portfolio, certifications)
5. **Questionnaire** — fetched from `GET /public/career/job/:slug/questionnaire`. Render dynamically based on `type`:
   - `text`, `textarea`
   - `number` (with min/max)
   - `email`, `phone`, `date`
   - `radio`, `checkbox`, `dropdown` (use `options` array)
   - `rating` (1–5 stars, respect min/max)
   - `boolean` (yes/no)
   - `file_upload`
6. **Review & submit**

### Submit
```
POST /public/career/application   (multipart/form-data)
```
On success → redirect to `/careers/thank-you/:applicationId`.
On error → show inline messages (server returns `{ error, message }`).

### Validation (client-side)
- Email regex
- Phone digits-only
- File size ≤ 5 MB
- Required questionnaire fields enforced before submit
- min/max for number / rating types

---

## 5. Thank-You Page

- Confirms submission with application ID
- "What's next" timeline (Reviewing → Interview → Offer)
- Share button: "Know someone else who'd be a fit?" → opens the same job's share menu
- Link to `/careers` to browse more roles

---

## 6. Bilingual Support (EN / AR)

- Locale toggle in header
- When `ar`: set `<html lang="ar" dir="rtl">`, swap to `*_ae` fields, mirror layout
- All static labels in i18n files (`en.json`, `ar.json`)
- Use Arabic-friendly font (e.g. Noto Sans Arabic, Tajawal)

---

## 7. Tracking & Analytics

### 7.1 Honor UTM params from admin share links
The admin share buttons add `?utm_source=linkedin&utm_medium=share`. Send these to your analytics (GA4, Plausible, Mixpanel) on page-view AND on application-submit.

### 7.2 Conversion event
Fire `application_submitted` event with `{ job_id, slug, utm_source }` on success.

### 7.3 Optional: forward UTM to backend
Include UTM params in the application payload so HR can see "this candidate came from LinkedIn":
```
POST /public/career/application
  ...other fields,
  utm_source: 'linkedin',
  utm_medium: 'share',
  utm_campaign: 'job-123'
```
(Backend needs to accept + persist these — coordinate.)

---

## 8. Performance & Accessibility

- Lazy-load job images
- Skeleton loaders during fetch
- All form fields have `<label>` + `aria-*`
- Keyboard navigable, focus-visible rings
- Lighthouse score ≥ 90 on mobile

---

## 9. Stack Recommendation

If starting fresh:
- **Next.js 14 (App Router)** — server components handle OG tags + JSON-LD perfectly
- **Tailwind** for styling
- **react-hook-form** + **zod** for the application form
- **next-intl** for i18n

If integrating into existing site (`new_theme/` Vite-React app in this repo):
- Need to add server-side rendering (`vite-plugin-ssr` or migrate to Next) for OG tags to work on social platforms.
- Pure CSR will only work for direct visitors — share previews on LinkedIn/FB will be blank.

---

## 10. Default Share Image (one-time asset)

Create a 1200×630 PNG banner with:
- Autostrad logo
- "We're Hiring" headline
- Brand colors

Host at `https://autostrad.com/og/careers-default.png`. Backend returns this URL when `image_url` is null.

---

## 11. Checklist

```
[ ] /careers list page with filters + pagination
[ ] /careers/:slug detail page with SSR
[ ] OG meta tags + Twitter Card meta
[ ] Schema.org JobPosting JSON-LD
[ ] Default 1200×630 share image asset
[ ] Application form (with dynamic questionnaire)
[ ] CV + attachment upload (multipart)
[ ] /careers/thank-you/:id confirmation
[ ] EN/AR i18n + RTL
[ ] UTM tracking → analytics
[ ] Mobile responsive
[ ] Lighthouse pass
[ ] Sitemap.xml includes /careers/* URLs
[ ] robots.txt allows crawler access
```

---

## 12. Coordination with Admin Portal

- Confirm **canonical URL pattern** with backend (so admin's share URLs match)
- Once decided, update admin `.env`:
  ```
  REACT_APP_CAREERS_PUBLIC_URL=https://autostrad.com/careers
  ```
- Test end-to-end: admin creates job → click LinkedIn share button → verify LinkedIn renders rich preview with image + title.

---

## 13. Priority Order

1. ✅ Job list + detail pages with SSR + OG tags  *(unblocks share feature)*
2. ✅ Default share image asset
3. ✅ Application form + CV upload
4. ✅ Dynamic questionnaire renderer
5. ✅ Thank-you page
6. ⏩ JSON-LD for Google Jobs
7. ⏩ EN/AR + RTL
8. ⏩ UTM tracking
