# Backend Tasks — HR / Careers Module

> Scope: NestJS API at `https://api.staging.autostrad.com/api/v1/`
> Goal: Enable the public-facing careers experience and unblock the share-job feature in the admin portal.

---

## 1. Public Career Endpoints (NO AUTH)

All endpoints below must be **publicly accessible** (no JWT). Return only `status=1` jobs whose `expiry_date >= NOW()`.

### 1.1 List active jobs
```
GET /public/career/job
Query:
  page          (default 1)
  page_size     (default 12, max 50)
  search        (matches title_en/title_ae)
  location      (filter by location_en/location_ae)
  experience    (number, returns jobs with experience_years <= value)
Response:
  { data: [JobPublicDto], total: number, page, page_size }
```

### 1.2 Job detail
```
GET /public/career/job/:idOrSlug
Response: JobPublicDto (404 if not active or expired)
```

`JobPublicDto`:
```ts
{
  id: number;
  slug: string;                  // see §3
  title_en: string;
  title_ae: string;
  description_en: string;        // sanitized HTML
  description_ae: string;        // sanitized HTML
  location_en: string;
  location_ae: string;
  experience_years: number;
  expiry_date: string;           // ISO
  image_url: string | null;      // see §2
  created_at: string;
  questionnaire_id: number | null;
}
```

### 1.3 Public questionnaire
```
GET /public/career/job/:idOrSlug/questionnaire
Response:
  {
    id, title_en, title_ae,
    questions: [
      { id, type, label_en, label_ae, placeholder_en, placeholder_ae,
        help_text_en, help_text_ae, options, min, max, required, order }
    ]
  }
```

### 1.4 Submit application
```
POST /public/career/application      (multipart/form-data)
Body:
  career_job_id: number              (required)
  first_name, last_name              (required)
  email, country_code, phone_number  (required)
  current_location, expected_salary, notice_period_days  (optional)
  cv: File                           (required, .pdf/.doc/.docx, max 5 MB)
  attachments: File[]                (optional, max 3)
  answers: JSON string of [{ question_id, answer }]   (optional)
Response: 201 { id, status: 'received' }
```

Validate:
- Email format, phone digits-only
- Reject if `career_job_id` is not active/expired
- Server-side enforce questionnaire required-fields and min/max constraints

---

## 2. SEO / Share Metadata

### 2.1 Add `image_url` column to `career_job`
- Nullable string, optional hero image per job
- Falls back to a default Autostrad recruiting banner if null

### 2.2 Public job page must serve Open Graph meta
(implemented on the **public website frontend** — see frontend script — but backend should expose all data needed)

Required fields in `JobPublicDto` to power OG tags:
- `title_en` → `og:title`
- First 200 chars of stripped `description_en` → `og:description` (provide as `description_excerpt` field)
- `image_url` (with default fallback) → `og:image`
- Canonical URL built from slug → `og:url`

Add a derived field server-side:
```
description_excerpt: string   // plaintext, ~200 chars, ellipsis if truncated
```

---

## 3. Job Slug

### 3.1 Add `slug` column on `career_job`
- `VARCHAR(160) UNIQUE NOT NULL`
- Auto-generated on create from `title_en` + `id`:
  `slugify(title_en) + '-' + id`
  e.g. `senior-mechanic-dubai-123`
- Regenerate on title change OR keep stable forever (recommended: stable, never change → preserves shared links)
- Backfill migration for existing rows

### 3.2 Accept slug or numeric id everywhere
`GET /public/career/job/:idOrSlug` should detect:
- if param is numeric → lookup by id
- else → lookup by slug

---

## 4. Application Tracking & Analytics (optional, nice-to-have)

### 4.1 UTM-tagged share clicks
Admin is sharing URLs like `?utm_source=linkedin&utm_medium=share`.
Backend can log these on the public job-detail endpoint:
```
Table: career_job_view
  id, career_job_id, utm_source, utm_medium, utm_campaign,
  ip_hash, user_agent, created_at
```

### 4.2 Stats endpoint for admin
```
GET /admin/career/job/:id/share-stats
Response:
  {
    total_views: 532,
    by_source: { linkedin: 210, facebook: 88, twitter: 45, direct: 189 },
    last_7d: [...],
  }
```

---

## 5. Channel Postings (existing module)

The admin already has a `Channel Postings` page; it currently just logs entries.
Decide direction:

### Option A — Manual logging only (zero backend work)
Keep current implementation; HR records "I posted to LinkedIn at 10:00am" manually.

### Option B — Automated push (significant work)
Add integrations:
- **Indeed**: serve XML feed at `GET /public/career/feed/indeed.xml` (Indeed crawls it daily). No API write needed.
- **LinkedIn**: requires LinkedIn Recruiter API + OAuth app + business verification.
- **Glassdoor**: same XML feed pattern as Indeed.

Recommended: ship Option A now + Indeed XML feed (low effort, high value).

### 5.1 Indeed XML feed (recommended quick win)
```
GET /public/career/feed/indeed.xml      (Content-Type: application/xml)
```
Format: https://www.indeed.com/intl/en/xmlinfo.html
Output one `<job>` per active, non-expired posting with: title, date, referencenumber, url, company, city, country, description (CDATA HTML), category.

---

## 6. Notifications

### 6.1 On job publish
Email the HR Manager who created the job + all `hr_recruitment` users with:
- Subject: `New job posted — {title_en}`
- Body: link to admin detail page + public share URL + ready-made share text snippets

### 6.2 On new application
Email assigned recruiters (existing flow — confirm it still works after these changes).

---

## 7. CORS / Security

- Public endpoints (`/public/career/*`) need CORS allow-list to include the public website domain.
- Rate-limit `POST /public/career/application` (e.g. 5/min/IP) to prevent spam.
- Strip dangerous HTML from description fields on read (DOMPurify-equivalent server-side).
- File-type sniff CVs by magic bytes, not just MIME header.

---

## 8. Migration Checklist

```
[ ] ALTER TABLE career_job ADD COLUMN slug VARCHAR(160)
[ ] ALTER TABLE career_job ADD COLUMN image_url VARCHAR(500) NULL
[ ] CREATE UNIQUE INDEX career_job_slug_idx ON career_job(slug)
[ ] Backfill slug for existing rows
[ ] CREATE TABLE career_job_view (id, career_job_id, utm_*, ip_hash, user_agent, created_at)
[ ] Add public.career.controller.ts
[ ] Add throttle guard to POST /public/career/application
[ ] Update CORS config
[ ] Add Indeed XML feed endpoint (if Option B)
```

---

## 9. Priority Order

1. ✅ Public job list + detail endpoints (`§1.1` + `§1.2`)
2. ✅ Public application submit (`§1.4`)
3. ✅ Public questionnaire (`§1.3`)
4. ✅ Slug + image_url + description_excerpt (`§2` + `§3`)
5. ⏩ Indeed XML feed (`§5.1`)
6. ⏩ Notifications (`§6`)
7. ⏩ Share analytics (`§4`)
