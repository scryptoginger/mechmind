# Deploying MechMind as a PWA

## Local web build

```bash
npx expo export --platform web --output-dir dist
# Then serve dist/ with any static server, e.g.
npx serve dist
```

Open the served URL on your phone, "Add to Home Screen" (Safari) or
"Install app" (Chrome) to get the PWA icon. No app store needed.

## Vercel (recommended — what Keith's repo is wired for)

`vercel.json` declares the build command and SPA rewrites. To deploy:

```bash
npm install -g vercel
vercel login           # one-time
vercel --prod
```

Vercel will:
1. Run `npm install --legacy-peer-deps` (required because nativewind v4
   pulls react-native-worklets transitively without a clean peer match).
2. Run `npx expo export --platform web --output-dir dist`.
3. Serve `dist/` with `/index.html` rewrites for client-side routing.

### Environment variables in Vercel

Add the following to the Vercel project settings → Environment Variables:

| Key | Value |
|---|---|
| `EXPO_PUBLIC_DISCORD_WEBHOOK_URL` | The Discord webhook URL. Anything prefixed `EXPO_PUBLIC_` ships to the client. Be aware: **the webhook URL is reachable in the browser bundle**. For this single-user app that is acceptable; for any multi-user deployment, keep the webhook server-side. |

### Skipping deploy in this session

The session was run without a `VERCEL_TOKEN` in `.env`, so the live
deploy step is left for Keith to run manually. The web build in
`dist/` already verifies the export step works end-to-end.

## PWA notes

- iOS Safari requires the user to manually tap "Add to Home Screen".
- Android Chrome shows an install prompt automatically once the
  manifest + service worker are detected. Expo Router's web template
  does not currently ship a service worker; for offline odometer
  entry, the existing IndexedDB-backed expo-sqlite shim is sufficient
  on first load. A service worker can be added later if Keith wants
  fully offline page reloads.

## Updating the catalog without redeploying

The Discord webhook + the catalog seed both run client-side. To refresh
the seeded catalog you re-run the scraper (which writes the local
`mechmind.db`) and then reload the PWA — or if the seed values change,
bump the migration list and ship a new build.
