export type RiskLevel = 'safe' | 'warning' | 'high' | 'critical';

export interface Location {
  lat: number;
  lng: number;
  name: string;
}

export interface Vehicle {
  id: string;
  driverName: string;
  contactNumber: string;
  vehicleNumber: string;
  currentLocation: Location;
  destination: Location;
  speedKmH: number;
  fuelPercent: number;
  cargoType: 'Medicine' | 'Food Supplies' | 'Construction' | 'General Freight';
  cargoPriority: 'Critical' | 'High' | 'Normal';
  riskLevel: RiskLevel;
  etaHours: number;
  lastUpdated: string;
}

export interface IncidentReport {
  id: string;
  location: Location;
  type: 'Landslide' | 'Flash Flood' | 'Bridge Damage' | 'Road Blockage';
  severity: RiskLevel;
  description: string;
  reportedAt: string;
  verified: boolean;
  confidenceScore: number;
}

export interface Shelter {
  id: string;
  name: string;
  location: Location;
  capacityTotal: number;
  capacityOccupied: number;
  status: 'Operational' | 'Full' | 'Standby';
  hasMedicalFacility: boolean;
}

export interface RoadCorridor {
  id: string;
  name: string;
  origin: string;
  destination: string;
  status: 'Open' | 'Restricted' | 'Blocked';
  riskLevel: RiskLevel;
  disruptionProbability: number;
  coordinates: number[][];
}