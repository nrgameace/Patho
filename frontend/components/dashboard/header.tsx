"use client"

import { TimelineSlider } from "./timeline-slider"
import { Activity } from "lucide-react"

interface HeaderProps {
  year: number
  onYearChange: (year: number) => void
}

export function Header({ year, onYearChange }: HeaderProps) {
  return (
    <header className="h-20 bg-card border-b border-border px-6 flex items-center justify-between gap-8">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Patho
          </h1>
          <p className="text-xs text-muted-foreground">
            COVID-19 Tracker
          </p>
        </div>
      </div>

      {/* Timeline */}
      <TimelineSlider year={year} onYearChange={onYearChange} />

      {/* Spacer for balance */}
      <div className="w-32" />
    </header>
  )
}
