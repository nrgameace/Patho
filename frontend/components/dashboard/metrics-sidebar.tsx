"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  statesData,
  getNationalData,
  getCumulativeData,
  formatNumber,
} from "@/lib/covid-data"
import { Activity, Skull, TrendingDown, TrendingUp, MapPin } from "lucide-react"

interface MetricsSidebarProps {
  year: number
  selectedState: string | null
  selectedStateName: string | null
  selectedCounty: string | null
  selectedCountyName: string | null
}

export function MetricsSidebar({
  year,
  selectedState,
  selectedStateName,
  selectedCounty,
  selectedCountyName,
}: MetricsSidebarProps) {
  const isPredictive = year >= 2025

  // Determine current selection level
  const selectionLevel = useMemo(() => {
    if (selectedCounty) return "county"
    if (selectedState) return "state"
    return "national"
  }, [selectedState, selectedCounty])

  // Get display title
  const displayTitle = useMemo(() => {
    if (selectedCountyName) return selectedCountyName
    if (selectedStateName) return selectedStateName
    return "United States"
  }, [selectedStateName, selectedCountyName])

  // Get current year data
  const yearData = useMemo(() => {
    if (selectedCounty && selectedState) {
      const state = statesData.find((s) => s.id === selectedState)
      const county = state?.counties.find((c) => c.id === selectedCounty)
      return {
        cases: county?.cases[year] || 0,
        deaths: county?.deaths[year] || 0,
      }
    }
    if (selectedState) {
      const state = statesData.find((s) => s.id === selectedState)
      return {
        cases: state?.cases[year] || 0,
        deaths: state?.deaths[year] || 0,
      }
    }
    return getNationalData(year)
  }, [year, selectedState, selectedCounty])

  // Get cumulative data
  const cumulativeData = useMemo(() => {
    return getCumulativeData(selectedState || undefined, selectedCounty || undefined, year)
  }, [selectedState, selectedCounty, year])

  // Calculate trend (comparing to previous year)
  const trend = useMemo(() => {
    const prevYear = year - 1
    let prevCases = 0

    if (selectedCounty && selectedState) {
      const state = statesData.find((s) => s.id === selectedState)
      const county = state?.counties.find((c) => c.id === selectedCounty)
      prevCases = county?.cases[prevYear] || 0
    } else if (selectedState) {
      const state = statesData.find((s) => s.id === selectedState)
      prevCases = state?.cases[prevYear] || 0
    } else {
      prevCases = getNationalData(prevYear).cases
    }

    if (prevCases === 0) return 0
    return ((yearData.cases - prevCases) / prevCases) * 100
  }, [year, yearData.cases, selectedState, selectedCounty])

  return (
    <aside className="w-full h-full bg-card border-l border-border overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Location Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider font-medium">
              {selectionLevel === "county"
                ? "County"
                : selectionLevel === "state"
                ? "State"
                : "National"}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            {displayTitle}
          </h2>
          {isPredictive && (
            <Badge variant="outline" className="border-primary/50 text-primary">
              Predictive Data
            </Badge>
          )}
        </div>

        <Separator className="bg-border" />

        {/* Selected Year Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Selected Year ({year})
            </h3>
            {trend !== 0 && (
              <div
                className={`flex items-center gap-1 text-xs ${
                  trend < 0 ? "text-green-400" : "text-primary"
                }`}
              >
                {trend < 0 ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <TrendingUp className="w-3 h-3" />
                )}
                <span>{Math.abs(trend).toFixed(1)}%</span>
              </div>
            )}
          </div>

          <div className="grid gap-4">
            {/* Total Cases Card */}
            <Card className="bg-secondary/50 border-border">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Total Cases
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-3xl font-bold text-foreground tabular-nums">
                  {formatNumber(yearData.cases)}
                </p>
              </CardContent>
            </Card>

            {/* Total Deaths Card */}
            <Card className="bg-secondary/50 border-border">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Skull className="w-4 h-4 text-muted-foreground" />
                  Total Deaths
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-3xl font-bold text-foreground tabular-nums">
                  {formatNumber(yearData.deaths)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Cumulative Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Cumulative (Since 2020)
          </h3>

          <div className="grid gap-4">
            {/* Cumulative Cases Card */}
            <Card className="bg-secondary/50 border-border">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Total Cases
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-3xl font-bold text-foreground tabular-nums">
                  {formatNumber(cumulativeData.cases)}
                </p>
              </CardContent>
            </Card>

            {/* Cumulative Deaths Card */}
            <Card className="bg-secondary/50 border-border">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Skull className="w-4 h-4 text-muted-foreground" />
                  Total Deaths
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-3xl font-bold text-foreground tabular-nums">
                  {formatNumber(cumulativeData.deaths)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Data Note */}
        <div className="pt-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isPredictive
              ? "Data for years 2025 and beyond are AI-generated predictions based on historical trends and epidemiological models."
              : "Historical data sourced from public health records. Last updated March 2024."}
          </p>
        </div>
      </div>
    </aside>
  )
}
