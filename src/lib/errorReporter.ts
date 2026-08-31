const WEBHOOK_URL = import.meta.env.VITE_DISCORD_WEBHOOK_URL as string | undefined

interface ReportInput {
  title: string
  message: string
  stack?: string
  url?: string
  extra?: Record<string, unknown>
}

export function reportError({ title, message, stack, url, extra }: ReportInput) {
  if (!WEBHOOK_URL) return

  const fields = [
    { name: 'URL', value: (url || (typeof window !== 'undefined' ? window.location.href : '')).slice(0, 1024), inline: true },
    ...(extra
      ? Object.entries(extra).map(([k, v]) => ({ name: k, value: String(v ?? '').slice(0, 1024) }))
      : []),
  ]

  const payload = {
    embeds: [
      {
        title,
        description: stack ? `\`\`\`\n${stack.slice(0, 3000)}\n\`\`\`` : (message || 'Sem mensagem').slice(0, 3000),
        color: 15548997,
        fields,
        timestamp: new Date().toISOString(),
      },
    ],
  }

  fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {})
}