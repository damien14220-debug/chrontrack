import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function Dashboard() {
  const [stats, setStats] = useState({
    nbAnalyses: 0,
    nbSymptomes: 0,
    nbMedicaments: 0,
    nbRepas: 0,
    derniereAnalyse: null,
    anormaux: [],
    symptomesRecents: [],
    medicaments: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    setLoading(true)
    const today = new Date()
    const il7jours = new Date(today)
    il7jours.setDate(today.getDate() - 7)
    const dateLimit = il7jours.toISOString().split('T')[0]

    const [
      { data: analyses },
      { data: symptomes },
      { data: medicaments },
      { data: repas },
    ] = await Promise.all([
      supabase.from('analyses').select('*').order('date', { ascending: false }),
      supabase.from('symptomes').select('*').order('date', { ascending: false }),
      supabase.from('medicaments').select('*'),
      supabase.from('repas').select('*').order('date', { ascending: false }),
    ])

    const derniereDate = analyses?.[0]?.date
    const dernierBilan = analyses?.filter(a => a.date === derniereDate) || []
    const anormaux = dernierBilan.filter(a =>
      a.normal_min !== null && a.normal_max !== null &&
      (a.valeur < a.normal_min || a.valeur > a.normal_max)
    )
    const symptomesRecents = symptomes?.filter(s => s.date >= dateLimit) || []

    setStats({
      nbAnalyses: [...new Set(analyses?.map(a => a.date) || [])].length,
      nbSymptomes: symptomesRecents.length,
      nbMedicaments: medicaments?.length || 0,
      nbRepas: repas?.length || 0,
      derniereAnalyse: derniereDate,
      anormaux,
      symptomesRecents: symptomesRecents.slice(0, 5),
      medicaments: medicaments || [],
    })
    setLoading(false)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const getBonjour = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bonjour'
    if (h < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }

  if (loading) return <div className="px-6 py-8 text-slate-500">Chargement...</div>

  return (
    <div className="px-6 py-8">

      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{getBonjour()} 👋</h2>
        <p className="text-slate-500 dark:text-gray-400">Voici un résumé de ton suivi CrohnTrack.</p>
      </div>

      {/* Cartes résumé */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">📊</span>
            <p className="text-slate-500 dark:text-gray-400 text-sm">Bilans</p>
          </div>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.nbAnalyses}</p>
          <p className="text-slate-400 dark:text-gray-600 text-xs mt-1">
            {stats.derniereAnalyse ? `Dernier : ${formatDate(stats.derniereAnalyse)}` : 'Aucun bilan'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🤒</span>
            <p className="text-slate-500 dark:text-gray-400 text-sm">Symptômes</p>
          </div>
          <p className="text-3xl font-bold text-amber-500">{stats.nbSymptomes}</p>
          <p className="text-slate-400 dark:text-gray-600 text-xs mt-1">Ces 7 derniers jours</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">💊</span>
            <p className="text-slate-500 dark:text-gray-400 text-sm">Traitements</p>
          </div>
          <p className="text-3xl font-bold text-sky-500">{stats.nbMedicaments}</p>
          <p className="text-slate-400 dark:text-gray-600 text-xs mt-1">En cours</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🍽️</span>
            <p className="text-slate-500 dark:text-gray-400 text-sm">Repas</p>
          </div>
          <p className="text-3xl font-bold text-orange-500">{stats.nbRepas}</p>
          <p className="text-slate-400 dark:text-gray-600 text-xs mt-1">Enregistrés</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Dernier bilan */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span>📊</span> Dernier bilan — {formatDate(stats.derniereAnalyse)}
          </h3>
          {stats.anormaux.length === 0 ? (
            <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold">Tout est normal</p>
                <p className="text-slate-500 dark:text-gray-400 text-sm">Aucune valeur anormale détectée.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.anormaux.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{a.type}</p>
                    <p className="text-slate-400 dark:text-gray-500 text-xs">Normal : {a.normal_min} — {a.normal_max} {a.unite}</p>
                  </div>
                  <p className="text-red-500 font-bold">{a.valeur} {a.unite}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Médicaments */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span>💊</span> Traitements en cours
          </h3>
          {stats.medicaments.length === 0 ? (
            <p className="text-slate-500 dark:text-gray-400 text-sm">Aucun traitement enregistré.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.medicaments.map(med => (
                <div key={med.id} className="flex items-center justify-between bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/30 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{med.nom}</p>
                    <p className="text-slate-400 dark:text-gray-500 text-xs">{med.frequence || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sky-600 dark:text-sky-400 font-semibold text-sm">{med.dosage}</p>
                    {med.heure_rappel && <p className="text-slate-400 dark:text-gray-600 text-xs">⏰ {med.heure_rappel}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Symptômes récents */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm dark:shadow-none md:col-span-2">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span>🤒</span> Symptômes récents — 7 derniers jours
          </h3>
          {stats.symptomesRecents.length === 0 ? (
            <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold">Aucun symptôme cette semaine</p>
                <p className="text-slate-500 dark:text-gray-400 text-sm">Continue comme ça !</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {stats.symptomesRecents.map(s => (
                <div key={s.id} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl px-4 py-2 flex items-center gap-2">
                  <span className="text-amber-600 dark:text-amber-400 font-semibold text-sm">{s.type}</span>
                  <span className="text-slate-400 dark:text-gray-500 text-xs">— {s.intensite}/5</span>
                  <span className="text-slate-400 dark:text-gray-600 text-xs">{formatDate(s.date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Dashboard