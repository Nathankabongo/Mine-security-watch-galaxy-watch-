"use client"

import { useState, useEffect, useCallback } from "react"
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
} from "lucide-react"

interface WatchData {
  heartRate: number
  seismicHz: number
  dangerLevel: "NORMAL" | "ALERTE" | "CRITIQUE"
  location: { lat: number; lng: number }
  distance: number
  battery: number
  isConnected: boolean
  connectionQuality: "Bonne" | "Moyenne" | "Faible"
}

export default function WatchScreen() {
  const [time, setTime] = useState(new Date())
  const [sosPressed, setSosPressed] = useState(false)
  const [sosTimer, setSosTimer] = useState(0)
  const [data, setData] = useState<WatchData>({
    heartRate: 88,
    seismicHz: 24.5,
    dangerLevel: "NORMAL",
    location: { lat: -4.325, lng: 15.322 },
    distance: 245,
    battery: 82,
    isConnected: true,
    connectionQuality: "Bonne",
  })

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Simulate sensor data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        const newHeartRate = Math.max(60, Math.min(120, prev.heartRate + (Math.random() - 0.5) * 4))
        const newSeismicHz = Math.max(0, Math.min(100, prev.seismicHz + (Math.random() - 0.5) * 2))
        const newDistance = prev.distance + Math.floor(Math.random() * 3)

        let dangerLevel: "NORMAL" | "ALERTE" | "CRITIQUE" = "NORMAL"
        if (newHeartRate > 110 || newSeismicHz > 50) dangerLevel = "ALERTE"
        if (newHeartRate > 120 || newSeismicHz > 75) dangerLevel = "CRITIQUE"

        return {
          ...prev,
          heartRate: Math.round(newHeartRate),
          seismicHz: Math.round(newSeismicHz * 10) / 10,
          dangerLevel,
          distance: newDistance,
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
      // SOS triggered
      alert("🚨 SOS ENVOYÉ! Les secours ont été alertés.")
    }
    setSosPressed(false)
    setSosTimer(0)
  }, [sosTimer])

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
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 font-medium">CONNECTÉ</span>
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
                  <div className="text-[8px] text-zinc-500">Fréquence cardiaque</div>
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
              <div className="bg-zinc-900/80 rounded-xl p-2 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="text-[10px] text-green-500 font-medium">LOCALISATION</div>
                    <div className="text-white text-xs font-mono">
                      {data.location.lat.toFixed(5)}, {data.location.lng.toFixed(5)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <PersonStanding className="w-4 h-4 text-green-500" />
                  <div className="text-right">
                    <div className="text-[10px] text-green-500 font-medium">DÉPLACEMENT</div>
                    <div className="text-white text-xs font-bold">{data.distance} m</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center justify-center gap-4">
                {/* GPS Button */}
                <button className="bg-zinc-900/80 rounded-full p-2.5 border border-zinc-800 hover:bg-zinc-800 transition-colors">
                  <Navigation className="w-4 h-4 text-zinc-400" />
                  <span className="text-[8px] text-zinc-500 block mt-0.5">GPS</span>
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
