import { ErrorBoundary } from './components/ErrorBoundary'
import Layout from './components/Layout'

export default function App() {
  return (
    <ErrorBoundary>
      <Layout />
    </ErrorBoundary>
  )
}
