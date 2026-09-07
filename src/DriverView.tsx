import React, { useEffect } from 'react';
import type { Vehicle, RoadCorridor } from './types/logistics.ts';
import { supabase } from './supabaseClient.ts';

interface DriverViewProps {
  vehicle: Vehicle | null;
  corridor: RoadCorridor;
  isRerouted: boolean;
  lang: 'EN' | 'AS' | 'BN' | 'HI';
  onQuickReport: (type: 'Landslide' | 'Flash Flood' | 'Road Blockage') => void;
  onDownloadPDF: () => void;
}

export const DriverView: React.FC<DriverViewProps> = ({
  vehicle,
  corridor,
  isRerouted,
  lang,
  onQuickReport,
  onDownloadPDF,
}) => {
  if (!vehicle) {
    return (
      <div className="p-8 text-center text-slate-400">
        No active vehicle assigned. Please select a vehicle from the command view.
      </div>
    );
  }

  // Multi-Lingual Text-to-Speech Engine for Hands-Free Driving
  const speakAlert = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel(); // Stop active speech
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.rate = 0.85; // Clear pacing for noisy vehicle cabs
    utterance.pitch = 1.0;

    // Fetch available system voices
    const voices = window.speechSynthesis.getVoices();

    if (lang === 'HI') {
      utterance.lang = 'hi-IN';
      const hiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('HI'));
      if (hiVoice) utterance.voice = hiVoice;
    } 
    else if (lang === 'BN') {
      utterance.lang = 'bn-IN';
      const bnVoice = voices.find(v => v.lang.includes('bn') || v.lang.includes('BN'));
      if (bnVoice) utterance.voice = bnVoice;
    } 
    else if (lang === 'AS') {
      // Fallback for Assamese to Bengali/Hindi acoustic engine if AS voice is uninstalled
      utterance.lang = 'bn-IN'; 
      const asVoice = voices.find(v => v.lang.includes('bn') || v.lang.includes('hi'));
      if (asVoice) utterance.voice = asVoice;
    } 
    else {
      utterance.lang = 'en-US';
    }

    window.speechSynthesis.speak(utterance);
  };

  // Auto-announce status changes aloud
  useEffect(() => {
    if (isRerouted) {
      speakAlert("Warning! Sonapur Tunnel on Highway N H 6 is blocked by a landslide. Your truck has been rerouted via Jowai Bypass.");
    } else {
      speakAlert("Highway N H 6 is clear. Proceed with caution across hill sectors.");
    }
  }, [isRerouted]);

  // Real-Time Cloud Hazard Reporting Handler
  const handleCloudReport = async (type: 'Landslide' | 'Flash Flood' | 'Road Blockage') => {
    // Default coordinates near Sonapur sector
    let reportLat = vehicle?.currentLocation?.lat || 25.1211;
    let reportLng = vehicle?.currentLocation?.lng || 92.3686;

    // Grab real GPS coordinates if geolocation is available on driver device
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
        });
        reportLat = position.coords.latitude;
        reportLng = position.coords.longitude;
      } catch (e) {
        console.log("Using default corridor coordinates for hazard report.");
      }
    }

    // Write report directly to online Supabase database
    const { error } = await supabase.from('incidents').insert([
      {
        type: type,
        description: `Hazard reported by Driver ${vehicle.driverName} (${vehicle.id})`,
        lat: reportLat,
        lng: reportLng,
      },
    ]);

    if (error) {
      console.error("Supabase live write failed, triggering local state fallback:", error);
    }

    // Trigger parent state update
    onQuickReport(type);
  };

  return (
    <div className="flex flex-col flex-1 bg-slate-950 p-4 max-w-md mx-auto w-full space-y-4 overflow-y-auto">
      {/* Route Status Card */}
      <div className={`p-5 rounded-2xl border ${isRerouted ? 'bg-red-950/80 border-red-600 animate-pulse' : 'bg-emerald-950/80 border-emerald-600'} shadow-2xl text-center`}>
        <span className="text-4xl block mb-2">{isRerouted ? '🚨' : '🟢'}</span>
        <h2 className="text-xl font-black uppercase text-white tracking-wide">
          {isRerouted ? 'MAIN ROAD BLOCKED' : 'ROUTE CLEAR'}
        </h2>
        <p className="text-xs text-slate-200 font-semibold mt-1">
          {isRerouted ? 'Sonapur Tunnel sector closed due to landslide.' : 'Highway NH-6 open for heavy traffic.'}
        </p>
        
        <button
          onClick={() => speakAlert(isRerouted ? "Warning! Highway N H 6 blocked. Detour through Jowai Bypass." : "Route clear. Normal travel time 4 hours.")}
          className="mt-3 bg-slate-900 hover:bg-slate-800 text-blue-400 text-xs font-bold py-2 px-4 rounded-xl border border-slate-700 flex items-center justify-center gap-2 mx-auto"
        >
          🔊 Replay Voice Alert
        </button>
      </div>

      {/* Active Navigation Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Assigned Vehicle</span>
            <span className="text-base font-bold text-blue-400">{vehicle.id} ({vehicle.vehicleNumber})</span>
          </div>
          <span className="bg-blue-950 text-blue-300 border border-blue-800 text-xs font-bold px-2.5 py-1 rounded-lg">
            {vehicle.cargoType}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Current Location</span>
            <span className="font-bold text-slate-100">{vehicle.currentLocation.name}</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Est. Travel Time</span>
            <span className="font-bold text-emerald-400">{vehicle.etaHours} Hours</span>
          </div>
        </div>
      </div>

      {/* 1-Tap Rapid Hazard Reporting for Drivers */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase mb-3 text-center">
          ⚡ 1-Tap Quick Hazard Reporter
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleCloudReport('Landslide')}
            className="bg-red-950 hover:bg-red-900 border border-red-700 text-red-200 font-bold py-3 px-2 rounded-xl text-xs flex flex-col items-center gap-1 active:scale-95 transition-all"
          >
            <span className="text-xl">🪨</span>
            Landslide
          </button>

          <button
            onClick={() => handleCloudReport('Flash Flood')}
            className="bg-blue-950 hover:bg-blue-900 border border-blue-700 text-blue-200 font-bold py-3 px-2 rounded-xl text-xs flex flex-col items-center gap-1 active:scale-95 transition-all"
          >
            <span className="text-xl">🌊</span>
            Flood
          </button>

          <button
            onClick={() => handleCloudReport('Road Blockage')}
            className="bg-orange-950 hover:bg-orange-900 border border-orange-700 text-orange-200 font-bold py-3 px-2 rounded-xl text-xs flex flex-col items-center gap-1 active:scale-95 transition-all"
          >
            <span className="text-xl">🚧</span>
            Blockage
          </button>
        </div>
      </div>

      {/* Offline Route PDF Export */}
      <button
        onClick={onDownloadPDF}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl text-xs shadow-lg transition-all flex items-center justify-center gap-2"
      >
        📄 Save Offline Route PDF
      </button>
    </div>
  );
};