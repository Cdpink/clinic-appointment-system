from typing import Optional
from pydantic import BaseModel, EmailStr

class ConsultationRecord(BaseModel):
    id: Optional[int]
    first_name: str
    middle_initial: Optional[str]
    last_name: str
    age: Optional[int]
    gender: Optional[str]
    grade_section: Optional[str]
    date_of_birth: Optional[str]
    address: Optional[str]
    parent_guardian: Optional[str]
    contact_number: Optional[str]
    date_of_visit: Optional[str]
    time_of_visit: Optional[str]
    reason_for_visit: Optional[str]
    temperature: Optional[str]
    pulse_rate: Optional[str]
    blood_pressure: Optional[str]
    respiratory_rate: Optional[str]
    assessment: Optional[str]
    diagnosis: Optional[str]
    actions_taken: Optional[dict]
    recommendations: Optional[str]
    nurse_name: Optional[str]
    nurse_signature: Optional[str]
    nurse_date: Optional[str]

class Appointment(BaseModel):
    id: Optional[int]
    first_name: str
    last_name: str
    concern: Optional[str]
    date_time: Optional[str]
    nurse: Optional[str]
    status: Optional[str] = "Pending"
    
class User(BaseModel):
    id: Optional[int]
    full_name: str
    username: str
    email: EmailStr
    password_hash: str
    status: str 
