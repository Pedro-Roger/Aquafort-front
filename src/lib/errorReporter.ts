const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface ReportInput {
  title: string
  message: string
  stack?: string
  url?: string
  extra?: Record<string, unknown>
}

export function reportError(input: ReportInput) {
  fetch(`${API_URL}/v1/error-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    keepalive: true,
  }).catch(() => {})
}