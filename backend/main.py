import os
from typing import Optional

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "covid_weekly.csv")
TITLE_FIX = {"District Of Columbia": "District of Columbia"}

_STATE_INDEX: dict[str, list[dict]] = {}
_YEARS: list[int] = []


class StateDataPoint(BaseModel):
    state: str
    infected: int
    deaths: int
    is_interpolated: Optional[bool]


class DataRequest(BaseModel):
    disease: str
    year: int
    month: int = 1


def _load_data() -> None:
    global _STATE_INDEX, _YEARS

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


# pip install fastapi uvicorn pandas
# uvicorn main:app --reload --port 8000
