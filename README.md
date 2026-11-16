# DAXRONE AI — Web starter

Dark Titanium / Quantum Identity React + Vite web app with Firebase Google authentication, Firestore chat history, and a server-side Gemini API endpoint.

## Requirements
- Node.js 20+
- Firebase project with Google Authentication enabled
- Firestore database created
- Gemini API key

## Setup
1. Extract the ZIP and open the folder in a terminal.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Fill in Firebase web app values and `GEMINI_API_KEY`.
5. In Firebase Console → Authentication → Sign-in method, enable Google.
6. Add your local host (`localhost`) to Firebase Authentication authorized domains.
7. Create Firestore and publish `firestore.rules`.
8. Run `npm run dev`.
9. Open `http://localhost:5173`.

The Vite dev server proxies `/api` to the backend only if configured; for local dev run the API on port 3001 and configure a Vite proxy if needed. The supplied Vite config can be extended as below:

```js
server: {
  port: 5173,
  proxy: { "/api": "http://localhost:3001" }
}
```

## Important security notes
- Keep `GEMINI_API_KEY` server-side. Do not rename it to `VITE_GEMINI_API_KEY`.
- Firebase client configuration is not a secret, but Firestore Security Rules are essential.
- The included Firestore rules restrict each user's chat documents to their own UID.
- For production, verify Firebase ID tokens on the backend, add per-user rate limiting, set a strict CORS origin, and deploy the API over HTTPS.
- Gemini quota exhaustion returns `QUOTA_EXHAUSTED`; the UI displays the requested DAXRONE tired message.
- The "come back tomorrow" wording is a product message, not a guarantee that Google's quota resets at midnight. Actual quota reset timing depends on the Gemini project and model limits.

## Current scope
This is a working starter implementation, not a deployed hosted service. Firebase and Gemini credentials must be configured by the project owner before login and AI chat can work. Streaming output, file uploads, voice, and production-grade server-side Firebase token verification are not included yet.


## Phone-friendly deployment (Render)
This project is configured to serve both the website and `/api` from one Node service.

1. Upload this project to a GitHub repository (extract the ZIP first; upload the files inside it).
2. In Render, create **New → Web Service** and connect that GitHub repository.
3. Use:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. Add these Environment Variables in Render:
   - `GEMINI_API_KEY` = your Gemini API key
   - `GEMINI_MODEL` = `gemini-2.5-flash`
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
5. Deploy. Open the Render `onrender.com` URL on your phone.
6. In Firebase Console → Authentication → Settings → Authorized domains, add your Render hostname (without `https://`).

Keep `GEMINI_API_KEY` only in Render's server environment. Never put it in a `VITE_` variable or in frontend code.
