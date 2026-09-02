"""Dataset-scoped AI chat endpoint (PRO feature)."""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from models import ChatRequest, ChatResponse
from openai_client import chat_about_dataset

logger = logging.getLogger("datapost.chat")

router = APIRouter()

MAX_QUESTION_LENGTH = 500
MAX_ISSUES_IN_CONTEXT = 20


def local_fallback_answer(question: str) -> str:
    return (
        "AI-чат сейчас недоступен: на сервере не настроен OPENAI_API_KEY. "
        "Посмотри раздел «Проблемы» и «Диагностика» в отчёте — там есть подробное "
        "объяснение каждой найденной проблемы и готовый код для исправления."
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Вопрос не может быть пустым")
    if len(question) > MAX_QUESTION_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Вопрос слишком длинный (максимум {MAX_QUESTION_LENGTH} символов)",
        )

    context = {
        "summary": request.summary,
        "quality_score": request.quality_score,
        "row_count": request.row_count,
        "col_count": request.col_count,
        "issues": request.issues[:MAX_ISSUES_IN_CONTEXT],
        "stats": request.stats,
    }
    history = [{"role": m.role, "content": m.content} for m in request.history]

    try:
        answer = chat_about_dataset(context, history, question)
    except Exception as exc:  # noqa: BLE001
        logger.error("OpenAI chat failed, falling back to local response: %s", exc)
        answer = local_fallback_answer(question)

    return {"answer": answer}
