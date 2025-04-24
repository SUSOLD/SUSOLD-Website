# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.UserProfile_backend.main_routes import main_router
from backend.registerloginbackend.auth_routes import auth_router
from backend.PurchaseScreen_backend.purchase import router as purchase_router
from backend.HomePage_backend.app.routes import home
from backend.HomePage_backend.app.routes import favorites
from backend.HomePage_backend.app.routes import basket


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Use specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(home.router, prefix="/api")
app.include_router(main_router, prefix="/api")
app.include_router(purchase_router, prefix="/api")
app.include_router(favorites.router, prefix="/api")
app.include_router(basket.router, prefix="/api")
app.include_router(auth_router, prefix="/auth")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
