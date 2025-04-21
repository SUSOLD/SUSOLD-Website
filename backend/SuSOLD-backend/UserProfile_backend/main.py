'''
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from main_routes import main_router
from auth_routes import auth_router

app = FastAPI()

origins = ['https://localhost:3000']

app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

app.include_router(main_router)
app.include_router(auth_router)
'''