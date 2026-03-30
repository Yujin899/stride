<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure
may all differ from your training data.
Read the relevant guide in `node_modules/next/dist/docs/` before writing any code.
Heed deprecation notices.

## Stride-Specific Rules
- NO src/ directory — app/ is in the root
- App Router only — no pages/ directory
- Firebase Auth — no NextAuth, no useSession
- Firebase Firestore — no MongoDB, no Mongoose
- Light warm mode only — "The Woodland Desk" theme (see DESIGN.md), never dark mode
<!-- END:nextjs-agent-rules -->