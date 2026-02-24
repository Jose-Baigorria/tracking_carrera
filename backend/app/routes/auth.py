from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.models import Usuario, Carrera
from app.core.security import hash_password, verify_password, create_access_token
from pydantic import BaseModel, EmailStr
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])

class UserRegister(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    password: str
    legajo: str
    carrera_id: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
def register(data: UserRegister, db: Session = Depends(get_db)):
    # Verificar si el email ya existe
    if db.query(Usuario).filter(Usuario.email == data.email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    nuevo_usuario = Usuario(
        id=f"user_{uuid.uuid4().hex[:10]}",
        nombre=data.nombre,
        apellido=data.apellido,
        email=data.email,
        legajo=data.legajo,
        carrera_id=data.carrera_id,
        password_hash=hash_password(data.password)
    )
    db.add(nuevo_usuario)
    db.commit()
    return {"message": "Usuario creado con éxito"}

@router.post("/login")
def login(data: UserLogin, db: Session = Depends(get_db)):
    print(f"DEBUG: Intentando login para email: '{data.email}'")
    
    # Cargamos al usuario junto con su carrera para tener el nombre real (ej: "Ingeniería en Sistemas")
    user = db.query(Usuario).options(joinedload(Usuario.carrera)).filter(Usuario.email == data.email).first()
    
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    token = create_access_token({"sub": user.id})
    
    return {
        "access_token": token, 
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "nombre": user.nombre,
            "apellido": user.apellido,      # <-- AGREGADO: Necesario para "Nombre Completo"
            "email": user.email,
            "legajo": user.legajo,          # <-- AGREGADO: Necesario para el Dashboard
            "carrera_id": user.carrera_id,
            "carrera_nombre": user.carrera.nombre if user.carrera else "Carrera no especificada" # <-- AGREGADO
        }
    }