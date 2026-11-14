# SPACE ARCHIVE — To'liq Texnik Reja (Master Plan)

> **A Digital Atlas of Humanity's Footprint in Space**
> Insoniyatning kosmosdagi texnologik izlarini birlashtiruvchi interaktiv 3D ilmiy platforma.

| Parametr | Qiymat |
|---|---|
| Loyiha nomi | SPACE ARCHIVE |
| Hujjat versiyasi | v1.0 (reja) |
| Sana | 2026-11-14 |
| Holat | Rejalashtirish / arxitektura |
| Maqsadli muhit | Google Antigravity + Docker (lokal) → cloud (production) |
| Hujjat tili | O'zbekcha (texnik atamalar inglizcha) |

---

## 0. Nima uchun bu hujjat bor

Bu hujjat — SPACE ARCHIVE ni **faqat vizual prototip emas, balki haqiqiy, ma'lumotga asoslangan ilmiy platforma** sifatida qurish uchun bajariladigan ishlarning yagona manbai (single source of truth). Unda:

- qabul qilingan arxitektura qarorlari va ularning sabablari;
- ma'lumotlar bazasi sxemasi;
- har bir tashqi provayder bilan ishlash qoidalari;
- ilmiy hisoblash (orbital mexanika, koordinata transformatsiyalari) talablari;
- API kontrakti;
- frontend/3D arxitektura;
- bosqichlar (phase/sprint), testlar, risklar va qabul mezonlari

ketma-ket va tekshiriladigan ko'rinishda yozilgan. Har bir bosqich oxirida **"Done" mezoni** bor: bajarilmagan band keyingi bosqichga "qarz" sifatida o'tmaydi, balki ochiq holda ro'yxatga olinadi.

---

## 1. Loyiha auditi (Step 0 natijasi)

### 1.1. Hozirgi holat

```
Working directory: /home/azizbek/Desktop/Projects/1_Hackathon/space_bash
Git repo:          yo'q
Fayllar:           yo'q (bo'sh papka)
```

**Xulosa:** loyiha **greenfield** — saqlanishi kerak bo'lgan mavjud kod, konfiguratsiya yoki asset yo'q. Shuning uchun:

- hech qanday "mavjud funksiyani buzmaslik" cheklovi yo'q;
- arxitekturani noldan, uzoq muddatli kengayishga mo'ljallab tanlaymiz;
- birinchi commit — monorepo skeleti va hujjatlar.

### 1.2. Audit davomida qabul qilingan asosiy cheklovlar

| Cheklov | Oqibat |
|---|---|
| Space-Track va ESA DISCOS uchun ro'yxatdan o'tish/kredensial kerak | Adapter to'liq yoziladi, lekin **`is_enabled=false`** va "credentials required" holatida ishlaydi. Integratsiya "live" deb e'lon qilinmaydi. |
| CelesTrak bepul, lekin usage policy va rate limit bor | Server-side adapter, kuchli keshlash, `User-Agent`, kondan-kunga emas, ehtiyoj bo'lganda yangilash. |
| To'liq orbital katalog o'n minglab obyekt (debris) | Hammasini brauzerga yuklash **taqiqlanadi**. Server-side filtrlash + instanced rendering + LOD. |
| NASA lunar artifacts sahifasi mashina o'qiy oladigan API emas | Bir martalik, qo'lda tekshirilgan `data/curated/*.json` import + provenance. |
| Mars lander/rover koordinatalari turli manbalarda turli formatda | Har bir yozuv uchun `coordinate_system`, `longitude_convention`, `source_url` majburiy. |
| Ba'zi provayderlar (masalan, DISCOS) xizmat holati vaqti-vaqti bilan o'zgaradi | Har bir adapter **feature flag** ortida; ishlamasa, platforma ishlashda davom etadi va buni ochiq ko'rsatadi. |
| AI provayderi hali tanlanmagan | Abstrakt `LLMClient` interfeysi; OpenAI-compatible default, lokal modelga almashtirish mumkin. |

### 1.3. Muhim tamoyil (butun loyiha bo'ylab)

> **Ma'lumot yo'q bo'lsa — "Not available" yoziladi. Koordinata yo'q bo'lsa — "Unknown location". Hech qachon to'qib yozilmaydi.**

Bu tamoyil kodda ham majburlanadi: `NULL` ruxsat etilgan maydonlar, `location_status`/`confidence_level` enumlari, API da `null` + `data_quality` bloki, UI da esa aniq vizual belgi.

---

## 2. Vizyon, maqsad va muvaffaqiyat mezonlari

### 2.1. Vizyon

Foydalanuvchi brauzerda Quyosh tizimini ochadi, Yer atrofidagi haqiqiy katalog obyektlarini, Oy yuzasidagi Apollo artefaktlarini, Marsdagi lander/roverlarni va chuqur kosmosdagi zondlarni topadi. Har bir obyekt — **manbasi, holati, ishonchliligi va ilmiy ma'lumoti bilan** ko'rsatiladi.

### 2.2. Foydalanuvchi personalari

| Persona | Ehtiyoj | Platforma javobi |
|---|---|---|
| Qiziquvchi (umumiy) | "Kosmosda nima qoldirganmiz?" | Homepage → 3D Solar System → obyekt kartochkalari |
| Talaba/o'qituvchi | Tarix va missiyalarni tushunish | Timeline, mission sahifalari, AI guide, manbalar |
| Muhandis/rezearcher | Orbital elementlar, aniq pozitsiya, provenance | Scientific mode, orbital panel, data source bloklari, API |
| Hakam/demo tomoshabin | 30 soniyada "wow" + ishonch | Kinematik intro, real ma'lumot, ochiq "DEMO/CACHED" yorliqlari |

### 2.3. Muvaffaqiyat mezonlari (KPI)

| Ko'rsatkich | Maqsad |
|---|---|
| Birinchi 3D sahifa yuklanishi (LCP, desktop) | ≤ 3.5 s (dynamic import bilan) |
| 3D sahna FPS (desktop, 5k marker) | ≥ 50 FPS; mobil ≥ 30 FPS |
| Obyektlar ro'yxati API javobi (p95) | ≤ 300 ms (katalogdan, kesh bilan) |
| Orbital pozitsiya hisoblash (p95) | ≤ 150 ms / so'rov, keshda ≤ 20 ms |
| Har bir ko'rsatilgan ilmiy yozuvda manba | 100% |
| "To'qib yozilgan" koordinata/spec | 0 ta |
| Test qamrovi (backend core + calculations) | ≥ 80% line, critical paths 100% |
| E2E asosiy user journey | 100% o'tadi |

---

## 3. Scope: MVP, v1, v2

Scope ni ochiq belgilash — loyihaning eng muhim qarori. "Hammasi bir vaqtda" qilinmaydi.

### 3.1. MVP (birinchi ishlaydigan versiya, ~5–6 hafta)

1. Monorepo, Docker Compose, `.env.example`, migratsiyalar.
2. 3D Solar System: Quyosh + 8 sayyora, kamera navigatsiyasi, dizayn tizimi.
3. Yer orbitasi sahnasi: **CelesTrak OMM** dan olingan real obyektlar (boshlang'ich guruhlar), SGP4 pozitsiya, orbit chizig'i, filtrlar.
4. Oy sahnasi: kamida **Apollo 11/12/14/15/16/17 + Surveyor + Luna** artefaktlari (verified koordinatalar bilan), "Unknown location" holati.
5. Mars sahnasi: Viking 1/2, Pathfinder/Sojourner, Spirit, Opportunity, Curiosity, Perseverance, InSight, Phoenix.
6. Object Inspector paneli (identifikatsiya, lokatsiya, texnik ma'lumot, tarix, status, manbalar).
7. Global qidiruv va filtrlar (server-side).
8. Data Center: real DB dan hisoblangan statistika.
9. Timeline (asosiy 10–15 voqea, hujjatlashtirilgan).
10. Deep Space: Voyager 1/2, Pioneer 10/11, New Horizons — Horizons yoki rasmiy manbadan olingan holat/pozitsiya, "hisoblangan" yorlig'i bilan.

### 3.2. v1 (MVP ustiga, ~4–5 hafta)

- To'liqroq katalog (Space-Track kredensiali bo'lsa), debris qatlami va zichlik statistikasi.
- Obyekt tarixi (events), mission sahifalari, mission ↔ object bog'lanishlari.
- Vaqt slayderi: tarixiy sanalar uchun **mavjud bo'lgandagina** orbital pozitsiya; aks holda "historical elements unavailable".
- AI assistant (RAG + citations + TTS).
- Admin: sync trigger, provider status, data quality dashboard.
- Performance: clustering, instancing, LOD, texture compression, keshlash.
- Testlar to'liq to'plami, CI, monitoring.

### 3.3. v2 (kelajak)

- SPICE kernel integratsiyasi (yuqori aniqlikdagi traektoriyalar).
- Boshqa jismlar: Venera, Merkuriy, Yupiter/Oy, Saturn/Titan, asteroidlar, kometalar.
- Foydalanuvchi kolleksiyalari, ulashish, permalink.
- Ko'p tilli UI (uz/ru/en), ovozli navigatsiya.
- Public API + API keys, rate limiting tierlari.

### 3.4. Ataylab scope dan tashqarida (hozircha)

- Real-time tracking ("live") da'vosi — faqat hisoblangan pozitsiya va yosh ko'rsatkichi.
- Barcha 30k+ debris obyektni bir vaqtda brauzerda render qilish.
- To'qib yozilgan 3D modellar (har bir roverning aniq CAD modeli) — placeholder geometriya + rasmiy foto bilan cheklanamiz.
- Foydalanuvchi autentifikatsiyasi (ommaviy qism) — faqat admin auth.

---

## 4. Texnologik stack va versiyalar

### 4.1. Frontend

| Qatlam | Texnologiya | Izoh |
|---|---|---|
| Framework | **Next.js (App Router)** | RSC + client 3D orolchalari |
| UI | React, TypeScript (`strict: true`) | |
| 3D | **Three.js + @react-three/fiber + @react-three/drei** | R3F canvas izolyatsiyasi |
| Post FX | `@react-three/postprocessing` | Bloom juda ehtiyotkorlik bilan |
| Styling | Tailwind CSS + shadcn/ui | tokenlar CSS variables orqali |
| Animatsiya | Framer Motion | UI animatsiyalari (3D emas) |
| Icons | Lucide | |
| State | Zustand (scene/UI) + TanStack Query (server state) | 3D state React renderidan ajratiladi |
| Forms/validation | React Hook Form + Zod | |
| Testing | Vitest + Testing Library, Playwright | |

### 4.2. Backend

| Qatlam | Texnologiya | Izoh |
|---|---|---|
| Language | Python 3.12+ | |
| API | **FastAPI** | async, OpenAPI |
| Validation | Pydantic v2 | strict mode, `model_config` |
| ORM | SQLAlchemy 2.0 (async) + asyncpg | typed ORM |
| Migrations | Alembic | PostGIS extension bilan |
| Orbital math | `sgp4` (Vallado), `numpy` | OMM → SGP4 |
| Astro transform | `astropy` (TEME→ITRS), `skyfield` (ixtiyoriy) | aniq va hujjatlashtirilgan |
| Ephemeris | JPL Horizons API (server-side) | |
| SPICE | `spiceypy` (v2, feature flag) | |
| AI | Provider-agnostic LLM client + embeddings | RAG |
| Auth (admin) | JWT (short-lived) + argon2 parol hash | faqat admin endpointlar |
| Logging | `structlog` (JSON) | request-id, provider, sync-id |
| Tests | `pytest`, `pytest-asyncio`, `httpx`, `testcontainers` | |

### 4.3. Infratuzilma

| Komponent | Tanlov |
|---|---|
| DB | **PostgreSQL 16 + PostGIS 3.4** (+ `pgvector` AI uchun) |
| Cache / broker | **Redis 7** (Celery broker + API cache) |
| Background | **Celery + Celery Beat** |
| Object storage | S3-compatible (**MinIO** lokal, R2/S3 production) |
| Reverse proxy | Caddy yoki Nginx |
| Containers | Docker + Docker Compose (dev), production uchun alohida compose/managed |
| CI | GitHub Actions: lint → typecheck → unit → integration → e2e → build |
| Monitoring | Prometheus + Grafana (v1), Sentry (ixtiyoriy) |

### 4.4. Nega aynan shu stack

- **Next.js App Router** — 3D ni `dynamic(..., { ssr:false })` bilan ajratish, SEO uchun statik sahifalar, API proxy.
- **R3F** — deklarativ scene graph, lekin performance uchun `useFrame` va instancing bilan imperativ qatlam.
- **FastAPI + SQLAlchemy async** — ilmiy hisoblash va tashqi API integratsiyalari uchun qulay, OpenAPI avtomatik.
- **PostgreSQL + PostGIS** — obyektlarning geografik/sferik joylashuvi, spatial indekslar, provenance bilan relational integrity.
- **Celery** — tashqi manbalarni sekin, limitga rioya qilib yuklash; API ni bloklamaslik.

---

## 5. Monorepo strukturasi

```text
space-archive/
├── apps/
│   ├── web/                          # Next.js
│   │   ├── app/
│   │   │   ├── (marketing)/page.tsx  # HOME
│   │   │   ├── explore/page.tsx
│   │   │   ├── solar-system/page.tsx
│   │   │   ├── earth-orbit/page.tsx
│   │   │   ├── moon/page.tsx
│   │   │   ├── mars/page.tsx
│   │   │   ├── deep-space/page.tsx
│   │   │   ├── missions/page.tsx
│   │   │   ├── data-center/page.tsx
│   │   │   ├── about/page.tsx
│   │   │   └── api/                   # faqat proxy/health, sir yo'q
│   │   ├── components/
│   │   │   ├── layout/                # Header, Footer, Shell
│   │   │   ├── navigation/
│   │   │   ├── solar-system/          # Scene, Sun, Planet, Orbits
│   │   │   ├── planets/               # Earth/Moon/Mars globes
│   │   │   ├── orbital-visualization/ # SatelliteField, OrbitLine
│   │   │   ├── object-markers/        # InstancedMarkers, Cluster
│   │   │   ├── object-inspector/
│   │   │   ├── timeline/
│   │   │   ├── search/
│   │   │   ├── filters/
│   │   │   ├── statistics/
│   │   │   └── ai-assistant/
│   │   ├── features/                  # domen logikasi (hooks + api clients)
│   │   ├── hooks/
│   │   ├── lib/                       # api client, formatting, guards
│   │   ├── store/                     # zustand slices
│   │   ├── types/                     # generated + qo'lda yozilgan
│   │   ├── public/
│   │   │   ├── textures/              # optimallashtirilgan (KTX2/WebP)
│   │   │   └── models/
│   │   └── styles/
│   │
│   └── api/                           # FastAPI
│       ├── app/
│       │   ├── main.py
│       │   ├── api/v1/                # routers
│       │   ├── core/                  # config, security, logging, cache, errors
│       │   ├── db/                    # session, base
│       │   ├── models/                # SQLAlchemy
│       │   ├── schemas/               # Pydantic
│       │   ├── repositories/
│       │   ├── services/
│       │   ├── providers/
│       │   │   ├── base.py            # SpaceDataProvider protocol
│       │   │   ├── celestrak/
│       │   │   ├── space_track/
│       │   │   ├── esa_discos/
│       │   │   ├── nasa_orbital_debris/
│       │   │   ├── nasa_lunar/
│       │   │   ├── nasa_pds/
│       │   │   ├── nasa_mars/
│       │   │   ├── jpl_horizons/
│       │   │   ├── naif_spice/
│       │   │   └── nssdc/
│       │   ├── calculations/
│       │   │   ├── orbital/           # omm, sgp4, propagation, frames
│       │   │   ├── coordinates/       # geo↔cartesian, TEME→ECEF
│       │   │   └── planetary/         # body ellipsoids, local frames
│       │   ├── tasks/                 # celery tasks + beat schedule
│       │   ├── ai/                    # rag, prompts, llm client, tts
│       │   └── utils/
│       ├── alembic/
│       ├── tests/
│       └── pyproject.toml
│
├── packages/
│   ├── shared-types/                  # OpenAPI dan generatsiya + qo'lda enumlar
│   └── shared-config/                 # eslint/tsconfig/tailwind preset
│
├── data/
│   ├── curated/                       # verified qo'lda kiritilgan JSON + manbalar
│   │   ├── lunar_artifacts.json
│   │   ├── mars_surface_objects.json
│   │   └── deep_space_probes.json
│   ├── fixtures/                      # testlar uchun kichik, aniq namunalar
│   └── imports/                       # vaqtinchalik yuklamalar (gitignore)
│
├── infrastructure/
│   ├── docker/                        # Dockerfile.web, Dockerfile.api
│   ├── deployment/
│   └── monitoring/                    # prometheus, grafana
│
├── docs/
│   ├── architecture.md
│   ├── database-schema.md
│   ├── data-sources.md
│   ├── api-documentation.md
│   ├── orbital-calculations.md
│   ├── development-roadmap.md
│   ├── setup.md
│   └── deployment.md
│
├── docker-compose.yml
├── pnpm-workspace.yaml
├── .env.example
├── .gitignore
└── README.md
```

**Qoidalar:**
- `apps/web` hech qachon tashqi provayderga to'g'ridan-to'g'ri murojaat qilmaydi (faqat backend).
- `apps/api` hech qachon UI/formatlash logikasini bilmaydi.
- `calculations/` hech qanday DB yoki HTTP import qilmaydi — sof funksiyalar, testlanadi.
- `data/curated/` — har bir yozuvda `source_url`, `retrieved_at`, `verified_by`, `notes`.

---

## 6. Yuqori darajadagi arxitektura

```text
┌──────────────────────────────────────────────────────────────────────┐
│                        BROWSER (Next.js + R3F)                       │
│  UI (React)          Scene (Three.js)          Query cache (RQ)      │
│     │                     │                          │               │
│     └──────────┬──────────┘                          │               │
│                ▼                                     ▼               │
│         /api/v1/* (same-origin, typed client)                        │
└────────────────────────────────┬─────────────────────────────────────┘
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          FASTAPI (API qatlami)                       │
│  routers → services → repositories → SQLAlchemy → PostgreSQL/PostGIS  │
│      │         │                                                     │
│      │         ├── calculations (sof funksiyalar, testlangan)        │
│      │         ├── ai (RAG, LLM client)                              │
│      │         └── cache (Redis)                                     │
│      ▼                                                               │
│  providers (adapterlar) ── HTTP ──► tashqi manbalar                  │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │ (faqat Celery orqali, API emas)
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     CELERY WORKERS + BEAT                            │
│  sync tasks → provider fetch → raw store (S3 + DB) → normalize →     │
│  validate → dedupe → upsert → sync log → cache invalidate            │
└──────────────────────────────────────────────────────────────────────┘
        │                    │                        │
        ▼                    ▼                        ▼
   Redis (broker)      MinIO/S3 (raw)          PostgreSQL + PostGIS
```

### 6.1. Ma'lumot oqimi (majburiy pipeline)

```text
OFFICIAL SOURCES
      │  (adapter, rate-limit, retry, ETag cache)
      ▼
PROVIDER ADAPTERS  →  RAW DATA STORAGE (S3 JSON/CSV + raw_records satri)
      │
      ▼
NORMALIZATION (common model, birliklar, NULL siyosati)
      │
      ▼
SCIENTIFIC VALIDATION (diapazonlar, epoch, koordinata konventsiyasi)
      │
      ▼
DUPLICATE DETECTION (NORAD, Intl Designator, name+launch, fuzzy)
      │
      ▼
UNIFIED DATABASE (PostgreSQL + PostGIS + provenance)
      │
      ├──► REST API (v1)
      ├──► Statistics (materialized view)
      ├──► Search index (Postgres FTS; keyinroq optional Meilisearch)
      └──► AI embedding index (pgvector)
```

### 6.2. Nima uchun sync API da emas, Celery da

- Tashqi API sekin va limitli; HTTP so'rovni 30 soniya ushlab turish mumkin emas.
- Retry, backoff, qisman muvaffaqiyat, sync log — worker da tabiiy.
- API faqat **keshlangan, validatsiyadan o'tgan** ma'lumotni o'qiydi → tez va barqaror.
- Admin endpoint `POST /admin/sync/{provider}` faqat **task queue ga yozadi** va `sync_id` qaytaradi.

---

## 7. Ma'lumotlar bazasi arxitekturasi

Barcha vaqtlar **UTC** (`timestamptz`). Barcha jadvallarda `id UUID default gen_random_uuid()`. `created_at/updated_at` — trigger bilan.

### 7.1. Enumlar (Postgres native ENUM yoki check constraint)

```text
body_type:            star | planet | moon | dwarf_planet | asteroid | comet
object_type:          satellite | rocket_body | debris | spacecraft | lander | rover |
                      instrument | descent_stage | parachute | impact_site | equipment | other
object_category:      earth_orbit | lunar_surface | mars_surface | deep_space | other_body
operational_status:   active | partially_operational | inactive | mission_completed |
                      lost_contact | destroyed | unknown
physical_status:      intact | damaged | partial | destroyed | unknown
mission_status:       planned | active | completed | extended | failed | cancelled | unknown
confidence_level:     verified | estimated | approximate | unknown
location_accuracy:    verified | estimated | approximate | unknown
longitude_convention: east_positive | west_positive | unknown
coordinate_system:    planetocentric | planetographic | unknown
coordinate_frame:     TEME | ECEF | ICRF | body_fixed | unknown
validation_status:    pending | valid | warning | rejected
provider_type:        orbital_catalog | mission_archive | imagery | ephemeris | metadata | statistics
sync_status:          queued | running | success | partial | failed
```

### 7.2. Jadvallar

#### `celestial_bodies`
| Ustun | Tur | Izoh |
|---|---|---|
| id | uuid PK | |
| name | text | "Earth", "Moon", "Mars" |
| slug | text UNIQUE | `earth`, `moon`, `mars` |
| body_type | body_type | |
| radius_km | numeric NULL | ekvatorial |
| polar_radius_km | numeric NULL | ellipsoid uchun |
| flattening | numeric NULL | |
| mass_kg | numeric NULL | |
| gravity_m_s2 | numeric NULL | |
| texture_url | text NULL | S3/CDN |
| parent_body_id | uuid FK self NULL | Moon→Earth |
| coordinate_reference_system | text NULL | "IAU_2015", "MOLA", ... |
| description | text NULL | |
| created_at/updated_at | timestamptz | |

Indekslar: `slug`, `parent_body_id`.

#### `missions`
| Ustun | Tur |
|---|---|
| id, mission_name, mission_code (UNIQUE NULL), space_agency, mission_type | |
| launch_date, mission_start_date, mission_end_date | date NULL |
| mission_status | mission_status |
| target_body_id | FK celestial_bodies NULL |
| description | text NULL |
| official_source_url | text NULL |
| created_at/updated_at | timestamptz |

#### `space_objects` (asosiy jadval)
| Ustun | Tur | Izoh |
|---|---|---|
| id | uuid PK | |
| object_name | text NOT NULL | |
| slug | text UNIQUE | |
| object_type | object_type | |
| object_category | object_category | |
| international_designator | text NULL | `1998-067A` |
| norad_catalog_id | bigint NULL | UNIQUE (partial, NULL ruxsat) |
| mission_id | FK missions NULL | |
| agency | text NULL | |
| country | text NULL | ISO yoki nom |
| host_body_id | FK celestial_bodies | |
| operational_status | operational_status | default `unknown` |
| physical_status | physical_status | default `unknown` |
| mission_status | mission_status | default `unknown` |
| first_launch_date | date NULL | |
| mission_end_date | date NULL | |
| mass_kg | numeric NULL | |
| dimensions | text NULL | "2.3 × 2.3 × 3.4 m" |
| description | text NULL | |
| image_url | text NULL | faqat rasmiy manba |
| image_credit | text NULL | |
| is_historical_artifact | boolean | default false |
| is_catalogued_debris | boolean | default false |
| confidence_level | confidence_level | default `unknown` |
| search_vector | tsvector | generated |
| created_at/updated_at | timestamptz | |

Indekslar: `norad_catalog_id`, `international_designator`, `object_category`, `host_body_id`, `operational_status`, `first_launch_date`, GIN(`search_vector`), composite (`host_body_id`,`object_category`,`operational_status`).

**Muhim:** `operational_status` hech qachon default `inactive` emas — noma'lum bo'lsa `unknown`.

#### `orbital_elements`
| Ustun | Tur |
|---|---|
| id, space_object_id FK | |
| epoch | timestamptz NOT NULL |
| inclination_deg, raan_deg, eccentricity, arg_perigee_deg, mean_anomaly_deg | numeric NOT NULL |
| mean_motion_rev_day, semi_major_axis_km, orbital_period_min | numeric NULL |
| mean_motion_dot, mean_motion_ddot, bstar | numeric NULL (SGP4 uchun) |
| reference_frame | coordinate_frame default `TEME` |
| source_id | FK data_sources |
| source_record_id | FK object_source_records NULL |
| fetched_at | timestamptz |
| is_current | boolean | partial unique: bitta obyektga bitta current |

Indeks: (`space_object_id`, `epoch DESC`), partial unique (`space_object_id`) where `is_current`.

**Tarixiy snapshotlar o'chirilmaydi.** Yangi element kelsa — eskisi `is_current=false`.

#### `orbital_position_history`
Faqat **hisoblangan/keshlangan** vaqtinchalik pozitsiyalar yoki trajectory sample nuqtalari. Har bir yuqori chastotali pozitsiya saqlanmaydi.

| Ustun | Tur |
|---|---|
| id, space_object_id | |
| timestamp | timestamptz |
| position_x/y/z | double precision (km, ECEF yoki ICRF) |
| velocity_x/y/z | double precision NULL (km/s) |
| coordinate_frame | coordinate_frame |
| calculation_method | text (`sgp4@v1`, `horizons`, `spice`) |
| source_epoch | timestamptz NULL |
| accuracy_metadata | jsonb NULL |
| created_at | |

Indeks: (`space_object_id`, `timestamp`). Retention: trajectory cache uchun 30 kun, keyin o'chirish (source elementsdan qayta hisoblanadi).

#### `surface_locations`
| Ustun | Tur |
|---|---|
| id, space_object_id FK, celestial_body_id FK | |
| latitude_deg, longitude_deg | numeric NULL |
| elevation_m | numeric NULL |
| longitude_convention | enum |
| coordinate_system | enum |
| location_accuracy | enum |
| location_status | enum (`verified_located` \| `unknown_location`) |
| location_description | text NULL |
| original_source_coordinates | text NULL |
| source_id | FK data_sources NULL |
| geom | geography(Point, 4326) NULL (PostGIS, faqat lat/lon mavjud bo'lsa) |
| created_at/updated_at | |

Check constraint: `(latitude_deg IS NULL) = (longitude_deg IS NULL)` — ikkalasi birga bo'sh yoki birga to'la. `latitude BETWEEN -90 AND 90`, `longitude BETWEEN -180 AND 180`.

**UNKNOWN LOCATION** — bu satr `location_status='unknown_location'`, koordinatalar `NULL`. UI da marker **umuman chizilmaydi**, faqat ro'yxatda "Unknown location" belgisi.

#### `data_sources`
| Ustun |
|---|
| id, provider_name UNIQUE, provider_type, official_url, api_documentation_url |
| license_or_usage_policy, attribution_text, update_interval_seconds |
| is_enabled boolean, requires_credentials boolean |
| last_successful_sync, last_failed_sync, last_error text |
| created_at/updated_at |

#### `object_source_records`
| Ustun |
|---|
| id, space_object_id FK, data_source_id FK |
| external_record_id text NOT NULL |
| original_source_url text NOT NULL |
| raw_record_reference text NULL (S3 kaliti) |
| raw_record jsonb NULL (kichik bo'lsa) |
| source_updated_at, fetched_at timestamptz |
| validation_status, validation_notes text NULL |
| created_at/updated_at |

Unique: (`data_source_id`, `external_record_id`). Indeks: `space_object_id`.

#### `object_events`
| Ustun |
|---|
| id, space_object_id FK, event_type text, event_date date NULL, event_description text |
| event_location text NULL, source_id FK NULL, created_at |

`event_type` qiymatlari: launch, orbital_insertion, landing, rover_deployment, instrument_activation, mission_completion, loss_of_communication, impact, orbital_decay, decommission, discovery, other.

#### `sync_logs`
| Ustun |
|---|
| id, provider_id FK, job_name, started_at, completed_at |
| records_received, records_created, records_updated, records_rejected int |
| status sync_status, error_message text NULL, details jsonb NULL |

#### `raw_records` (provenance arxivi)
| Ustun |
|---|
| id, data_source_id, external_record_id, storage_url (S3), content_type |
| content_hash (sha256), http_status, fetched_at, expires_at NULL |

Raw ma'lumot **hech qachon** "yo'qolmaydi" — normalizatsiya xatosi bo'lsa qayta ishlash mumkin.

#### `ai_documents` + `ai_chunks` (RAG, v1)
- `ai_documents`: id, source_type (`object`|`mission`|`source_doc`), source_id, title, url, content_hash, updated_at.
- `ai_chunks`: id, document_id, chunk_index, content, embedding `vector(1536)`, metadata jsonb. HNSW indeks.

#### `users` (faqat admin)
id, email UNIQUE, password_hash (argon2), role (`admin`|`viewer`), is_active, created_at.

#### `statistics` uchun materialized view
`mv_object_stats` — category/type/status/agency/country/launch decade bo'yicha agregatlar. Sync tugagach `REFRESH MATERIALIZED VIEW CONCURRENTLY`. API hech qachon "soxta" son qaytarmaydi: bo'sh bo'lsa `0` + `data_quality.last_sync`.

### 7.3. Migratsiya va seed tartibi

1. `0001_extensions` — `postgis`, `pgvector`, `pg_trgm`.
2. `0002_core` — data_sources, celestial_bodies, missions.
3. `0003_objects` — space_objects, orbital_elements, surface_locations, object_source_records, object_events.
4. `0004_sync` — sync_logs, raw_records.
5. `0005_ai` — ai_documents, ai_chunks, users.
6. `0006_indexes_views` — GIN, composite, `mv_object_stats`.

Seed: Quyosh tizimi jismlari (9 ta), data_sources (10 ta, `is_enabled` bo'yicha), curated lunar/mars/deep-space yozuvlari (faqat manbali).

### 7.4. Provenance qoidasi

Har bir `space_objects` yozuvi kamida bitta `object_source_records` ga ega bo'lishi **servis qatlamida** tekshiriladi (DB trigger bilan emas, chunki import vaqtinchalik holatda bo'lishi mumkin). Publik API faqat `validation_status != 'rejected'` va kamida bitta source recordga ega obyektlarni qaytaradi.

---

## 8. Data provider arxitekturasi

### 8.1. Umumiy interfeys

```python
# providers/base.py (kontseptual)
class SpaceDataProvider(Protocol):
    name: str
    source_type: ProviderType
    requires_credentials: bool

    async def health_check(self) -> ProviderHealth: ...
    async def fetch_objects(self, params: FetchParams) -> AsyncIterator[RawRecord]: ...
    def normalize_object(self, raw: RawRecord) -> NormalizedObject: ...
    def validate_record(self, rec: NormalizedObject) -> ValidationResult: ...
    def get_source_metadata(self) -> SourceMetadata: ...
```

Talablar:
- Har bir adapter o'z `settings` bloki, timeout, retry/backoff, rate limiter va `User-Agent` ga ega.
- Xatolar tiplashtirilgan: `ProviderAuthError`, `ProviderRateLimitError`, `ProviderUnavailableError`, `ProviderSchemaError`.
- Hech bir adapter boshqasini import qilmaydi.
- Adapter **hech qachon** to'g'ridan-to'g'ri DB ga yozmaydi — faqat `RawRecord`/`NormalizedObject` qaytaradi; yozishni `services/ingestion.py` bajaradi.
- Har bir fetch natijasi `raw_records` ga hash bilan saqlanadi; bir xil hash qayta ishlanmaydi (idempotentlik).

### 8.2. Provayderlar jadvali

| # | Provider | Manba | Auth | Ma'lumot | Yangilanish | MVP |
|---|---|---|---|---|---|---|
| 1 | `celestrak` | celestrak.org GP (OMM JSON) | yo'q | orbital elements | kuniga bir necha marta (kesh 6–12 soat) | ✅ |
| 2 | `space_track` | space-track.org | **ha** (env) | to'liq katalog, SATCAT | kunlik | ⚠️ kredensial bo'lsa |
| 3 | `esa_discos` | discosweb.esoc.esa.int | ha (token) | obyekt metadata | haftalik | ⚠️ feature flag |
| 4 | `nasa_orbital_debris` | orbitaldebris.jsc.nasa.gov | yo'q | statistik kontekst, model hujjatlari | oylik/qo'lda | ✅ (statik/curated) |
| 5 | `nasa_lunar` | NASA Human Artifacts catalogue | yo'q | lunar artefaktlar | qo'lda | ✅ curated |
| 6 | `nasa_pds` | pds.nasa.gov | yo'q | mission arxivlari | kamdan-kam | ⏳ v1 |
| 7 | `nasa_mars` | Mars Trek WMTS/TMS | yo'q | sirt rasmlari (layer) | statik tiles | ✅ (v1 da layer) |
| 8 | `jpl_horizons` | ssd-api.jpl.nasa.gov | yo'q | ephemeris, state vectors | so'rov bo'yicha + kesh | ✅ |
| 9 | `naif_spice` | naif.jpl.nasa.gov | yo'q | kernel traektoriyalar | qo'lda | ⏳ v2 |
| 10 | `nssdc` | data.nasa.gov dataset | yo'q | tarixiy metadata | kamdan-kam | ⏳ v1 |

> **Muhim:** har bir provayderning hozirgi ishlashi, endpoint formati va limitlari **integratsiya boshlanishida rasmiy hujjatdan qayta tekshiriladi**. Reja'dagi endpointlar — yo'nalish, kafolat emas. Tekshirilmagan integratsiya "live" deb hisoblanmaydi.

### 8.3. CelesTrak adapteri (eng muhim)

**Nima olinadi:** GP (General Perturbations) ma'lumotlari OMM JSON formatida.

**Endpointlar (rasmiy hujjatga muvofiq tekshiriladi):**
```
https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json
https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=json
https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=json
```

**Guruhlar bo'yicha strategiya (MVP):**
- `stations` (ISS va boshqalar) — kichik, doim ko'rsatiladi.
- `active` — ~10k+ obyekt; sahnalashtirilgan holda, server-side filter bilan.
- `last-30-days` — yangi launchlar.
- `debris`/`rocket-bodies` guruhlari — **to'liq yuklanmaydi**; MVP da statistik qatlam sifatida NASA ODP ma'lumotlari, obyekt darajasida esa Space-Track (agar ruxsat bo'lsa).
- `analyst` kabi maxsus guruhlar — faqat ruxsat bo'lsa.

**Talablar:**
- `If-None-Match` / `If-Modified-Since` bilan shartli so'rov; 304 bo'lsa qayta ishlanmaydi.
- Lokal kesh: S3 `raw/celestrak/{group}/{date}.json` + `raw_records.content_hash`.
- Minimal interval: guruh uchun `update_interval_seconds` (masalan 6 soat); Beat job undan tez-tez ishlamaydi.
- Parallel so'rovlar cheklangan (semaphore, masalan 2).
- `User-Agent: SpaceArchive/1.0 (+contact)`.
- Rate limit javobi (429) → exponential backoff, `sync_logs.status='partial'`.
- OMM → `NormalizedObject` + `OrbitalElements`; **TLE matnini saqlamaymiz**, lekin raw JSON saqlanadi.

**Nega OMM, TLE emas:** 5 xonali NORAD ID cheklovi (Alpha-5 muammosi), kelajakdagi katalog o'sishi, JSON parsing barqarorligi. `sgp4` kutubxonasi OMM maydonlaridan klassik elementlarni oladi.

### 8.4. Space-Track adapteri

- Login: `POST /ajaxauth/login` (cookie session), keyin `GET /basicspacedata/query/...`.
- Kredensiallar faqat `SPACE_TRACK_USER` / `SPACE_TRACK_PASSWORD` env.
- Sessiya cookie Redis da qisqa muddat keshlanadi; 401 bo'lsa qayta login (bir marta).
- So'rovlar `limit`/`offset` bilan sahifalanadi; kunlik limitga rioya.
- SATCAT (metadata) va GP (elements) alohida joblar.
- **Frontend hech qachon Space-Track ga murojaat qilmaydi.**
- Kredensial yo'q bo'lsa: `health_check()` → `credentials_missing`, UI "Provider disabled" ko'rsatadi.

### 8.5. ESA DISCOS adapteri

- Token-based auth (`DISCOS_TOKEN`), `Authorization: Token ...`.
- Obyektlar, launch, rocket, spacecraft metadata.
- DISCOS ID → `object_source_records.external_record_id` (`discos:{id}`).
- Xizmat mavjudligi tekshiriladi; mavjud bo'lmasa adapter `is_enabled=false`.
- Redistribution shartlari `data_sources.license_or_usage_policy` da yoziladi; UI attribution ko'rsatadi.

### 8.6. NASA Orbital Debris Program Office

- Bu **obyekt darajasidagi API emas**. Faqat:
  - statistik kontekst (debris populyatsiyasi modellari, o'lchov hisobotlari);
  - `data_center` sahifasidagi izohlar va manbalar;
  - `data/curated/orbital_debris_context.json` (qo'lda, manba sanasi bilan).
- Hech qachon "NASA ODP dan obyekt koordinatasi" deb da'vo qilinmaydi.

### 8.7. NASA Lunar Artifacts

- Manba: NASA Human Artifacts catalogue (HTML/PDF).
- Jarayon: sahifani yuklab olish → jadvalni qo'lda/yarim-avtomatik ajratish → `data/curated/lunar_artifacts.json` → import script (`scripts/import_curated.py`) → DB.
- Har bir yozuv: `name`, `mission`, `object_type`, `latitude`, `longitude`, `coordinate_system`, `longitude_convention`, `source_url`, `notes`.
- Koordinata manbada yo'q bo'lsa — `null`, `location_status='unknown_location'`.
- Import idempotent: `external_record_id = "nasa-lunar:{slug}"`.
- **Rasm:** faqat NASA public-domain rasmlari, `image_credit` bilan.

### 8.8. NASA PDS

- PDS — yagona API emas, ko'plab node lar (GEO, ATM, IMG, PPI...).
- Har bir mission uchun aniq arxiv va format aniqlanadi (PDS3/PDS4 label, GeoTIFF, CSV).
- MVP da faqat **hujjatlashtirilgan, kichik** datasetlar (masalan, mission event yoki sirt rasmi metadata).
- Katta fayllar S3 ga, DB da faqat metadata + havola.

### 8.9. NASA Mars Trek

- WMTS/TMS tile xizmatlari; Mars uchun basemap va landing-site layerlari.
- **Backend proxy** (`/api/v1/imagery/mars/...`) orqali: attribution, CORS, kesh.
- Tile server client-side da to'g'ridan-to'g'ri chaqirilsa ham, usage/attribution talablari tekshiriladi; imkon bo'lsa proxy afzal.
- Bu **obyekt katalogi emas** — faqat vizual layer.

### 8.10. JPL Horizons

- `https://ssd-api.jpl.nasa.gov/horizons.api` — `format=json`, `COMMAND='-31'` (Voyager 1 kabi), `EPHEM_TYPE='VECTORS'`, `CENTER`, `START_TIME`, `STOP_TIME`, `STEP_SIZE`.
- FAQAT server-side; javob keshlanadi (`raw_records` + Redis).
- Har bir javobda: `reference_epoch`, `frame` (`ICRF`/`Ecliptic`), `target`, `provider_version` saqlanadi.
- UI da "Calculated from JPL Horizons, epoch: ..." yoziladi. **"Live tracking" emas.**
- Rate limit va javob hajmi nazorat qilinadi; ko'p obyekt uchun batch emas, alohida so'rov + kesh.

### 8.11. NAIF SPICE (v2)

- `spiceypy`, metakernel (`kernels.txt`) versiyalangan holda S3 da.
- Kernel yuklab olinishi qo'lda/admin task; litsenziya va hajm tekshiriladi.
- `spkezr`/`pxform` orqali state vector va frame transformatsiyalari.
- Adapter interfeysi MVP da yoziladi, lekin `is_enabled=false`.

### 8.12. NSSDC Master Catalog

- Ommaviy dataset (CSV/JSON), to'liq yuklab olinadi (bir marta + yangilanish bo'lsa).
- **Enrichment** uchun: mission tavsifi, experimentlar, tarixiy identifikatorlar.
- `space_objects.description` ni faqat manba bilan to'ldiradi; ziddiyat bo'lsa confidence pasaytiriladi va ikkala manba saqlanadi.

### 8.13. Deduplikatsiya qoidalari

Tartib bo'yicha:
1. `norad_catalog_id` teng → bir obyekt.
2. `international_designator` teng va obyekt turi mos → bir obyekt.
3. `provider_name + external_record_id` → source record bog'lanishi.
4. Normalizatsiya qilingan nom + launch yili + host body → `estimated` darajada merge, **admin tasdiqi** talab qilinadi.
5. Hech qachon faqat nom o'xshashligi bo'yicha avtomatik merge qilinmaydi.

Har bir merge `sync_logs.details` va alohida audit yozuvida qayd etiladi.

---

## 9. Ilmiy hisoblash qatlami

Bu qatlam UI dan mustaqil, sof funksiyalar to'plami. Hech qanday `fetch`, DB yoki React import yo'q. Har bir funksiya unit test + reference case bilan.

### 9.1. Yer orbitasi: OMM → SGP4 → sahna

```text
OMM JSON
  → OrbitalElements (epoch UTC, radianlarga o'tkazish)
  → sgp4.model.Satrec (init)
  → sgp4.propagation.sgp4(satrec, tsince_min)
  → TEME position (km) + velocity (km/s)
  → GMST orqali TEME → ECEF (WGS-84)
  → geodetic lat/lon/alt (WGS-84)
  → scene: unit sphere radius R_scene = 1 + alt_km / EARTH_RADIUS_KM * exaggeration
```

**Talablar:**
- `epoch` dan `tsince` **daqiqalarda**, UTC.
- Epoch eskirgan bo'lsa (LEO > 7 kun, MEO > 14 kun, GEO > 30 kun) → `stale=true`, UI ogohlantiradi; pozitsiya baribir hisoblanadi, lekin "estimated" deb belgilanadi.
- SGP4 xatosi (decayed, invalid elements) → `PositionUnavailable` xatosi; UI "Position unavailable" ko'rsatadi. **Fallback pozitsiya to'qilmaydi.**
- TEME→ECEF uchun `astropy` (`TEME` → `ITRS`) yoki hujjatlashtirilgan GMST formulasi. Qaysi biri ishlatilsa, `docs/orbital-calculations.md` da formula, aniqlik va testlar yoziladi.
- Natija Redis da: key `pos:v1:{norad}:{timestamp_bucket}` (masalan 60 s bucket), TTL 5 daqiqa.
- Orbit chizig'i: bir orbital davr uchun 180–360 sample; agar `period > 24h` bo'lsa 720 sample; serverda hisoblanadi va `GET /objects/{id}/orbit` qaytaradi (compact binary yoki JSON).

**Muhim:** orbital elementlar **geografik koordinata emas**. UI da "latitude/longitude" faqat hisoblangan subpoint sifatida, "calculated" yorlig'i bilan ko'rsatiladi.

### 9.2. Oy va Mars: geo → planet-centered cartesian

```text
(lat, lon, elevation) + body ellipsoid (a, f) + convention
  → planetocentric/planetographic konversiya (agar kerak bo'lsa)
  → ECEF-like body-fixed XYZ (km)
  → normalized → scene position (body radius = 1)
```

- **Oy:** sferaga yaqin (`R=1737.4 km`), latitude planetocentric, longitude east-positive (NASA standarti). Manba west-positive bo'lsa, `longitude_convention` bo'yicha aylantiriladi va original qiymat saqlanadi.
- **Mars:** ellipsoid `a=3396.19 km`, `f=1/169.8` (IAU). Planetographic latitude va planetocentric farqi hisobga olinadi.
- Elevation noma'lum bo'lsa `0` deb qabul qilinadi, lekin `elevation_m=NULL` va UI "elevation not available" ko'rsatadi (vizual uchun 0 — bu taxmin, yozuvda `assumed_zero_elevation=true` metadata).
- **Har bir obyekt uchun** `location_accuracy` va `location_status` saqlanadi.
- Koordinata yo'q obyekt sahnada marker olmaydi; ro'yxatda "Unknown location" bilan turadi.

### 9.3. Deep space

- JPL Horizons state vectorlari (ICRF) → Quyosh markazli sahna koordinatalari.
- Vizual masshtab: logarifmik yoki siqilgan radial mapping; **Scientific mode** da real AU masshtabi va kamera `near/far` sozlamalari.
- Har bir obyekt uchun: `epoch`, `frame`, `target`, `uncertainty` (agar manba bersa), `data_age`.
- Traektoriya — kamida 2 nuqta (o'tgan va hozirgi) yoki mission trajectory dataseti bo'lsa ko'proq; yo'q bo'lsa faqat joriy nuqta.
- "Voyager 1 hozir X AU da" — manba va epoch bilan; "real-time" so'zi ishlatilmaydi.

### 9.4. Location confidence

| Daraja | Ma'nosi | UI |
|---|---|---|
| `verified` | Rasmiy manbada aniq koordinata, sana bilan | to'liq marker + yashil nuqta |
| `estimated` | Hisoblangan yoki bilvosita aniqlangan | marker + "Estimated" yorlig'i |
| `approximate` | Taxminiy hudud (masalan, landing ellipse) | doiraviy hudud, markazda emas |
| `unknown` | Koordinata yo'q | marker yo'q, ro'yxatda belgi |

### 9.5. Visual vs Scientific mode

| | Visual mode | Scientific mode |
|---|---|---|
| Masofa | siqilgan/logarifmik | real nisbat (AU/km) |
| Jism radiusi | kattalashtirilgan | real nisbat (ixtiyoriy kattalashtirish bilan) |
| Marker | doim ko'rinadigan, minimal o'lcham | real joyida, masshtabga mos |
| Vaqt | tanlangan timestamp | aniq UTC timestamp ko'rsatiladi |
| Maqsad | navigatsiya, taassurot | aniqlik, tekshirish |

Mode almashtirilganda sahna qayta quriladi; hech qachon "vizual kattalashtirish" ilmiy qiymat deb ko'rsatilmaydi.

---

## 10. Backend API dizayni

Baza: `/api/v1`. OpenAPI `/api/docs` (faqat dev/staging yoki admin himoyasi ostida).

### 10.1. Endpointlar

| Method | Path | Tavsif |
|---|---|---|
| GET | `/bodies/` | jismlar ro'yxati |
| GET | `/bodies/{slug}/` | bitta jism + statistikasi |
| GET | `/bodies/{slug}/objects/` | jism obyektlari (pagination, filter) |
| GET | `/bodies/{slug}/scene/` | sahna uchun optimallashtirilgan to'plam (markerlar, bounding) |
| GET | `/objects/` | qidiruv/filter/sort/pagination |
| GET | `/objects/{id}/` | to'liq obyekt (source records bilan) |
| GET | `/objects/{id}/history/` | events |
| GET | `/objects/{id}/sources/` | provenance |
| GET | `/objects/{id}/position/?at=ISO8601` | hisoblangan pozitsiya |
| GET | `/objects/{id}/orbit/?samples=240` | orbit chizig'i |
| GET | `/missions/` | missionlar |
| GET | `/missions/{id}/` | mission + obyektlari |
| GET | `/search/?q=` | global qidiruv (typeahead) |
| GET | `/statistics/overview/` | umumiy sonlar + last_sync |
| GET | `/statistics/categories/` | category/type/status/agency/country/decade |
| GET | `/sources/` | data source metadata |
| GET | `/sources/status/` | health + last sync |
| GET | `/timeline/?from=&to=` | voqealar |
| GET | `/imagery/mars/...` | Mars Trek proxy (v1) |
| POST | `/ai/ask/` | RAG javob + citations |
| GET | `/health/` | liveness/readiness |
| POST | `/admin/sync/{provider}/` | sync trigger (auth) |
| GET | `/admin/sync/{id}/` | sync holati (auth) |
| POST | `/admin/token/` | admin JWT (auth) |

### 10.2. Umumiy javob konvertlari

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "page_size": 50,
  "has_next": false
}
```

Xatolar (RFC 7807 ga yaqin):
```json
{
  "type": "https://space-archive.dev/errors/provider-unavailable",
  "title": "Provider unavailable",
  "status": 503,
  "detail": "CelesTrak did not respond within 10s",
  "request_id": "req_...",
  "context": {"provider": "celestrak"}
}
```

### 10.3. Obyekt javobi (qisqartirilgan)

```json
{
  "id": "uuid",
  "slug": "iss",
  "name": "International Space Station",
  "category": "earth_orbit",
  "type": "spacecraft",
  "status": {"operational": "active", "physical": "intact", "mission": "extended"},
  "identifiers": {"norad": 25544, "international": "1998-067A"},
  "host_body": {"slug": "earth", "name": "Earth"},
  "orbit": {"epoch": "...", "inclination_deg": 51.64, "mean_motion_rev_day": 15.5, "freshness": {"age_hours": 3.2, "stale": false}},
  "location": {"kind": "orbit", "computed_at": "...", "lat": 12.3, "lon": 45.6, "alt_km": 420.1, "confidence": "estimated", "method": "sgp4@v1"},
  "provenance": [{"provider": "celestrak", "record": "25544", "url": "...", "fetched_at": "...", "validation": "valid"}],
  "data_quality": {"confidence": "verified", "missing_fields": ["mass_kg", "dimensions"]}
}
```

### 10.4. Query parametrlari (objects)

`q`, `category`, `type`, `status`, `host_body`, `agency`, `country`, `launch_year_from`, `launch_year_to`, `confidence`, `norad`, `intl_designator`, `sort` (`name|-name|launch_date|-launch_date`), `page`, `page_size` (max 200), `bbox` (kelajak), `include_unknown_location` (default true).

### 10.5. Kesh va rate limit

- Redis: `statistics:*` 60 s, `bodies:*` 300 s, `object:{id}` 60 s, `position` 60 s bucket, orbit 300 s.
- Rate limit: anonim 60 req/min/IP; AI 10 req/min/IP; admin sync 5 req/min.
- `X-Cache: HIT|MISS`, `X-Data-Age` headerlari.
- ETag `GET /objects/` va `/statistics/*` uchun.

### 10.6. Auth

- Faqat admin endpointlar JWT talab qiladi (`/admin/*`).
- Parol argon2; JWT 15 daqiqa; refresh yo'q (qayta login).
- CORS: faqat `WEB_ORIGIN`.
- Hech qanday tashqi provider kredensiali API javobida chiqmaydi; `settings` da `SecretStr`.

---

## 11. Frontend va 3D arxitektura

### 11.1. Render strategiyasi

- 3D komponentlar `dynamic(() => import(...), { ssr: false })`.
- Sahifa darajasida RSC: statik matn, SEO metadata, schema.org.
- `<Canvas>` atrofida faqat kerakli UI. Canvas ichida React state minimal; pozitsiyalar `useMemo`/`useFrame` va ref orqali.
- Har bir sahna alohida route: `/solar-system`, `/earth-orbit`, `/moon`, `/mars`, `/deep-space`.
- Bitta "global scene" emas — har sahna o'z local frame va kamera konfiguratsiyasi bilan (performance va aniqlik).

### 11.2. Scene graph (Yer orbitasi misolida)

```
<EarthOrbitScene>
  <Starfield />
  <EarthGlobe texture day/night, atmosphere shader />
  <OrbitRing altitude shells (optional) />
  <SatelliteField>          // instanced points, 1 draw call
    <InstancedMarkers data={filtered} />
  </SatelliteField>
  <SelectedOrbitLine points={calc} />
  <SelectionMarker />
  <CameraRig focus={selected} />
</EarthOrbitScene>
```

**Instanced rendering:** har bir marker alohida mesh emas. `InstancedMesh` yoki `Points` + custom shader; tanlangan marker alohida highlight mesh.

**Clustering/LOD:**
- Kamera uzoqda: altitude shell bo'yicha agregat nuqtalar.
- Yaqinlashganda: individual markerlar.
- Serverdan sahna uchun `max_objects` (masalan 3000) va `stride/sample` bilan keladi; UI "Showing 3,000 of 12,431 — zoom in to refine" deb yozadi.
- `frustumCulled`, `dpr` clamp `[1, 2]`, `powerPreference: 'high-performance'`.

### 11.3. State boshqaruvi

| State | Joy |
|---|---|
| Server ma'lumotlari | TanStack Query (cache, retry, staleTime) |
| Tanlangan obyekt, filtrlar, mode, timestamp | Zustand |
| Kamera/animatsiya | ref + `useFrame` (React state emas) |
| URL holati | `searchParams` (shareable permalink) |

Filtrlar URL da saqlanadi: `/earth-orbit?type=satellite&status=inactive&at=2026-11-14T00:00:00Z`.

### 11.4. Dizayn tizimi

Tokenlar CSS variables:
```css
--bg: #05070A; --bg-2: #0B0F14; --panel: #111820;
--text: #F5F7FA; --text-2: #8B96A5; --border: rgba(255,255,255,0.08);
--accent-orbit: #55C8FF; --accent-artifact: #E5B45C;
--warning: #F07854; --success: #70C99B;
```
- Shrift: `Inter`/`Geist` (sans) + `JetBrains Mono` (raqamlar, ID, koordinatalar).
- Panellar: 1px nozik border, 8–12px radius, shaffof fon (`backdrop-blur` juda kam).
- Glow faqat tanlangan obyekt va muhim statuslarda; neon ko'paytirilmaydi.
- Raqamlar `tabular-nums`; koordinatalar monospace.
- Har bir status uchun matn + rang + icon (faqat rangga tayanmaslik — accessibility).

### 11.5. Sahifalar va UX oqimi

1. **HOME** — to'liq ekran 3D Solar System, minimal nav, sarlavha, 2 CTA. Scroll qilganda 3D parallax; "Skip intro" tugmasi.
2. **EXPLORE** — umumiy xarita: barcha jismlar + obyektlar soni, tez o'tish.
3. **SOLAR SYSTEM** — orbital overview, sayyora tanlash, masshtab rejimi.
4. **EARTH ORBIT** — globus + katalog; chapda filtrlar, o'ngda inspector, pastda timeline/legend.
5. **MOON ARCHIVE** — Oy globusi + verified artefaktlar, Apollo missiyalari bo'yicha filtr.
6. **MARS ARCHIVE** — Mars globusi + basemap layer + lander/roverlar, rover path (agar mavjud).
7. **DEEP SPACE** — logarifmik masshtab, zondlar, "calculated" yorlig'i.
8. **MISSIONS** — mission kartalari, status, target, obyektlar.
9. **DATA CENTER** — real statistikalar, source coverage, last sync, missing data.
10. **ABOUT** — metodologiya, manbalar, litsenziyalar, chegara/limitations.

**Object Inspector bo'limlari (accordion):**
- Identification
- Location (coordinates, frame, accuracy, freshness)
- Technical (mass, dimensions, launch, purpose)
- History (events timeline)
- Current status (operational/physical/mission, last known)
- Sources (provider, record, URL, fetched_at, validation)
- Actions: "Focus in 3D", "Show orbit", "Ask AI about this" (v1), "Copy permalink".

**Empty/error holatlari:**
- "No objects match filters" + "Clear filters".
- "Provider temporarily unavailable — showing cached data from {date}" (amber banner).
- "Location unknown for this object" (neutral, ne qizil ne yashil).
- 3D WebGL yo'q bo'lsa: fallback 2D ro'yxat + xarita.

### 11.6. Timeline

- Gorizontal vaqt chizig'i (1957 → hozir), voqealar klasterlangan.
- Sana tanlanganda: `at` parametri orqali obyektlar holati va (mavjud bo'lsa) orbital pozitsiya.
- **Muhim:** tarixiy sana uchun faqat o'sha davr orbital elementlari bo'lsa aniq pozitsiya. Bo'lmasa: "Historical orbital elements unavailable — showing current elements" yoki obyektni "not yet launched" deb yashirish. Hech qachon bugungi element bilan o'tmish pozitsiyasi "aniq" deb ko'rsatilmaydi.
- Mars/Moon obyektlari uchun voqea sanasi va missiya holati (planned/active/completed) o'zgaradi.

### 11.7. Accessibility va responsivlik

- Klaviatura bilan navigatsiya, `focus-visible`, ARIA label lar.
- `prefers-reduced-motion` — kamera animatsiyalari qisqartiriladi.
- Mobil: 3D canvas to'liq ekran, inspector bottom-sheet; markerlar soni kamaytiriladi.
- Kontrast WCAG AA (matn uchun), statuslar matn bilan.

---

## 12. AI Space Guide (RAG)

### 12.1. Oqim

```text
User question + context (object_id/body/timestamp)
   → intent + query rewrite (LLM, kichik)
   → retrieval:
       - structured: DB dan obyekt/mission yozuvlari
       - unstructured: ai_chunks (pgvector) + source hujjatlar
   → grounding prompt (faqat berilgan kontekst, citations majburiy)
   → LLM javob
   → post-validation: citationlar mavjudligi, raqamlar kontekstda borligi
   → javob + citations + "uncertainty" bayrog'i
```

### 12.2. Qoidalar

- Kontekstda yo'q raqam/koordinata **taqiqlanadi**. Post-processing: javobdagi barcha raqamlarni kontekst raqamlari bilan solishtirish (regex + tolerance), mos kelmasa javob qayta generatsiya yoki "aniq ma'lumot yo'q" javobi.
- Har bir javobda kamida bitta citation yoki "No reliable source found".
- "Live", "real-time" so'zlari faqat manba shuni tasdiqlasa ishlatiladi.
- Tizim promptida: "Agar ma'lumot bo'lmasa, ochiq ayt: 'Bu ma'lumot arxivda mavjud emas'".
- Suhbat tarixi sessiyada saqlanadi (Redis, 30 daqiqa), shaxsiy ma'lumot yig'ilmaydi.
- Provayder: `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY` env; OpenAI-compatible interfeys; lokal modelga almashtirish mumkin.
- TTS (v1): brauzer `SpeechSynthesis` (bepul) yoki server TTS (feature flag). Ovozli javob matni ham citation bilan.

### 12.3. Embedding yangilanishi

- Obyekt/mission yozuvi o'zgarsa → `ai_documents.content_hash` o'zgaradi → Celery task chunk + embed qiladi.
- Embedding model versiyasi saqlanadi (`embedding_model`), model almashsa to'liq reindex.
- Xarajat nazorati: faqat o'zgargan hujjatlar.

---

## 13. Xavfsizlik, ishonchlilik, observability

### 13.1. Xavfsizlik

- Barcha sirlar env orqali; `.env` gitignore; `.env.example` da faqat nomlar.
- `SecretStr` (Pydantic) — log va repr da maskalanadi.
- SQL: faqat ORM/parametrlangan so'rovlar; raw SQL faqat migratsiyalarda.
- Input validation: Pydantic + query param cheklovlari (page_size, samples, date range).
- CORS: aniq origin; credentials faqat kerak bo'lsa.
- Rate limit: Redis token bucket.
- SSRF himoyasi: provider adapterlar faqat allowlist domenlarga so'rov yuboradi; foydalanuvchi URL ni server fetch qilmaydi.
- Admin: JWT + argon2 + login rate limit + audit log.
- Xatolar: stack trace faqat logda; foydalanuvchiga `request_id`.
- Dependency skan: `pip-audit`, `pnpm audit` CI da (warning).
- Content Security Policy (v1): `default-src 'self'`, 3D uchun kerakli exceptions.

### 13.2. Ishonchlilik

- Provider ishlamasa: oxirgi valid kesh ishlatiladi, UI `data_age` ko'rsatadi.
- DB backup: `pg_dump` kunlik + S3 (production), restore testi oyiga bir marta.
- Migratsiyalar: faqat forward, `alembic upgrade head`; destructive o'zgarishlar alohida ko'rib chiqiladi.
- Idempotent sync: `content_hash` + upsert.
- Health endpoint: DB, Redis, S3, oxirgi sync yoshi.
- Graceful degradation: AI ishlamasa chat "temporarily unavailable"; Mars tiles ishlamasa oddiy globus.

### 13.3. Observability

- `structlog` JSON: `request_id`, `route`, `status`, `duration_ms`, `provider`, `sync_id`.
- Prometheus metrikalar: `http_request_duration_seconds`, `provider_fetch_total{provider,status}`, `sync_records_total`, `position_calc_seconds`, `cache_hits_total`.
- Grafana dashboard (v1): API latency, error rate, provider health, sync freshness.
- Sentry (ixtiyoriy): frontend + backend xatolar.

---

## 14. Test strategiyasi

### 14.1. Backend

| Test turi | Nima tekshiriladi |
|---|---|
| Unit | normalizatsiya, validatsiya, dedupe, confidence hisoblash |
| Calculations | SGP4 reference vectors, TEME→ECEF, geo→cartesian, Oy/Mars ellipsoid |
| Repository | filter/sort/pagination, NULL handling, PostGIS query |
| API | status kodlar, schema, error format, rate limit, auth |
| Provider | mock HTTP (respx): success, 429, 500, timeout, schema o'zgarishi, auth fail |
| Ingestion | idempotentlik (bir xil raw ikki marta), provenance saqlanishi, rejected records |
| DB | constraintlar, unique, FK, enum, migration up/down (dev) |

**SGP4 reference:** Vallado test to'plami yoki ma'lum TLE/OMM + kutilgan TEME vektor, tolerance `1e-3 km` (yoki kutubxona aniqligiga mos). Kamida 3 holat: LEO (ISS), GEO, high-eccentricity (Molniya).

### 14.2. Frontend

- Vitest: filter mantiqi, formatting (`Unknown`, `null`), URL state, inspector rendering.
- Playwright: home → solar system → Earth → filter → select → inspector → Moon → Apollo 11 → Mars → Perseverance.
- Vizual regressiya (ixtiyoriy): screenshot baseline (3D uchun barqaror emas — faqat UI panellar).
- Accessibility: axe skan asosiy sahifalarda.

### 14.3. E2E (majburiy user journey)

1. Homepage ochiladi, 3D yuklanadi (yoki fallback).
2. "Explore the Solar System" → solar system.
3. Earth tanlanadi → obyektlar soni ko'rinadi.
4. Filtr: `inactive` + `satellite` → counter o'zgaradi.
5. Obyekt tanlanadi → inspector ochiladi.
6. Orbital ma'lumot va freshness ko'rinadi.
7. Manba havolasi mavjud.
8. Moon → Apollo 11 → koordinata + "verified" + NASA manba.
9. Mars → Perseverance → koordinata + status `active`.
10. "Unknown location" obyekt marker chizmasligi tekshiriladi.

---

## 15. Performance byudjeti va optimizatsiya

| Element | Byudjet |
|---|---|
| JS bundle (route, gzip) | ≤ 350 KB (3D chunk alohida) |
| Textures | ≤ 2 MB jami sahna uchun; KTX2/WebP, 1024–2048px |
| Draw calls (Earth orbit) | ≤ 40 |
| Markerlar | instanced, 1–3 draw call |
| API sahifa | `page_size` default 50, max 200 |
| 3D obyektlar (sahna) | ≤ 3000 marker, clustering bilan |

Optimizatsiya ro'yxati:
- `next/dynamic` + `Suspense` + skeleton.
- Texture: `KTX2Loader` yoki WebP, `anisotropy` cheklangan.
- `InstancedMesh`, `Points`, custom shader.
- `useFrame` da har frame React setState yo'q.
- `frustumCulled`, `dpr` clamp, `frameloop="demand"` statik sahnada.
- Server-side: pagination, `selectinload` (N+1 yo'q), Redis, materialized view.
- Mars tiles: faqat ko'rinadigan zoom darajasida, cache.
- Prefetch: hover da object detail.
- Request dedupe: TanStack Query.

---

## 16. DevOps va deployment

### 16.1. Docker Compose (dev)

```yaml
services:
  postgres:   # postgis/postgis:16-3.4
  redis:      # redis:7-alpine
  minio:      # minio/minio
  api:        # FastAPI (uvicorn --reload)
  worker:     # celery worker
  beat:       # celery beat
  web:        # next dev
  caddy:      # optional reverse proxy
```

- `make up`, `make migrate`, `make seed`, `make sync GROUP=stations`, `make test`.
- Healthcheck lar: postgres, redis, api.
- Volume lar: `pgdata`, `miniodata`.

### 16.2. Environment (` .env.example `)

```bash
# App
APP_ENV=development
WEB_ORIGIN=http://localhost:3000
API_URL=http://localhost:8000
SECRET_KEY=change-me

# Database / cache / storage
DATABASE_URL=postgresql+asyncpg://space:space@postgres:5432/space_archive
REDIS_URL=redis://redis:6379/0
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minio
S3_SECRET_KEY=minio123
S3_BUCKET=space-archive

# Providers
CELESTRAK_ENABLED=true
CELESTRAK_USER_AGENT="SpaceArchive/1.0 (+https://example.org)"
SPACE_TRACK_USER=
SPACE_TRACK_PASSWORD=
DISCOS_ENABLED=false
DISCOS_TOKEN=
HORIZONS_ENABLED=true

# AI
LLM_PROVIDER=openai
LLM_MODEL=
LLM_API_KEY=
EMBEDDING_MODEL=
TTS_ENABLED=false

# Admin
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
```

### 16.3. Production

- Managed Postgres (PostGIS), managed Redis, S3/R2.
- API: 2+ replicas, `uvicorn` + gunicorn yoki `uvicorn --workers`.
- Celery: alohida worker (sync), alohida beat (bitta instance).
- Next.js: standalone build, CDN oldida.
- TLS, HSTS, backup, monitoring.
- Migratsiyalar deploy pipeline da alohida step.

---

## 17. Bosqichlar, sprintlar va Done mezonlari

> Taxmin: 1 senior full-stack + 1 dizayner/3D (parallel). Yakka ishlasa, har bosqich 1.5–2x. Bu **reja**, kafolat emas.

### PHASE 1 — Foundation (1 hafta)

- [ ] Monorepo, pnpm workspace, tsconfig, eslint, prettier, ruff, mypy.
- [ ] Docker Compose (postgres+postgis, redis, minio).
- [ ] `docs/architecture.md`, `database-schema.md`, `data-sources.md`, `api-documentation.md`, `orbital-calculations.md`, `development-roadmap.md`.
- [ ] Alembic 0001–0003, seed (bodies, sources).
- [ ] FastAPI skelet: `/health`, error handler, logging, settings.
- [ ] Next.js skelet: layout, nav, design tokens, home placeholder.
- [ ] CI: lint + typecheck + unit.

**Done:** `docker compose up` → API health 200, web 200, migratsiya o'tadi, CI yashil.

### PHASE 2 — 3D Solar System (2 hafta)

- [ ] Scene: Sun + 8 planets, starfield, lighting.
- [ ] Orbit rings, labels, hover/click.
- [ ] Kamera rig: focus, smooth transitions, overview.
- [ ] Planet textures (NASA, optimallashtirilgan).
- [ ] Postprocessing (minimal), quality tiers.
- [ ] Home sahifasi cinematic intro.
- [ ] Responsive + reduced motion.

**Done:** 60 FPS desktop, sayyoralar orasida navigatsiya ishlaydi, mobil fallback bor.

### PHASE 3 — Data pipeline (2 hafta)

- [ ] `SpaceDataProvider` protokoli + xatolar + logging.
- [ ] CelesTrak OMM adapter + kesh + `sync_logs`.
- [ ] Ingestion service: normalize → validate → dedupe → upsert → provenance.
- [ ] OMM → SGP4 → TEME/ECEF calculations + testlar.
- [ ] Curated lunar/mars/deep-space import scriptlari.
- [ ] Horizons adapter (deep space).
- [ ] Admin sync endpoint + Celery task.
- [ ] `docs/data-sources.md` yangilangan.

**Done:** `make sync` bilan real obyektlar DB ga tushadi; takroriy sync idempotent; unit testlar yashil; kredensialsiz provayderlar to'g'ri "disabled" holatda.

### PHASE 4 — Interactive mapping (2 hafta)

- [ ] Earth orbit scene + instanced markers + orbit line.
- [ ] Moon scene + verified artefaktlar.
- [ ] Mars scene + lander/roverlar.
- [ ] Object Inspector (barcha bo'limlar, citation).
- [ ] Filterlar (server-side) + URL state.
- [ ] Global search (typeahead).
- [ ] Selection ↔ camera focus.

**Done:** MVP user journey to'liq ishlaydi; har bir obyekt manbali; unknown location to'g'ri ko'rsatiladi.

### PHASE 5 — Scientific visualization (1.5 hafta)

- [ ] Visual/Scientific mode.
- [ ] Freshness/stale indikatorlar.
- [ ] Timeline + tarixiy sana mantiqi.
- [ ] Confidence vizuallari.
- [ ] Statistics/Data Center (real agregatlar).
- [ ] Deep space sahna + epoch yorliqlari.

**Done:** hech qanday "aniq" da'vo manbasiz emas; Data Center raqamlari DB bilan mos.

### PHASE 6 — AI (1 hafta)

- [ ] RAG pipeline + pgvector.
- [ ] `/ai/ask` + citations + guardrails.
- [ ] Object/planet context.
- [ ] Chat UI + "Ask about this object".
- [ ] TTS (ixtiyoriy).
- [ ] AI testlar: citation majburiy, raqam tekshiruvi.

**Done:** AI kontekstda yo'q raqamni aytmaydi (test bilan), har javobda manba.

### PHASE 7 — Hardening & production (1.5 hafta)

- [ ] Performance tuning, Lighthouse, bundle analysis.
- [ ] E2E to'liq to'plam, accessibility.
- [ ] Rate limit, CSP, security review.
- [ ] Monitoring, backup, deploy runbook.
- [ ] `README`, `setup.md`, `deployment.md` yakuniy.
- [ ] Demo dataset va "DEMO/CACHED" yorliqlari.

**Done:** qabul mezonlari checklist 100% (yoki ochiq, asoslangan istisnolar bilan).

**Jami:** ~11 hafta (parallel ish bilan ~7–8 hafta).

---

## 18. Risk register

| # | Risk | Ehtimol | Ta'sir | Chora |
|---|---|---|---|---|
| 1 | Space-Track/DISCOS kredensiali yo'q | Yuqori | O'rta | Adapter + feature flag; MVP CelesTrak + curated bilan to'liq ishlaydi |
| 2 | CelesTrak rate limit / policy buzilishi | O'rta | Yuqori | Kesh, shartli so'rov, sekin sync, User-Agent, limitlar |
| 3 | To'liq katalog performance ni o'ldiradi | Yuqori | Yuqori | Server-side filter, instancing, clustering, sahnalashtirish |
| 4 | Koordinata konventsiyalari xatosi (Oy/Mars) | O'rta | Yuqori | Har yozuvda convention maydoni, reference testlar, manba bilan solishtirish |
| 5 | Eski orbital element bilan noto'g'ri "aniq" da'vo | O'rta | Yuqori | Freshness, `stale` flag, UI ogohlantirish, tarixiy ma'lumot cheklovi |
| 6 | AI hallucination | Yuqori | Yuqori | RAG guardrails, citation, raqam tekshiruvi, "unknown" javobi |
| 7 | Texture/image litsenziyasi | O'rta | O'rta | Faqat public domain/rasmiy, credit, manba yozuvi |
| 8 | Scope creep (barcha sayyoralar, CAD modellar) | Yuqori | O'rta | MVP/v1/v2 kesimi, "v2" ro'yxati |
| 9 | 3D mobil qurilmada sekin | O'rta | O'rta | Quality tier, marker kamaytirish, 2D fallback |
| 10 | Provider sxemasi o'zgaradi | O'rta | O'rta | Schema validation, `ProviderSchemaError`, raw saqlash, alert |
| 11 | Demo ma'lumot "real" bilan aralashib ketadi | O'rta | Yuqori | `is_demo`/`data_quality` belgisi, UI yorliq, alohida seed |
| 12 | Vaqt yetishmasligi (hackathon) | Yuqori | Yuqori | Phase 1–4 ni birinchi tugatish; AI/statistika keyin |

---

## 19. Qabul mezonlari (final checklist)

### Ma'lumot va ilm
- [ ] Har bir ko'rsatilgan obyekt kamida bitta `object_source_record` ga ega.
- [ ] Koordinatasi yo'q obyekt "Unknown location" deb ko'rsatiladi, marker chizilmaydi.
- [ ] Orbital pozitsiya OMM+SGP4 orqali hisoblanadi; epoch va freshness ko'rinadi.
- [ ] Tarixiy sana uchun elementlar bo'lmasa, aniq pozitsiya da'vo qilinmaydi.
- [ ] Active obyekt "abandoned" deb tasniflanmaydi.
- [ ] Mars/Oy koordinatalarida konventsiya va manba saqlanadi.

### UI/UX
- [ ] Solar System interaktiv, silliq, mobil fallback.
- [ ] Earth/Moon/Mars/Deep Space sahnalari ishlaydi.
- [ ] Inspector barcha bo'limlari va manbalar bilan.
- [ ] Filtrlar 3D va counterni yangilaydi.
- [ ] Search ishlaydi (nom, NORAD, designator, missiya).
- [ ] Timeline ishlaydi.
- [ ] Data Center raqamlari real DB dan.
- [ ] Empty/error/loading holatlari bor.
- [ ] Hech qanday bo'sh ("dead") tugma yo'q.

### Backend/API
- [ ] Versioned REST, OpenAPI, pagination, filter, sort.
- [ ] Structured errors, request_id.
- [ ] Rate limit, CORS, admin auth.
- [ ] Provider adapterlari mustaqil yoqiladi/o'chiriladi.
- [ ] Sync idempotent va loglanadi.
- [ ] Sirlar API da ko'rinmaydi.

### Sifat
- [ ] Backend critical testlar 100%, umumiy ≥80%.
- [ ] E2E asosiy journey o'tadi.
- [ ] CI yashil.
- [ ] `docker compose up` + documented setup ishlaydi.
- [ ] Docs: architecture, schema, sources, API, calculations, setup, deployment.

---

## 20. Hujjatlar (deliverables)

| Fayl | Mazmun |
|---|---|
| `README.md` | qisqa tavsif, screenshot, tez start |
| `docs/architecture.md` | komponentlar, oqim, qarorlar (ADR) |
| `docs/database-schema.md` | ER diagramma, jadvallar, indekslar |
| `docs/data-sources.md` | har provayder: maqsad, auth, endpoint, limit, litsenziya, holat |
| `docs/api-documentation.md` | endpointlar, misollar, xatolar |
| `docs/orbital-calculations.md` | formulalar, frame lar, toleranslar, testlar |
| `docs/development-roadmap.md` | fazalar, vazifalar, holat |
| `docs/setup.md` | lokal muhit, env, migrate, seed, sync |
| `docs/deployment.md` | production, backup, monitoring |
| `docs/decisions/` | ADR lar (masalan, OMM vs TLE, pgvector, R3F) |

---

## 21. Birinchi 10 ta amaliy qadam (keyingi ish)

1. Git repo init + `.gitignore`, `README.md`, `reja.md` commit.
2. `docs/` dagi 6 ta hujjat skeletini yozish (bu reja asosida).
3. Monorepo skeleti: `apps/web` (Next.js), `apps/api` (FastAPI), `packages/*`.
4. `docker-compose.yml` + `.env.example` + `Makefile`.
5. Alembic 0001–0003 + seed (celestial bodies, data_sources) → `make migrate && make seed`.
6. FastAPI `/health`, settings, logging, error handler.
7. Next.js layout + design tokens + nav + home placeholder.
8. CelesTrak adapter (faqat `stations`) + `sync_logs` + raw storage → real ISS yozuvi DB da.
9. OMM→SGP4 calculation + unit test (ISS reference).
10. Earth orbit sahna prototipi (globus + 100 ta marker) → keyin kengaytirish.

Har qadamdan keyin: test, commit, docs yangilash. **"Keyin qilaman" degan bo'sh tugma yoki soxta ma'lumot qoldirilmaydi.**

---

## 22. Ochiq savollar (qaror kutilmoqda)

1. **AI provayderi**: OpenAI-compatible bulutmi yoki lokal model (Ollama)? Kalit bormi?
2. **Space-Track akkaunti** mavjudmi? (Agar yo'q — MVP faqat CelesTrak + curated.)
3. **Debris qamrovi**: MVP da obyekt darajasida cheklangan namuna yetarlimi, yoki to'liq katalog talab qilinadimi?
4. **Til**: UI faqat inglizmi yoki uz/ru ham kerakmi? (AI javoblari tili ham.)
5. **Deploy manzili**: lokal demo, Vercel + Railway, yoki o'z server?
6. **Dizayn assetlari**: sayyora teksturalari uchun ruxsat etilgan manbalar (NASA public domain) tasdiqlanganmi?
7. **Demo dataset hajmi**: hakamlarga ko'rsatish uchun qancha obyekt "yetarli"?

Bu savollarga javoblar arxitekturani o'zgartirmaydi, lekin scope va vaqtni aniqlashtiradi.

---

## 23. Xulosa

SPACE ARCHIVE — bu 3D "wow" va ilmiy ishonchning kesishmasi. Uning muvaffaqiyati quyidagilarga bog'liq:

1. **Provenance-first ma'lumot modeli** — har bir raqam ortida manba.
2. **OMM + SGP4 + hujjatlashtirilgan transformatsiyalar** — pozitsiya "chiroyli" emas, tekshiriladigan.
3. **NULL siyosati** — yo'q ma'lumot yo'qligicha qoladi.
4. **Provider mustaqilligi** — bitta manba ishlamasa platforma o'lmaydi.
5. **Performance byudjeti** — 30k obyektni brauzerga tashlamaslik.
6. **Bosqichma-bosqich yetkazish** — har fazada ishlaydigan, testlangan mahsulot.

> **Build the actual product, not just a concept or a visual prototype.**

---

*Hujjat oxiri. O'zgarishlar tarixi: v1.0 — boshlang'ich to'liq reja.*
