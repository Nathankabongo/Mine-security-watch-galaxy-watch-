"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Heart,
  Activity,
  AlertTriangle,
  MapPin,
  PersonStanding,
  Wifi,
  Battery,
  Signal,
  Clock,
  Navigation,
  Route,
  WifiOff,
  MapPinOff,
} from "lucide-react"

interface WatchData {
  heartRate: number
  seismicHz: number
  dangerLevel: "NORMAL" | "ALERTE" | "CRITIQUE"
  location: { lat: number; lng: number } | null
  totalDistance: number
  battery: number
  isConnected: boolean
  connectionQuality: "Bonne" | "Moyenne" | "Faible"
  gpsStatus: "active" | "searching" | "error" | "denied"
}

// Calculate distance between two GPS coordinates using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

export default function WatchScreen() {
  const [time, setTime] = useState(new Date())
  const [sosPressed, setSosPressed] = useState(false)
  const [sosTimer, setSosTimer] = useState(0)
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null)
  const watchIdRef = useRef<number | null>(null)
  
  const [data, setData] = useState<WatchData>({
    heartRate: 88,
    seismicHz: 24.5,
    dangerLevel: "NORMAL",
    location: null,
    totalDistance: 0,
    battery: 82,
    isConnected: true,
    connectionQuality: "Bonne",
    gpsStatus: "searching",
  })

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Real GPS tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      setData((prev) => ({ ...prev, gpsStatus: "error" }))
      return
    }

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        const newLocation = { lat: latitude, lng: longitude }

        setData((prev) => {
          let newTotalDistance = prev.totalDistance

          // Calculate distance from last position if we have one
          if (lastPositionRef.current) {
            const distance = calculateDistance(
              lastPositionRef.current.lat,
              lastPositionRef.current.lng,
              latitude,
              longitude
            )
            // Only add distance if it's significant (more than 2 meters) to filter GPS noise
            if (distance > 2) {
              newTotalDistance = prev.totalDistance + distance
              lastPositionRef.current = newLocation
            }
          } else {
            // First position recorded
            lastPositionRef.current = newLocation
          }

          // Determine connection quality based on GPS accuracy
          let connectionQuality: "Bonne" | "Moyenne" | "Faible" = "Bonne"
          if (accuracy > 50) connectionQuality = "Faible"
          else if (accuracy > 20) connectionQuality = "Moyenne"

          return {
            ...prev,
            location: newLocation,
            totalDistance: Math.round(newTotalDistance),
            gpsStatus: "active",
            connectionQuality,
          }
        })
      },
      (error) => {
        console.log("[v0] GPS Error:", error.code, error.message)
        if (error.code === error.PERMISSION_DENIED) {
          setData((prev) => ({ ...prev, gpsStatus: "denied" }))
        } else {
          setData((prev) => ({ ...prev, gpsStatus: "error" }))
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  // Simulate other sensor data updates (heart rate, seismic)
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        const newHeartRate = Math.max(60, Math.min(120, prev.heartRate + (Math.random() - 0.5) * 4))
        const newSeismicHz = Math.max(0, Math.min(100, prev.seismicHz + (Math.random() - 0.5) * 2))

        let dangerLevel: "NORMAL" | "ALERTE" | "CRITIQUE" = "NORMAL"
        if (newHeartRate > 110 || newSeismicHz > 50) dangerLevel = "ALERTE"
        if (newHeartRate > 120 || newSeismicHz > 75) dangerLevel = "CRITIQUE"

        return {
          ...prev,
          heartRate: Math.round(newHeartRate),
          seismicHz: Math.round(newSeismicHz * 10) / 10,
          dangerLevel,
        }
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // SOS button handler
  const handleSosStart = useCallback(() => {
    setSosPressed(true)
    setSosTimer(0)
  }, [])

  const handleSosEnd = useCallback(() => {
    if (sosTimer >= 3) {
      // SOS triggered with real location
      const locationText = data.location
        ? `Position: ${data.location.lat.toFixed(5)}, ${data.location.lng.toFixed(5)}`
        : "Position GPS non disponible"
      alert(`SOS ENVOYE! Les secours ont ete alertes.\n${locationText}`)
    }
    setSosPressed(false)
    setSosTimer(0)
  }, [sosTimer, data.location])

  // SOS timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (sosPressed) {
      interval = setInterval(() => {
        setSosTimer((prev) => prev + 0.1)
      }, 100)
    }
    return () => clearInterval(interval)
  }, [sosPressed])

  // Reset distance
  const handleResetDistance = useCallback(() => {
    setData((prev) => ({ ...prev, totalDistance: 0 }))
    if (data.location) {
      lastPositionRef.current = data.location
    }
  }, [data.location])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getDangerColor = () => {
    switch (data.dangerLevel) {
      case "CRITIQUE":
        return "text-red-500"
      case "ALERTE":
        return "text-yellow-500"
      default:
        return "text-green-500"
    }
  }

  // Request GPS permission manually
  const requestGpsPermission = useCallback(() => {
    if (!navigator.geolocation) {
      setData((prev) => ({ ...prev, gpsStatus: "error" }))
      return
    }
    
    setData((prev) => ({ ...prev, gpsStatus: "searching" }))
    
    // Clear previous watch if exists
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }
    
    // Start watching position again
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        const newLocation = { lat: latitude, lng: longitude }

        setData((prev) => {
          let newTotalDistance = prev.totalDistance

          if (lastPositionRef.current) {
            const distance = calculateDistance(
              lastPositionRef.current.lat,
              lastPositionRef.current.lng,
              latitude,
              longitude
            )
            if (distance > 2) {
              newTotalDistance = prev.totalDistance + distance
              lastPositionRef.current = newLocation
            }
          } else {
            lastPositionRef.current = newLocation
          }

          let connectionQuality: "Bonne" | "Moyenne" | "Faible" = "Bonne"
          if (accuracy > 50) connectionQuality = "Faible"
          else if (accuracy > 20) connectionQuality = "Moyenne"

          return {
            ...prev,
            location: newLocation,
            totalDistance: Math.round(newTotalDistance),
            gpsStatus: "active",
            connectionQuality,
          }
        })
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setData((prev) => ({ ...prev, gpsStatus: "denied" }))
        } else {
          setData((prev) => ({ ...prev, gpsStatus: "error" }))
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }, [])

  const getGpsStatusText = () => {
    switch (data.gpsStatus) {
      case "active":
        return "GPS ACTIF"
      case "searching":
        return "RECHERCHE..."
      case "denied":
        return "ACTIVER GPS"
      case "error":
        return "GPS ERREUR"
    }
  }

  const getGpsStatusColor = () => {
    switch (data.gpsStatus) {
      case "active":
        return "text-green-500"
      case "searching":
        return "text-yellow-500"
      default:
        return "text-red-500"
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Watch Container */}
      <div className="watch-container bg-zinc-900 shadow-2xl">
        <div className="watch-screen bg-black p-4 flex flex-col">
          {/* Content wrapper to handle circular clipping */}
          <div className="flex flex-col h-full justify-between py-2">
            {/* Top Section - Time, Connection, Battery */}
            <div className="text-center space-y-1 pt-2">
              <div className="text-3xl font-bold text-white tracking-wider">
                {formatTime(time)}
              </div>
              <div className="flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-1">
                  {data.isConnected ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                  <span className={data.isConnected ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                    {data.isConnected ? "CONNECTE" : "DECONNECTE"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Battery className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 font-medium">{data.battery}%</span>
                </div>
              </div>
            </div>

            {/* Main Data Cards */}
            <div className="flex-1 flex flex-col justify-center px-2 space-y-2">
              {/* Top Row - BPM, Seismic, Danger */}
              <div className="grid grid-cols-3 gap-1.5">
                {/* Heart Rate Card */}
                <div className="bg-zinc-900/80 rounded-xl p-2 border border-zinc-800">
                  <div className="flex items-center gap-1 mb-1">
                    <Heart className="w-4 h-4 text-red-500 heartbeat" fill="currentColor" />
                    <span className="text-white font-bold text-lg">{data.heartRate}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400">BPM</div>
                  <div className="text-[8px] text-zinc-500">Frequence cardiaque</div>
                </div>

                {/* Seismic Card */}
                <div className="bg-zinc-900/80 rounded-xl p-2 border border-zinc-800">
                  <div className="flex items-center gap-1 mb-1">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="text-white font-bold text-lg">{data.seismicHz}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400">Hz</div>
                  <div className="text-[8px] text-zinc-500">Vibrations sismiques</div>
                </div>

                {/* Danger Level Card */}
                <div className="bg-zinc-900/80 rounded-xl p-2 border border-zinc-800">
                  <div className="flex items-center justify-center mb-1">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="text-[8px] text-zinc-400 text-center">NIVEAU DE DANGER</div>
                  <div className={`text-xs font-bold text-center ${getDangerColor()}`}>
                    {data.dangerLevel}
                  </div>
                </div>
              </div>

              {/* Location Row */}
              <button
                onClick={data.gpsStatus === "denied" || data.gpsStatus === "error" ? requestGpsPermission : undefined}
                className={`bg-zinc-900/80 rounded-xl p-2 border border-zinc-800 flex items-center justify-between w-full text-left ${
                  data.gpsStatus === "denied" || data.gpsStatus === "error" ? "cursor-pointer hover:bg-zinc-800 active:bg-zinc-700" : "cursor-default"
                }`}
              >
                <div className="flex items-center gap-2">
                  {data.gpsStatus === "active" ? (
                    <MapPin className="w-4 h-4 text-green-500" />
                  ) : data.gpsStatus === "searching" ? (
                    <MapPin className="w-4 h-4 text-yellow-500 animate-pulse" />
                  ) : (
                    <MapPinOff className="w-4 h-4 text-red-500" />
                  )}
                  <div>
                    <div className={`text-[10px] font-medium ${getGpsStatusColor()}`}>LOCALISATION</div>
                    <div className="text-white text-xs font-mono">
                      {data.location
                        ? `${data.location.lat.toFixed(5)}, ${data.location.lng.toFixed(5)}`
                        : getGpsStatusText()}
                    </div>
                    {(data.gpsStatus === "denied" || data.gpsStatus === "error") && (
                      <div className="text-[8px] text-yellow-400 mt-0.5">Appuyer pour activer</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <PersonStanding className="w-4 h-4 text-green-500" />
                  <div className="text-right">
                    <div className="text-[10px] text-green-500 font-medium">DEPLACEMENT</div>
                    <div className="text-white text-xs font-bold">{data.totalDistance} m</div>
                  </div>
                </div>
              </button>

              {/* Action Buttons Row */}
              <div className="flex items-center justify-center gap-4">
                {/* GPS Button - Reset distance */}
                <button 
                  onClick={handleResetDistance}
                  className="bg-zinc-900/80 rounded-full p-2.5 border border-zinc-800 hover:bg-zinc-800 transition-colors"
                  title="Reinitialiser le deplacement"
                >
                  <Navigation className={`w-4 h-4 ${data.gpsStatus === "active" ? "text-green-500" : "text-zinc-400"}`} />
                  <span className={`text-[8px] block mt-0.5 ${getGpsStatusColor()}`}>GPS</span>
                </button>

                {/* SOS Button */}
                <button
                  onMouseDown={handleSosStart}
                  onMouseUp={handleSosEnd}
                  onMouseLeave={handleSosEnd}
                  onTouchStart={handleSosStart}
                  onTouchEnd={handleSosEnd}
                  className={`sos-button bg-red-600 hover:bg-red-700 rounded-full w-16 h-16 flex flex-col items-center justify-center transition-all ${
                    sosPressed ? "scale-95 bg-red-700" : ""
                  }`}
                >
                  <span className="text-white font-bold text-lg">SOS</span>
                  <span className="text-white/80 text-[8px]">
                    {sosPressed ? `${Math.min(sosTimer, 3).toFixed(1)}s` : "Appuyer 3s"}
                  </span>
                </button>

                {/* Route Button */}
                <button className="bg-zinc-900/80 rounded-full p-2.5 border border-zinc-800 hover:bg-zinc-800 transition-colors">
                  <Route className="w-4 h-4 text-zinc-400" />
                  <span className="text-[8px] text-zinc-500 block mt-0.5">TRAJET</span>
                </button>
              </div>

              {/* Bottom Status Row */}
              <div className="bg-zinc-900/80 rounded-xl p-2 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Battery className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="text-[10px] text-green-500 font-medium">BATTERIE</div>
                    <div className="text-white text-xs font-bold">{data.battery}%</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Signal className="w-4 h-4 text-blue-400" />
                  <div className="text-right">
                    <div className="text-[10px] text-green-500 font-medium">CONNEXION</div>
                    <div className="text-white text-xs font-bold">{data.connectionQuality}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Time */}
            <div className="flex items-center justify-center gap-2 pb-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <div>
                <span className="text-[10px] text-zinc-400">HEURE</span>
                <span className="text-white text-sm font-bold ml-2">{formatTime(time)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
