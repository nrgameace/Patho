import io
import os

import pandas as pd
import requests

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

VALID_STATES = set(STATE_ABBREV_MAP.values())
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
SINGLE_FILE_LIMIT_MB = 50
COMBINED_LIMIT_MB = 100


def ensure_data_dir() -> None:
    os.makedirs(DATA_DIR, exist_ok=True)


def fetch_json(url: str, params: dict) -> list:
    response = requests.get(url, params=params, timeout=60)
    if response.status_code != 200:
        raise RuntimeError(f"Failed to fetch {url}: HTTP {response.status_code}")
    return response.json()


def fill_nulls(df: pd.DataFrame) -> pd.DataFrame:
    return df.replace("", 0).fillna(0)


def downsample_monthly(df: pd.DataFrame, date_col: str, group_cols: list) -> pd.DataFrame:
    parsed = pd.to_datetime(df[date_col], errors="coerce")
    df = df[parsed.notna()].copy()
    parsed = parsed[parsed.notna()]
    df["_year"] = parsed.dt.year
    df["_month"] = parsed.dt.month
    grouped = df.groupby(group_cols + ["_year", "_month"], as_index=False).last()
    grouped[date_col] = grouped.apply(lambda r: f"{int(r['_year'])}-{int(r['_month']):02d}-01", axis=1)
    return grouped.drop(columns=["_year", "_month"]).reset_index(drop=True)


def downsample_quarterly(df: pd.DataFrame, date_col: str, group_cols: list) -> pd.DataFrame:
    parsed = pd.to_datetime(df[date_col], errors="coerce")
    df = df[parsed.notna()].copy()
    parsed = parsed[parsed.notna()]
    df["_year"] = parsed.dt.year
    df["_month"] = parsed.dt.month
    df["_quarter"] = ((df["_month"] - 1) // 3) + 1
    quarter_start = {1: "01", 2: "04", 3: "07", 4: "10"}
    grouped = df.groupby(group_cols + ["_year", "_quarter"], as_index=False).last()
    grouped[date_col] = grouped.apply(
        lambda r: f"{int(r['_year'])}-{quarter_start[int(r['_quarter'])]}-01", axis=1
    )
    return grouped.drop(columns=["_year", "_month", "_quarter"], errors="ignore").reset_index(drop=True)


def save_csv(df: pd.DataFrame, filename: str) -> float:
    path = os.path.join(DATA_DIR, filename)
    df.to_csv(path, index=False)
    size_mb = os.path.getsize(path) / (1024 * 1024)
    date_col = next((c for c in df.columns if any(k in c for k in ("week", "month", "date"))), None)
    if date_col:
        years = pd.to_datetime(df[date_col], errors="coerce").dt.year.dropna()
        year_range = f"{int(years.min())}–{int(years.max())}" if not years.empty else "unknown"
    else:
        year_range = "unknown"
    print(f"Saved {filename}: {len(df)} rows | {year_range} | {size_mb:.2f} MB")
    return size_mb


def check_and_requantize(df: pd.DataFrame, filename: str, date_col: str, group_cols: list, size_mb: float) -> tuple:
    if size_mb <= SINGLE_FILE_LIMIT_MB:
        return df, size_mb
    print(f"  {filename} exceeds {SINGLE_FILE_LIMIT_MB} MB — re-aggregating to quarterly...")
    df = downsample_quarterly(df, date_col, group_cols)
    new_size = save_csv(df, filename)
    return df, new_size


def fetch_source_1() -> pd.DataFrame:
    print("Fetching Source 1: CDC COVID Weekly State Aggregates...")
    data = fetch_json("https://data.cdc.gov/resource/pwn4-m3yp.json", {"$limit": 50000})
    df = pd.DataFrame(data)
    df = df[["state", "end_date", "tot_cases", "tot_deaths"]].rename(
        columns={"end_date": "week", "tot_cases": "infected", "tot_deaths": "deaths"}
    )
    df["state"] = df["state"].map(STATE_ABBREV_MAP)
    df = df.dropna(subset=["state"])
    df["infected"] = pd.to_numeric(df["infected"], errors="coerce")
    df["deaths"] = pd.to_numeric(df["deaths"], errors="coerce")
    df = fill_nulls(df)
    return downsample_monthly(df, "week", ["state"])


def fetch_source_2() -> pd.DataFrame:
    print("Fetching Source 2: CDC Case Surveillance Geography Dataset...")
    data = fetch_json("https://data.cdc.gov/resource/n8mc-b4w4.json", {"$limit": 50000})
    df = pd.DataFrame(data)
    df = df[["res_state", "case_month", "age_group", "death_yn", "hosp_yn"]].rename(
        columns={"res_state": "state", "case_month": "month", "death_yn": "death", "hosp_yn": "hospitalized"}
    )
    df["state"] = df["state"].map(STATE_ABBREV_MAP)
    df = df.dropna(subset=["state"])
    df["month"] = pd.to_datetime(df["month"], errors="coerce").dt.strftime("%Y-%m-01")
    df = df.dropna(subset=["month"])
    df["death_count"] = (df["death"] == "Yes").astype(int)
    df["hosp_count"] = (df["hospitalized"] == "Yes").astype(int)
    agg = df.groupby(["state", "month", "age_group"], as_index=False).agg(
        total_cases=("death", "count"),
        deaths=("death_count", "sum"),
        hospitalized=("hosp_count", "sum"),
    )
    return fill_nulls(agg)


def fetch_source_3() -> pd.DataFrame:
    print("Fetching Source 3: Our World in Data COVID Vaccinations...")
    url = "https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/vaccinations/us_state_vaccinations.csv"
    response = requests.get(url, timeout=60)
    if response.status_code != 200:
        raise RuntimeError(f"Failed to fetch OWID CSV: HTTP {response.status_code}")
    df = pd.read_csv(io.StringIO(response.text))
    df = df[["date", "location", "people_vaccinated", "people_fully_vaccinated"]].rename(
        columns={"date": "week", "location": "state", "people_vaccinated": "vaccinated", "people_fully_vaccinated": "fully_vaccinated"}
    )
    df = df[df["state"].isin(VALID_STATES)]
    df["vaccinated"] = pd.to_numeric(df["vaccinated"], errors="coerce")
    df["fully_vaccinated"] = pd.to_numeric(df["fully_vaccinated"], errors="coerce")
    df = fill_nulls(df)
    return downsample_monthly(df, "week", ["state"])


def print_summary(sizes: list) -> None:
    total = sum(sizes)
    print(f"\nTotal combined size: {total:.2f} MB")
    if total > COMBINED_LIMIT_MB:
        print(f"WARNING: combined size {total:.2f} MB exceeds {COMBINED_LIMIT_MB} MB limit.")


def main() -> None:
    ensure_data_dir()

    df1 = fetch_source_1()
    size1 = save_csv(df1, "covid_weekly.csv")
    df1, size1 = check_and_requantize(df1, "covid_weekly.csv", "week", ["state"], size1)

    df2 = fetch_source_2()
    size2 = save_csv(df2, "covid_cases.csv")
    df2, size2 = check_and_requantize(df2, "covid_cases.csv", "month", ["state", "age_group"], size2)

    df3 = fetch_source_3()
    size3 = save_csv(df3, "covid_vaccinations.csv")
    df3, size3 = check_and_requantize(df3, "covid_vaccinations.csv", "week", ["state"], size3)

    print_summary([size1, size2, size3])


if __name__ == "__main__":
    main()
