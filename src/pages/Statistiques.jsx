import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'

const COULEURS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'
]

function Statistiques() {
  const [analyses, setAnalyses] = useState([])
  const [parametres, setParametres] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeSelectionne, setTypeSelectionne] = useState(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: analysesData }, { data: paramsData }] = await Promise.all([
      supabase.from('analyses').select('*').order('date', { ascending: true }),
      supabase.from('parametres_analyses').select('*')
    ])
    if (analysesData) setAnalyses(analysesData)
    if (paramsData) setParametres(paramsData)
    setLoading(false)
  }

  // Récupère tous les types d'analyses disponibles
  const types = [...new Set(analyses.map(a => a.type))]

  // Données pour le graphique du type sélectionné
  const donneesGraphique = () => {
    if (!typeSelectionne) return []
    return analyses
      .filter(a => a.type === typeSelectionne)
      .map(a => ({
        date: new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }),
        valeur: a.valeur,
        normal_min: a.normal_min,
        normal_max: a.normal_max,
      }))
  }

  const getParams = (type) => parametres.find(p => p.type === type)

  const getStats = (type) => {
    const vals = analyses.filter(a => a.type === type).map(a => a.valeur)
    if (vals.length === 0) return null
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const moy = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
    const derniere = vals[vals.length - 1]
    return { min, max, moy, derniere, total: vals.length }
  }

  const isAnormal = (valeur, min, max) => {
    if (min === null || max === null) return false
    return valeur < min || valeur > max
  }

  const donnees = donneesGraphique()
  const params = typeSelectionne ? getParams(typeSelectionne) : null
  const stats = typeSelectionne ? getStats(typeSelectionne) : null

  if (loading) return <div className="px-6 py-8 text-gray-500">Chargement...</div>

  return (
    <div className="px-6 py-8">

      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">📈 Statistiques</h2>
        <p className="text-gray-400">Visualise l'évolution de tes analyses dans le temps.</p>
      </div>

      {analyses.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          <span className="text-4xl mb-4 block">📊</span>
          <h3 className="text-xl font-bold text-gray-200 mb-2">Aucune donnée disponible</h3>
          <p className="text-gray-500">Enregistre des bilans sanguins pour voir les graphiques.</p>
        </div>
      ) : (
        <>
          {/* Sélecteur de type */}
          <div className="mb-8">
            <p className="text-gray-400 text-sm mb-3">Sélectionne une analyse à visualiser :</p>
            <div className="flex flex-wrap gap-2">
              {types.map((type, i) => {
                const p = getParams(type)
                const s = getStats(type)
                const anormal = p && s ? isAnormal(s.derniere, p.normal_min, p.normal_max) : false
                return (
                  <button
                    key={type}
                    onClick={() => setTypeSelectionne(type)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${
                      typeSelectionne === type
                        ? 'bg-green-500/20 text-green-400 border-green-500/50'
                        : anormal
                        ? 'bg-red-900/20 text-red-400 border-red-800/50 hover:bg-red-900/30'
                        : 'bg-gray-900 text-gray-400 border-gray-800 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    {anormal ? '⚠️ ' : ''}{type}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Graphique */}
          {typeSelectionne && donnees.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">

              {/* Stats rapides */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-800 rounded-xl p-4 text-center">
                    <p className="text-gray-500 text-xs mb-1">Dernière valeur</p>
                    <p className={`text-2xl font-bold ${
                      params && isAnormal(stats.derniere, params.normal_min, params.normal_max)
                        ? 'text-red-400' : 'text-green-400'
                    }`}>{stats.derniere}</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-4 text-center">
                    <p className="text-gray-500 text-xs mb-1">Moyenne</p>
                    <p className="text-2xl font-bold text-blue-400">{stats.moy}</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-4 text-center">
                    <p className="text-gray-500 text-xs mb-1">Min / Max</p>
                    <p className="text-lg font-bold text-gray-300">{stats.min} / {stats.max}</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-4 text-center">
                    <p className="text-gray-500 text-xs mb-1">Mesures</p>
                    <p className="text-2xl font-bold text-purple-400">{stats.total}</p>
                  </div>
                </div>
              )}

              <h3 className="text-lg font-bold text-white mb-4">
                Évolution — {typeSelectionne}
                {params && (
                  <span className="text-sm text-gray-500 font-normal ml-2">
                    (normal : {params.normal_min} — {params.normal_max} {params.unite})
                  </span>
                )}
              </h3>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={donnees} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px' }}
                    labelStyle={{ color: '#9ca3af' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  {params && (
                    <>
                      <ReferenceLine y={params.normal_max} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Max', fill: '#ef4444', fontSize: 11 }} />
                      <ReferenceLine y={params.normal_min} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Min', fill: '#f59e0b', fontSize: 11 }} />
                    </>
                  )}
                  <Line
                    type="monotone"
                    dataKey="valeur"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {typeSelectionne && donnees.length < 2 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center text-gray-500">
              <p>📊 Enregistre au moins 2 bilans pour voir l'évolution sur le graphique.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Statistiques