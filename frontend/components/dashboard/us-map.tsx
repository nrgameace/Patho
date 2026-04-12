"use client"

import { useState, useCallback, useMemo } from "react"
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps"
import { statesData, getMaxCases } from "@/lib/covid-data"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

const US_TOPO_JSON = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"
const COUNTIES_TOPO_JSON = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json"

// State FIPS codes mapping
const STATE_FIPS: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "12": "FL", "13": "GA",
  "15": "HI", "16": "ID", "17": "IL", "18": "IN", "19": "IA",
  "20": "KS", "21": "KY", "22": "LA", "23": "ME", "24": "MD",
  "25": "MA", "26": "MI", "27": "MN", "28": "MS", "29": "MO",
  "30": "MT", "31": "NE", "32": "NV", "33": "NH", "34": "NJ",
  "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH",
  "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC",
  "46": "SD", "47": "TN", "48": "TX", "49": "UT", "50": "VT",
  "51": "VA", "53": "WA", "54": "WV", "55": "WI", "56": "WY"
}

// Reverse mapping
const FIPS_TO_STATE: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_FIPS).map(([k, v]) => [v, k])
)

// State center coordinates and zoom levels for proper centering
const STATE_CENTERS: Record<string, { center: [number, number]; zoom: number }> = {
  "AL": { center: [-86.9, 32.8], zoom: 5 },
  "AK": { center: [-153.5, 64.2], zoom: 3 },
  "AZ": { center: [-111.9, 34.2], zoom: 5 },
  "AR": { center: [-92.4, 34.9], zoom: 5.5 },
  "CA": { center: [-119.5, 37.2], zoom: 4.5 },
  "CO": { center: [-105.5, 39.0], zoom: 5 },
  "CT": { center: [-72.7, 41.6], zoom: 8 },
  "DE": { center: [-75.5, 39.0], zoom: 8 },
  "FL": { center: [-82.5, 28.5], zoom: 5 },
  "GA": { center: [-83.4, 32.6], zoom: 5 },
  "HI": { center: [-157.5, 20.5], zoom: 5 },
  "ID": { center: [-114.5, 44.4], zoom: 4.5 },
  "IL": { center: [-89.2, 40.0], zoom: 5 },
  "IN": { center: [-86.2, 39.9], zoom: 5.5 },
  "IA": { center: [-93.5, 42.0], zoom: 5 },
  "KS": { center: [-98.4, 38.5], zoom: 5 },
  "KY": { center: [-85.3, 37.8], zoom: 5.5 },
  "LA": { center: [-91.9, 31.0], zoom: 5.5 },
  "ME": { center: [-69.0, 45.3], zoom: 5 },
  "MD": { center: [-76.6, 39.0], zoom: 6.5 },
  "MA": { center: [-71.8, 42.2], zoom: 7 },
  "MI": { center: [-85.4, 44.3], zoom: 4.5 },
  "MN": { center: [-94.3, 46.3], zoom: 4.5 },
  "MS": { center: [-89.7, 32.7], zoom: 5 },
  "MO": { center: [-92.5, 38.3], zoom: 5 },
  "MT": { center: [-109.6, 47.0], zoom: 4.5 },
  "NE": { center: [-99.8, 41.5], zoom: 5 },
  "NV": { center: [-116.6, 39.3], zoom: 4.5 },
  "NH": { center: [-71.5, 43.7], zoom: 6 },
  "NJ": { center: [-74.7, 40.2], zoom: 7 },
  "NM": { center: [-106.0, 34.4], zoom: 4.5 },
  "NY": { center: [-75.5, 43.0], zoom: 5 },
  "NC": { center: [-79.4, 35.5], zoom: 5 },
  "ND": { center: [-100.5, 47.4], zoom: 5 },
  "OH": { center: [-82.8, 40.2], zoom: 5.5 },
  "OK": { center: [-97.5, 35.5], zoom: 5 },
  "OR": { center: [-120.5, 44.0], zoom: 5 },
  "PA": { center: [-77.6, 41.0], zoom: 5.5 },
  "RI": { center: [-71.5, 41.7], zoom: 9 },
  "SC": { center: [-80.9, 33.9], zoom: 5.5 },
  "SD": { center: [-100.2, 44.4], zoom: 5 },
  "TN": { center: [-86.3, 35.8], zoom: 5.5 },
  "TX": { center: [-99.5, 31.5], zoom: 4 },
  "UT": { center: [-111.7, 39.3], zoom: 4.5 },
  "VT": { center: [-72.6, 44.0], zoom: 6 },
  "VA": { center: [-79.4, 37.5], zoom: 5.5 },
  "WA": { center: [-120.5, 47.4], zoom: 5 },
  "WV": { center: [-80.6, 38.9], zoom: 5.5 },
  "WI": { center: [-89.8, 44.6], zoom: 5 },
  "WY": { center: [-107.5, 43.0], zoom: 5 },
}

interface USMapProps {
  year: number
  selectedState: string | null
  selectedCounty: string | null
  onStateSelect: (stateId: string | null, stateName: string | null) => void
  onCountySelect: (countyId: string | null, countyName: string | null) => void
}

// Color scale for COVID cases (8 red shades: lighter = low, darker = high)
const COLOR_SCALE = [
  "#fce4e4", // 1 - Very low (lightest)
  "#f5c4c4", // 2 - Low
  "#e89999", // 3 - Low-medium
  "#d96b6b", // 4 - Medium
  "#c94444", // 5 - Medium-high
  "#a82e2e", // 6 - High
  "#7a1f1f", // 7 - Very high
  "#4a1010", // 8 - Critical (darkest)
]

const getColorForCases = (cases: number, maxCases: number): string => {
  if (maxCases === 0) return COLOR_SCALE[0]
  const intensity = Math.min(cases / maxCases, 1)
  
  // Map intensity to 8 color bands (lighter = low, darker = high)
  if (intensity < 0.125) return COLOR_SCALE[0]
  if (intensity < 0.25) return COLOR_SCALE[1]
  if (intensity < 0.375) return COLOR_SCALE[2]
  if (intensity < 0.5) return COLOR_SCALE[3]
  if (intensity < 0.625) return COLOR_SCALE[4]
  if (intensity < 0.75) return COLOR_SCALE[5]
  if (intensity < 0.875) return COLOR_SCALE[6]
  return COLOR_SCALE[7]
}

export function USMap({
  year,
  selectedState,
  selectedCounty,
  onStateSelect,
  onCountySelect,
}: USMapProps) {
  const [hoveredGeo, setHoveredGeo] = useState<string | null>(null)
  const [position, setPosition] = useState({ coordinates: [-96, 38] as [number, number], zoom: 1 })
  const [isPlaying, setIsPlaying] = useState(false) // NEW: Audio state tracker

  // NEW: Function to fetch and play audio
  const playAudioSummary = async (locationName: string, casesCount: number, deathsCount: number) => {
    if (isPlaying) return;
    setIsPlaying(true);

    try {
      const response = await fetch('http://localhost:8000/api/generateAudio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: locationName,
          cases: casesCount,
          deaths: deathsCount
        }),
      });

      if (!response.ok) throw new Error("Audio generation failed");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => setIsPlaying(false);
      await audio.play();

    } catch (error) {
      console.error("Error playing summary:", error);
      setIsPlaying(false);
    }
  };
  const maxStateCases = useMemo(() => getMaxCases(year, 'state'), [year])
  
  const selectedStateData = useMemo(() => {
    if (!selectedState) return null
    return statesData.find(s => s.id === selectedState)
  }, [selectedState])

  const maxCountyCases = useMemo(() => {
    if (!selectedState) return 0
    return getMaxCases(year, 'county', selectedState)
  }, [year, selectedState])

  const handleStateClick = useCallback((geo: { id: string, properties: { name: string } }) => {
    const fips = geo.id
    const stateAbbr = STATE_FIPS[fips]
    if (stateAbbr) {
      const state = statesData.find(s => s.id === stateAbbr)
      if (state) {
        onStateSelect(stateAbbr, state.name)
        onCountySelect(null, null)
        
        // NEW: Trigger the audio for the State
        const cases = state.cases[year] || 0;
        // The mock data doesn't map state deaths at the root, so we sum them or pass a placeholder
        const deaths = 0; 
        playAudioSummary(state.name, cases, deaths);

        const stateConfig = STATE_CENTERS[stateAbbr]
        if (stateConfig) {
          setPosition({ coordinates: stateConfig.center, zoom: stateConfig.zoom })
        }
      }
    }
  }, [onStateSelect, onCountySelect, year, isPlaying])

  const handleCountyClick = useCallback((countyId: string, countyName: string) => {
    onCountySelect(countyId, countyName)
  }, [onCountySelect])

  const handleBackToUS = useCallback(() => {
    onStateSelect(null, null)
    onCountySelect(null, null)
    setPosition({ coordinates: [-96, 38], zoom: 1 })
  }, [onStateSelect, onCountySelect])

  const handleMoveEnd = useCallback((pos: { coordinates: [number, number]; zoom: number }) => {
    setPosition(pos)
  }, [])

  // National view - show states
  if (!selectedState) {
    return (
      <div className="relative w-full h-full bg-background rounded-lg overflow-hidden">
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{ scale: 1000 }}
          className="w-full h-full"
        >
          <ZoomableGroup
            center={position.coordinates}
            zoom={position.zoom}
            onMoveEnd={handleMoveEnd}
            minZoom={1}
            maxZoom={8}
          >
            <Geographies geography={US_TOPO_JSON}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const fips = geo.id
                  const stateAbbr = STATE_FIPS[fips]
                  const stateData = statesData.find(s => s.id === stateAbbr)
                  const cases = stateData?.cases[year] || 0
                  const fillColor = getColorForCases(cases, maxStateCases)
                  const isHovered = hoveredGeo === geo.id
                  
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fillColor}
                      stroke="#1a1a1f"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { outline: "none", fill: "#ff6060", cursor: "pointer" },
                        pressed: { outline: "none" },
                      }}
                      onMouseEnter={() => setHoveredGeo(geo.id)}
                      onMouseLeave={() => setHoveredGeo(null)}
                      onClick={() => handleStateClick(geo)}
                    />
                  )
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
        
        {/* Tooltip */}
        {hoveredGeo && (
          <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg px-4 py-2 pointer-events-none">
            <p className="text-sm font-medium text-foreground">
              {statesData.find(s => s.id === STATE_FIPS[hoveredGeo])?.name || "Unknown"}
            </p>
            <p className="text-xs text-muted-foreground">
              Click to view counties
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Cases Intensity</p>
          <div className="flex items-center gap-0.5">
            {COLOR_SCALE.map((color, i) => (
              <div key={i} className="w-5 h-3 first:rounded-l-sm last:rounded-r-sm" style={{ backgroundColor: color }} />
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>
      </div>
    )
  }

  // State view - show counties
  return (
    <div className="relative w-full h-full bg-background rounded-lg overflow-hidden">
      {/* Back button */}
      <Button
        variant="secondary"
        size="sm"
        className="absolute top-4 left-4 z-10 gap-2"
        onClick={handleBackToUS}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to US Map
      </Button>

      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{ scale: 1000 }}
        className="w-full h-full"
      >
        <ZoomableGroup
          center={position.coordinates}
          zoom={position.zoom}
          onMoveEnd={handleMoveEnd}
          minZoom={1}
          maxZoom={12}
        >
          <Geographies geography={COUNTIES_TOPO_JSON}>
            {({ geographies }) => {
              // Filter counties for selected state
              const stateFips = FIPS_TO_STATE[selectedState]
              const stateCounties = geographies.filter(geo => {
                const countyFips = String(geo.id)
                return countyFips.startsWith(stateFips)
              })

              return stateCounties.map((geo) => {
                const countyFips = String(geo.id).padStart(5, "0")
                const countyData = selectedStateData?.counties.find(c => c.id === countyFips)
                
                // Extract cases and deaths here so the onClick handler can access them safely
                const cases = countyData?.cases[year] || 0
                const deaths = countyData?.deaths[year] || 0
                
                const fillColor = getColorForCases(cases, maxCountyCases)
                const isSelected = selectedCounty === countyFips

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isSelected ? "#ff8080" : fillColor}
                    stroke={isSelected ? "#ffffff" : "#1a1a1f"}
                    strokeWidth={isSelected ? 2 : 0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none", fill: "#ff6060", cursor: "pointer" },
                      pressed: { outline: "none" },
                    }}
                    onMouseEnter={() => setHoveredGeo(countyFips)}
                    onMouseLeave={() => setHoveredGeo(null)}
                    onClick={() => {
                      const name = countyData?.name || `County ${countyFips}`
                      
                      // Trigger visual selection
                      handleCountyClick(countyFips, name)
                      
                      // NEW: Trigger audio summary
                      playAudioSummary(name, cases, deaths)
                    }}
                  />
                )
              })
            }}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      {hoveredGeo && (
        <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg px-4 py-2 pointer-events-none">
          <p className="text-sm font-medium text-foreground">
            {selectedStateData?.counties.find(c => c.id === hoveredGeo)?.name || `County ${hoveredGeo}`}
          </p>
          <p className="text-xs text-muted-foreground">
            Click to select
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3">
        <p className="text-xs text-muted-foreground mb-2 font-medium">Cases Intensity</p>
        <div className="flex items-center gap-0.5">
          {COLOR_SCALE.map((color, i) => (
            <div key={i} className="w-5 h-3 first:rounded-l-sm last:rounded-r-sm" style={{ backgroundColor: color }} />
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    </div>
  )
}
