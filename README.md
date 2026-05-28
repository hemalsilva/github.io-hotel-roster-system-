# AI Smart Hotel Roster System

A web-based hotel roster management system with AI-powered smart scheduling.

## Features

- 📅 **Auto Roster Generation** — Smart monthly roster based on occupancy, leaves & rules
- ✏️ **Manual Cell Editing** — Click any cell to edit with reason tracking
- 🌙 **Night Shift Rotation** — Monthly A/B/C group rotation
- 📊 **Occupancy-Based OFF Distribution** — HIGH days = fewer offs, LOW days = more offs
- 📅 **Configurable Monthly Day Off Count** — Set different off counts per month
- ⚠️ **Smart Alerts** — Staff shortage, consecutive days, supervisor coverage
- 📋 **Edit Audit Log** — Full history of all manual changes
- 📤 **Excel Export** — Download roster as .xlsx

## Live Demo

🌐 https://hemalsilva.github.io/github.io-hotel-roster-system-/

## Getting Started

```bash
npm install
npm run dev
```

## Deployment to GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages → Source → GitHub Actions**
3. Every push to `main` auto-deploys via `.github/workflows/deploy.yml`

## How to Use

1. **Configure Settings** — Set month, year, day off count, night group
2. **Add Employees** — Add staff with night shift group assignments
3. **Enter Leaves & Off Requests** — Approve requests
4. **Set Busy Days** — Mark HIGH/MEDIUM/LOW occupancy days
5. **Generate Roster** — Click the Generate button
6. **Manual Edit** — Click any cell in the roster to change it
7. **Export** — Download to Excel for printing
