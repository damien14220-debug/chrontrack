import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'

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

  const types = [...new Set(analyses.map(a => a.type))]

  const donneesGraphique = () => {
    if (!typeSelectionne) return []
    return analyses
      .filter(a => a.type === typeSelectionne)
      .map(a => ({
        date: new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
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

  if (loading) return (
    <div className="px-4 py-8 text-slate-500 dark:text-gray-500">Chargement...</div>
  )

  return (
    <div className="px-3 py-4 md:px-6 md:py-8">

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1">📈 Statistiques</h2>
        <p className="text-slate-500 dark:text-gray-400 text-sm">Visualise l'évolution de tes analyses dans le temps.</p>
      </div>

      {analyses.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-8 text-center shadow-sm">
          <span className="text-4xl mb-4 block">📊</span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-gray-200 mb-2">Aucune donnée disponible</h3>
          <p className="text-slate-500 dark:text-gray-500">Enregistre des bilans sanguins pour voir les graphiques.</p>
        </div>
      ) : (
        <>
          {/* Sélecteur */}
          <div className="mb-6">
            <p className="text-slate-500 dark:text-gray-400 text-sm mb-3">Sélectionne une analyse :</p>
            <div className="flex flex-wrap gap-2">
              {types.map(type => {
                const p = getParams(type)
                const s = getStats(type)
                const anormal = p && s ? isAnormal(s.derniere, p.normal_min, p.normal_max) : false
                return (
                  <button
                    key={type}
                    onClick={() => setTypeSelectionne(type)}
                    className={`px-3 py-1.5 rounded-xl text-xs md:text-sm font-medium transition border ${
                      typeSelectionne === type
                        ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/50'
                        : anormal
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-500 border-red-200 dark:border-red-800/50'
                        : 'bg-white dark:bg-gray-900 text-slate-600 dark:text-gray-400 border-slate-200 dark:border-gray-800'
                    }`}
                  >
                    {anormal ? '⚠️ ' : ''}{type}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Graphique + Stats */}
          {typeSelectionne && donnees.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-3 md:p-6 mb-6 shadow-sm dark:shadow-none">

              {/* Titre */}
              <div className="mb-4">
                <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                  {typeSelectionne}
                </h3>
                {params && (
                  <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">
                    Valeurs normales : {params.normal_min} — {params.normal_max} {params.unite}
                  </p>
                )}
              </div>

              {/* Stats rapides — 2 colonnes sur mobile, 4 sur desktop */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-5">
                  <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                    <p className="text-slate-400 dark:text-gray-500 text-xs mb-1">Dernière valeur</p>
                    <p className={`text-xl md:text-2xl font-bold ${
                      params && isAnormal(stats.derniere, params.normal_min, params.normal_max)
                        ? 'text-red-500' : 'text-emerald-500'
                    }`}>{stats.derniere}</p>
                    {params && (
                      <p className="text-xs text-slate-400 dark:text-gray-600 mt-0.5">{params.unite}</p>
                    )}
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                    <p className="text-slate-400 dark:text-gray-500 text-xs mb-1">Moyenne</p>
                    <p className="text-xl md:text-2xl font-bold text-sky-500">{stats.moy}</p>
                    {params && (
                      <p className="text-xs text-slate-400 dark:text-gray-600 mt-0.5">{params.unite}</p>
                    )}
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                    <p className="text-slate-400 dark:text-gray-500 text-xs mb-1">Min / Max</p>
                    <p className="text-base md:text-lg font-bold text-slate-700 dark:text-gray-300">{stats.min} / {stats.max}</p>
                    {params && (
                      <p className="text-xs text-slate-400 dark:text-gray-600 mt-0.5">{params.unite}</p>
                    )}
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                    <p className="text-slate-400 dark:text-gray-500 text-xs mb-1">Mesures</p>
                    <p className="text-xl md:text-2xl font-bold text-purple-500">{stats.total}</p>
                    <p className="text-xs text-slate-400 dark:text-gray-600 mt-0.5">bilans</p>
                  </div>
                </div>
              )}

              {/* Graphique — plus haut sur mobile */}
              <ResponsiveContainer width="100%" height={280}>
                <LineChart
                  data={donnees}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fontSize: 10 }}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      color: '#0f172a',
                      fontSize: '13px'
                    }}
                  />
                  {params && (
                    <>
                      <ReferenceLine
                        y={params.normal_max}
                        stroke="#ef4444"
                        strokeDasharray="4 4"
                        label={{ value: 'Max', fill: '#ef4444', fontSize: 10, position: 'right' }}
                      />
                      <ReferenceLine
                        y={params.normal_min}
                        stroke="#f59e0b"
                        strokeDasharray="4 4"
                        label={{ value: 'Min', fill: '#f59e0b', fontSize: 10, position: 'right' }}
                      />
                    </>
                  )}
                  <Line
                    type="monotone"
                    dataKey="valeur"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>

            </div>
          )}

          {typeSelectionne && donnees.length < 2 && (
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 text-center text-slate-500 dark:text-gray-500 shadow-sm">
              <p className="text-sm">📊 Enregistre au moins 2 bilans pour voir l'évolution.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Statistiques