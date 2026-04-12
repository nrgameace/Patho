# Disease Spread Tracker — Hackathon Project
## WashU Google DevFest Hackathon

---

## Project Overview

An interactive disease spread prediction dashboard aimed at helping governmental healthcare providers create better policies. Users can visualize historical outbreak data on a US map, track spread through travel routes, and see AI-generated predictions for future spread.

---

## Team & Responsibilities

| Person | Role | Tasks |
|---|---|---|
| **Lukas** | Frontend (Vercel) | Intro page, interactive map (Google Maps satellite), time slider, disease selector, stats sidebar, commercial transportation overlay |
| **Nick** | Backend + AI | FastAPI backend, CDC data scraping/fetching, Featherless.ai model integration, Cloud Run deploy |
| **Lucas** | Narration | ElevenLabs narration of outbreak story, triggered at time slider milestones |

---

## Tech Stack

### Frontend (Lukas)


### Backend (Nick)
- **FastAPI** + **pandas** (Python)
- **Cloud Run** — final deployment (deploy last 1-2 hours)
- **Featherless.ai API** — open source LLM (Llama 3.1 8B) for predictions
- Develop **locally first**, deploy to Cloud Run at end
- Dependencies: `fastapi`, `uvicorn`, `pandas`, `requests`

### Narration (Lucas)
- **ElevenLabs** — pre-generate 2-3 narration clips
- Triggered by time slider milestones (not real-time generation)

---

## Google Cloud Credits ($300)

| Service | Purpose | Est. Cost |
|---|---|---|
| **Cloud Run** | Host FastAPI backend | ~$5-10 |
| **Google Maps API** | Satellite tiles for Lukas | ~$10-20 |
| **Vertex AI** | SKIP — use Featherless instead | $0 |

> Do NOT use BigQuery, Cloud Functions, Pub/Sub — overkill for hackathon timeline.



---

## Architecture

```
CDC Data API (data.cdc.gov)
        ↓
fetch_data.py (run once to pull & save CSVs)
        ↓
/backend/data/*.csv (local CSV files, loaded at startup)
        ↓
FastAPI Backend (local → Cloud Run)
        ↓
Featherless.ai API (predictions)
        ↓
React Frontend (Vercel) ← Google Maps satellite tiles
```

> No Firestore — data is pre-fetched and stored as local CSVs. FastAPI loads them once at startup.

---

## Data Sources

I want to download a limited amount of data and store it locally. This way all requests to the backend endpoints can be fufilled quickly.

### Fetched & Saved CSVs (run `python backend/fetch_data.py` to refresh)

| File | Source | Columns | Coverage |
|---|---|---|---|
| `backend/data/covid_weekly.csv` | CDC `pwn4-m3yp` (Socrata) | state, week, infected, deaths | 2020–2023, ~2091 rows |
| `backend/data/covid_cases.csv` | CDC `n8mc-b4w4` (Socrata) | state, month, age_group, total_cases, deaths, hospitalized | 2020–2024, ~265 rows |
| `backend/data/covid_vaccinations.csv` | Our World in Data GitHub CSV | state, week, vaccinated, fully_vaccinated | 2021–2023, ~1450 rows |

**All dates normalized to `YYYY-MM-01` format. State names are full names (e.g. "California"), not abbreviations.**

### Data Limitations to Know
- CDC case surveillance updates **discontinued July 1, 2024** — predictions extrapolate from data ending 2023/early 2024
- States that dropped out early: Iowa, Kansas, Kentucky, Louisiana, NH, Oklahoma
- Actual CDC API column is `tot_deaths` (plural) — not `tot_death`



---

## API Endpoints

### Implemented (`backend/main.py`)

```
GET /api/health
→ { "status": "ok" }

GET /api/years
→ [2020, 2021, 2022, 2023]

POST /api/getData
Body: { "disease": "covid", "year": 2021, "month": 6 }
→ [{ "state": "California", "infected": 12000, "deaths": 340, "is_interpolated": false }, ...]
  Returns all 51 states sorted alphabetically.
  is_interpolated: false = exact match, true = nearest month used (±3 months, same year only), null = no data
```

### Still to Build
```
POST /api/predict
→ Featherless prediction for next 8 weeks: [{ state, week, predicted_infections }]
```

---

## Featherless.ai Integration

- **Model:** Llama 3.1 8B
- **Strategy:** Pass last 12 weeks of real CDC data as context, get next 8 weeks back
- **Prompt pattern:**
```
Given weekly COVID infection data by US state for 2020-2024 (attached),
predict infections for each state for the next 8 weeks.
Return JSON: [{ state, week, predicted_infections }]
```
- This is prompt-based inference, NOT training from scratch

---

## Key Features (Priority Order)

1. **Interactive satellite map with real CDC data** — choropleth gradient by infection count
2. **Time slider** — scrub through historical data; past = real data, 2026+ = predictions
3. **Disease selector** — start with COVID, expandable
4. **AI predictions** — Featherless.ai predicts future spread
5. **Commercial travel routes** — flight/road overlay toggle
6. **ElevenLabs narration** — triggered at key timeline milestones
7. **Stats sidebar** — deaths, infected, vaccinated per state

### Prediction Mode Visual Indicators
When time slider enters prediction territory (2026+):
- Dashed border on map
- Different color tone
- "PREDICTED" badge visible

---

---

## Local Dev Setup (Nick)
Anaconda environment on Python 3.11 — activate with `conda activate devfest26`.
Ensure any new packages are installed in the environment. All backend code lives in `/backend/`.

```bash
# Install dependencies
conda activate devfest26
pip install fastapi uvicorn pandas requests

# Refresh local CSV data (only needed if data is stale)
python backend/fetch_data.py

# Run the backend server
uvicorn backend.main:app --reload --port 8000
```

---

## Credits Available
- **Google Cloud** — $300
- **Featherless.ai** — LLM inference
- **ElevenLabs** — narration generation


## Backend File Structure
```
backend/
  main.py           ← FastAPI app (load data at startup, serve endpoints)
  fetch_data.py     ← One-time data fetch script (writes CSVs to backend/data/)
  data/
    covid_weekly.csv
    covid_cases.csv
    covid_vaccinations.csv
```