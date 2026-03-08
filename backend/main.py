from dotenv import load_dotenv

load_dotenv()  # must come before other backend imports

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import Settings
from backend.routers import auth, customers, orders, products, proxy
from backend.routers import settings as settings_router

app_settings = Settings()

app = FastAPI(title=app_settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=app_settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(customers.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")
app.include_router(proxy.router, prefix="/api")


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
