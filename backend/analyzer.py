"""Dataset reading, statistics computation, and the /analyze endpoint."""
from __future__ import annotations

import io
import logging
import math
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from fastapi import APIRouter, Form, HTTPException, UploadFile

from openai_client import audit_dataset

logger = logging.getLogger("datapost.analyzer")

router = APIRouter()

FREE_PLAN_MAX_BYTES = 5 * 1024 * 1024  # 5 MB
MAX_SAMPLE_ROWS = 100
MAX_CORR_COLUMNS = 15
MAX_DESCRIBE_COLUMNS = 25
MAX_VALUE_COUNTS = 20


# --------------------------------------------------------------------------
# Sanitization helpers - pandas/numpy values are not JSON serializable
# --------------------------------------------------------------------------

def sanitize(value: Any) -> Any:
    """Recursively convert pandas/numpy values into plain, JSON-safe Python values."""
    if value is None:
        return None
    if isinstance(value, dict):
        return {str(sanitize(k)): sanitize(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [sanitize(v) for v in value]
    if isinstance(value, (np.ndarray,)):
        return [sanitize(v) for v in value.tolist()]
    if isinstance(value, pd.Series):
        return [sanitize(v) for v in value.tolist()]
    if isinstance(value, pd.DataFrame):
        return [sanitize(row) for row in value.to_dict(orient="records")]

    if isinstance(value, (pd.Timestamp,)):
        if pd.isna(value):
            return None
        return value.isoformat()
    if isinstance(value, pd.Timedelta):
        return str(value)
    if isinstance(value, (np.datetime64,)):
        ts = pd.Timestamp(value)
        if pd.isna(ts):
            return None
        return ts.isoformat()

    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        f = float(value)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    if isinstance(value, np.bool_):
        return bool(value)
    if isinstance(value, np.generic):
        return sanitize(value.item())

    if isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            return None
        return value

    try:
        if value is pd.NaT:
            return None
    except Exception:
        pass

    if isinstance(value, (str, int, bool)):
        return value

    # Fallback: anything else that pandas.isna understands as missing
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass

    return value


# --------------------------------------------------------------------------
# File reading
# --------------------------------------------------------------------------

def read_dataframe(raw_bytes: bytes, filename: str) -> pd.DataFrame:
    """Read an uploaded file into a pandas DataFrame based on its extension."""
    name_lower = (filename or "").lower()
    buffer = io.BytesIO(raw_bytes)

    if name_lower.endswith(".csv"):
        df = pd.read_csv(buffer)
    elif name_lower.endswith(".xlsx") or name_lower.endswith(".xls"):
        df = pd.read_excel(buffer)
    elif name_lower.endswith(".json"):
        df = pd.read_json(buffer)
    else:
        # Best-effort fallback: try csv first, then json
        try:
            buffer.seek(0)
            df = pd.read_csv(buffer)
        except Exception:
            buffer.seek(0)
            df = pd.read_json(buffer)

    if df is None or df.shape[1] == 0:
        raise ValueError("Файл не содержит распознаваемых колонок")

    return df


def get_file_extension(filename: str) -> str:
    name_lower = (filename or "").lower()
    for ext in (".csv", ".xlsx", ".xls", ".json"):
        if name_lower.endswith(ext):
            return ext.lstrip(".")
    return ""


# --------------------------------------------------------------------------
# Statistics
# --------------------------------------------------------------------------

def compute_iqr_outliers(series: pd.Series) -> Dict[str, Any]:
    clean = series.dropna()
    if clean.empty:
        return {"count": 0, "lower_bound": None, "upper_bound": None, "percentage": 0.0}
    q1 = clean.quantile(0.25)
    q3 = clean.quantile(0.75)
    iqr = q3 - q1
    if iqr == 0 or pd.isna(iqr):
        return {"count": 0, "lower_bound": sanitize(q1), "upper_bound": sanitize(q3), "percentage": 0.0}
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr
    outliers = clean[(clean < lower) | (clean > upper)]
    pct = round((len(outliers) / len(clean)) * 100, 2) if len(clean) else 0.0
    return {
        "count": int(len(outliers)),
        "lower_bound": sanitize(lower),
        "upper_bound": sanitize(upper),
        "percentage": pct,
    }


def compute_stats(df: pd.DataFrame, target_column: Optional[str]) -> Dict[str, Any]:
    n_rows, n_cols = df.shape
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    all_cols = df.columns.tolist()

    dtypes = {col: str(dtype) for col, dtype in df.dtypes.items()}
    nulls = {col: int(df[col].isnull().sum()) for col in all_cols}
    null_pct = {
        col: round((nulls[col] / n_rows) * 100, 2) if n_rows else 0.0 for col in all_cols
    }

    duplicated_count = int(df.duplicated().sum())

    describe_cols = numeric_cols[:MAX_DESCRIBE_COLUMNS]
    describe_dict: Dict[str, Any] = {}
    if describe_cols:
        describe_df = df[describe_cols].describe()
        describe_dict = {
            col: {stat: sanitize(describe_df.loc[stat, col]) for stat in describe_df.index}
            for col in describe_df.columns
        }

    outliers: Dict[str, Any] = {}
    for col in numeric_cols[:MAX_DESCRIBE_COLUMNS]:
        outliers[col] = compute_iqr_outliers(df[col])

    constant_columns: List[str] = []
    low_variance_columns: List[str] = []
    for col in all_cols:
        nunique = df[col].nunique(dropna=True)
        if nunique <= 1:
            constant_columns.append(col)
        elif n_rows > 0 and (nunique / n_rows) < 0.01 and col in numeric_cols:
            low_variance_columns.append(col)

    correlation: Dict[str, Any] = {}
    corr_cols = numeric_cols[:MAX_CORR_COLUMNS]
    if len(corr_cols) >= 2:
        corr_df = df[corr_cols].corr(numeric_only=True)
        correlation = {
            col: {row: sanitize(corr_df.loc[row, col]) for row in corr_df.index}
            for col in corr_df.columns
        }

    target_value_counts: Optional[Dict[str, Any]] = None
    target_info: Dict[str, Any] = {}
    if target_column and target_column in df.columns:
        vc = df[target_column].value_counts(dropna=False).head(MAX_VALUE_COUNTS)
        target_value_counts = {str(k): int(v) for k, v in vc.items()}
        n_classes = df[target_column].nunique(dropna=True)
        target_info = {
            "column": target_column,
            "n_unique": int(n_classes),
            "value_counts": target_value_counts,
            "dtype": str(df[target_column].dtype),
        }
        if target_value_counts and len(target_value_counts) >= 2:
            counts = list(target_value_counts.values())
            target_info["imbalance_ratio"] = round(max(counts) / max(min(counts), 1), 2)

    id_like_columns: List[str] = []
    for col in all_cols:
        col_lower = str(col).lower()
        if ("id" in col_lower or col_lower.endswith("_id") or col_lower == "index") and n_rows:
            nunique = df[col].nunique(dropna=True)
            if nunique / n_rows > 0.95:
                id_like_columns.append(col)

    stats: Dict[str, Any] = {
        "shape": {"rows": n_rows, "columns": n_cols},
        "columns": all_cols,
        "dtypes": dtypes,
        "nulls": nulls,
        "null_percentage": null_pct,
        "duplicated_rows": duplicated_count,
        "duplicated_percentage": round((duplicated_count / n_rows) * 100, 2) if n_rows else 0.0,
        "describe": describe_dict,
        "outliers": outliers,
        "constant_columns": constant_columns,
        "low_variance_columns": low_variance_columns,
        "correlation": correlation,
        "target": target_info,
        "id_like_columns": id_like_columns,
        "numeric_columns": numeric_cols,
    }
    return sanitize(stats)


def build_sample_data(df: pd.DataFrame, limit: int = MAX_SAMPLE_ROWS) -> List[Dict[str, Any]]:
    sample = df.head(limit)
    records = sample.to_dict(orient="records")
    return [sanitize(record) for record in records]


# --------------------------------------------------------------------------
# Local rule-based fallback (used when the LLM call fails)
# --------------------------------------------------------------------------

def local_fallback_audit(stats: Dict[str, Any], target_column: Optional[str]) -> Dict[str, Any]:
    issues: List[Dict[str, Any]] = []

    n_rows = stats["shape"]["rows"]

    # Missing values
    for col, pct in stats.get("null_percentage", {}).items():
        if pct is None:
            continue
        if pct > 0:
            severity = "critical" if pct > 30 else ("warning" if pct > 5 else "info")
            issues.append(
                {
                    "type": "missing",
                    "severity": severity,
                    "column": col,
                    "title": f"Пропуски в колонке '{col}'",
                    "description": (
                        f"В колонке '{col}' обнаружено {stats['nulls'].get(col, 0)} пропущенных "
                        f"значений ({pct}% строк). Это может повлиять на качество обучения модели."
                    ),
                    "fix_code": (
                        f"df['{col}'] = df['{col}'].fillna(df['{col}'].median())"
                        if col in stats.get("numeric_columns", [])
                        else f"df['{col}'] = df['{col}'].fillna(df['{col}'].mode()[0] if not df['{col}'].mode().empty else 'unknown')"
                    ),
                    "fix_description": "Заполнить пропуски медианой (числовые) или модой (категориальные).",
                }
            )

    # Duplicates
    if stats.get("duplicated_rows", 0) > 0:
        issues.append(
            {
                "type": "duplicate",
                "severity": "warning" if stats["duplicated_percentage"] < 10 else "critical",
                "column": None,
                "title": "Дублирующиеся строки",
                "description": (
                    f"Найдено {stats['duplicated_rows']} дублирующихся строк "
                    f"({stats['duplicated_percentage']}% от датасета)."
                ),
                "fix_code": "df = df.drop_duplicates()",
                "fix_description": "Удалить полностью дублирующиеся строки.",
            }
        )

    # Constant columns
    for col in stats.get("constant_columns", []):
        issues.append(
            {
                "type": "constant",
                "severity": "warning",
                "column": col,
                "title": f"Константная колонка '{col}'",
                "description": (
                    f"Колонка '{col}' содержит только одно уникальное значение и не несёт "
                    "информации для обучения модели."
                ),
                "fix_code": f"df = df.drop(columns=['{col}'])",
                "fix_description": "Удалить колонку, так как она не несёт вариативности.",
            }
        )

    # Outliers
    for col, info in stats.get("outliers", {}).items():
        if info and info.get("count", 0) > 0 and info.get("percentage", 0) > 1:
            issues.append(
                {
                    "type": "outlier",
                    "severity": "warning" if info["percentage"] < 10 else "critical",
                    "column": col,
                    "title": f"Выбросы в колонке '{col}'",
                    "description": (
                        f"Обнаружено {info['count']} выбросов ({info['percentage']}%) по методу IQR "
                        f"в колонке '{col}'."
                    ),
                    "fix_code": (
                        f"df['{col}'] = df['{col}'].clip(lower=df['{col}'].quantile(0.01), "
                        f"upper=df['{col}'].quantile(0.99))"
                    ),
                    "fix_description": "Winsorize: обрезать значения по 1-му и 99-му перцентилю.",
                }
            )

    # Target leakage: correlation with target
    target_info = stats.get("target") or {}
    target_col = target_info.get("column")
    if target_col and target_col in stats.get("correlation", {}):
        for other_col, corr_val in stats["correlation"].get(target_col, {}).items():
            if other_col == target_col or corr_val is None:
                continue
            if abs(corr_val) > 0.95:
                issues.append(
                    {
                        "type": "target_leakage",
                        "severity": "critical",
                        "column": other_col,
                        "title": f"Возможная утечка таргета в '{other_col}'",
                        "description": (
                            f"Колонка '{other_col}' имеет аномально высокую корреляцию "
                            f"({round(corr_val, 3)}) с таргетом '{target_col}'. Это может означать "
                            "утечку данных из будущего или post-hoc признак."
                        ),
                        "fix_code": f"df = df.drop(columns=['{other_col}'])",
                        "fix_description": "Удалить подозрительную колонку перед обучением.",
                    }
                )

    # Class imbalance
    if target_col and target_info.get("imbalance_ratio") and target_info["imbalance_ratio"] > 3:
        issues.append(
            {
                "type": "imbalance",
                "severity": "warning" if target_info["imbalance_ratio"] < 10 else "critical",
                "column": target_col,
                "title": f"Дисбаланс классов в '{target_col}'",
                "description": (
                    f"Соотношение самого частого и самого редкого класса составляет "
                    f"{target_info['imbalance_ratio']}:1. Это может привести к смещённой модели."
                ),
                "fix_code": (
                    "from sklearn.utils import resample; "
                    "df = pd.concat([df, resample(df[df['" + target_col + "']==df['" + target_col + "'].value_counts().idxmin()], "
                    "replace=True, n_samples=df['" + target_col + "'].value_counts().max())])"
                ),
                "fix_description": "Провести oversampling редкого класса или использовать class_weight.",
            }
        )

    # Suspicious ID-like duplicated columns
    for col in stats.get("id_like_columns", []):
        issues.append(
            {
                "type": "suspicious",
                "severity": "info",
                "column": col,
                "title": f"ID-подобная колонка '{col}'",
                "description": (
                    f"Колонка '{col}' выглядит как идентификатор (почти все значения уникальны). "
                    "Обычно такие колонки следует исключать из признаков."
                ),
                "fix_code": f"df = df.drop(columns=['{col}'])",
                "fix_description": "Исключить идентификатор из признаков модели.",
            }
        )

    critical_count = sum(1 for i in issues if i["severity"] == "critical")
    quality_score = max(0, 100 - critical_count * 20 - sum(1 for i in issues if i["severity"] == "warning") * 5)
    ready_for_training = critical_count == 0

    summary = (
        f"Датасет содержит {n_rows} строк и {stats['shape']['columns']} колонок. "
        f"Локальный анализ выявил {len(issues)} потенциальных проблем "
        f"({critical_count} критических). "
        + ("Датасет в целом готов к обучению." if ready_for_training else "Рекомендуется устранить критические проблемы перед обучением.")
    )

    return {
        "quality_score": quality_score,
        "ready_for_training": ready_for_training,
        "summary": summary,
        "issues": issues,
    }


def normalize_llm_issues(raw_issues: Any) -> List[Dict[str, Any]]:
    normalized: List[Dict[str, Any]] = []
    if not isinstance(raw_issues, list):
        return normalized
    valid_types = {
        "target_leakage",
        "missing",
        "outlier",
        "imbalance",
        "duplicate",
        "dtype",
        "constant",
        "suspicious",
    }
    valid_severities = {"critical", "warning", "info"}
    for item in raw_issues:
        if not isinstance(item, dict):
            continue
        issue_type = item.get("type") if item.get("type") in valid_types else "suspicious"
        severity = item.get("severity") if item.get("severity") in valid_severities else "info"
        normalized.append(
            {
                "type": issue_type,
                "severity": severity,
                "column": item.get("column"),
                "title": str(item.get("title") or "Проблема датасета"),
                "description": str(item.get("description") or ""),
                "fix_code": str(item.get("fix_code") or ""),
                "fix_description": str(item.get("fix_description") or ""),
            }
        )
    return normalized


# --------------------------------------------------------------------------
# Endpoint
# --------------------------------------------------------------------------

@router.post("/analyze")
async def analyze(
    file: UploadFile,
    target_column: str = Form(default=""),
    task_type: str = Form(default=""),
    user_id: str = Form(...),
    plan: str = Form(...),
):
    raw_bytes = await file.read()
    file_size = len(raw_bytes)
    extension = get_file_extension(file.filename or "")

    # Defense-in-depth plan enforcement
    if plan == "free" and extension not in ("", "csv"):
        raise HTTPException(status_code=403, detail="Excel/JSON доступны только в PRO")
    if plan == "free" and file_size > FREE_PLAN_MAX_BYTES:
        raise HTTPException(status_code=403, detail="Превышен лимит размера файла для FREE")

    try:
        df = read_dataframe(raw_bytes, file.filename or "")
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to read uploaded file %s", file.filename)
        raise HTTPException(
            status_code=400,
            detail="Не удалось прочитать файл. Проверьте, что это корректный CSV, Excel или JSON.",
        ) from exc

    target_col: Optional[str] = target_column.strip() if target_column else None
    if target_col and target_col not in df.columns:
        target_col = None

    try:
        stats = compute_stats(df, target_col)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to compute stats for %s", file.filename)
        raise HTTPException(
            status_code=400, detail="Не удалось проанализировать датасет."
        ) from exc

    sample_data = build_sample_data(df)

    llm_audit: Optional[Dict[str, Any]] = None
    try:
        compact_stats = dict(stats)
        llm_audit = audit_dataset(compact_stats)
    except Exception as exc:  # noqa: BLE001
        logger.error("OpenAI audit failed, falling back to local rules: %s", exc)
        llm_audit = None

    if llm_audit is not None:
        issues = normalize_llm_issues(llm_audit.get("issues"))
        quality_score = llm_audit.get("quality_score")
        if not isinstance(quality_score, (int, float)):
            quality_score = 70
        quality_score = int(max(0, min(100, quality_score)))
        summary = str(llm_audit.get("summary") or "")
        ready_for_training = bool(llm_audit.get("ready_for_training", False))
        if not issues:
            # LLM returned no issues at all - still merge in a light local pass
            # so obviously severe problems are not silently dropped.
            fallback = local_fallback_audit(stats, target_col)
            issues = fallback["issues"]
    else:
        fallback = local_fallback_audit(stats, target_col)
        issues = fallback["issues"]
        quality_score = fallback["quality_score"]
        summary = fallback["summary"]
        ready_for_training = fallback["ready_for_training"]

    critical_count = sum(1 for i in issues if i.get("severity") == "critical")
    ready_for_training = ready_for_training and critical_count == 0

    result = {
        "quality_score": quality_score,
        "issues": issues,
        "stats": stats,
        "sample_data": sample_data,
        "summary": summary,
        "ready_for_training": ready_for_training,
        "critical_count": critical_count,
        "row_count": int(df.shape[0]),
        "col_count": int(df.shape[1]),
    }
    return sanitize(result)
