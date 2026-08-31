import { Component } from 'react'
import type { ReactNode } from 'react'
import { reportError } from '../lib/errorReporter'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    reportError({
      title: 'React ErrorBoundary',
      message: error.message,
      stack: error.stack,
      extra: { componentStack: info?.componentStack },
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 24px', textAlign: 'center', fontFamily: 'sans-serif', color: '#64748b' }}>
          <h2 style={{ margin: '0 0 8px', color: '#0f172a' }}>Ocorreu um erro inesperado</h2>
          <p style={{ margin: 0 }}>Recarregue a página. Se o problema persistir, tente novamente mais tarde.</p>
        </div>
      )
    }
    return this.props.children
  }
}