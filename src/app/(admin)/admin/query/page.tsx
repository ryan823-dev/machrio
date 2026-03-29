'use client'

import { useState } from 'react'

export default function AdminQueryPage() {
  const [sql, setSql] = useState('SELECT slug FROM categories WHERE is_published = true ORDER BY display_order;')
  const [result, setResult] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const executeQuery = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Query failed')
      }

      setResult(data.rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Database Query Tool</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SQL Query
          </label>
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            className="w-full h-32 p-3 font-mono text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter SQL query..."
          />
          <button
            onClick={executeQuery}
            disabled={loading}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Executing...' : 'Execute Query'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-2">Error</h3>
            <p className="font-mono text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-lg mb-4">
              Results ({result.length} rows)
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    {result.length > 0 &&
                      Object.keys(result[0]).map((key) => (
                        <th
                          key={key}
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {key}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {result.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((value: any, i) => (
                        <td key={i} className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Quick Queries</h3>
          <div className="space-y-2">
            <button
              onClick={() => setSql('SELECT slug FROM categories WHERE is_published = true ORDER BY display_order;')}
              className="block text-sm text-blue-700 hover:text-blue-900"
            >
              → List all published categories
            </button>
            <button
              onClick={() => setSql('SELECT id, name, slug, is_published FROM categories ORDER BY id;')}
              className="block text-sm text-blue-700 hover:text-blue-900"
            >
              → List all categories with details
            </button>
            <button
              onClick={() => setSql('SELECT DISTINCT slug FROM scenario_categories ORDER BY slug;')}
              className="block text-sm text-blue-700 hover:text-blue-900"
            >
              → List all scenario category slugs
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
