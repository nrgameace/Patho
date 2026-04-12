import os
from typing import Optional

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DATA_PATH         = os.path.join(os.path.dirname(__file__), "data", "covid_weekly.csv")
HESITANCY_PATH    = os.path.join(os.path.dirname(__file__), "data", "vaccine_hesitancy.csv")
SURVEILLANCE_PATH = os.path.join(os.path.dirname(__file__), "data", "case_surveillance.csv")
PREDICTIONS_PATH  = os.path.join(os.path.dirname(__file__), "data", "predictions.csv")
TRANSMISSION_PATH = os.path.join(os.path.dirname(__file__), "output", "cdc_county_monthly.csv")
TITLE_FIX = {"District Of Columbia": "District of Columbia"}

STATE_ABBREV = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
    "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
    "District of Columbia": "DC", "Florida": "FL", "Georgia": "GA", "Hawaii": "HI",
    "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
    "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME",
    "Maryland": "MD", "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN",
    "Mississippi": "MS", "Missouri": "MO", "Montana": "MT", "Nebraska": "NE",
    "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM",
    "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
    "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI",
    "South Carolina": "SC", "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX",
    "Utah": "UT", "Vermont": "VT", "Virginia": "VA", "Washington": "WA",
    "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
}
ABBREV_TO_STATE = {v: k for k, v in STATE_ABBREV.items()}

_STATE_INDEX: dict[str, list[dict]] = {}
_YEARS: list[int] = []
_HESITANCY_BY_STATE: dict[str, list[dict]] = {}
_HESITANCY_BY_FIPS: dict[str, dict] = {}
_SURVEILLANCE_BY_FIPS: dict[str, list[dict]] = {}
_PREDICTIONS_INDEX: dict[tuple[str, int], list[dict]] = {}
_TRANSMISSION_BY_STATE: dict[str, dict[str, list[dict]]] = {}


class StateDataPoint(BaseModel):
    state: str
    infected: int
    deaths: int
    is_interpolated: Optional[bool]


class DataRequest(BaseModel):
    disease: str
    year: int
    month: int = 1


class VaccineHesitancyRequest(BaseModel):
    stateCode: str


class VaccineHesitancyByFipsRequest(BaseModel):
    fipsCode: str


class CaseSurveillanceRequest(BaseModel):
    fipsCode: str
    year: Optional[int] = None


class VaccineHesitancyPoint(BaseModel):
    fipsCode: str
    countyName: str
    stateCode: str
    estimatedHesitant: float
    estimatedHesitantOrUnsure: float
    estimatedStronglyHesitant: float
    socialVulnerabilityIndex: float
    socialVulnerabilityCategory: str
    abilityToHandleCovid: float
    cvacCategory: str


class CaseSurveillancePoint(BaseModel):
    state: str
    county: str
    fipsCode: str
    caseMonth: str
    totalCases: int
    deaths: int
    hospitalizations: int
    icuAdmissions: int


class PredictionRequest(BaseModel):
    state: str
    year: int


class CountyPrediction(BaseModel):
    fips: str
    county: str
    state: str
    year: int
    infected: int
    deaths: int


class StateCountiesRequest(BaseModel):
    stateCode: str


class CountyYearData(BaseModel):
    id: str
    name: str
    cases: dict[int, int]
    deaths: dict[int, int]


class StateYearData(BaseModel):
    id: str
    name: str
    cases: dict[int, int]
    deaths: dict[int, int]


def _load_data() -> None:
    global _STATE_INDEX, _YEARS, _HESITANCY_BY_STATE, _HESITANCY_BY_FIPS, _SURVEILLANCE_BY_FIPS, _PREDICTIONS_INDEX, _TRANSMISSION_BY_STATE

    df = pd.read_csv(DATA_PATH)
    df["week"] = pd.to_datetime(df["week"])
    df["year"] = df["week"].dt.year.astype(int)
    df["month"] = df["week"].dt.month.astype(int)
    df["state"] = df["state"].str.strip().str.title().replace(TITLE_FIX)
    df["infected"] = pd.to_numeric(df["infected"], errors="coerce").fillna(0)
    df["deaths"] = pd.to_numeric(df["deaths"], errors="coerce").fillna(0)

    _YEARS = sorted(df["year"].unique().tolist())

    for state, group in df.groupby("state"):
        rows = (
            group[["year", "month", "infected", "deaths"]]
            .sort_values(["year", "month"])
            .to_dict("records")
        )
        _STATE_INDEX[state] = rows

    hdf = pd.read_csv(HESITANCY_PATH)
    hdf["fips_code"]    = hdf["fips_code"].astype(str).str.strip().str.zfill(5)
    hdf["county_name"]  = hdf["county_name"].str.strip().str.title()
    hdf["state_code"]   = hdf["state_code"].str.strip().str.upper()
    hdf["svi_category"] = hdf["svi_category"].str.strip().str.title()
    hdf["cvac_category"] = hdf["cvac_category"].str.strip().str.title()
    for col in ["estimated_hesitant", "estimated_hesitant_or_unsure",
                "estimated_strongly_hesitant", "social_vulnerability_index",
                "ability_to_handle_a_covid"]:
        hdf[col] = pd.to_numeric(hdf[col], errors="coerce").fillna(0)

    for state_code, grp in hdf.groupby("state_code"):
        _HESITANCY_BY_STATE[state_code] = grp.sort_values("county_name").to_dict("records")

    _HESITANCY_BY_FIPS = {row["fips_code"]: row for row in hdf.to_dict("records")}

    sdf = pd.read_csv(SURVEILLANCE_PATH)
    sdf["res_state"]        = sdf["res_state"].str.strip().str.title()
    sdf["res_county"]       = sdf["res_county"].str.strip().str.title()
    sdf["county_fips_code"] = pd.to_numeric(sdf["county_fips_code"], errors="coerce").fillna(0).astype(int).astype(str).str.zfill(5)
    sdf["case_month"]       = sdf["case_month"].astype(str).str.strip()
    for col in ["total_cases", "deaths", "hospitalizations", "icu_admissions"]:
        sdf[col] = pd.to_numeric(sdf[col], errors="coerce").fillna(0).astype(int)

    for fips, grp in sdf.groupby("county_fips_code"):
        _SURVEILLANCE_BY_FIPS[fips] = grp.sort_values("case_month").to_dict("records")

    pdf = pd.read_csv(PREDICTIONS_PATH)
    pdf["fips"]     = pdf["fips"].astype(str).str.strip().str.zfill(5)
    pdf["county"]   = pdf["county"].str.strip().str.title()
    pdf["state"]    = pdf["state"].str.strip().str.title().replace(TITLE_FIX)
    pdf["year"]     = pd.to_numeric(pdf["year"], errors="coerce").fillna(0).astype(int) - 1
    pdf["infected"] = pd.to_numeric(pdf["infected"], errors="coerce").fillna(0).astype(int)
    pdf["deaths"]   = pd.to_numeric(pdf["deaths"], errors="coerce").fillna(0).astype(int)

    for (state, year), grp in pdf.groupby(["state", "year"]):
        _PREDICTIONS_INDEX[(state, year)] = grp.sort_values("county").to_dict("records")

    if os.path.exists(TRANSMISSION_PATH):
        tdf = pd.read_csv(TRANSMISSION_PATH)
        tdf["fips_code"] = tdf["fips_code"].astype(str).str.strip().str.zfill(5)
        tdf["date"] = pd.to_datetime(tdf["date"], errors="coerce")
        tdf["year"] = tdf["date"].dt.year.astype(int)
        tdf["cases_per_100K_7_day_count_change"] = pd.to_numeric(tdf["cases_per_100K_7_day_count_change"], errors="coerce").fillna(0)
        tdf["state_name"] = tdf["state_name"].str.strip()
        tdf["county_name"] = tdf["county_name"].str.strip()
        for state_name, state_grp in tdf.groupby("state_name"):
            by_fips: dict[str, list[dict]] = {}
            for fips, fips_grp in state_grp.groupby("fips_code"):
                by_fips[fips] = fips_grp[["fips_code", "county_name", "year", "cases_per_100K_7_day_count_change"]].to_dict("records")
            _TRANSMISSION_BY_STATE[state_name] = by_fips


def _hesitancy_record_to_point(r: dict) -> VaccineHesitancyPoint:
    return VaccineHesitancyPoint(
        fipsCode=r["fips_code"],
        countyName=r["county_name"],
        stateCode=r["state_code"],
        estimatedHesitant=float(r["estimated_hesitant"]),
        estimatedHesitantOrUnsure=float(r["estimated_hesitant_or_unsure"]),
        estimatedStronglyHesitant=float(r["estimated_strongly_hesitant"]),
        socialVulnerabilityIndex=float(r["social_vulnerability_index"]),
        socialVulnerabilityCategory=str(r["svi_category"]),
        abilityToHandleCovid=float(r["ability_to_handle_a_covid"]),
        cvacCategory=str(r["cvac_category"]),
    )


def _query_state(state: str, rows: list[dict], year: int, month: int) -> StateDataPoint:
    year_rows = [r for r in rows if r["year"] == year]

    for r in year_rows:
        if r["month"] == month:
            return StateDataPoint(state=state, infected=int(r["infected"]), deaths=int(r["deaths"]), is_interpolated=False)

    candidates = [r for r in year_rows if abs(r["month"] - month) <= 3]
    if candidates:
        best = min(candidates, key=lambda r: abs(r["month"] - month))
        return StateDataPoint(state=state, infected=int(best["infected"]), deaths=int(best["deaths"]), is_interpolated=True)

    return StateDataPoint(state=state, infected=0, deaths=0, is_interpolated=None)


_load_data()

app = FastAPI(title="Patho Disease Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/years")
def get_years() -> list[int]:
    return _YEARS


@app.post("/api/getData", response_model=list[StateDataPoint])
def get_data(body: DataRequest) -> list[StateDataPoint]:
    if body.disease.lower() != "covid":
        raise HTTPException(status_code=400, detail=f"Unsupported disease: '{body.disease}'. Only 'covid' is supported.")

    results = [_query_state(state, rows, body.year, body.month) for state, rows in _STATE_INDEX.items()]
    return sorted(results, key=lambda r: r.state)


@app.post("/api/getVaccineHesitancy", response_model=list[VaccineHesitancyPoint])
def get_vaccine_hesitancy(body: VaccineHesitancyRequest) -> list[VaccineHesitancyPoint]:
    rows = _HESITANCY_BY_STATE.get(body.stateCode.strip().upper(), [])
    return [_hesitancy_record_to_point(r) for r in rows]


@app.post("/api/getVaccineHesitancyByFips", response_model=list[VaccineHesitancyPoint])
def get_vaccine_hesitancy_by_fips(body: VaccineHesitancyByFipsRequest) -> list[VaccineHesitancyPoint]:
    row = _HESITANCY_BY_FIPS.get(body.fipsCode.strip().zfill(5))
    return [_hesitancy_record_to_point(row)] if row else []


@app.post("/api/getCaseSurveillance", response_model=list[CaseSurveillancePoint])
def get_case_surveillance(body: CaseSurveillanceRequest) -> list[CaseSurveillancePoint]:
    rows = _SURVEILLANCE_BY_FIPS.get(body.fipsCode.strip().zfill(5), [])
    if body.year is not None:
        rows = [r for r in rows if r["case_month"].startswith(str(body.year))]
    return [
        CaseSurveillancePoint(
            state=r["res_state"],
            county=r["res_county"],
            fipsCode=r["county_fips_code"],
            caseMonth=r["case_month"],
            totalCases=int(r["total_cases"]),
            deaths=int(r["deaths"]),
            hospitalizations=int(r["hospitalizations"]),
            icuAdmissions=int(r["icu_admissions"]),
        )
        for r in rows
    ]


@app.post("/api/getPredictions", response_model=list[CountyPrediction])
def get_predictions(body: PredictionRequest) -> list[CountyPrediction]:
    if body.year < 2024 or body.year > 2027:
        raise HTTPException(status_code=400, detail="Predictions only available for years 2024-2027")
    state = body.state.strip().title()
    rows = _PREDICTIONS_INDEX.get((state, body.year), [])
    return [
        CountyPrediction(
            fips=r["fips"],
            county=r["county"],
            state=r["state"],
            year=int(r["year"]),
            infected=int(r["infected"]),
            deaths=int(r["deaths"]),
        )
        for r in rows
    ]


@app.get("/api/getAllStateData", response_model=list[StateYearData])
def get_all_state_data() -> list[StateYearData]:
    all_years = list(range(2020, 2028))
    results = []
    for state_name, rows in _STATE_INDEX.items():
        abbrev = STATE_ABBREV.get(state_name)
        if not abbrev:
            continue
        cases: dict[int, int] = {}
        deaths: dict[int, int] = {}
        for yr in all_years:
            if yr <= 2023:
                point = _query_state(state_name, rows, yr, 6)
                cases[yr] = point.infected
                deaths[yr] = point.deaths
            else:
                preds = _PREDICTIONS_INDEX.get((state_name, yr), [])
                cases[yr] = sum(int(r["infected"]) for r in preds)
                deaths[yr] = sum(int(r["deaths"]) for r in preds)
        results.append(StateYearData(id=abbrev, name=state_name, cases=cases, deaths=deaths))
    return sorted(results, key=lambda r: r.name)


@app.post("/api/getStateCounties", response_model=list[CountyYearData])
def get_state_counties(body: StateCountiesRequest) -> list[CountyYearData]:
    state_code = body.stateCode.strip().upper()
    full_state_name = ABBREV_TO_STATE.get(state_code, "")

    fips_set: set[str] = set()
    county_names: dict[str, str] = {}

    for r in _HESITANCY_BY_STATE.get(state_code, []):
        fips_set.add(r["fips_code"])
        raw_name = r["county_name"]
        county_names[r["fips_code"]] = raw_name.rsplit(",", 1)[0].strip() if "," in raw_name else raw_name

    transmission_fips = _TRANSMISSION_BY_STATE.get(full_state_name, {})
    for fips, rows in transmission_fips.items():
        fips_set.add(fips)
        if fips not in county_names and rows:
            county_names[fips] = rows[0]["county_name"]

    for yr in range(2024, 2028):
        for r in _PREDICTIONS_INDEX.get((full_state_name, yr), []):
            fips_set.add(r["fips"])
            if r["fips"] not in county_names:
                county_names[r["fips"]] = r["county"]

    results = []
    for fips in sorted(fips_set):
        cases: dict[int, int] = {}
        deaths: dict[int, int] = {}

        trans_rows = transmission_fips.get(fips, [])
        for r in trans_rows:
            yr = int(r["year"])
            cases[yr] = cases.get(yr, 0) + int(round(r["cases_per_100K_7_day_count_change"]))

        surv_rows = _SURVEILLANCE_BY_FIPS.get(fips, [])
        for r in surv_rows:
            yr = int(r["case_month"][:4])
            deaths[yr] = deaths.get(yr, 0) + int(r["deaths"])
            if yr not in cases:
                cases[yr] = cases.get(yr, 0) + int(r["total_cases"])

        for yr in range(2024, 2028):
            for r in _PREDICTIONS_INDEX.get((full_state_name, yr), []):
                if r["fips"] == fips:
                    cases[yr] = int(r["infected"])
                    deaths[yr] = int(r["deaths"])
                    break

        name = county_names.get(fips, f"County {fips}")
        results.append(CountyYearData(id=fips, name=name, cases=cases, deaths=deaths))
    return results


# pip install fastapi uvicorn pandas
# uvicorn main:app --reload --port 8000
