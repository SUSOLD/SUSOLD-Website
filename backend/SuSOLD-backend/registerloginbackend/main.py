from fastapi import FastAPI
from auth.auth_routes import router as auth_router

app = FastAPI()

# Auth endpointlerini ekle
app.include_router(auth_router, prefix="/auth")
