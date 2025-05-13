from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class Appointment(BaseModel):
    id: str
    patient_id: str
    department: str
    doctor: Optional[str] = None
    datetime: datetime
    status: str = "scheduled"

class Patient(BaseModel):
    id: str
    name: str
    date_of_birth: Optional[datetime] = None
    upcoming_appointments: List[str] = []
    recent_visits: List[Dict[str, Any]] = []
