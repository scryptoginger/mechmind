# First-run guide

What to do the first time you open the app.

## 1. Start the dev server

```bash
cd ~/mechmind
npx expo start --web
```

Open the printed URL (typically http://localhost:8081). The first load
applies the migrations and seeds the canonical 2017 Tacoma catalog.

## 2. Add your vehicle

The Add Vehicle screen pre-fills with:
- 2017 Toyota Tacoma TRD Off-Road
- Double Cab, Long Bed
- 4.0L V6 1GR-FE
- 4WD

**Pick your transmission** (6-speed automatic AC60F vs. 6-speed manual
RA63F). The catalog filters transmission-specific jobs based on this.

**Enter the current odometer.** This drives every "miles until due"
calculation.

**Service profile:**
- `normal` — easy commuting only
- `severe` — towing, dusty, short trips, off-road
- `mixed` — mix of both. Recommended for a TRD OR that sees trail use.

## 3. Backfill what you remember

Open the dashboard. The "Up to date / no record" section will list every
job in the catalog. For each one Keith *has* done at a known date or
mileage, tap it → **Mark Complete** → enter the past completion date and
odometer. The app uses the most recent log to compute "miles since last."

Anything Keith doesn't remember can be left blank — the dashboard will
show it as "no record" until the first time it's logged.

## 4. Wire up Discord notifications

If `EXPO_PUBLIC_DISCORD_WEBHOOK_URL` was set in `.env` before the build,
notifications already work. Test with:

```bash
curl -H "Content-Type: application/json" \
  -d '{"content":"🔧 MechMind: hello from your truck","username":"MechMind"}' \
  "$EXPO_PUBLIC_DISCORD_WEBHOOK_URL"
```

Inside the app, when you tap the pending-alerts banner on the dashboard,
all queued notifications fire to Discord and are recorded in
`notification_log` so they don't fire again within 24h.

## 5. Add it to your phone home screen

Build for web and either deploy to Vercel (see `docs/DEPLOY.md`) or run
`npx serve dist` and open it on your phone. Then "Add to Home Screen"
in your browser to get the standalone PWA.

The most important screen for daily use is the **Quick Mileage** entry —
3 taps from the home screen and you're at a giant number-pad designed
to be used one-handed at the gas pump.

## 6. Plan the first scrape

The app is useful from first launch with seeded data, but `media_links`
are empty until the scraper runs. To populate them:

```bash
sudo apt install python3-venv     # one-time, if missing
cd ~/mechmind/scraper
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m scraper.cli scrape-all
deactivate
```

If you have a YouTube Data API key, set `YOUTUBE_API_KEY=...` in `.env`
beforehand for richer video search. Otherwise the scraper falls back to
Reddit-only (which is still useful).
