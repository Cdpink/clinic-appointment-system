from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ValidationError
from typing import List, Optional
from backend.database.connection import db
from bson import ObjectId

router = APIRouter()
consultations = db["student_consultations"]

class ActionsTaken(BaseModel):
    restedInClinic: bool = False
    givenFirstAid: bool = False
    administeredMedication: bool = False
    medicationDetails: Optional[str] = ""
    sentHome: bool = False
    referred: bool = False
    referredTo: Optional[str] = ""
    others: bool = False
    othersDetails: Optional[str] = ""

class Consultation(BaseModel):
    id: Optional[str] = None
    studentId: Optional[str] = None
    firstName: Optional[str] = None
    middleInitial: Optional[str] = None
    lastName: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    gradeSection: Optional[str] = None
    dateOfBirth: Optional[str] = None
    address: Optional[str] = None
    parentGuardian: Optional[str] = None
    contactNumber: Optional[str] = None
    concern: Optional[str] = None
    nurse: Optional[str] = None
    dateTime: Optional[str] = None
    temperature: Optional[str] = ""
    pulseRate: Optional[str] = ""
    bloodPressure: Optional[str] = ""
    respiratoryRate: Optional[str] = ""
    assessment: Optional[str] = ""
    diagnosis: Optional[str] = ""
    actionsTaken: ActionsTaken = ActionsTaken()
    recommendations: Optional[str] = ""
    nurseName: Optional[str] = ""
    nurseSignature: Optional[str] = ""
    nurseDate: Optional[str] = ""

from datetime import datetime

def consultation_table(c) -> dict:
    c = dict(c)
    student_id = c.get("studentId", "")
    if hasattr(student_id, "binary"):  # check if ObjectId
        student_id = str(student_id)
    date_time = c.get("dateTime", "")
    if isinstance(date_time, datetime):
        date_time = date_time.isoformat()
    actions_taken = c.get("actionsTaken", {
        "restedInClinic": False,
        "givenFirstAid": False,
        "administeredMedication": False,
        "medicationDetails": "",
        "sentHome": False,
        "referred": False,
        "referredTo": "",
        "others": False,
        "othersDetails": ""
    })
    if not isinstance(actions_taken, dict) or isinstance(actions_taken, str):
        actions_taken = {
            "restedInClinic": False,
            "givenFirstAid": False,
            "administeredMedication": False,
            "medicationDetails": "",
            "sentHome": False,
            "referred": False,
            "referredTo": "",
            "others": False,
            "othersDetails": ""
        }
    return {
        "id": str(c.get("_id", "")),
        "studentId": student_id,
        "firstName": c.get("firstName", ""),
        "middleInitial": c.get("middleInitial", ""),
        "lastName": c.get("lastName", ""),
        "age": c.get("age", 0),
        "gender": c.get("gender", ""),
        "gradeSection": c.get("gradeSection", ""),
        "dateOfBirth": c.get("dateOfBirth", ""),
        "address": c.get("address", ""),
        "parentGuardian": c.get("parentGuardian", ""),
        "contactNumber": c.get("contactNumber", ""),
        "concern": c.get("concern", ""),
        "nurse": c.get("nurse", ""),
        "dateTime": date_time,
        "temperature": c.get("temperature", ""),
        "pulseRate": c.get("pulseRate", ""),
        "bloodPressure": c.get("bloodPressure", ""),
        "respiratoryRate": c.get("respiratoryRate", ""),
        "assessment": c.get("assessment", ""),
        "diagnosis": c.get("diagnosis", ""),
        "actionsTaken": actions_taken,
        "recommendations": c.get("recommendations", ""),
        "nurseName": c.get("nurseName", ""),
        "nurseSignature": c.get("nurseSignature", ""),
        "nurseDate": c.get("nurseDate", "")
    }

@router.get("/consultations", response_model=List[Consultation])
async def get_consultations():
    consultations_list = []
    for c in consultations.find():
        data = consultation_table(c)
        consultation_obj = Consultation.parse_obj(data)
        consultations_list.append(consultation_obj)
    return consultations_list

@router.post("/consultations")
async def create_consultation(request: Request):
    try:
        consultation = Consultation.parse_obj(await request.json())
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors())

    data = consultation.dict()
    data["actionsTaken"] = consultation.actionsTaken.dict()

    result = consultations.insert_one(data)
    return {"message": "Consultation created successfully.", "id": str(result.inserted_id)}

@router.put("/consultations/{consultation_id}")
async def update_consultation(consultation_id: str, consultation: Consultation):
    try:
        obj_id = ObjectId(consultation_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid consultation ID format")

    existing = consultations.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail=f"Consultation with ID {consultation_id} not found")

    update_data = consultation.dict()
    update_data["actionsTaken"] = consultation.actionsTaken.dict()

    result = consultations.update_one({"_id": obj_id}, {"$set": update_data})
    return {"message": "Consultation updated successfully."}

@router.delete("/consultations/{consultation_id}")
async def delete_consultation(consultation_id: str):
    try:
        obj_id = ObjectId(consultation_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid consultation ID format")

    result = consultations.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Consultation with ID {consultation_id} not found")

    return {"message": f"Consultation with ID {consultation_id} deleted successfully."}
