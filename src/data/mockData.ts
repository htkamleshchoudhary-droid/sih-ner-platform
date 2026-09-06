import type { Vehicle, IncidentReport, Shelter, RoadCorridor } from '../types/logistics.ts';

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'VEH-101',
    driverName: 'Biren Gogoi',
    contactNumber: '+91 98765 43210',
    vehicleNumber: 'AS-01-GC-4412',
    currentLocation: { lat: 25.8010, lng: 91.8200, name: 'Near Nongpoh, Meghalaya' },
    destination: { lat: 25.5788, lng: 91.8933, name: 'Shillong Central Warehouse' },
    speedKmH: 38,
    fuelPercent: 78,
    cargoType: 'Medicine',
    cargoPriority: 'Critical',
    riskLevel: 'safe',
    etaHours: 1.2,
    lastUpdated: '2 mins ago',
  },
  {
    id: 'VEH-104',
    driverName: 'Romen Singh',
    contactNumber: '+91 91234 56789',
    vehicleNumber: 'MN-01-A-8821',
    currentLocation: { lat: 25.1200, lng: 92.3500, name: 'NH-6 East Jaintia Hills' },
    destination: { lat: 24.8170, lng: 93.9368, name: 'Imphal Relief Depot' },
    speedKmH: 22,
    fuelPercent: 45,
    cargoType: 'Food Supplies',
    cargoPriority: 'High',
    riskLevel: 'high',
    etaHours: 5.8,
    lastUpdated: 'Just now',
  }
];

export const INITIAL_INCIDENTS: IncidentReport[] = [
  {
    id: 'INC-2026-01',
    location: { lat: 25.1800, lng: 92.2100, name: 'NH-6 Sonapur Tunnel Approach' },
    type: 'Landslide',
    severity: 'critical',
    description: 'Mudslide and boulder accumulation covering both lanes following heavy rainfall.',
    reportedAt: '15 mins ago',
    verified: true,
    confidenceScore: 94,
  }
];

export const INITIAL_SHELTERS: Shelter[] = [
  {
    id: 'SHL-01',
    name: 'Jowai Community Relief Shelter',
    location: { lat: 25.4500, lng: 92.2000, name: 'Jowai' },
    capacityTotal: 350,
    capacityOccupied: 120,
    status: 'Operational',
    hasMedicalFacility: true,
  }
];

export const MAIN_CORRIDOR: RoadCorridor = {
  id: 'CORRIDOR-NH6',
  name: 'Guwahati - Shillong - Silchar Highway (NH-6)',
  origin: 'Guwahati, Assam',
  destination: 'Silchar, Assam',
  status: 'Restricted',
  riskLevel: 'high',
  disruptionProbability: 76,
  coordinates: [
    [26.1445, 91.7362],
    [25.8010, 91.8200],
    [25.5788, 91.8933],
    [25.4500, 92.2000],
    [25.1800, 92.2100],
    [24.8333, 92.7789]
  ]
};