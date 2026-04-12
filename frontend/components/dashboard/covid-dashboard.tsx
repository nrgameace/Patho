"use client"

import { useState, useCallback } from "react"
import { Header } from "./header"
import { USMap } from "./us-map"
import { MetricsSidebar } from "./metrics-sidebar"
import { WelcomeOverlay } from "./welcome-overlay"

export function CovidDashboard() {
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

  const handleStateSelect = useCallback((stateId: string | null, stateName: string | null) => {
    setSelectedState(stateId)
    setSelectedStateName(stateName)
    // Clear county selection when state changes
    setSelectedCounty(null)
    setSelectedCountyName(null)
  }, [])

  const handleCountySelect = useCallback((countyId: string | null, countyName: string | null) => {
    setSelectedCounty(countyId)
    setSelectedCountyName(countyName)
  }, [])

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
