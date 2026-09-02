const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export interface AnalyzeParams {
  file: File | Blob;
  fileName: string;
  targetColumn: string;
  taskType: string;
  userId: string;
  plan: string;
}

export async function callAnalyze(params: AnalyzeParams) {
  const formData = new FormData();
  formData.append('file', params.file, params.fileName);
  formData.append('target_column', params.targetColumn);
  formData.append('task_type', params.taskType);
  formData.append('user_id', params.userId);
  formData.append('plan', params.plan);

  const res = await fetch(`${FASTAPI_URL}/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Analyze failed (${res.status}): ${text || res.statusText}`);
  }

  return res.json();
}

export interface CleanParams {
  fileContentBase64: string;
  fileName: string;
  issues: unknown[];
}

export async function callClean(params: CleanParams) {
  const res = await fetch(`${FASTAPI_URL}/clean`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file_content_base64: params.fileContentBase64,
      file_name: params.fileName,
      issues: params.issues,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Clean failed (${res.status}): ${text || res.statusText}`);
  }

  return res.json();
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatParams {
  summary: string;
  qualityScore: number | null;
  rowCount: number | null;
  colCount: number | null;
  issues: unknown[];
  stats: unknown;
  history: ChatMessage[];
  question: string;
}

export async function callChat(params: ChatParams): Promise<{ answer: string }> {
  const res = await fetch(`${FASTAPI_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary: params.summary,
      quality_score: params.qualityScore,
      row_count: params.rowCount,
      col_count: params.colCount,
      issues: params.issues,
      stats: params.stats,
      history: params.history,
      question: params.question,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Chat failed (${res.status}): ${text || res.statusText}`);
  }

  return res.json();
}
