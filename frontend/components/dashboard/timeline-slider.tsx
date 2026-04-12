"use client"

import { useCallback } from "react"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"

interface TimelineSliderProps {
  year: number
  onYearChange: (year: number) => void
}

const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027]
const CURRENT_YEAR = 2024

export function TimelineSlider({ year, onYearChange }: TimelineSliderProps) {
  const handleValueChange = useCallback(
    (value: number[]) => {
      onYearChange(YEARS[value[0]])
    },
    [onYearChange]
  )

  const currentIndex = YEARS.indexOf(year)
  const isPredictive = year > CURRENT_YEAR

  return (
    <div className="flex items-center gap-6 flex-1 max-w-2xl">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground tabular-nums w-12">
          {year}
        </span>
        {isPredictive && (
          <Badge 
            variant="outline" 
            className="border-primary/50 text-primary text-xs px-2 py-0"
          >
            Predictive
          </Badge>
        )}
      </div>

      <div className="flex-1 relative">
        {/* Year labels */}
        <div className="absolute -top-5 left-0 right-0 flex justify-between px-1">
          {YEARS.map((y) => (
            <span
              key={y}
              className={`text-xs tabular-nums ${
                y === year
                  ? "text-foreground font-medium"
                  : y > CURRENT_YEAR
                  ? "text-primary/60"
                  : "text-muted-foreground"
              }`}
            >
              {y}
            </span>
          ))}
        </div>

        {/* Slider track with predictive indicator */}
        <div className="relative">
          <Slider
            value={[currentIndex]}
            min={0}
            max={YEARS.length - 1}
            step={1}
            onValueChange={handleValueChange}
            className="cursor-pointer"
          />
          
          {/* Predictive overlay indicator */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 h-1 bg-primary/20 rounded-full pointer-events-none"
            style={{
              left: `${((CURRENT_YEAR - 2020 + 1) / (YEARS.length)) * 100}%`,
              right: 0,
            }}
          />
        </div>

        {/* Historical / Predictive labels */}
        <div className="absolute -bottom-5 left-0 right-0 flex justify-between">
          <span className="text-xs text-muted-foreground">Historical</span>
          <span className="text-xs text-primary/80">Predictive →</span>
        </div>
      </div>
    </div>
  )
}
