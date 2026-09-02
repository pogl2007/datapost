"""Auto-cleaning of a dataset and the /clean endpoint."""
from __future__ import annotations

import base64
import io
import logging
from typing import Any, Dict, List

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException

from models import CleanRequest

logger = logging.getLogger("datapost.cleaner")

router = APIRouter()


def get_extension(filename: str) -> str:
    name_lower = (filename or "").lower()
    for ext in (".csv", ".xlsx", ".xls", ".json"):
        if name_lower.endswith(ext):
            return ext.lstrip(".")
    return "csv"


def load_dataframe(raw_bytes: bytes, filename: str) -> pd.DataFrame:
    ext = get_extension(filename)
    buffer = io.BytesIO(raw_bytes)
    if ext == "csv":
        return pd.read_csv(buffer)
    if ext in ("xlsx", "xls"):
        return pd.read_excel(buffer)
    if ext == "json":
        return pd.read_json(buffer)
    # fallback attempt
    try:
        buffer.seek(0)
        return pd.read_csv(buffer)
    except Exception:
        buffer.seek(0)
        return pd.read_json(buffer)


def try_coerce_numeric(df: pd.DataFrame, changes: List[str]) -> pd.DataFrame:
    for col in df.columns:
        if df[col].dtype == object:
            coerced = pd.to_numeric(df[col], errors="coerce")
            non_null_original = df[col].notna().sum()
            non_null_coerced = coerced.notna().sum()
            # Only coerce if we didn't lose meaningful data (allow it if at least
            # 90% of the originally non-null values converted successfully) and
            # there is at least one convertible value.
            if non_null_original > 0 and non_null_coerced > 0:
                ratio = non_null_coerced / non_null_original
                if ratio >= 0.9:
                    df[col] = coerced
                    changes.append(
                        f"Колонка '{col}' приведена к числовому типу ({non_null_coerced} значений успешно сконвертировано)"
                    )
    return df


def fill_missing(df: pd.DataFrame, changes: List[str]) -> pd.DataFrame:
    for col in df.columns:
        n_missing = int(df[col].isnull().sum())
        if n_missing == 0:
            continue
        if pd.api.types.is_numeric_dtype(df[col]):
            median_value = df[col].median()
            if pd.isna(median_value):
                median_value = 0
            df[col] = df[col].fillna(median_value)
            changes.append(
                f"Заполнено {n_missing} пропусков в колонке '{col}' медианой ({round(float(median_value), 4)})"
            )
        else:
            mode_series = df[col].mode(dropna=True)
            if not mode_series.empty:
                fill_value = mode_series.iloc[0]
                df[col] = df[col].fillna(fill_value)
                changes.append(
                    f"Заполнено {n_missing} пропусков в колонке '{col}' модой ('{fill_value}')"
                )
            else:
                df[col] = df[col].fillna("unknown")
                changes.append(
                    f"Заполнено {n_missing} пропусков в колонке '{col}' значением 'unknown'"
                )
    return df


def drop_duplicates(df: pd.DataFrame, changes: List[str]) -> pd.DataFrame:
    n_before = len(df)
    df = df.drop_duplicates()
    n_removed = n_before - len(df)
    if n_removed > 0:
        changes.append(f"Удалено {n_removed} дубликатов строк")
    return df


def is_id_like_column(df: pd.DataFrame, col: str) -> bool:
    name = col.lower()
    if name == "id" or name.endswith("_id") or name.endswith("id"):
        return True
    series = df[col].dropna()
    if series.empty:
        return False
    # A numeric column where every value is unique (and integer-valued) is
    # almost certainly a key/identifier, not a measurement — winsorizing it
    # would corrupt the identifiers rather than clean the data.
    is_integer_valued = (series % 1 == 0).all()
    is_fully_unique = series.nunique() == len(series)
    return is_integer_valued and is_fully_unique and len(series) > 1


def winsorize(df: pd.DataFrame, changes: List[str]) -> pd.DataFrame:
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    for col in numeric_cols:
        if is_id_like_column(df, col):
            continue
        series = df[col].dropna()
        if series.empty:
            continue
        lower = series.quantile(0.01)
        upper = series.quantile(0.99)
        if pd.isna(lower) or pd.isna(upper) or lower == upper:
            continue
        n_clipped = int(((df[col] < lower) | (df[col] > upper)).sum())
        if n_clipped > 0:
            df[col] = df[col].clip(lower=lower, upper=upper)
            changes.append(
                f"Обрезано {n_clipped} выбросов в колонке '{col}' по 1-му/99-му перцентилю "
                f"[{round(float(lower), 4)}, {round(float(upper), 4)}]"
            )
    return df


def dataframe_to_base64(df: pd.DataFrame, filename: str) -> str:
    ext = get_extension(filename)
    if ext in ("xlsx", "xls"):
        buffer = io.BytesIO()
        df.to_excel(buffer, index=False, engine="openpyxl")
        raw_bytes = buffer.getvalue()
    elif ext == "json":
        raw_bytes = df.to_json(orient="records", force_ascii=False).encode("utf-8")
    else:
        raw_bytes = df.to_csv(index=False).encode("utf-8")
    return base64.b64encode(raw_bytes).decode("ascii")


@router.post("/clean")
async def clean(request: CleanRequest):
    try:
        raw_bytes = base64.b64decode(request.file_content_base64)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Некорректный base64: {exc}") from exc

    try:
        df = load_dataframe(raw_bytes, request.file_name)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to load dataframe for cleaning: %s", request.file_name)
        raise HTTPException(status_code=400, detail=f"Не удалось прочитать файл: {exc}") from exc

    changes: List[str] = []

    try:
        df = try_coerce_numeric(df, changes)
        df = fill_missing(df, changes)
        df = drop_duplicates(df, changes)
        df = winsorize(df, changes)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed while cleaning dataset: %s", request.file_name)
        raise HTTPException(status_code=400, detail=f"Ошибка при очистке датасета: {exc}") from exc

    if not changes:
        changes.append("Датасет уже соответствовал критериям качества, изменений не потребовалось")

    try:
        cleaned_b64 = dataframe_to_base64(df, request.file_name)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to re-encode cleaned dataset: %s", request.file_name)
        raise HTTPException(status_code=400, detail=f"Не удалось сохранить очищенный файл: {exc}") from exc

    return {"cleaned_file_base64": cleaned_b64, "changes_made": changes}
