import React, { useState } from 'react';
import type { IncidentReport, RiskLevel } from '../types/logistics.ts';
import { saveIncidentOffline } from '../services/db.ts';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReport: (newReport: IncidentReport) => void;
}

export const ReportIncidentModal: React.FC<ModalProps> = ({ isOpen, onClose, onSubmitReport }) => {
  const [type, setType] = useState<IncidentReport['type']>('Landslide');
  const [severity, setSeverity] = useState<RiskLevel>('critical');
  const [locationName, setLocationName] = useState('NH-6 Jowai Sector');
  const [description, setDescription] = useState('');
  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const [lat, setLat] = useState(25.3500);
  const [lng, setLng] = useState(92.2500);

  if (!isOpen) return null;

  const handleCaptureGPS = () => {
    setIsCapturingGps(true);
    // Simulate mobile browser GPS fetch along mountain corridor
    setTimeout(() => {
      setLat(25.3341);
      setLng(92.2890);
      setIsCapturingGps(false);
    }, 800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const report: IncidentReport = {
      id: `INC-2026-${Math.floor(100 + Math.random() * 900)}`,
      location: { lat, lng, name: locationName },
      type,
      severity,
      description: description || 'Field report submitted via mobile terminal.',
      reportedAt: 'Just now',
      verified: navigator.onLine, // Auto-verified if online, pending if offline
      confidenceScore: navigator.onLine ? 91 : 75,
    };

    // If device is offline, persist report locally in IndexedDB
    if (!navigator.onLine) {
      await saveIncidentOffline(report);
      alert(`Network connection unavailable. Report ${report.id} saved locally in IndexedDB and queued for auto-sync.`);
    }

    onSubmitReport(report);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            🚨 Report Field Hazard / Road Damage
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-lg">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Incident Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as IncidentReport['type'])}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-blue-500 outline-none"
            >
              <option value="Landslide">Mudslide / Landslide</option>
              <option value="Flash Flood">Flash Flood / Water Logging</option>
              <option value="Bridge Damage">Bridge Structural Damage</option>
              <option value="Road Blockage">Tree / Debris Obstruction</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as RiskLevel)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-blue-500 outline-none"
              >
                <option value="warning">Warning (Single Lane Open)</option>
                <option value="high">High Risk (Heavy Vehicles Stuck)</option>
                <option value="critical">Critical (Total Corridor Blocked)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Location Landmark</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">GPS Coordinates</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${lat.toFixed(4)}, ${lng.toFixed(4)}`}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-400 font-mono text-[11px]"
              />
              <button
                type="button"
                onClick={handleCaptureGPS}
                className="bg-slate-800 hover:bg-slate-700 text-blue-400 font-semibold px-3 rounded-lg border border-slate-700"
              >
                {isCapturingGps ? 'Capturing...' : '📡 Capture GPS'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Field Observations / Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe boulder sizes, water depth, or affected highway kilometer post..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-600/30"
            >
              Submit Hazard Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};