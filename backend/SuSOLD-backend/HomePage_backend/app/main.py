'''from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import home
from app.routes import favorites, basket 


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(home.router, prefix="/api")
app.include_router(favorites.router, prefix="/api")  

app.include_router(favorites.router, prefix="/api")
app.include_router(basket.router, prefix="/api")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
    '''
