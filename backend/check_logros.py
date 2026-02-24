from app.database import SessionLocal
from app.services.logros_service import LogroService

def update_demo_user():
    db = SessionLocal()
    try:
        usuario_id = "usuario_001" # El ID que tiene tus datos
        print(f"Iniciando verificación masiva para {usuario_id}...")
        
        # Invocamos el método masivo de tu servicio
        nuevos = LogroService.verificar_y_desbloquear_logros(db, usuario_id)
        
        if nuevos:
            print(f"✅ ¡ÉXITO! Se desbloquearon {len(nuevos)} logros: {', '.join(nuevos)}")
        else:
            print("ℹ️ No se cumplieron nuevas condiciones o ya estaban todos desbloqueados.")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_demo_user()