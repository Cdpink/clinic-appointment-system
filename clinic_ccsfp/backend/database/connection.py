from pymongo import MongoClient

MONGO_URI = "mongodb://localhost:27017"
client = MongoClient(MONGO_URI)
db = client["clinic_db"]

users = db["admin_users"]
appointments = db["student_appointments"]
consultations = db["student_consultations"]
records = db["student_records"]
