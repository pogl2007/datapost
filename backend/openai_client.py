"""Thin wrapper around the OpenAI SDK for the GPT-4o-mini dataset audit."""
from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, List, Optional

from openai import OpenAI

logger = logging.getLogger("datapost.openai_client")

AUDIT_PROMPT_TEMPLATE = """Ты эксперт по качеству ML датасетов.
Тебе передана статистика датасета в JSON.
Проведи полный аудит и верни ТОЛЬКО JSON без markdown.

Проверь:
1. TARGET LEAKAGE: колонки аномально коррелирующие с таргетом, post-hoc признаки, колонки с будущими данными
2. DATA QUALITY: пропуски, выбросы, дубликаты, константные колонки, неверные типы
3. CLASS IMBALANCE: для classification — соотношение классов
4. SUSPICIOUS PATTERNS: слишком идеальные распределения, временные аномалии, дубликаты в ID колонках

Верни JSON:
{{
  "quality_score": 0-100,
  "ready_for_training": true/false,
  "summary": "2-3 предложения про датасет",
  "issues": [
    {{
      "type": "target_leakage|missing|outlier|imbalance|duplicate|dtype|constant|suspicious",
      "severity": "critical|warning|info",
      "column": "имя колонки или null",
      "title": "короткий заголовок",
      "description": "2-3 предложения объяснения",
      "fix_code": "однострочный pandas код фикса",
      "fix_description": "что делает фикс"
    }}
  ]
}}

Статистика датасета:
{stats_json}
"""

_client: Optional[OpenAI] = None


def get_client() -> OpenAI:
    """Lazily instantiate (and cache) the OpenAI client."""
    global _client
    if _client is None:
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY is not set in the environment")
        _client = OpenAI(api_key=api_key)
    return _client


def build_audit_prompt(stats: Dict[str, Any]) -> str:
    stats_json = json.dumps(stats, ensure_ascii=False, default=str)
    return AUDIT_PROMPT_TEMPLATE.format(stats_json=stats_json)


def audit_dataset(stats: Dict[str, Any], model: str = "gpt-4o-mini") -> Dict[str, Any]:
    """Send the compact stats summary to GPT-4o-mini and return the parsed JSON audit.

    Raises on any failure (network error, malformed JSON, etc). Callers are expected
    to catch exceptions and fall back to a local rule-based audit.
    """
    client = get_client()
    stats_json = json.dumps(stats, ensure_ascii=False, default=str)
    prompt = AUDIT_PROMPT_TEMPLATE.format(stats_json=stats_json)

    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": (
                    "Ты эксперт по качеству ML датасетов. Всегда отвечай ТОЛЬКО "
                    "валидным JSON без markdown-разметки и без пояснений."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
        max_tokens=2000,
    )

    content = response.choices[0].message.content
    if not content:
        raise ValueError("Empty response content from OpenAI")

    parsed = json.loads(content)
    if not isinstance(parsed, dict):
        raise ValueError("OpenAI response JSON is not an object")
    return parsed


CHAT_SYSTEM_PROMPT = """Ты — DATAPOST AI, ассистент по анализу качества ML-датасетов.

Тебе передан контекст: сводка статистики конкретного датасета и список найденных в нём проблем.
Отвечай ТОЛЬКО на вопросы про этот датасет — его качество, найденные проблемы, колонки,
статистику, стратегии очистки и подготовки к обучению модели.

Правила:
- Если вопрос не относится к этому датасету (общие темы, посторонние вопросы, программирование
  не по теме датасета и т.д.) — вежливо откажись и напомни, что ты помогаешь только с этим датасетом.
- Отвечай кратко и по делу, 2-5 предложений, на русском языке.
- Если предлагаешь код — используй pandas, оформляй как короткий фрагмент.
- Опирайся на переданную статистику и список проблем, не выдумывай цифры, которых там нет.

Контекст датасета (JSON):
{context_json}
"""


def chat_about_dataset(
    context: Dict[str, Any],
    history: List[Dict[str, str]],
    question: str,
    model: str = "gpt-4o-mini",
) -> str:
    """Answer a user question about a specific dataset, scoped by a system prompt.

    `history` is a list of {"role": "user"|"assistant", "content": str} dicts from
    prior turns in this dataset's chat. Raises on failure; callers should catch and
    fall back to a canned response.
    """
    client = get_client()
    context_json = json.dumps(context, ensure_ascii=False, default=str)

    messages: List[Dict[str, str]] = [
        {"role": "system", "content": CHAT_SYSTEM_PROMPT.format(context_json=context_json)},
    ]
    for turn in history[-20:]:
        role = turn.get("role")
        content = turn.get("content")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": question})

    response = client.chat.completions.create(
        model=model,
        messages=messages,  # type: ignore[arg-type]
        temperature=0.4,
        max_tokens=500,
    )

    content = response.choices[0].message.content
    if not content:
        raise ValueError("Empty response content from OpenAI")
    return content.strip()
