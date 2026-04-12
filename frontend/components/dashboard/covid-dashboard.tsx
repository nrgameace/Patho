"use client"

import { useState, useCallback } from "react"
import { Header } from "./header"
import { USMap } from "./us-map"
import { MetricsSidebar } from "./metrics-sidebar"
import { WelcomeOverlay } from "./welcome-overlay"
import { useCovidData, loadCountiesForState } from "@/lib/covid-data"
import { Activity } from "lucide-react"

export function CovidDashboard() {
  const { loading, error } = useCovidData()
  const [showWelcome, setShowWelcome] = useState(true)
  const [year, setYear] = useState(2024)
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [selectedStateName, setSelectedStateName] = useState<string | null>(null)
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null)
  const [selectedCountyName, setSelectedCountyName] = useState<string | null>(null)

  const handleStartSimulation = useCallback(() => {
    setShowWelcome(false)
  }, [])

  const handleYearChange = useCallback((newYear: number) => {
    setYear(newYear)
  }, [])

  const handleStateSelect = useCallback(async (stateId: string | null, stateName: string | null) => {
    if (stateId) {
      await loadCountiesForState(stateId)
    }
    setSelectedState(stateId)
    setSelectedStateName(stateName)
    setSelectedCounty(null)
    setSelectedCountyName(null)
  }, [])

  const handleCountySelect = useCallback((countyId: string | null, countyName: string | null) => {
    setSelectedCounty(countyId)
    setSelectedCountyName(countyName)
  }, [])

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Activity className="w-10 h-10 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground">Loading data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <p className="text-destructive">Failed to load data: {error}</p>
      </div>
    )
  }

  if (showWelcome) {
    return <WelcomeOverlay onStart={handleStartSimulation} />
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Header with Timeline */}
      <Header year={year} onYearChange={handleYearChange} />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Section - 70% */}
        <main className="flex-1 lg:w-[70%] p-4 overflow-hidden">
          <div className="h-full w-full rounded-xl border border-border bg-card/50 overflow-hidden">
            <USMap
              year={year}
              selectedState={selectedState}
              selectedCounty={selectedCounty}
              onStateSelect={handleStateSelect}
              onCountySelect={handleCountySelect}
            />
          </div>
        </main>

        {/* Metrics Sidebar - 30% */}
        <div className="hidden lg:block lg:w-[30%] border-l border-border">
          <MetricsSidebar
            year={year}
            selectedState={selectedState}
            selectedStateName={selectedStateName}
            selectedCounty={selectedCounty}
            selectedCountyName={selectedCountyName}
          />
        </div>
      </div>

      {/* Mobile Metrics (shown below map on small screens) */}
      <div className="lg:hidden border-t border-border max-h-[40vh] overflow-y-auto">
        <MetricsSidebar
          year={year}
          selectedState={selectedState}
          selectedStateName={selectedStateName}
          selectedCounty={selectedCounty}
          selectedCountyName={selectedCountyName}
        />
      </div>
    </div>
  )
}
