from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

# Connects to production PostgreSQL/PostGIS container
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/ner_shield_db"

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class DBIncidentReport(Base):
    __tablename__ = "incident_reports"

    id = Column(String, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String, nullable=False)
    incident_type = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    description = Column(String)
    confidence_score = Column(Integer, default=85)
    reported_at = Column(DateTime, default=datetime.datetime.utcnow)
    synced_from_offline = Column(Boolean, default=False)

class DBVehicleTelemetry(Base):
    __tablename__ = "vehicle_telemetry"

    vehicle_id = Column(String, primary_key=True, index=True)
    driver_name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed_kmh = Column(Float, default=0.0)
    fuel_percent = Column(Float, default=100.0)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)