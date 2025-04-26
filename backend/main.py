# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from backend.UserProfile_backend.main_routes import main_router
from backend.registerloginbackend.auth_routes import auth_router
from backend.PurchaseScreen_backend.purchase import router as purchase_router
from backend.HomePage_backend.app.routes import home
from backend.HomePage_backend.app.routes import favorites
from backend.HomePage_backend.app.routes import basket


app = FastAPI(
    title="SuSOLD API",
    description="API for SUSell marketplace application",
    # Configure the swagger UI for proper OAuth2 password flow
    swagger_ui_init_oauth={
        "usePkceWithAuthorizationCodeGrant": False,
        "useBasicAuthenticationWithAccessCodeGrant": True
    }
)

# Custom OpenAPI schema to fix the authentication in Swagger UI
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    # Update the security schema to use just bearerAuth
    openapi_schema["components"] = openapi_schema.get("components", {})
    openapi_schema["components"]["securitySchemes"] = {
        "bearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Use specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers with their prefixes
app.include_router(home.router, prefix="/api")
app.include_router(main_router, prefix="/api")
app.include_router(purchase_router, prefix="/api")
app.include_router(favorites.router, prefix="/api")
app.include_router(basket.router, prefix="/api")
app.include_router(auth_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)