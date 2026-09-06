import os
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier

MODEL_FILE = "landslide_risk_model.joblib"

def train_and_save_model():
    """Simulates training on historical IMD weather & ISRO geological landslide logs."""
    np.random.seed(42)
    # Features: [hourly_rainfall_mm, slope_degrees, soil_moisture_percent, historical_incident_count]
    X_train = np.random.uniform(low=[0, 10, 20, 0], high=[100, 70, 100, 10], size=(1000, 4))
    
    # Target: 1 = Disrupted/Blocked, 0 = Safe
    # High rainfall (>25mm), steep slope (>35 deg), and high soil saturation (>75%) trigger blockage
    y_train = ((X_train[:, 0] * 0.4 + X_train[:, 1] * 0.3 + X_train[:, 2] * 0.3) > 55).astype(int)

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    joblib.dump(model, MODEL_FILE)
    return model

def load_or_train_model():
    if os.path.exists(MODEL_FILE):
        return joblib.load(MODEL_FILE)
    return train_and_save_model()

risk_model = load_or_train_model()

def predict_landslide_disruption(rainfall_mm: float, slope_deg: float, soil_moisture: float, incidents: int = 1):
    features = np.array([[rainfall_mm, slope_deg, soil_moisture, incidents]])
    disruption_prob = float(risk_model.predict_proba(features)[0][1]) * 100
    
    if disruption_prob >= 75:
        status = "Critical"
    elif disruption_prob >= 40:
        status = "Restricted"
    else:
        status = "Open"

    return {
        "disruption_probability_percent": round(disruption_prob, 2),
        "risk_status": status,
        "model_version": "RandomForest_v1.0_Production"
    }