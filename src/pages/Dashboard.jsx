import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

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
    sportSemaine: { nb: 0, distance: 0, duree: 0, ressenti: null },
    prochainEvenement: null,
    dernierEvenement: null,
    trend: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    setLoading(true)
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const il7jours = new Date(today)
    il7jours.setDate(today.getDate() - 7)
    const dateLimit = il7jours.toISOString().split('T')[0]

    const [
      { data: analyses },
      { data: symptomes },
      { data: medicaments },
      { data: repas },
      { data: sport },
      { data: evenements },
    ] = await Promise.all([
      supabase.from('analyses').select('*').order('date', { ascending: false }),
      supabase.from('symptomes').select('*').order('date', { ascending: false }),
      supabase.from('medicaments').select('*'),
      supabase.from('repas').select('*').order('date', { ascending: false }),
      supabase.from('sport').select('*').order('date', { ascending: false }),
      supabase.from('evenements_medicaux').select('*').order('date_debut', { ascending: false }),
    ])

    // --- Dernier bilan + valeurs anormales ---
    const derniereDate = analyses?.[0]?.date
    const dernierBilan = analyses?.filter(a => a.date === derniereDate) || []
    const anormaux = dernierBilan.filter(a =>
      a.normal_min !== null && a.normal_max !== null &&
      (a.valeur < a.normal_min || a.valeur > a.normal_max)
    )

    // --- Symptômes 7 derniers jours ---
    const symptomesRecents = symptomes?.filter(s => s.date >= dateLimit) || []

    // --- Traitements EN COURS uniquement (pas de date_fin) ---
    const medsEnCours = medicaments?.filter(m => !m.date_fin) || []

    // --- Sport de la semaine ---
    const sportSemaine = sport?.filter(s => s.date >= dateLimit) || []
    const ressentis = sportSemaine
      .map(s => Number(s.sensation_ventre))
      .filter(v => !Number.isNaN(v))
    const sportStats = {
      nb: sportSemaine.length,
      distance: sportSemaine.reduce((sum, s) => sum + (Number(s.distance) || 0), 0),
      duree: sportSemaine.reduce((sum, s) => sum + (Number(s.duree) || 0), 0),
      ressenti: ressentis.length
        ? (ressentis.reduce((a, b) => a + b, 0) / ressentis.length)
        : null,
    }

    // --- Événements médicaux (prochain à venir / dernier passé) ---
    // evenements est trié desc sur date_debut
    const evPasses = evenements?.filter(e => e.date_debut <= todayStr) || []
    const evFuturs = (evenements?.filter(e => e.date_debut > todayStr) || [])
      .sort((a, b) => a.date_debut.localeCompare(b.date_debut))
    const dernierEvenement = evPasses[0] || null
    const prochainEvenement = evFuturs[0] || null

    // --- Tendance symptômes : intensité cumulée par jour sur 30 jours ---
    const trend = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = d.toISOString().split('T')[0]
      const daySympt = symptomes?.filter(s => s.date === key) || []
      trend.push({
        date: key,
        label: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        intensite: daySympt.reduce((sum, s) => sum + (Number(s.intensite) || 0), 0),
        count: daySympt.length,
      })
    }

    setStats({
      nbAnalyses: [...new Set(analyses?.map(a => a.date) || [])].length,
      nbSymptomes: symptomesRecents.length,
      nbMedicaments: medsEnCours.length,
      nbRepas: repas?.filter(r => r.date >= dateLimit).length || 0,
      derniereAnalyse: derniereDate,
      anormaux,
      symptomesRecents: symptomesRecents.slice(0, 5),
      medicaments: medsEnCours,
      sportSemaine: sportStats,
      prochainEvenement,
      dernierEvenement,
      trend,
    })
    setLoading(false)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const formatDateCourt = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
  }

  const formatDuree = (min) => {
    if (!min) return '0 min'
    const h = Math.floor(min / 60)
    const m = Math.round(min % 60)
    if (h === 0) return `${m} min`
    return m === 0 ? `${h} h` : `${h} h ${m} min`
  }

  const joursAvant = (dateStr) => {
    const d = new Date(dateStr)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const diff = Math.round((d - now) / (1000 * 60 * 60 * 24))
    if (diff === 0) return "aujourd'hui"
    if (diff === 1) return 'demain'
    if (diff > 1) return `dans ${diff} jours`
    if (diff === -1) return 'hier'
    return `il y a ${Math.abs(diff)} jours`
  }

  const getBonjour = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bonjour'
    if (h < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }

  const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const p = payload[0].payload
    return (
      <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold text-slate-900 dark:text-white mb-0.5">{label}</p>
        <p className="text-amber-500 font-medium">Intensité : {p.intensite}</p>
        <p className="text-slate-400 dark:text-gray-500">{p.count} symptôme{p.count > 1 ? 's' : ''}</p>
      </div>
    )
  }

  if (loading) return <div className="px-6 py-8 text-slate-500">Chargement...</div>

  const s = stats.sportSemaine

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
            <span className="text-xl">🏃</span>
            <p className="text-slate-500 dark:text-gray-400 text-sm">Sport</p>
          </div>
          <p className="text-3xl font-bold text-violet-500">{s.nb}</p>
          <p className="text-slate-400 dark:text-gray-600 text-xs mt-1">Séances / 7 jours</p>
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
            <p className="text-slate-500 dark:text-gray-400 text-sm">Aucun traitement en cours.</p>
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

        {/* Sport de la semaine */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span>🏃</span> Sport — 7 derniers jours
          </h3>
          {s.nb === 0 ? (
            <p className="text-slate-500 dark:text-gray-400 text-sm">Aucune séance cette semaine.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/30 rounded-xl px-3 py-4 text-center">
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{s.nb}</p>
                <p className="text-slate-400 dark:text-gray-500 text-xs mt-1">séances</p>
              </div>
              <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/30 rounded-xl px-3 py-4 text-center">
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{formatDuree(s.duree)}</p>
                <p className="text-slate-400 dark:text-gray-500 text-xs mt-1">durée totale</p>
              </div>
              <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/30 rounded-xl px-3 py-4 text-center">
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                  {s.distance > 0 ? `${s.distance.toFixed(1)}` : '—'}
                </p>
                <p className="text-slate-400 dark:text-gray-500 text-xs mt-1">distance (km)</p>
              </div>
              {s.ressenti !== null && (
                <div className="col-span-3 flex items-center justify-between bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3">
                  <p className="text-slate-500 dark:text-gray-400 text-sm">Ressenti ventre moyen</p>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{s.ressenti.toFixed(1)}/5</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Événements médicaux */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span>🏥</span> Événements médicaux
          </h3>
          {!stats.prochainEvenement && !stats.dernierEvenement ? (
            <p className="text-slate-500 dark:text-gray-400 text-sm">Aucun événement enregistré.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.prochainEvenement && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/30 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wide">À venir · {joursAvant(stats.prochainEvenement.date_debut)}</p>
                    <p className="text-slate-400 dark:text-gray-500 text-xs">{formatDateCourt(stats.prochainEvenement.date_debut)}</p>
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{stats.prochainEvenement.titre}</p>
                  {stats.prochainEvenement.type && <p className="text-slate-400 dark:text-gray-500 text-xs">{stats.prochainEvenement.type}</p>}
                </div>
              )}
              {stats.dernierEvenement && (
                <div className="bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-slate-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide">Dernier · {joursAvant(stats.dernierEvenement.date_debut)}</p>
                    <p className="text-slate-400 dark:text-gray-500 text-xs">{formatDateCourt(stats.dernierEvenement.date_debut)}</p>
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{stats.dernierEvenement.titre}</p>
                  {stats.dernierEvenement.resultats && <p className="text-slate-500 dark:text-gray-400 text-xs mt-1">{stats.dernierEvenement.resultats}</p>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tendance des symptômes */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm dark:shadow-none md:col-span-2">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span>📈</span> Tendance des symptômes — 30 derniers jours
          </h3>
          {stats.trend.every(d => d.intensite === 0) ? (
            <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold">Aucun symptôme sur 30 jours</p>
                <p className="text-slate-500 dark:text-gray-400 text-sm">Excellente période de rémission.</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSympt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} interval={4} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} tickLine={false} axisLine={false} width={30} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="intensite" stroke="#f59e0b" strokeWidth={2} fill="url(#gradSympt)" />
              </AreaChart>
            </ResponsiveContainer>
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
              {stats.symptomesRecents.map(sy => (
                <div key={sy.id} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl px-4 py-2 flex items-center gap-2">
                  <span className="text-amber-600 dark:text-amber-400 font-semibold text-sm">{sy.type}</span>
                  <span className="text-slate-400 dark:text-gray-500 text-xs">— {sy.intensite}/5</span>
                  <span className="text-slate-400 dark:text-gray-600 text-xs">{formatDate(sy.date)}</span>
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