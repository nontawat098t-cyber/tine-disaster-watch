# TINE DISASTER WATCH V4 — Disaster Map Prototype

## Features in this frontend prototype
- Thailand place search using Open-Meteo Geocoding (filters results to Thailand)
- Interactive Leaflet / OpenStreetMap map
- Weather and hourly forecast from Open-Meteo
- Citizen incident report form with type, severity, place, optional coordinates, details and optional reporter name
- Select report coordinates by clicking the map
- Incident pins, recent report list, report details and share/copy text
- Timeline view, layer toggles, mobile responsive layout
- Privacy notice and explicit unverified status for public reports

## IMPORTANT LIMITATION
This is currently a static GitHub Pages frontend. Reports are stored only in the submitting browser's localStorage. They do NOT appear to other users and may be lost if browser storage is cleared. Do not treat these reports as verified official warnings.

## To make reports shared across all users
Connect a shared backend such as Supabase:
1. Create a Supabase project.
2. Create an `reports` table with columns: `id`, `type`, `severity`, `location`, `lat`, `lon`, `details`, `reporter_name`, `created_at`, `verification_status`.
3. Configure Row Level Security policies carefully. Public reads should exclude private personal information. Inserts should be rate-limited/validated through an Edge Function or secure API.
4. Add only the public project URL and anon key to the frontend (never expose service_role keys).
5. Replace localStorage load/save with database read/insert, subscribe to realtime updates, and add a moderation/admin flow.
6. Add image uploads only after file size/type limits, abuse controls, and privacy rules are in place.

## Next production steps
- Shared database and realtime updates
- Admin moderation dashboard
- Confirmed official flood/weather/water-level feeds
- Verified shelter / hospital / rescue point dataset
- Rate limiting, spam/report abuse protection
- Push notifications after consent and secure service-worker setup
- Privacy policy and retention/deletion process

Map: OpenStreetMap / Leaflet. Weather and geocoding: Open-Meteo. External services are subject to their terms and availability.
