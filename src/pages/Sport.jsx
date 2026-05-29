import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const SPORTS = [
  { label: 'Course à pied', emoji: '🏃' },
  { label: 'Vélo', emoji: '🚴' },
  { label: 'Natation', emoji: '🏊' },
  { label: 'Musculation', emoji: '🏋️' },
  { label: 'Marche', emoji: '🚶' },
  { label: 'Yoga', emoji: '🧘' },
  { label: 'Autre', emoji: '⚡' },
]

const NIVEAUX = [
  { valeur: 1, label: 'Très bas', couleur: 'text-red-500' },
  { valeur: 2, label: 'Bas', couleur: 'text-orange-500' },
  { valeur: 3, label: 'Moyen', couleur: 'text-amber-500' },
  { valeur: 4, label: 'Bon', couleur: 'text-lime-500' },
  { valeur: 5, label: 'Excellent', couleur: 'text-emerald-500' },
]

const SENSATIONS = [
  { valeur: 1, label: 'Très douloureux', couleur: 'text-red-500' },
  { valeur: 2, label: 'Douloureux', couleur: 'text-orange-500' },
  { valeur: 3, label: 'Gêne légère', couleur: 'text-amber-500' },
  { valeur: 4, label: 'Bon', couleur: 'text-lime-500' },
  { valeur: 5, label: 'Parfait', couleur: 'text-emerald-500' },
]

function Sport() {
  const [seances, setSeances] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    date: '',
    sport: '',
    duree: '',
    distance: '',
    energie_avant: 3,
    energie_apres: 3,
    sensation_ventre: 3,
    symptomes_ventre: '',
    note: ''
  })
  const [joursOuverts, setJoursOuverts] = useState({})

  useEffect(() => { fetchSeances() }, [])

  const fetchSeances = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('sport')
      .select('*')
      .order('date', { ascending: false })
    if (data) {
      setSeances(data)
      if (data.length > 0) setJoursOuverts({ [data[0].date]: true })
    }
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!form.date || !form.sport) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('sport').insert([{
      ...form,
      duree: form.duree ? parseInt(form.duree) : null,
      distance: form.distance ? parseFloat(form.distance) : null,
      user_id: user.id
    }])
    setForm({ date: '', sport: '', duree: '', distance: '', energie_avant: 3, energie_apres: 3, sensation_ventre: 3, symptomes_ventre: '', note: '' })
    setShowForm(false)
    fetchSeances()
  }

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette séance ?')) {
      await supabase.from('sport').delete().eq('id', id)
      fetchSeances()
    }
  }

  const groupParDate = (data) => {
    const groupes = {}
    data.forEach(s => { if (!groupes[s.date]) groupes[s.date] = []; groupes[s.date].push(s) })
    return Object.entries(groupes).sort((a, b) => new Date(b[0]) - new Date(a[0]))
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const getNiveau = (val) => NIVEAUX.find(n => n.valeur === val) || NIVEAUX[2]
  const getSensation = (val) => SENSATIONS.find(s => s.valeur === val) || SENSATIONS[2]

  const getBadge = (seance) => {
    if (seance.sensation_ventre <= 2) return { label: '🔴 Mauvaises sensations', classe: 'bg-red-50 dark:bg-red-500/20 text-red-500 border-red-200 dark:border-red-500/30' }
    if (seance.sensation_ventre === 3) return { label: '🟡 Gêne légère', classe: 'bg-amber-50 dark:bg-amber-500/20 text-amber-500 border-amber-200 dark:border-amber-500/30' }
    return { label: '🟢 Bonne séance', classe: 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' }
  }

  const getSportEmoji = (sport) => SPORTS.find(s => s.label === sport)?.emoji || '⚡'

  const groupes = groupParDate(seances)

  return (
    <div className="px-6 py-8">

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">🏃 Journal Sportif</h2>
          <p className="text-slate-500 dark:text-gray-400">Suis tes séances et tes sensations physiques.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-3 rounded-xl transition"
        >
          + Ajouter une séance
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 mb-8 shadow-sm dark:shadow-none">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">🏋️ Nouvelle séance</h3>

          {/* Date */}
          <div className="mb-5">
            <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Date</label>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
              className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 outline-none" />
          </div>

          {/* Sport */}
          <div className="mb-5">
            <label className="text-slate-500 dark:text-gray-400 text-sm mb-3 block">Type de sport</label>
            <div className="flex flex-wrap gap-2">
              {SPORTS.map(s => (
                <button
                  key={s.label}
                  onClick={() => setForm({ ...form, sport: s.label })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition font-medium text-sm ${
                    form.sport === s.label
                      ? 'bg-sky-50 dark:bg-sky-500/20 border-sky-300 dark:border-sky-500/50 text-sky-600 dark:text-sky-400'
                      : 'bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400'
                  }`}
                >
                  <span>{s.emoji}</span>{s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Durée et distance */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Durée (minutes)</label>
              <input type="number" value={form.duree} onChange={e => setForm({ ...form, duree: e.target.value })}
                placeholder="45"
                className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 outline-none" />
            </div>
            <div>
              <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Distance (km) — optionnel</label>
              <input type="number" value={form.distance} onChange={e => setForm({ ...form, distance: e.target.value })}
                placeholder="5.2"
                className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 outline-none" />
            </div>
          </div>

          {/* Énergie avant */}
          <div className="mb-5">
            <label className="text-slate-500 dark:text-gray-400 text-sm mb-3 block">
              Niveau d'énergie <strong>avant</strong> la séance
            </label>
            <div className="flex gap-2">
              {NIVEAUX.map(n => (
                <button key={n.valeur} onClick={() => setForm({ ...form, energie_avant: n.valeur })}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
                    form.energie_avant === n.valeur
                      ? 'bg-sky-50 dark:bg-sky-500/20 border-sky-300 dark:border-sky-500/50 text-sky-600 dark:text-sky-400'
                      : 'bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-500'
                  }`}
                >
                  {n.valeur} — {n.label}
                </button>
              ))}
            </div>
          </div>

          {/* Énergie après */}
          <div className="mb-5">
            <label className="text-slate-500 dark:text-gray-400 text-sm mb-3 block">
              Niveau d'énergie <strong>après</strong> la séance
            </label>
            <div className="flex gap-2">
              {NIVEAUX.map(n => (
                <button key={n.valeur} onClick={() => setForm({ ...form, energie_apres: n.valeur })}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
                    form.energie_apres === n.valeur
                      ? 'bg-sky-50 dark:bg-sky-500/20 border-sky-300 dark:border-sky-500/50 text-sky-600 dark:text-sky-400'
                      : 'bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-500'
                  }`}
                >
                  {n.valeur} — {n.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sensation ventre */}
          <div className="mb-5">
            <label className="text-slate-500 dark:text-gray-400 text-sm mb-3 block">
              Sensations <strong>ventre</strong> pendant/après la séance
            </label>
            <div className="flex gap-2">
              {SENSATIONS.map(s => (
                <button key={s.valeur} onClick={() => setForm({ ...form, sensation_ventre: s.valeur })}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
                    form.sensation_ventre === s.valeur
                      ? 'bg-sky-50 dark:bg-sky-500/20 border-sky-300 dark:border-sky-500/50 text-sky-600 dark:text-sky-400'
                      : 'bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-500'
                  }`}
                >
                  {s.valeur} — {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Symptômes ventre */}
          {form.sensation_ventre <= 3 && (
            <div className="mb-5">
              <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Détails des symptômes ventre</label>
              <input type="text" value={form.symptomes_ventre} onChange={e => setForm({ ...form, symptomes_ventre: e.target.value })}
                placeholder="Ex: douleurs, ballonnements, transit perturbé..."
                className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 outline-none" />
            </div>
          )}

          {/* Note */}
          <div className="mb-6">
            <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Note générale (optionnel)</label>
            <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
              placeholder="Ressenti général, conditions météo, parcours..."
              rows={2}
              className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:border-sky-500 outline-none resize-none" />
          </div>

          <div className="flex gap-3">
            <button onClick={handleSubmit} className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-3 rounded-xl transition">
              Enregistrer
            </button>
            <button onClick={() => setShowForm(false)} className="bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 font-semibold px-6 py-3 rounded-xl transition">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="text-center text-slate-500 dark:text-gray-500 py-12">Chargement...</div>
      ) : groupes.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-8 text-center shadow-sm">
          <span className="text-4xl mb-4 block">🏃</span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-gray-200 mb-2">Aucune séance enregistrée</h3>
          <p className="text-slate-500 dark:text-gray-500">Clique sur "+ Ajouter une séance" pour commencer.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groupes.map(([date, seancesJour]) => (
            <div key={date} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
              <button
                onClick={() => setJoursOuverts(prev => ({ ...prev, [date]: !prev[date] }))}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-gray-800 transition"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">📅</span>
                  <div className="text-left">
                    <p className="font-bold text-slate-900 dark:text-white capitalize">{formatDate(date)}</p>
                    <p className="text-slate-400 dark:text-gray-500 text-sm">{seancesJour.length} séance{seancesJour.length > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {seancesJour.map(s => {
                    const badge = getBadge(s)
                    return <span key={s.id} className={`text-xs px-3 py-1 rounded-full border ${badge.classe}`}>{badge.label}</span>
                  })}
                  <span className="text-slate-400 dark:text-gray-500">{joursOuverts[date] ? '▲' : '▼'}</span>
                </div>
              </button>

              {joursOuverts[date] && (
                <div className="border-t border-slate-100 dark:border-gray-800">
                  {seancesJour.map(s => {
                    const energieAvant = getNiveau(s.energie_avant)
                    const energieApres = getNiveau(s.energie_apres)
                    const sensation = getSensation(s.sensation_ventre)
                    return (
                      <div key={s.id} className="px-6 py-4 border-b border-slate-100 dark:border-gray-800/50 last:border-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-2xl">{getSportEmoji(s.sport)}</span>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">{s.sport}</p>
                                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-gray-400">
                                  {s.duree && <span>⏱️ {s.duree} min</span>}
                                  {s.distance && <span>📍 {s.distance} km</span>}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-3">
                              <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                                <p className="text-xs text-slate-400 dark:text-gray-500 mb-1">Énergie avant</p>
                                <p className={`font-bold text-sm ${energieAvant.couleur}`}>{s.energie_avant}/5</p>
                                <p className="text-xs text-slate-400 dark:text-gray-500">{energieAvant.label}</p>
                              </div>
                              <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                                <p className="text-xs text-slate-400 dark:text-gray-500 mb-1">Énergie après</p>
                                <p className={`font-bold text-sm ${energieApres.couleur}`}>{s.energie_apres}/5</p>
                                <p className="text-xs text-slate-400 dark:text-gray-500">{energieApres.label}</p>
                              </div>
                              <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                                <p className="text-xs text-slate-400 dark:text-gray-500 mb-1">Ventre</p>
                                <p className={`font-bold text-sm ${sensation.couleur}`}>{s.sensation_ventre}/5</p>
                                <p className="text-xs text-slate-400 dark:text-gray-500">{sensation.label}</p>
                              </div>
                            </div>

                            {s.symptomes_ventre && (
                              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-2 mb-2">
                                <p className="text-red-600 dark:text-red-300 text-xs">🩺 {s.symptomes_ventre}</p>
                              </div>
                            )}
                            {s.note && <p className="text-slate-400 dark:text-gray-500 text-xs">📝 {s.note}</p>}
                          </div>
                          <button onClick={() => handleDelete(s.id)} className="text-slate-300 dark:text-gray-600 hover:text-red-400 text-xs transition ml-4 mt-1">
                            🗑️
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Sport