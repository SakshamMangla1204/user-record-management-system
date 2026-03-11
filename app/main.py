from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app import models
from app.routes.auth_routes import router as auth_router
from app.routes.import_routes import router as import_router
from app.routes.register_routes import router as register_router
from app.routes.user_routes import router as user_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Importing models ensures SQLAlchemy knows about the users table
    # before create_all() runs at startup.
    _ = models
    init_db()
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "http://127.0.0.1:8001",
        "http://localhost:8001",
        "null",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(import_router)
app.include_router(register_router)
app.include_router(user_router)


@app.get("/")
def health_check() -> dict[str, str]:
    return {"message": "User Record Management System API is running"}
