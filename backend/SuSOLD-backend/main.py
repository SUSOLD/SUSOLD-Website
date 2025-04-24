# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from UserProfile_backend.main_routes import main_router
from registerloginbackend.auth_routes import auth_router
from PurchaseScreen_backend import purchase
from HomePage_backend.app.routes import home
from HomePage_backend.app.routes import favorites
from HomePage_backend.app.routes import  basket  # make sure these match file names


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
#app.include_router(auth_router, prefix="/api")
app.include_router(purchase, prefix="/api")
app.include_router(favorites.router, prefix="/api")
app.include_router(basket.router, prefix="/api")
app.include_router(auth_router, prefix="/auth")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
