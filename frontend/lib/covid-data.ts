import { useState, useEffect } from "react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://34.42.246.161:8000"

export interface CountyData {
  id: string
  name: string
  cases: Record<number, number>
  deaths: Record<number, number>
}

export interface StateData {
  id: string
  name: string
  cases: Record<number, number>
  deaths: Record<number, number>
  counties: CountyData[]
}

export const statesData: StateData[] = []

let _initialized = false
let _initPromise: Promise<void> | null = null

function parseYearKeys(obj: Record<string, number>): Record<number, number> {
  const result: Record<number, number> = {}
  for (const [k, v] of Object.entries(obj)) {
    result[Number(k)] = v
  }
  return result
}

export async function initializeData(): Promise<void> {
  if (_initialized) return
  if (_initPromise) return _initPromise

  _initPromise = (async () => {
    const res = await fetch(`${API_BASE}/api/getAllStateData`)
    if (!res.ok) throw new Error(`Failed to load state data: ${res.status}`)
    const data = await res.json()
    statesData.length = 0
    statesData.push(
      ...data.map((s: { id: string; name: string; cases: Record<string, number>; deaths: Record<string, number> }) => ({
        id: s.id,
        name: s.name,
        cases: parseYearKeys(s.cases),
        deaths: parseYearKeys(s.deaths),
        counties: [],
      }))
    )
    _initialized = true
  })()

  return _initPromise
}

export async function loadCountiesForState(stateId: string): Promise<void> {
  const state = statesData.find((s) => s.id === stateId)
  if (!state || state.counties.length > 0) return

  const res = await fetch(`${API_BASE}/api/getStateCounties`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stateCode: stateId }),
  })
  if (!res.ok) return

  const data = await res.json()
  state.counties = data.map((c: { id: string; name: string; cases: Record<string, number>; deaths: Record<string, number> }) => ({
    id: c.id,
    name: c.name,
    cases: parseYearKeys(c.cases),
    deaths: parseYearKeys(c.deaths),
  }))
}

export function getMaxCases(year: number, level: "state" | "county", stateId?: string): number {
  if (level === "state") {
    return Math.max(0, ...statesData.map((s) => s.cases[year] || 0))
  }
  if (stateId) {
    const state = statesData.find((s) => s.id === stateId)
    if (!state || state.counties.length === 0) return 0
    return Math.max(0, ...state.counties.map((c) => c.cases[year] || 0))
  }
  return 0
}

export function getNationalData(year: number): { cases: number; deaths: number } {
  return {
    cases: statesData.reduce((sum, s) => sum + (s.cases[year] || 0), 0),
    deaths: statesData.reduce((sum, s) => sum + (s.deaths[year] || 0), 0),
  }
}

export function getCumulativeData(stateId?: string, countyId?: string, upToYear?: number): { cases: number; deaths: number } {
  const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027].filter((y) => !upToYear || y <= upToYear)

  if (countyId && stateId) {
    const state = statesData.find((s) => s.id === stateId)
    const county = state?.counties.find((c) => c.id === countyId)
    if (!county) return { cases: 0, deaths: 0 }
    return {
      cases: years.reduce((sum, y) => sum + (county.cases[y] || 0), 0),
      deaths: years.reduce((sum, y) => sum + (county.deaths[y] || 0), 0),
    }
  }

  if (stateId) {
    const state = statesData.find((s) => s.id === stateId)
    if (!state) return { cases: 0, deaths: 0 }
    return {
      cases: years.reduce((sum, y) => sum + (state.cases[y] || 0), 0),
      deaths: years.reduce((sum, y) => sum + (state.deaths[y] || 0), 0),
    }
  }

  return {
    cases: years.reduce((sum, y) => sum + getNationalData(y).cases, 0),
    deaths: years.reduce((sum, y) => sum + getNationalData(y).deaths, 0),
  }
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US")
}

export function useCovidData() {
  const [loading, setLoading] = useState(!_initialized)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (_initialized) {
      setLoading(false)
      return
    }
    initializeData()
      .then(() => setLoading(false))
      .catch((e) => setError(e.message))
  }, [])

  return { loading, error }
}
