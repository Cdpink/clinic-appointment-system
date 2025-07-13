import logging
logging.basicConfig(level=logging.DEBUG)

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from backend.database.connection import db
from bson import ObjectId

router = APIRouter()
appointments = db["student_appointments"]

class Appointment(BaseModel):
    id: str = None
    studentId: str
    lastName: str
    firstName: str
    email: str
    concern: str
    nurse: str
    dateTime: str
    status: str

import datetime
from bson import ObjectId

def appointment_table(a) -> dict:
    student_id = a.get("studentId", "")
    if isinstance(student_id, ObjectId):
        student_id = str(student_id)
    nurse = a.get("nurse", "")
    if isinstance(nurse, ObjectId):
        nurse = str(nurse)
    date_time = a.get("dateTime", "")
    if isinstance(date_time, datetime.datetime):
        date_time = date_time.isoformat()
    return {
        "id": str(a["_id"]),
        "studentId": student_id,
        "lastName": a.get("lastName", ""),
        "firstName": a.get("firstName", ""),
        "email": a.get("email", "N/A"),
        "concern": a.get("concern", ""),
        "nurse": nurse,
        "dateTime": date_time,
        "status": a.get("status", "")
    }

import logging
from fastapi import status

logger = logging.getLogger(__name__)

@router.get("/appointments")
async def get_appointments():
    try:
        raw_appointments = list(appointments.find())
        logger.debug(f"Raw appointments from DB: {raw_appointments}")
        return [appointment_table(a) for a in raw_appointments]
    except Exception as e:
        logger.error(f"Error fetching appointments: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")

@router.post("/appointments")
async def create_appointment(appointment: Appointment):
    appointment_date = appointment.dateTime.split("T")[0]
    start_of_day = f"{appointment_date}T00:00"
    end_of_day = f"{appointment_date}T23:59"

    if appointments.find_one({
        "nurse": appointment.nurse,
        "dateTime": appointment.dateTime,
        "status": {"$ne": "Rejected"}
    }):
        raise HTTPException(status_code=400, detail="Time slot already booked for this nurse.")

    if appointments.find_one({
        "studentId": appointment.studentId,
        "dateTime": {
            "$gte": start_of_day,
            "$lte": end_of_day
        },
        "status": {"$ne": "Rejected"}
    }):
        raise HTTPException(status_code=400, detail="Student already has an appointment on this date.")

    data = appointment.dict(exclude_unset=True)
    result = appointments.insert_one(data)
    return {"message": "Appointment created successfully.", "id": str(result.inserted_id)}

@router.patch("/appointments/{id}/accept")
async def accept_appointment(id: str):
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid appointment ID")

    result = appointments.update_one(
        {"_id": obj_id},
        {"$set": {"status": "Accepted"}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")

    return {"message": "Appointment accepted successfully"}

@router.delete("/appointments/{id}")
async def delete_appointment(id: str):
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid appointment ID")

    result = appointments.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")

    return {"message": "Appointment deleted successfully"}
