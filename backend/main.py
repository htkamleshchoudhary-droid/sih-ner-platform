from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import requests
import datetime

# Import modular components (if auth.py or ml_model.py exist in backend/)
try:
    from auth import create_access_token, get_current_user, User
    from ml_model import predict_landslide_disruption
    HAS_ENTERPRISE_MODULES = True
except ImportError:
    HAS_ENTERPRISE_MODULES = False

app = FastAPI(
    title="NER-SHIELD Logistics Intelligence API",
    description="Disaster-aware AI risk engine, live OpenWeather monitoring, and telematics core for North East India (NH-6 Corridor)",
    version="2.0.0"
)

# Enable CORS for Vite local frontend (http://localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PYDANTIC SCHEMAS ---

# --- PYDANTIC SCHEMAS ---

class EnvironmentalData(BaseModel):
    rainfall_mm_hr: float = Field(default=28.5, alias="hourly_rainfall_mm")
    slope_angle_deg: float = Field(default=45.0, alias="slope_gradient_degrees")
    soil_saturation_percent: float = Field(default=82.0, alias="soil_saturation_percent")
    recent_earthquake_mag: Optional[float] = 0.0

class FlexibleRiskRequest(BaseModel):
    origin: Optional[str] = "Guwahati"
    destination: Optional[str] = "Silchar"
    cargo_priority: Optional[str] = "High"
    hourly_rainfall_mm: Optional[float] = 28.5
    slope_gradient_degrees: Optional[float] = 45.0
    soil_saturation_percent: Optional[float] = 82.0
    env_data: Optional[EnvironmentalData] = None

# --- GEOGRAPHIC & WEATHER CONSTANTS ---

SECTOR_COORDINATES = {
    "Sonapur": {"lat": 25.1800, "lon": 92.2100},
    "Jowai": {"lat": 25.4500, "lon": 92.2000},
    "Shillong": {"lat": 25.5788, "lon": 91.8933}
}

def fetch_live_rainfall(lat: float, lon: float, api_key: str = "DEMO_KEY") -> float:
    """Fetches live 1-hour precipitation data via OpenWeatherMap API."""
    if api_key == "DEMO_KEY":
        return 35.0  # Simulated heavy monsoon precipitation for East Jaintia Hills
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
        response = requests.get(url, timeout=5)
        data = response.json()
        rain = data.get("rain", {}).get("1h", 0.0)
        return float(rain)
    except Exception:
        return 15.0

def calculate_rule_risk(rainfall: float, slope: float = 45.0, saturation: float = 85.0) -> dict:
    """Algorithmic risk evaluation engine with threshold recommendations."""
    risk_score = (rainfall * 1.6) + (slope * 0.7) + (saturation * 0.3)
    final_probability = min(round(risk_score, 1), 99.9)

    if final_probability < 35:
        status = "Safe"
        recommendation = "Normal highway operations along primary NH-6 corridor."
    elif final_probability < 70:
        status = "Warning"
        recommendation = "Proceed with caution. Speed restrictions active along hill sectors."
    else:
        status = "Critical"
        recommendation = "HIGH LANDSLIDE RISK: Dynamic AI detour triggered via Jowai feeder bypass road."

    return {
        "rainfall_mm_hr": rainfall,
        "disruption_probability_percent": final_probability,
        "risk_status": status,
        "ai_recommendation": recommendation,
    }

# --- API ENDPOINTS ---

@app.get("/")
def root():
    return {
        "status": "Online",
        "system": "NER-SHIELD Risk & Telematics Intelligence Core",
        "version": "2.0.0",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

@app.post("/api/v1/token")
def login(username: str, role: str):
    """Generates JWT tokens for authorized operators and drivers."""
    if HAS_ENTERPRISE_MODULES:
        access_token = create_access_token(data={"sub": username, "role": role})
        return {"access_token": access_token, "token_type": "bearer", "role": role}
    return {"access_token": "DEMO_JWT_TOKEN", "token_type": "bearer", "role": role}

@app.post("/api/v1/predict-risk")
def predict_corridor_risk(request: FlexibleRiskRequest):
    """Calculates route risk supporting both flat JSON payloads and nested RouteRequests."""
    coords = SECTOR_COORDINATES["Sonapur"]

    # Extract environmental parameters flexibly
    if request.env_data:
        rainfall = request.env_data.rainfall_mm_hr
        slope = request.env_data.slope_angle_deg
        saturation = request.env_data.soil_saturation_percent
    else:
        rainfall = request.hourly_rainfall_mm if request.hourly_rainfall_mm is not None else fetch_live_rainfall(coords["lat"], coords["lon"])
        slope = request.slope_gradient_degrees if request.slope_gradient_degrees is not None else 45.0
        saturation = request.soil_saturation_percent if request.soil_saturation_percent is not None else 82.0

    # Use ML model if trained binary is available, otherwise fall back to formula
    if HAS_ENTERPRISE_MODULES:
        risk_assessment = predict_landslide_disruption(rainfall, slope, saturation)
        risk_assessment["ai_recommendation"] = "Dynamic AI detour triggered via Jowai feeder bypass road." if risk_assessment["risk_status"] == "Critical" else "Primary Highway NH-6 open."
    else:
        risk_assessment = calculate_rule_risk(rainfall, slope, saturation)

    return {
        "corridor": f"{request.origin} to {request.destination}",
        "sector_monitored": "Sonapur Tunnel Sector (NH-6)",
        "cargo_priority": request.cargo_priority,
        "assessment": risk_assessment,
    }

# --- WEBSOCKET TELEMETRY STREAMING ---

class TelemetryConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = TelemetryConnectionManager()

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"Telemetry Broadcast: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)