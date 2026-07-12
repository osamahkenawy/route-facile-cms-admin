HR Recruitment Portal - Phase 1 Pending Items
Date: 2026-04-23
Last updated: 2026-04-24

1) ✅ Section H3 - Status History standalone page - DONE
2) ✅ Section H4 - Ratings standalone page - DONE

3) ✅ Section A3 - Stronger role hardening for hr_recruitment - DONE
- AppContent.js filters routes by roles array.
- Routes without roles are excluded for non-admin users.
- hr_recruitment receives only explicitly allowed HR routes.
- Catch-all route redirects unauthorized URLs to /hr/dashboard/staff.

4) ✅ Section J - Applications state polish - DONE
- Refactored HRApplicationsList.js so filters are derived from useSearchParams.
- Browser reload/back/forward now restores filter state from URL.
- Added source_channel filtering to filtered useMemo.
- Removed redundant URL-sync and reset-page effects.

5) ✅ Section J - EN/AR consistency sweep - DONE
- HRQuestionnaires.js uses RTL rendering for Arabic field question_ae.
- HRKeywords, HRChannelPostings, HRStatusHistory, HRRatings do not contain bilingual content fields.

6) ⬜ Section K - QA execution (frontend) - PENDING (live backend required)
Status: blocked by environment/access, implementation is ready.

Required inputs before execution:
- Valid test accounts: hr_manager and hr_recruitment.
- At least one account with must_reset_password=true.
- Seed data for jobs, applications, interviews, ratings, and status history.
- Working attachments/CV URLs in application records.

Execution checklist:
- Role redirects:
  hr_manager -> /hr/dashboard/manager
  hr_recruitment -> /hr/dashboard/staff
- Forced password reset gating:
  must_reset_password=true blocks non-password routes and redirects to /admin/change-password.
- Unauthorized visibility:
  non-HR roles cannot access HR routes by URL.
- Filters behavior:
  search, status, job, source, date, page, page_size persist on reload/back/forward/direct URL.
- CRUD stale-state checks:
  create/edit/delete updates list state without stale rows.
- Attachment downloads:
  CV and file links open/download successfully.
- Status badge enum mapping:
  all displayed labels/colors match enum values.
- Channel status transitions:
  queued -> posted, posted -> failed, failed -> retrying update correctly.
- Empty dataset rendering:
  dashboards and list pages show proper empty states.

Evidence to capture during QA:
- Screenshots for each checklist area.
- API response snippets for failed cases.
- Final pass/fail report with repro steps for defects.

7) ✅ Optional path consistency cleanup - DONE
- Internal HR navigation uses contract-first paths:
  /hr/jobs/create
  /hr/jobs/:id/edit
  /hr/applications/:id
  /admin/change-password
- Legacy aliases are kept in routes.js for backward compatibility only.
