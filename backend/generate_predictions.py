import os
import json
import re
import time
import traceback

import pandas as pd
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
FEATHERLESS_KEY = os.getenv("FEATHERLESS_KEY")
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
BATCH_SIZE = 20
MODEL = "Qwen/Qwen2.5-7B-Instruct"

STATE_ABBREV_MAP = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
    "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
    "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho",
    "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas",
    "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi",
    "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada",
    "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York",
    "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma",
    "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah",
    "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia",
    "WI": "Wisconsin", "WY": "Wyoming", "DC": "District of Columbia",
}


def load_hesitancy() -> dict[str, list[dict]]:
    df = pd.read_csv(os.path.join(DATA_DIR, "vaccine_hesitancy.csv"))
    df["fips_code"] = df["fips_code"].astype(str).str.strip().str.zfill(5)
    df["state_code"] = df["state_code"].str.strip().str.upper()
    for col in ["estimated_hesitant", "estimated_strongly_hesitant",
                "social_vulnerability_index", "ability_to_handle_a_covid"]:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    return {sc: grp.sort_values("county_name").to_dict("records")
            for sc, grp in df.groupby("state_code")}


def load_surveillance() -> dict[str, dict[int, dict]]:
    df = pd.read_csv(os.path.join(DATA_DIR, "case_surveillance.csv"))
    df["county_fips_code"] = df["county_fips_code"].astype(str).str.zfill(5)
    df["year"] = pd.to_datetime(df["case_month"]).dt.year
    for col in ["total_cases", "deaths"]:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    grouped = df.groupby(["county_fips_code", "year"])[["total_cases", "deaths"]].sum()
    result: dict[str, dict[int, dict]] = {}
    for (fips, year), row in grouped.iterrows():
        result.setdefault(fips, {})[int(year)] = {
            "cases": int(row["total_cases"]),
            "deaths": int(row["deaths"]),
        }
    return result


def load_state_covid() -> dict[str, dict[int, dict]]:
    df = pd.read_csv(os.path.join(DATA_DIR, "covid_weekly.csv"))
    df["year"] = pd.to_datetime(df["week"]).dt.year
    df["state"] = df["state"].str.strip().str.title()
    for col in ["infected", "deaths"]:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    grouped = df.groupby(["state", "year"])[["infected", "deaths"]].sum()
    result: dict[str, dict[int, dict]] = {}
    for (state, year), row in grouped.iterrows():
        result.setdefault(state, {})[int(year)] = {
            "infected": int(row["infected"]),
            "deaths": int(row["deaths"]),
        }
    return result


def load_vaccinations() -> dict[str, dict[int, dict]]:
    df = pd.read_csv(os.path.join(DATA_DIR, "covid_vaccinations.csv"))
    df["year"] = pd.to_datetime(df["week"]).dt.year
    df["state"] = df["state"].str.strip().str.title()
    for col in ["vaccinated", "fully_vaccinated"]:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    grouped = df.groupby(["state", "year"])[["vaccinated", "fully_vaccinated"]].max()
    result: dict[str, dict[int, dict]] = {}
    for (state, year), row in grouped.iterrows():
        result.setdefault(state, {})[int(year)] = {
            "vaccinated": int(row["vaccinated"]),
            "fully_vaccinated": int(row["fully_vaccinated"]),
        }
    return result


def load_flight_context() -> dict[str, str]:
    df = pd.read_csv(os.path.join(DATA_DIR, "flight_covid.csv"))
    df["year"] = pd.to_datetime(df["Date"]).dt.year
    result: dict[str, list[str]] = {}
    for (origin, year), grp in df.groupby(["Origin State Abbrev", "year"]):
        top5 = grp.groupby("Destination State Abbrev").size().nlargest(5)
        entry = ", ".join(f"{dest}({cnt})" for dest, cnt in top5.items())
        result.setdefault(origin, []).append(f"{year}: {entry}")
    return {k: "\n".join(v) for k, v in result.items()}


def build_section_a(state_name: str, state_covid: dict, vaccinations: dict) -> str:
    lines = ["Year | StateInfected | StateDeaths | Vaccinated | FullyVaccinated"]
    covid = state_covid.get(state_name, {})
    vacc = vaccinations.get(state_name, {})
    for year in range(2020, 2025):
        c = covid.get(year, {})
        v = vacc.get(year, {})
        lines.append(
            f"{year} | {c.get('infected', 0):<13} | {c.get('deaths', 0):<11} | "
            f"{v.get('vaccinated', 0):<10} | {v.get('fully_vaccinated', 0)}"
        )
    return "\n".join(lines)


def build_section_b(state_abbrev: str, flight_context: dict) -> str:
    return flight_context.get(state_abbrev, "No flight data available")


def build_section_c(counties: list[dict], surveillance: dict) -> str:
    header = "fips | county_name | hesitant% | strong_hesitant% | svi | cvac | 2020_cases | 2020_deaths | 2021_cases | 2021_deaths | 2022_cases | 2022_deaths | 2023_cases | 2023_deaths"
    rows = [header]
    for r in counties:
        fips = r["fips_code"]
        surv = surveillance.get(fips, {})
        def sc(year: int, key: str) -> str:
            return str(surv[year][key]) if year in surv else ""
        rows.append(
            f"{fips} | {r['county_name']} | {r['estimated_hesitant']:.3f} | "
            f"{r['estimated_strongly_hesitant']:.3f} | {r['social_vulnerability_index']:.3f} | "
            f"{r['ability_to_handle_a_covid']:.3f} | "
            f"{sc(2020,'cases')} | {sc(2020,'deaths')} | "
            f"{sc(2021,'cases')} | {sc(2021,'deaths')} | "
            f"{sc(2022,'cases')} | {sc(2022,'deaths')} | "
            f"{sc(2023,'cases')} | {sc(2023,'deaths')}"
        )
    return "\n".join(rows)


def build_prompt(state_name: str, section_a: str, section_b: str, section_c: str) -> str:
    return f"""You are an epidemiological forecasting assistant predicting future COVID-19 spread at the county level.

State: {state_name}
Task: Predict yearly infected and deaths for EVERY county listed below for years 2025, 2026, 2027, and 2028.

STATE-LEVEL HISTORICAL CONTEXT (2020-2024):
{section_a}

STATE FLIGHT CONNECTIVITY (yearly top destinations):
{section_b}

COUNTY DATA (fips | county | hesitant% | strong_hesitant% | svi | cvac | 2020_cases | 2020_deaths | 2021_cases | 2021_deaths | 2022_cases | 2022_deaths | 2023_cases | 2023_deaths):
{section_c}

Rules you MUST follow:
- Generate predictions for EVERY county row listed above — do not skip any
- Predictions must follow the trend direction established in 2022-2023 data
- Counties with higher hesitancy scores should trend higher than low hesitancy neighbors
- Counties with higher SVI (social vulnerability) should trend relatively higher
- Year-over-year change must not exceed 40% in either direction
- Deaths must always be less than infected — use roughly a 1-3% death rate
- Do not predict zero for any field — use at minimum 10 infected, 1 death for very small/rural counties
- Counties with missing historical data should be estimated relative to neighboring counties in the table based on their hesitancy and SVI scores
- Respond ONLY with valid JSON array, no explanation, no markdown, no backticks

Required output format (one object per county per year = 4 objects per county):
[
  {{"fips": "01001", "county": "Autauga County", "state": "{state_name}", "year": 2025, "infected": 1234, "deaths": 12}},
  {{"fips": "01001", "county": "Autauga County", "state": "{state_name}", "year": 2026, "infected": 1189, "deaths": 11}},
  ...
]"""


def call_featherless(client: OpenAI, prompt: str, retries: int = 2) -> str:
    prompt_len = len(prompt)
    print(f"\n  [DEBUG] Calling {MODEL} | prompt length: {prompt_len} chars", flush=True)
    for attempt in range(1, retries + 2):
        try:
            start = time.time()
            resp = client.chat.completions.create(
                model=MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=12000,
                temperature=0.3,
            )
            elapsed = time.time() - start
            raw = resp.choices[0].message.content
            print(f"  [DEBUG] Response received in {elapsed:.1f}s | response length: {len(raw)} chars", flush=True)
            return raw
        except Exception as e:
            print(f"\n  [DEBUG] Attempt {attempt}/{retries + 1} failed: {type(e).__name__}: {e}", flush=True)
            if attempt <= retries:
                wait = 3 * attempt
                print(f"  [DEBUG] Retrying in {wait}s...", flush=True)
                time.sleep(wait)
            else:
                raise


def validate_rows(rows: list[dict], state: str, batch_num: int) -> list[dict]:
    required = {"fips", "county", "state", "year", "infected", "deaths"}
    valid = []
    dropped = 0
    for row in rows:
        if not required.issubset(row.keys()):
            dropped += 1
            continue
        try:
            row["year"] = int(row["year"])
            row["infected"] = max(10, int(row["infected"]))
            row["deaths"] = max(1, int(row["deaths"]))
        except (ValueError, TypeError):
            dropped += 1
            continue
        if row["deaths"] >= row["infected"]:
            row["deaths"] = max(1, int(row["infected"] * 0.02))
        if row["year"] not in (2025, 2026, 2027, 2028):
            dropped += 1
            continue
        valid.append(row)
    if dropped > 0:
        print(f"  [{state} batch {batch_num}] dropped {dropped} invalid rows")
    return valid


def parse_prediction_response(raw: str, state: str, batch_num: int) -> list[dict]:
    text = re.sub(r'```json', '', raw)
    text = re.sub(r'```', '', text)
    text = text.strip()

    try:
        result = json.loads(text)
        if isinstance(result, list):
            return validate_rows(result, state, batch_num)
    except json.JSONDecodeError:
        pass

    text_fixed = re.sub(r',\s*([}\]])', r'\1', text)
    try:
        result = json.loads(text_fixed)
        if isinstance(result, list):
            return validate_rows(result, state, batch_num)
    except json.JSONDecodeError:
        pass

    arrays = re.findall(r'\[.*?\]', text_fixed, re.DOTALL)
    if arrays:
        combined = []
        for arr_str in arrays:
            arr_str = re.sub(r',\s*([}\]])', r'\1', arr_str)
            try:
                parsed = json.loads(arr_str)
                if isinstance(parsed, list):
                    combined.extend(parsed)
            except json.JSONDecodeError:
                continue
        if combined:
            return validate_rows(combined, state, batch_num)

    objects = re.findall(r'\{[^{}]+\}', text_fixed, re.DOTALL)
    if objects:
        combined = []
        for obj_str in objects:
            obj_str = re.sub(r',\s*([}\]])', r'\1', obj_str)
            try:
                parsed = json.loads(obj_str)
                if isinstance(parsed, dict):
                    combined.append(parsed)
            except json.JSONDecodeError:
                continue
        if combined:
            print(f"  [{state} batch {batch_num}] WARNING: recovered {len(combined)} objects via fallback extraction")
            return validate_rows(combined, state, batch_num)

    print(f"  [{state} batch {batch_num}] PARSE FAILED — first 300 chars: {raw[:300]}")
    return []


def predict_state(client: OpenAI, state_abbrev: str, counties: list[dict],
                  surveillance: dict, state_covid: dict, vaccinations: dict,
                  flight_context: dict) -> list[dict]:
    state_name = STATE_ABBREV_MAP.get(state_abbrev, state_abbrev)
    batches = [counties[i:i + BATCH_SIZE] for i in range(0, len(counties), BATCH_SIZE)]
    all_rows: list[dict] = []
    for i, batch in enumerate(batches, 1):
        label = f"{state_name} batch {i}/{len(batches)}" if len(batches) > 1 else state_name
        print(f"Predicting {label} ({len(batch)} counties)...", end=" ", flush=True)
        section_a = build_section_a(state_name, state_covid, vaccinations)
        section_b = build_section_b(state_abbrev, flight_context)
        section_c = build_section_c(batch, surveillance)
        prompt = build_prompt(state_name, section_a, section_b, section_c)
        try:
            raw = call_featherless(client, prompt)
            rows = parse_prediction_response(raw, state_name, i)
            if rows:
                all_rows.extend(rows)
                print("done")
            else:
                print("failed (parse error)")
        except Exception as e:
            print(f"failed ({type(e).__name__}: {e})")
            traceback.print_exc()
        if i < len(batches):
            time.sleep(1.5)
    return all_rows


def main() -> None:
    if not FEATHERLESS_KEY:
        print("ERROR: FEATHERLESS_KEY not found in environment. Check backend/.env")
        return
    print(f"[DEBUG] API key loaded: {FEATHERLESS_KEY[:8]}...{FEATHERLESS_KEY[-4:]}")
    print(f"[DEBUG] Base URL: https://api.featherless.ai/v1")
    print(f"[DEBUG] Model: {MODEL}")
    client = OpenAI(
        base_url="https://api.featherless.ai/v1",
        api_key=FEATHERLESS_KEY,
        timeout=120.0,
    )
    hesitancy = load_hesitancy()
    surveillance = load_surveillance()
    state_covid = load_state_covid()
    vaccinations = load_vaccinations()
    flight_context = load_flight_context()

    failed: list[str] = []
    states = sorted(hesitancy.keys())
    out_path = os.path.join(DATA_DIR, "predictions.csv")

    existing_rows: list[dict] = []
    completed_states: set[str] = set()
    if os.path.exists(out_path):
        existing_df = pd.read_csv(out_path)
        existing_rows = existing_df.to_dict("records")
        completed_states = set(existing_df["state"].unique())
        print(f"[DEBUG] Loaded {len(existing_rows)} existing rows for states: {sorted(completed_states)}")

    all_rows = list(existing_rows)
    retry_states = {"ID", "NM", "NY", "OR", "VT"}

    for state_abbrev in states:
        if state_abbrev not in retry_states:
            continue
        counties = hesitancy[state_abbrev]
        rows = predict_state(client, state_abbrev, counties, surveillance,
                             state_covid, vaccinations, flight_context)
        if rows:
            all_rows.extend(rows)
            state_df = pd.DataFrame(rows, columns=["fips", "county", "state", "year", "infected", "deaths"])
            state_df.to_csv(out_path, mode="a", header=not os.path.exists(out_path), index=False)
        else:
            failed.append(state_abbrev)
        time.sleep(1.5)

    final_df = pd.DataFrame(all_rows, columns=["fips", "county", "state", "year", "infected", "deaths"])
    final_df = final_df.sort_values(["state", "fips", "year"])
    final_df.to_csv(out_path, index=False)

    counties_predicted = final_df["fips"].nunique()
    succeeded = len(states) - len(failed)
    print(f"\nStates succeeded: {succeeded}/51")
    print(f"Counties predicted: {counties_predicted}/3142")
    print(f"Total rows written: {len(final_df)}")
    print(f"Failed states: {failed}")
    if succeeded < 40:
        print(f"WARNING: Only {succeeded}/51 states predicted — consider re-running failed states")


if __name__ == "__main__":
    main()
