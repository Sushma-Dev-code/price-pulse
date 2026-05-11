from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.products import router as products_router

app = FastAPI(title="PricePulse API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products_router)

@app.get("/")
def root():
    return {"message": "PricePulse API is running"}
