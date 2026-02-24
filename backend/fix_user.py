from app.database import SessionLocal
from app.models.models import Usuario
from app.core.security import hash_password

def fix():
    db = SessionLocal()
    try:
        # Buscamos al usuario que tiene todos tus datos vinculados
        user = db.query(Usuario).filter(Usuario.id == 'usuario_001').first()
        
        if user:
            print(f"Usuario encontrado: {user.nombre} {user.apellido}")
            
            # Generamos el hash usando TU lógica de seguridad real
            # Esto evita errores de padding o de versiones de librerías
            nueva_pass = "123456"
            user.password_hash = hash_password(nueva_pass)
            user.email = "estudiante@universidad.edu"
            
            db.commit()
            print(f"✅ ÉXITO: Usuario '{user.email}' actualizado con la contraseña '{nueva_pass}'.")
            print("Ahora ya podés intentar el login en la web.")
        else:
            print("❌ ERROR: No se encontró un usuario con ID 'usuario_001' en la base de datos.")
            
    except Exception as e:
        print(f"❌ ERROR inesperado: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix()