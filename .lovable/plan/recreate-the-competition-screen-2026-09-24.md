# Recreate the competition screen

## What I’ll build
- Replace the blank home page with the supplied mobile competition-details screen.
- Match the screenshot’s section order, spacing, teal/navy palette, typography, borders, cards, tabs, rewards, referral strip, action button, and bottom navigation.
- Use lightweight local placeholder portraits styled to match the composition without embedding the reference screenshot itself.
- Make the narrow mobile layout fluid, while centering it within a clean page shell on wider screens.
- Add working UI states for language selection, information tabs, copying the referral link, and the submission action.

## Technical details
- Implement the screen with React and CSS in the existing TanStack React project.
- Keep displayed content in structured JavaScript objects so a future MongoDB-backed API can replace it cleanly.
- Use the existing icon library and semantic design tokens in the shared stylesheet.
- Add page-specific title, description, Open Graph, and Twitter metadata.
- Verify the result at the requested mobile viewport and at desktop width.

## Scope note
- This project produces a responsive React web interface, not a React Native mobile binary.
- No backend or MongoDB connection will be added in this pass.
