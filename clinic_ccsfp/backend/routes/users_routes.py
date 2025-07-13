from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import List
from passlib.context import CryptContext
from backend.database.connection import db

router = APIRouter()
users = db["admin_users"]
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


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


def user_table(u) -> dict:
    return {
        "id": str(u["_id"]),
        "full_name": u["full_name"],
        "username": u["username"],
        "email": u["email"],
        "status": u["status"]
    }

def get_user_by_username(username: str):
    return users.find_one({"username": username})

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

    users.insert_one(data)
    return {"message": "Registration successful. Please wait for approval."}

@router.post("/login")
def login(user: UserLogin):
    db_user = get_user_by_username(user.username)
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(400, "Invalid username or password")
    if db_user["status"] != "Active":
        raise HTTPException(403, "User not approved yet")
    return {"message": "Login successful"}

@router.get("/pending-users", response_model=List[UserOut])
def get_pending_users():
    return [user_table(u) for u in users.find({"status": "Pending"})]

@router.post("/approve-user")
def approve_user(user: UserApprove):
    result = users.update_one(
        {"username": user.username, "status": "Pending"},
        {"$set": {"status": "Active"}}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "User not found or already approved")
    return {"message": "User approved successfully"}

@router.post("/create-admin-user")
def create_admin_user(user: UserRegister):
    if get_user_by_username(user.username):
        raise HTTPException(400, "Username already exists")

    data = {
        "full_name": user.full_name,
        "username": user.username,
        "email": user.email,
        "password_hash": hash_password(user.password),
        "status": "Active"
    }

    users.insert_one(data)
    return {"message": "Admin user created successfully"}

@router.get("/admin-users", response_model=List[UserOut])
async def get_admin_users():
    return [user_table(u) for u in users.find()]

@router.delete("/delete-user/{username}")
async def delete_user(username: str):
    result = users.delete_one({"username": username})
    if result.deleted_count > 0:
        return {"message": f"User '{username}' deleted successfully"}
    raise HTTPException(404, detail=f"User '{username}' not found")
