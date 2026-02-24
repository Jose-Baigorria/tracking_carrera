from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 1. EL HASH QUE TENÉS EN LA DB (copialo tal cual de DB Browser)
hash_db = "$2b$12$R9h/cIPz0gi.URQHeNHGaOT.28dmEfL0nEf977K6mJq.5dK.X8J82"

# 2. LA CONTRASEÑA QUE ESTÁS ESCRIBIENDO EN EL LOGIN
password_tipeada = "123456"

print(f"¿Coinciden?: {pwd_context.verify(password_tipeada, hash_db)}")