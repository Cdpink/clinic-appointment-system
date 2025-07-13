from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import List
from passlib.context import CryptContext
from backend.database.connection import users as admin_users, db

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

records = db["student_records"]

PERMANENT_ADMIN = {
    "username": "admin",
    "password": "admin12345",
    "full_name": "Administrator",
    "email": "admin@system.com",
    "status": "Active"
}

class UserRegister(BaseModel):
    full_name: str
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserApprove(BaseModel):
    username: str

class UserOut(BaseModel):
    full_name: str
    username: str
    email: EmailStr
    status: str

class Record(BaseModel):
    studentId: str
    lastName: str
    firstName: str
    concern: str
    nurse: str
    dateTime: str
    email: str

def admin_user_table(user) -> dict:
    return {
        "full_name": user["full_name"],
        "username": user["username"],
        "email": user["email"],
        "status": user["status"]
    }

def get_user_by_username(username: str):
    return admin_users.find_one({"username": username})

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str):
    return pwd_context.verify(plain, hashed)

@router.post("/register")
def register(user: UserRegister):
    if get_user_by_username(user.username):
        raise HTTPException(400, "Username already exists")

    data = {
        "full_name": user.full_name,
        "username": user.username,
        "email": user.email,
        "password_hash": hash_password(user.password),
        "status": "Pending"
    }

    admin_users.insert_one(data)
    return {"message": "Registration successful. Please wait for approval."}

@router.post("/login")
def login(user: UserLogin):
    if user.username == PERMANENT_ADMIN["username"] and user.password == PERMANENT_ADMIN["password"]:
        return {"message": "Login successful", "role": "admin"}

    db_user = get_user_by_username(user.username)
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(400, "Invalid username or password")
    if db_user["status"] != "Active":
        raise HTTPException(403, "User not approved yet")

    return {"message": "Login successful", "role": "staff"}

@router.get("/pending-users", response_model=List[UserOut])
def get_pending_users():
    users = admin_users.find({"status": "Pending"}, {"_id": 0, "password_hash": 0})
    return [admin_user_table(u) for u in users]

@router.post("/approve-user")
def approve_user(user: UserApprove):
    result = admin_users.update_one(
        {"username": user.username, "status": "Pending"},
        {"$set": {"status": "Active"}}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "User not found or already approved")

    return {"message": "User approved successfully"}

@router.delete("/clear-admin-users")
def clear_admin_users():
    result = admin_users.delete_many({})
    return {"message": f"Deleted {result.deleted_count} admin users."}

@router.post("/records")
def add_record(record: Record):
    records.insert_one(record.dict())
    return {"message": "Record saved"}

@router.get("/records")
def get_all_records():
    return list(records.find({}, {"_id": 0}))


