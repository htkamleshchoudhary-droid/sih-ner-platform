import React, { useEffect } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Vehicle, IncidentReport, Shelter, RoadCorridor } from '../types/logistics.ts';

// Fix Leaflet Default Icon pathing issue in React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Auto-recalculate map bounds when parent container sizes change
const MapResizeHandler = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

interface MapProps {
  vehicles: Vehicle[];
  incidents: IncidentReport[];
  shelters: Shelter[];
  corridor: RoadCorridor;
  onSelectVehicle?: (vehicle: Vehicle) => void;
}

// NER Regional Center: Centered over Meghalaya/Assam border
const NER_CENTER: [number, number] = [25.5788, 91.8933];

export const MapContainerComponent: React.FC<MapProps> = ({
  vehicles,
  incidents,
  shelters,
  corridor,
  onSelectVehicle,
}) => {
  return (
    <div className="w-full h-full min-h-[500px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative bg-slate-900">
      <LeafletMap
        center={NER_CENTER}
        zoom={8}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ height: '100%', width: '100%', minHeight: '500px' }}
      >
        <MapResizeHandler />

        {/* High-Contrast Mission Control Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Highway Corridor Overlay (NH-6) */}
        <Polyline
          positions={corridor.coordinates as [number, number][]}
          pathOptions={{
            color: corridor.status === 'Blocked' ? '#ef4444' : corridor.riskLevel === 'high' || corridor.riskLevel === 'critical' ? '#ea580c' : '#10b981',
            weight: 6,
            dashArray: corridor.status === 'Restricted' || corridor.status === 'Blocked' ? '8, 8' : undefined,
          }}
        >
          <Popup>
            <div className="p-1 text-slate-900">
              <p className="font-bold text-sm">{corridor.name}</p>
              <p className="text-xs">Status: <span className="font-semibold">{corridor.status}</span></p>
              <p className="text-xs">Disruption Risk: <span className="text-orange-600 font-bold">{corridor.disruptionProbability}%</span></p>
            </div>
          </Popup>
        </Polyline>

        {/* Live Vehicle Markers */}
        {vehicles.map((v) => (
          <Marker
            key={v.id}
            position={[v.currentLocation.lat, v.currentLocation.lng]}
            eventHandlers={{
              click: () => onSelectVehicle && onSelectVehicle(v),
            }}
          >
            <Popup>
              <div className="p-1 text-slate-900">
                <div className="flex items-center justify-between gap-2 border-b pb-1 mb-1">
                  <span className="font-bold text-blue-700">{v.id}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 font-mono">{v.vehicleNumber}</span>
                </div>
                <p className="text-xs">Driver: <strong>{v.driverName}</strong></p>
                <p className="text-xs">Cargo: <strong>{v.cargoType} ({v.cargoPriority})</strong></p>
                <p className="text-xs">Destination: <strong>{v.destination.name}</strong></p>
                <p className="text-xs">ETA: <strong>{v.etaHours} hrs</strong></p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Disaster Incident Markers */}
        {incidents.map((inc) => (
          <Marker
            key={inc.id}
            position={[inc.location.lat, inc.location.lng]}
          >
            <Popup>
              <div className="p-1 text-slate-900">
                <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                  🚨 {inc.type}
                </span>
                <p className="font-bold text-xs mt-1">{inc.location.name}</p>
                <p className="text-xs text-slate-600">{inc.description}</p>
                <p className="text-[10px] text-slate-400 mt-1">Confidence: {inc.confidenceScore}%</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Emergency Shelter Markers */}
        {shelters.map((s) => (
          <Marker
            key={s.id}
            position={[s.location.lat, s.location.lng]}
          >
            <Popup>
              <div className="p-1 text-slate-900">
                <span className="bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                  🛖 {s.name}
                </span>
                <p className="text-xs mt-1">Occupancy: <strong>{s.capacityOccupied} / {s.capacityTotal}</strong></p>
                <p className="text-xs">Medical Facility: <strong>{s.hasMedicalFacility ? 'Yes ✓' : 'No'}</strong></p>
              </div>
            </Popup>
          </Marker>
        ))}
      </LeafletMap>
    </div>
  );
};