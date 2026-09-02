"""DATAPOST backend entrypoint - FastAPI app, CORS, and route registration."""
from __future__ import annotations

import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("datapost.main")

if not os.environ.get("OPENAI_API_KEY"):
    logger.warning(
        "OPENAI_API_KEY is not set. /analyze will fall back to local rule-based audits "
        "until a valid key is configured."
    )

app = FastAPI(
    title="DATAPOST backend",
    description="AI-powered dataset auditor with auto-cleaning",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://datapost.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers after logging/env setup so their module-level code (if any)
# can rely on environment variables already being loaded.
from analyzer import router as analyzer_router  # noqa: E402
from cleaner import router as cleaner_router  # noqa: E402
from chat import router as chat_router  # noqa: E402

app.include_router(analyzer_router)
app.include_router(cleaner_router)
app.include_router(chat_router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "datapost-backend"}
