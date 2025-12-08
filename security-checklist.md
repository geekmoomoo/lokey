# LO.KEY Security Checklist

## Backend safety

1. **Secrets**
   - Store `GEMINI_API_KEY` in Firebase environment config or `.env` for local runs.
   - Do **not** expose Firestore service account keys inside the client; rely on Cloud Functions.

2. **Firestore rules**
   - Permit only Cloud Functions/authorized clients to write partners/deals.
   - Restrict public reads to approved collections (`deals` can be public with filtered status).

3. **Image uploads**
   - Use signed URLs or `makePublic()` only for `deal-images/*`.
   - Scan/validate base64 uploads to avoid malicious payloads before writing to Storage.

## Operational hygiene

1. **Local development**
   - Use `firebase emulators:start --only functions,firestore,storage`.
   - Point `VITE_API_BASE_URL` to `http://localhost:5001/<project-id>/us-central1`.

2. **Deployment**
   - Run `firebase deploy --only functions` from the backend folder.
   - Confirm `GOOGLE_APPLICATION_CREDENTIALS` (or logged-in CLI user) can access the project.

3. **Monitoring**
   - Inspect Cloud Functions logs for errors and rate spikes.
   - Enable Firestore usage alerts (e.g., billing thresholds).

## Frontend considerations

1. **Environment variables**
   - Set `VITE_API_BASE_URL` and `VITE_FIREBASE_PROJECT_ID` in `.env.local`.
   - Refresh the dev server after any `.env` change.

2. **API usage**
   - Always check `success` flag before trusting data from `/generateImage`, `/listDeals`, etc.
   - Handle HTTP errors/timeout gracefully and surface helpful messages to the user.
