# Dynamic competition system

## User experience
- Keep the current Competition Details layout, but replace all displayed competition, judge, dates, rewards, winners, capacity, and descriptive content with live backend data.
- Derive registration-open, upcoming, submission-open, judging, completed, cancelled, and full states from authoritative server time.
- Update the countdown every second and automatically refresh the screen when a lifecycle boundary is crossed.
- Make registration and submission actions reflect the signed-in user’s real state, with clear disabled, loading, success, full, duplicate, expired, and error states.
- Add a compact sign-in prompt only when a user attempts an account-specific action.
- Refresh capacity and registration state when another user registers or withdraws.

## Backend and data
- Add competitions, judges, rewards, winners, registrations, and submissions tables with seeded data matching the current screen.
- Protect private participation/submission rows so users can access only their own records; published competition catalog data remains publicly readable.
- Add transactional database functions for registration and withdrawal. They will lock the competition row, re-check dates/capacity, prevent duplicate participation, and atomically maintain the booked count.
- Add submission validation for registration/payment status, submission window, one active submission per participant, and immutable ownership.
- Use database constraints and triggers for nonnegative fees/prizes, valid date ordering, capacity bounds, valid winner positions, and updated timestamps.

## App integration
- Add typed server functions for public competition details and signed-in participation actions.
- Use React Query for initial loading, refreshes, mutations, and consistent cached state.
- Add email/password and Google sign-in through Lovable Cloud for participant identity.
- Preserve the current visual hierarchy while rendering loading, unavailable, full, closed, registered, and submission states.

## Validation
- Regenerate database types, run database security checks, and verify the populated screen.
- Test registration concurrency rules, duplicate attempts, lifecycle gating, capacity calculations, countdown behavior, and mobile rendering.

## Scope
- This implementation uses Lovable Cloud’s built-in database and authentication rather than MongoDB. The data/service boundary remains replaceable if MongoDB is required later.
- Media uploading itself is not included; the submission action and database record lifecycle will be ready for a later storage/upload step.
