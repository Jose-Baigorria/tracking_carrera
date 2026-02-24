from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import materias
from app.routes import auth
from app.routes import social


# Crear las tablas al iniciar
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Track Académico RPG API",
    description="Sistema Multi-usuario para Track Académico",
    version="2.0.0"
)

# Configuración de CORS para que React pueda conectarse
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(materias.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(social.router, prefix="/api/social", tags=["Social"])

@app.get("/")
def read_root():
    return {
        "status": "Online - Back Funcionando",
        "system": "Focus Studio Multi-user",
        "api_version": "2.0"
    }