# SPACE ARCHIVE

**A digital atlas of humanity's footprint in space.**

SPACE ARCHIVE is a data-driven catalogue and 3D atlas of the hardware humans have left
beyond Earth: satellites and debris in Earth orbit, artefacts on the Moon, landers and
rovers on Mars, the eight planets, and interstellar probes.

Every location is backed by a published source. When a source does not provide a
coordinate, the record says **UNKNOWN LOCATION** instead of inventing one.

- **Earth orbit** — 1,075 satellites, rocket bodies and debris propagated with SGP4
  from published CelesTrak element sets.
- **Moon** — 43 catalogued artefacts with NASA catalogue provenance.
- **Mars** — 15 landing sites and rovers with confidence levels.
- **Planets** — eight planets at their real ICRF directions from JPL Horizons.
- **Deep space** — Voyager 1/2, Pioneer 10/11 and New Horizons, 66–172 AU from the Sun.

---

## Table of contents

- [What makes it honest](#what-makes-it-honest)
- [Stack](#stack)
- [Quick start](#quick-start)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [API](#api)
- [Data pipeline](#data-pipeline)
- [Deploy to Vercel](#deploy-to-vercel)
- [Environment variables](#environment-variables)
- [Known limitations](#known-limitations)
- [Attribution](#attribution)
- [Licence](#licence)

---

## What makes it honest

| Claim | What the app actually does |
| --- | --- |
| “Live tracking” | **Never claimed.** Earth-orbit markers are SGP4 propagations of stored element sets. The snapshot date is shown on every relevant screen. |
| Missing coordinates | Surface records without a reliable published coordinate are labelled **UNKNOWN LOCATION** and are not plotted. Two lunar records fall into this category. |
| Precision | Every Earth-orbit inspector prints the element age and an accuracy band (fresh / acceptable / degraded). |
| Planetary positions | Real ICRF directions from JPL Horizons at one epoch. Only radial distance is compressed for display, and the formula is shown in the UI. |
| Mission status | Preserved as reported by the cited source. “Unknown” means the catalogue does not state the status — not that the object is dead. |
| Rover positions | A Mars marker is a landing site, not a live rover position. Traverse paths are omitted unless a verified dataset exists. |

The full method is documented in the app at `/about`, and dataset provenance is listed
at `/data-center`.

---

## Stack

- **Next.js 14** (App Router, React Server Components)
- **React Three Fiber** + **three.js** for the 3D scenes
- **satellite.js 6** (`json2satrec` + SGP4) for Earth-orbit propagation
- **Tailwind CSS** for the interface
- **Vitest** for unit tests
- No database, no request-time scraping, no required API keys

The whole atlas is a single Vercel deployment. Datasets are committed to the repository
and imported into the serverless bundle at build time.

---

## Quick start

Requirements: **Node.js 20 or 22**, npm 9+.

```bash
git clone https://github.com/<your-user>/space-archive.git
cd space-archive
npm install
cp .env.example .env.local   # optional
npm run dev
```

Open <http://localhost:3000>.

Production check:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm start
```

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (`next lint`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest unit tests (54 tests) |
| `npm run test:watch` | Vitest in watch mode |
| `python3 scripts/build_datasets.py` | Rebuild the orbital and ephemeris datasets from raw provider files |

> `scripts/build_datasets.py` expects raw provider downloads in `data/imports/`, which
> are not committed (see `.gitignore`). The bundled JSON in `data/` is the shipped
> snapshot; rebuilding is optional and requires network access to CelesTrak, NASA and
> JPL Horizons.

---

## Project structure

```text
app/                        Next.js App Router pages and API routes
  api/v1/                   Read-only JSON API
  earth-orbit/              Earth-orbit view
  moon/  mars/              Surface globes
  solar-system/             Heliocentric view
  deep-space/               Interstellar probes
  missions/                 Mission index + timeline
  data-center/              Provenance manifest and API reference
  about/                    Method, coordinate conventions, limits
components/
  three/                    R3F canvases (Earth, surface globe, heliocentric)
  earth-orbit/  surface/    View shells with filters and lists
  solar-system/  deep-space/
  inspector/                Object inspector with on-demand record fetch
  layout/  ui/  home/       Chrome, badges, static hero orrery
lib/
  data.ts                   Single JSON access layer and normalisers
  orbital.ts                SGP4 helpers and element-age accuracy
  scene.ts                  Heliocentric scale compression
  geo.ts                    Lat/lon → sphere, clustering
  filters.ts  format.ts     Pure helpers with unit tests
  types.ts  constants.ts    Domain types and label vocabularies
data/
  celestrak/                Curated Earth-orbit snapshot + checksum metadata
  ephemeris/                JPL Horizons planet and probe state vectors
  curated/                  Lunar and Mars surface records
public/textures/            Planet and moon texture maps (CC BY 4.0)
tests/                      Vitest suites
scripts/build_datasets.py   Reproducible dataset builder
reja.md                     Original technical plan (Uzbek)
```

---

## API

All endpoints are read-only, need no key, and serve the same bundled snapshot as the UI.
Responses allow five-minute edge caching with stale-while-revalidate.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/v1/objects?category=mars_surface&limit=10` | Normalised entries with pagination |
| `GET` | `/api/v1/objects/:id` | One full record (accepts `eo:`, `lunar:`, `mars:`, `ds:`, `planet:` ids) |
| `GET` | `/api/v1/search?q=perseverance` | Deterministic substring ranking |
| `GET` | `/api/v1/statistics` | Counts, regimes, element-epoch range, snapshot metadata |
| `GET` | `/api/v1/timeline?limit=50&order=desc` | Dated mission events |
| `GET` | `/api/v1/missions` | Missions grouped from the surface catalogue |
| `GET` | `/api/v1/sources` | Provenance manifest for every dataset |
| `GET` | `/api/v1/bodies` | Bodies covered by the atlas |
| `GET` | `/api/v1/health` | Readiness probe and dataset freshness |
| `POST` | `/api/v1/ai/ask` | Optional grounded assistant; `503` without `LLM_API_KEY` |

---

## Data pipeline

The bundled snapshot was built once and committed:

1. **Earth orbit** — CelesTrak GP OMM JSON (multiple groups) joined with SATCAT CSV,
   curated to 1,075 objects for legibility, then propagated with SGP4 at request time.
   `data/celestrak/snapshot-meta.json` records the SHA-256 checksum, retrieval time and
   element-epoch range.
2. **Moon** — NASA “Human Artifacts on the Moon” catalogue. Coordinates are
   planetocentric and east-positive. Two records have no usable coordinate and are
   stored as unknown.
3. **Mars** — curated mission records from NASA/ESA documentation, with a confidence
   level and at least one source URL per record.
4. **Planets and probes** — JPL Horizons ICRF state vectors sampled at
   `2026-11-14T00:00:00Z`, heliocentric (`Sun (500@10)`).

No data is fetched or mutated at request time.

---

## Deploy to Vercel

### 1. Push to GitHub

The repository is not initialised yet. From the project root:

```bash
git init
git add .
git commit -m "SPACE ARCHIVE: interactive 3D atlas of human hardware in space"
git branch -M main
git remote add origin https://github.com/<your-user>/space-archive.git
git push -u origin main
```

Create the empty repository on GitHub first (no README, no `.gitignore`), then run the
commands above.

### 2. Import into Vercel

1. Go to <https://vercel.com/new> and import the GitHub repository.
2. Framework preset: **Next.js** (detected automatically).
3. Build command: `npm run build`. Output: `.next` (defaults).
4. Add environment variables only if you want the optional assistant (see below).
5. Deploy.

`vercel.json` sets the region to `fra1` and adds cache and security headers. Texture
files are cached immutably for one year.

### 3. Optional: CLI deploy

```bash
npm i -g vercel
vercel          # preview
vercel --prod   # production
```

Every push to `main` redeploys production once the GitHub integration is connected.
Pull requests get preview deployments automatically.

### CI

`.github/workflows/ci.yml` runs lint, typecheck, tests and a production build on every
push to `main` and on every pull request. No secrets are required.

---

## Environment variables

Copy `.env.example` to `.env.local` for development. In Vercel, add the same keys under
**Project → Settings → Environment Variables**.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | No | Canonical site URL for metadata and the sitemap |
| `LLM_API_KEY` | No | Enables `/api/v1/ai/ask`; without it the endpoint returns `503` |
| `LLM_BASE_URL` | No | OpenAI-compatible base URL (default `https://api.openai.com/v1`) |
| `LLM_MODEL` | No | Model name (default `gpt-4o-mini`) |
| `LLM_TIMEOUT_MS` | No | Assistant request timeout |
| `SPACE_TRACK_USER` / `SPACE_TRACK_PASSWORD` | No | Reserved for a future full dataset builder |
| `DISCOS_TOKEN` | No | Reserved for a future full dataset builder |
| `CELESTRAK_REFRESH_ENABLED` | No | Reserved for a future server-side refresh |

**The app is fully functional with no environment variables set.** The core atlas never
calls an external service at request time.

---

## Known limitations

- **Curated subset.** Earth orbit contains 1,075 objects, not the full 70,000+ catalogue.
  It is weighted towards stations, navigation constellations, recent launches and named
  debris families so the 3D view stays readable.
- **One-epoch ephemerides.** Planet and probe positions are state vectors at a single
  epoch. The scenes do not integrate motion forward.
- **No live telemetry.** Nothing in the app is a live feed. Element age is displayed
  wherever propagation is used.
- **No rover traverse paths.** Markers are landing sites.
- **Mission status may be stale.** Statuses are preserved as reported by the source.
- **Compressed scale.** Heliocentric radius uses
  `r = 2 + 3·√AU + 2·log₁₀(1 + AU)` scene units. Scene distance is not a measurement;
  real AU, km and light time are shown in the inspector.

---

## Attribution

| Dataset | Provider | Licence / terms |
| --- | --- | --- |
| GP element sets and SATCAT | CelesTrak | Free for non-commercial use; see CelesTrak usage policy |
| Human Artifacts on the Moon | NASA History Division | Public domain (NASA) |
| Mars mission landing sites | NASA / ESA mission documentation | Public domain / mission terms |
| Planetary and probe state vectors | JPL Horizons | Public domain (NASA/JPL) |
| Planet and moon textures | Solar System Scope | CC BY 4.0 |

Planet textures are equirectangular maps from
<https://www.solarsystemscope.com/textures/> (CC BY 4.0).

This project is not affiliated with NASA, ESA, JPL or CelesTrak.

---

## Licence

Application code is provided for demonstration and educational use. Bundled datasets
remain subject to their providers' terms; see [Attribution](#attribution).
