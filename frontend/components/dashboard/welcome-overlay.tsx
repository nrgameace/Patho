"use client"

import { Button } from "@/components/ui/button"
import { Activity, TrendingUp, Map, BarChart3 } from "lucide-react"

interface WelcomeOverlayProps {
  onStart: () => void
}

export function WelcomeOverlay({ onStart }: WelcomeOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        {/* Logo/Title */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
            <Activity className="w-10 h-10 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-foreground mb-2">
            Patho
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Disease Intelligence Platform
          </p>
        </div>

        {/* Description */}
        <div className="mb-10 space-y-4">
          <p className="text-muted-foreground leading-relaxed text-balance">
            Welcome to the CDC Disease Simulation Dashboard. This interactive platform 
            provides real-time visualization of COVID-19 epidemiological data across 
            the United States, featuring historical analysis and predictive modeling 
            through 2028.
          </p>
          <p className="text-sm text-muted-foreground/80">
            Explore state and county-level data, track transmission patterns, 
            and analyze trends with our comprehensive geospatial interface.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="p-4 rounded-lg bg-card border border-border">
            <Map className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Interactive Maps</p>
          </div>
          <div className="p-4 rounded-lg bg-card border border-border">
            <TrendingUp className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Predictive Analytics</p>
          </div>
          <div className="p-4 rounded-lg bg-card border border-border">
            <BarChart3 className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Real-time Metrics</p>
          </div>
        </div>

        {/* Start button */}
        <Button 
          onClick={onStart}
          size="lg"
          className="px-10 py-6 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Start Simulation
        </Button>

        {/* Footer note */}
        <p className="mt-8 text-xs text-muted-foreground/60">
          Data sourced from CDC epidemiological models. For simulation purposes only.
        </p>
      </div>
    </div>
  )
}
