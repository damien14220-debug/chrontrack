import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const MOMENTS = [
  { label: 'Petit-déjeuner', emoji: '🌅' },
  { label: 'Déjeuner', emoji: '☀️' },
  { label: 'Dîner', emoji: '🌙' },
  { label: 'Collation', emoji: '🍎' },
]

const REACTIONS = [
  { label: 'Aucune réaction', emoji: '✅', couleur: 'text-green-400', classe: 'border-green-500/40 bg-green-950/20' },
  { label: 'Légère gêne', emoji: '😐', couleur: 'text-yellow-400', classe: 'border-yellow-500/40 bg-yellow-950/20' },
  { label: 'Douleurs', emoji: '😣', couleur: 'text-orange-400', classe: 'border-orange-500/40 bg-orange-950/20' },
  { label: 'Forte réaction', emoji: '🚨', couleur: 'text-red-400', classe: 'border-red-500/40 bg-red-950/20' },
]

function Repas() {
  const [repas, setRepas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: '', moment: '', aliments: '', reaction: '', note: '' })
  const [joursOuverts, setJoursOuverts] = useState({})

  useEffect(() => { fetchRepas() }, [])

  const fetchRepas = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('repas')
      .select('*')
      .order('date', { ascending: false })
    if (data) {
      setRepas(data)
      if (data.length > 0) setJoursOuverts({ [data[0].date]: true })
    }
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!form.date || !form.moment || !form.aliments) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('repas').insert([{ ...form, user_id: user.id }])
    setForm({ date: '', moment: '', aliments: '', reaction: '', note: '' })
    setShowForm(false)
    fetchRepas()
  }

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce repas ?')) {
      await supabase.from('repas').delete().eq('id', id)
      fetchRepas()
    }
  }

  const groupParDate = (data) => {
    const groupes = {}
    data.forEach(r => {
      if (!groupes[r.date]) groupes[r.date] = []
      groupes[r.date].push(r)
    })
    return Object.entries(groupes).sort((a, b) => new Date(b[0]) - new Date(a[0]))
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const getReactionInfo = (label) => REACTIONS.find(r => r.label === label) || REACTIONS[0]

  const getBadgeJour = (repasJour) => {
    const reactions = repasJour.map(r => REACTIONS.findIndex(rx => rx.label === r.reaction))
    const max = Math.max(...reactions)
    if (max >= 3) return { label: '🚨 Forte réaction', classe: 'bg-red-500/20 text-red-400 border-red-500/30' }
    if (max === 2) return { label: '😣 Douleurs', classe: 'bg-orange-500/20 text-orange-400 border-orange-500/30' }
    if (max === 1) return { label: '😐 Légère gêne', classe: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
    return { label: '✅ Bonne journée', classe: 'bg-green-500/20 text-green-400 border-green-500/30' }
  }

  const groupes = groupParDate(repas)

  return (
    <div className="px-6 py-8">

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">🍽️ Journal alimentaire</h2>
          <p className="text-gray-400">Suis tes repas et identifie les aliments déclencheurs.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition"
        >
          + Ajouter un repas
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-bold text-white mb-6">🍴 Nouveau repas</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">Moment</label>
              <div className="flex gap-2">
                {MOMENTS.map(m => (
                  <button
                    key={m.label}
                    onClick={() => setForm({ ...form, moment: m.label })}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition border ${
                      form.moment === m.label
                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                        : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600'
                    }`}
                  >
                    {m.emoji}<br/><span className="text-xs">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-gray-400 text-sm mb-2 block">Aliments consommés</label>
            <textarea
              value={form.aliments}
              onChange={e => setForm({ ...form, aliments: e.target.value })}
              placeholder="Ex: Riz blanc, poulet grillé, carottes cuites..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:border-orange-500 outline-none resize-none"
            />
          </div>

          <div className="mb-4">
            <label className="text-gray-400 text-sm mb-3 block">Réaction après le repas</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {REACTIONS.map(r => (
                <button
                  key={r.label}
                  onClick={() => setForm({ ...form, reaction: r.label })}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition border ${
                    form.reaction === r.label
                      ? r.classe
                      : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600'
                  }`}
                >
                  <span className="text-xl block mb-1">{r.emoji}</span>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="text-gray-400 text-sm mb-2 block">Note (optionnel)</label>
            <input
              type="text"
              value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
              placeholder="Remarques, aliments suspects..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:border-orange-500 outline-none"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={handleSubmit} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition">
              Enregistrer
            </button>
            <button onClick={() => setShowForm(false)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold px-6 py-3 rounded-xl transition">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="text-center text-gray-500 py-12">Chargement...</div>
      ) : groupes.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          <span className="text-4xl mb-4 block">🥗</span>
          <h3 className="text-xl font-bold text-gray-200 mb-2">Aucun repas enregistré</h3>
          <p className="text-gray-500">Clique sur "+ Ajouter un repas" pour commencer.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groupes.map(([date, repasJour]) => {
            const badge = getBadgeJour(repasJour)
            const ouvert = joursOuverts[date]
            return (
              <div key={date} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setJoursOuverts(prev => ({ ...prev, [date]: !prev[date] }))}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-800 transition"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">📅</span>
                    <div className="text-left">
                      <p className="font-bold text-white capitalize">{formatDate(date)}</p>
                      <p className="text-gray-500 text-sm">{repasJour.length} repas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-3 py-1 rounded-full border ${badge.classe}`}>{badge.label}</span>
                    <span className="text-gray-500">{ouvert ? '▲' : '▼'}</span>
                  </div>
                </button>

                {ouvert && (
                  <div className="border-t border-gray-800">
                    {repasJour.map(r => {
                      const reaction = getReactionInfo(r.reaction)
                      const moment = MOMENTS.find(m => m.label === r.moment)
                      return (
                        <div key={r.id} className="px-6 py-4 border-b border-gray-800/50 last:border-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{moment?.emoji || '🍽️'}</span>
                                <span className="font-semibold text-white">{r.moment}</span>
                                <span className={`text-xs font-medium ${reaction.couleur}`}>
                                  {reaction.emoji} {r.reaction}
                                </span>
                              </div>
                              <p className="text-gray-400 text-sm">{r.aliments}</p>
                              {r.note && <p className="text-gray-600 text-xs mt-1">📝 {r.note}</p>}
                            </div>
                            <button
                              onClick={() => handleDelete(r.id)}
                              className="text-gray-600 hover:text-red-400 text-xs transition ml-4"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Repas