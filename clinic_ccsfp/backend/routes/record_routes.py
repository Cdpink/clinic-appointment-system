from fastapi import APIRouter
from pydantic import BaseModel
from backend.database.connection import db

router = APIRouter()
records = db["student_records"]

class Record(BaseModel):
    studentId: str
    lastName: str
    firstName: str
    concern: str
    nurse: str
    dateTime: str
    email: str

@router.post("/records")
def add_record(record: Record):
    records.insert_one(record.dict())
    return {"message": "Record saved"}

@router.get("/records")
def get_all_records():
    return list(records.find({}, {"_id": 0}))


