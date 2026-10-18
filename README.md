# RailTrack

RailTrack is a live Indian rail intelligence dashboard. It combines map-based train tracking, delay context, route geometry, and railfan controls into a single view that is optimized for quick scanning.

The UI is now light-first with a dark mode toggle in the top-right controls.

## What It Shows

- Live train positions on the India rail network
- Delay-aware and class-aware marker modes
- Passenger and railfan density presets
- Train context cards, speed history, and nearby-train radar
- A search bar for trains, stations, and lines

## Run Locally

Prerequisites:

- Node.js 18+
- npm 9+

Install dependencies:

```bash
npm install
```

Run the client:

```bash
npm run dev:client
```

Run the server:

```bash
npm run dev:server
```

## Current UI Notes

- The app defaults to the white theme shown in the reference image.
- Use the theme button in the top-right card to switch to dark mode.
- The header has been reorganized into a brand rail, search bar, quick mode controls, and utility actions.

## Suggested Cleanup

- Remove or merge legacy shell files under `client/src/components/layout/` if they are no longer used.
- Rename the remaining TrackPulse-specific auth/localStorage keys in a follow-up pass if you want a full product rename.
- Consider extracting the header rail cards into reusable components once the layout settles.

## License

MIT License.
