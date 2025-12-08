<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1tufRvJIyiq5lXyJPb8OIIsD_RkYUEJkI

## Run Locally (Web)

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Backend (Firebase Functions)

This project now hosts the backend logic entirely inside Firebase Cloud Functions while Firestore stores partners/deals and Cloud Storage keeps the generated media. The functions wrap Firestore CRUD, password hashing, and Gemini image generation so the UI can continue to call `/api/*`-style entry points.

1. Install the Firebase CLI if you haven't already:
   `npm install -g firebase-tools`
2. From `backend/functions`, install the dependencies:
   `cd backend/functions && npm install`
3. Copy `backend/.env.example` to `backend/.env` and add:
   ```
   GEMINI_API_KEY=<your Gemini API key>
   FIREBASE_STORAGE_BUCKET=<optional bucket override>
   ```
4. Start the emulator while developing:
   `firebase emulators:start --only functions`
   Calls will run under `http://localhost:5001/<project-id>/us-central1/<functionName>`.
5. Deploy to Firebase for production:
   `firebase deploy --only functions`
   Make sure you've run `firebase use --add` and the CLI or `GOOGLE_APPLICATION_CREDENTIALS` can reach the project.

### Point the frontend at the functions

- Set `VITE_API_BASE_URL` to the emulator or deployed functions host (e.g. `https://us-central1-<project-id>.cloudfunctions.net`).
- Optionally set `VITE_FIREBASE_PROJECT_ID` so the default emulator URL stays accurate.
- The shared `apiService` builds the HTTPS URLs for:
  - `generateImage`
  - `registerPartner`
  - `loginPartner`
  - `listDeals`
  - `createDeal`
  - `updateDeal`
  - `uploadImage`

This mirrors the former `/api/*` surface so the Vite app and Expo clients can keep calling the same endpoints.

### Firestore schema

- `partners`: stores `business_reg_number`, hashed password, store/owner metadata, plan/status flags.
- `deals`: stores merchant metadata, pricing/benefit fields, coupon totals, `expires_at` timestamps, `is_ghost` flags, and `usage_condition` text.
- `deal-images/*`: Cloud Storage bucket (public) where `uploadImage` writes generated/compressed images for `createDeal`.

### Frontend configuration

- Add `VITE_API_BASE_URL`/`VITE_FIREBASE_PROJECT_ID` to `.env.local` so `apiService` can build function URLs.
- Keep `GEMINI_API_KEY` in `.env.local` (shared with the backend via `backend/.env` during local development).

## Mobile Apps (Expo)

Shared logic (deals, types, AI helpers) was moved into `packages/shared`, so the Expo apps reuse the same data/resolver code as the Vite web version.

- **Supporter app** (`apps/supporter`) recreates the Discovery, Coupons, and Profile flows with immersive cards, golden ticket preview, and login prompts.
  1. `cd apps/supporter && npm install`
  2. `npm run android` / `npm run ios` / `npm run web`

- **Partner app** (`apps/partner`) provides the 4-step ad wizard, dashboard, and store info panels with AI-driven preview tooling.
  1. `cd apps/partner && npm install`
  2. `npm run android` / `npm run ios` / `npm run web`

