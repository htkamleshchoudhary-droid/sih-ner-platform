export interface RiskPredictionResponse {
  corridor: string;
  cargo_priority: string;
  assessment: {
    disruption_probability_percent: number;
    risk_status: 'Safe' | 'Warning' | 'Critical';
    ai_recommendation: string;
  };
}

export const fetchCorridorRisk = async (
  rainfallMmHr: number,
  slopeAngleDeg: number,
  soilSaturationPercent: number
): Promise<RiskPredictionResponse> => {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/v1/predict-risk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin: 'Guwahati, Assam',
        destination: 'Silchar, Assam',
        cargo_priority: 'Critical',
        env_data: {
          rainfall_mm_hr: rainfallMmHr,
          slope_angle_deg: slopeAngleDeg,
          soil_saturation_percent: soilSaturationPercent,
          recent_earthquake_mag: 0.0,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`FastAPI Server Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.warn("FastAPI offline or unreachable. Using offline fallback response:", error);
    return {
      corridor: "Guwahati, Assam to Silchar, Assam",
      cargo_priority: "Critical",
      assessment: {
        disruption_probability_percent: 98.5,
        risk_status: "Critical",
        ai_recommendation: "HIGH LANDSLIDE RISK: Dynamic AI detour triggered via Jowai feeder route.",
      },
    };
  }
};