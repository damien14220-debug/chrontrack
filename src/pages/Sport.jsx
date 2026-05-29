import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const SPORTS = [
  { label: 'Course à pied', emoji: '🏃', strava: ['Run', 'TrailRun', 'VirtualRun'] },
  { label: 'Vélo', emoji: '🚴', strava: ['Ride', 'VirtualRide', 'MountainBikeRide'] },
  { label: 'Natation', emoji: '🏊', strava: ['Swim'] },
  { label: 'Musculation', emoji: '🏋️', strava: ['WeightTraining', 'Crossfit'] },
  { label: 'Marche', emoji: '🚶', strava: ['Walk', 'Hike'] },
  { label: 'Yoga', emoji: '🧘', strava: ['Yoga'] },
  { label: 'Autre', emoji: '⚡', strava: [] },
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

const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID
const STRAVA_CLIENT_SECRET = import.meta.env.VITE_STRAVA_CLIENT_SECRET
const REDIRECT_URI = `${window.location.origin}/strava-callback`

function getSportFromStrava(stravaType) {
  const sport = SPORTS.find(s => s.strava.includes(stravaType))
  return sport ? sport.label : 'Autre'
}

function Sport() {
  const [seances, setSeances] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [stravaConnecte, setStravaConnecte] = useState(false)
  const [stravaLoading, setStravaLoading] = useState(false)
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

  useEffect(() => {
    fetchSeances()
    checkStravaToken()
    handleStravaCallback()
  }, [])

  const checkStravaToken = () => {
    const token = localStorage.getItem('strava_access_token')
    const expiry = localStorage.getItem('strava_token_expiry')
    if (token && expiry && Date.now() < parseInt(expiry)) {
      setStravaConnecte(true)
    }
  }

  const handleStravaCallback = async () => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (!code) return

    // Nettoie l'URL
    window.history.replaceState({}, '', window.location.pathname)

    setStravaLoading(true)
    try {
      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: STRAVA_CLIENT_ID,
          client_secret: STRAVA_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code'
        })
      })
      const data = await response.json()
      if (data.access_token) {
        localStorage.setItem('strava_access_token', data.access_token)
        localStorage.setItem('strava_refresh_token', data.refresh_token)
        localStorage.setItem('strava_token_expiry', String(data.expires_at * 1000))
        setStravaConnecte(true)
        await importStravaActivities(data.access_token)
      }
    } catch(e) {
      console.error('Erreur Strava:', e)
    }
    setStravaLoading(false)
  }

  const connecterStrava = () => {
    const url = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '?strava_code=1')}&response_type=code&scope=activity:read_all`
    window.location.href = url.replace('strava_code=1', 'strava_code=CODE').replace('CODE', '')
      .replace('?strava_code=', '')
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent('https://crohntrack.fr')}&response_type=code&scope=activity:read_all&approval_prompt=force`
    window.location.href = authUrl
  }

  const importStravaActivities = async (token) => {
    setStravaLoading(true)
    try {
      const response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=30', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const activities = await response.json()
      if (!Array.isArray(activities)) return

      const { data: { user } } = await supabase.auth.getUser()

      const lignes = activities.map(a => ({
        date: a.start_date_local.split('T')[0],
        sport: getSportFromStrava(a.type),
        duree: Math.round(a.moving_time / 60),
        distance: a.distance > 0 ? Math.round(a.distance / 100) / 10 : null,
        energie_avant: 3,
        energie_apres: 3,
        sensation_ventre: 3,
        symptomes_ventre: '',
        note: `Importé de Strava — ${a.name}`,
        user_id: user.id
      }))

      // Insère uniquement les nouvelles séances
      for (const ligne of lignes) {
        const { data: existing } = await supabase
          .from('sport')
          .select('id')
          .eq('date', ligne.date)
          .eq('note', ligne.note)
          .eq('user_id', user.id)
        if (!existing || existing.length === 0) {
          await supabase.from('sport').insert([ligne])
        }
      }
      fetchSeances()
    } catch(e) {
      console.error('Erreur import Strava:', e)
    }
    setStravaLoading(false)
  }

  const syncStrava = async () => {
    const token = localStorage.getItem('strava_access_token')
    if (!token) return
    await importStravaActivities(token)
  }

  const deconnecterStrava = () => {
    localStorage.removeItem('strava_access_token')
    localStorage.removeItem('strava_refresh_token')
    localStorage.removeItem('strava_token_expiry')
    setStravaConnecte(false)
  }

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
  const getSportEmoji = (sport) => SPORTS.find(s => s.label === sport)?.emoji || '⚡'

  const getBadge = (seance) => {
    if (seance.sensation_ventre <= 2) return { label: '🔴 Mauvaises sensations', classe: 'bg-red-50 dark:bg-red-500/20 text-red-500 border-red-200 dark:border-red-500/30' }
    if (seance.sensation_ventre === 3) return { label: '🟡 Gêne légère', classe: 'bg-amber-50 dark:bg-amber-500/20 text-amber-500 border-amber-200 dark:border-amber-500/30' }
    return { label: '🟢 Bonne séance', classe: 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' }
  }

  const groupes = groupParDate(seances)

  return (
    <div className="px-6 py-8">

      <div className="flex items-center justify-between mb-6">
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

      {/* Bloc Strava */}
      <div className={`rounded-2xl p-5 mb-8 border ${stravaConnecte ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/40' : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800'} shadow-sm dark:shadow-none`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              S
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Strava</p>
              <p className="text-slate-500 dark:text-gray-400 text-sm">
                {stravaConnecte ? '✅ Connecté — tes activités sont synchronisées' : 'Importe automatiquement tes activités'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {stravaConnecte ? (
              <>
                <button
                  onClick={syncStrava}
                  disabled={stravaLoading}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-xl transition text-sm disabled:opacity-50"
                >
                  {stravaLoading ? '⏳ Sync...' : '🔄 Synchroniser'}
                </button>
                <button
                  onClick={deconnecterStrava}
                  className="bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 font-semibold px-4 py-2 rounded-xl transition text-sm"
                >
                  Déconnecter
                </button>
              </>
            ) : (
              <button
                onClick={connecterStrava}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2 rounded-xl transition text-sm"
              >
                Connecter Strava
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 mb-8 shadow-sm dark:shadow-none">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">🏋️ Nouvelle séance</h3>

          <div className="mb-5">
            <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Date</label>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
              className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 outline-none" />
          </div>

          <div className="mb-5">
            <label className="text-slate-500 dark:text-gray-400 text-sm mb-3 block">Type de sport</label>
            <div className="flex flex-wrap gap-2">
              {SPORTS.map(s => (
                <button key={s.label} onClick={() => setForm({ ...form, sport: s.label })}
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

          <div className="mb-5">
            <label className="text-slate-500 dark:text-gray-400 text-sm mb-3 block">Niveau d'énergie <strong>avant</strong></label>
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

          <div className="mb-5">
            <label className="text-slate-500 dark:text-gray-400 text-sm mb-3 block">Niveau d'énergie <strong>après</strong></label>
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

          <div className="mb-5">
            <label className="text-slate-500 dark:text-gray-400 text-sm mb-3 block">Sensations <strong>ventre</strong></label>
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

          {form.sensation_ventre <= 3 && (
            <div className="mb-5">
              <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Détails des symptômes ventre</label>
              <input type="text" value={form.symptomes_ventre} onChange={e => setForm({ ...form, symptomes_ventre: e.target.value })}
                placeholder="Ex: douleurs, ballonnements, transit perturbé..."
                className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 outline-none" />
            </div>
          )}

          <div className="mb-6">
            <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Note générale (optionnel)</label>
            <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
              placeholder="Ressenti général, conditions, parcours..."
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
          <p className="text-slate-500 dark:text-gray-500">Ajoute une séance manuellement ou connecte Strava.</p>
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
                                  {s.note?.includes('Strava') && <span className="text-orange-500 text-xs font-medium">🟠 Strava</span>}
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