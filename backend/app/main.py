import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from celery import Celery
from sqlalchemy.orm import Session
from app.routers import auth, problems, submissions, status
from app.notification import gmail

app = FastAPI()

frontend_url_str = os.getenv("FRONTEND_URL", "")
if frontend_url_str:
    allowed_origins = frontend_url_str.split(",")
else:
    allowed_origins = []

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(problems.router)
app.include_router(submissions.router)
app.include_router(status.router)
app.include_router(gmail.router)
