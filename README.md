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

## Mobile Apps (Expo)

Shared logic (deals, types, AI helpers) was moved into `packages/shared`, so the Expo apps reuse the same data/resolver code as the Vite web version.

- **Supporter app** (`apps/supporter`) recreates the Discovery, Coupons, and Profile flows with immersive cards, golden ticket preview, and login prompts.
  1. `cd apps/supporter && npm install`
  2. `npm run android` / `npm run ios` / `npm run web`

- **Partner app** (`apps/partner`) provides the 4-step ad wizard, dashboard, and store info panels with AI-driven preview tooling.
  1. `cd apps/partner && npm install`
  2. `npm run android` / `npm run ios` / `npm run web`

## Supabase configuration

The apps now talk to the Supabase tables you created. Provide your Supabase URL and anonymous key through environment variables so the shared services can bootstrap the client:

1. Create a `.env.local` file at the repo root with:
   ```
   SUPABASE_URL=<your project URL>
   SUPABASE_ANON_KEY=<your anon/public key>
   ```
2. For the Expo apps, add the same values with the `EXPO_PUBLIC_` prefix inside their folders (or flow them through `app.config.js`).
   ```
   EXPO_PUBLIC_SUPABASE_URL=<your project URL>
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<your anon/public key>
   ```
3. Restart the Vite/Expo server after updating env values so they are picked up.
