import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const MOMENTS = [
  { label: 'Petit-déjeuner', emoji: '🌅' },
  { label: 'Déjeuner', emoji: '☀️' },
  { label: 'Dîner', emoji: '🌙' },
  { label: 'Collation', emoji: '🍎' },
]

const REACTIONS = [
  { label: 'Aucune réaction', emoji: '✅', couleur: 'text-emerald-500', classe: 'border-emerald-200 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20' },
  { label: 'Légère gêne', emoji: '😐', couleur: 'text-amber-500', classe: 'border-amber-200 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/20' },
  { label: 'Douleurs', emoji: '😣', couleur: 'text-orange-500', classe: 'border-orange-200 dark:border-orange-500/40 bg-orange-50 dark:bg-orange-950/20' },
  { label: 'Forte réaction', emoji: '🚨', couleur: 'text-red-500', classe: 'border-red-200 dark:border-red-500/40 bg-red-50 dark:bg-red-950/20' },
]

function Repas() {
  const [repas, setRepas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ date: '', moment: '', aliments: '', reaction: '', note: '' })
  const [joursOuverts, setJoursOuverts] = useState({})

  useEffect(() => { fetchRepas() }, [])

  const fetchRepas = async () => {
    setLoading(true)
    const { data } = await supabase.from('repas').select('*').order('date', { ascending: false })
    if (data) {
      setRepas(data)
      if (data.length > 0) setJoursOuverts({ [data[0].date]: true })
    }
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!form.date || !form.moment || !form.aliments) return
    const { data: { user } } = await supabase.auth.getUser()
    if (editId) {
      await supabase.from('repas').update({ ...form, user_id: user.id }).eq('id', editId)
      setEditId(null)
    } else {
      await supabase.from('repas').insert([{ ...form, user_id: user.id }])
    }
    setForm({ date: '', moment: '', aliments: '', reaction: '', note: '' })
    setShowForm(false)
    fetchRepas()
  }

  const handleEdit = (r) => {
    setForm({ date: r.date, moment: r.moment, aliments: r.aliments, reaction: r.reaction || '', note: r.note || '' })
    setEditId(r.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce repas ?')) {
      await supabase.from('repas').delete().eq('id', id)
      fetchRepas()
    }
  }

  const groupParDate = (data) => {
    const groupes = {}
    data.forEach(r => { if (!groupes[r.date]) groupes[r.date] = []; groupes[r.date].push(r) })
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
    if (max >= 3) return { label: '🚨 Forte réaction', classe: 'bg-red-50 dark:bg-red-500/20 text-red-500 border-red-200 dark:border-red-500/30' }
    if (max === 2) return { label: '😣 Douleurs', classe: 'bg-orange-50 dark:bg-orange-500/20 text-orange-500 border-orange-200 dark:border-orange-500/30' }
    if (max === 1) return { label: '😐 Légère gêne', classe: 'bg-amber-50 dark:bg-amber-500/20 text-amber-500 border-amber-200 dark:border-amber-500/30' }
    return { label: '✅ Bonne journée', classe: 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' }
  }

  const groupes = groupParDate(repas)

  return (
    <div className="px-6 py-8">

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">🍽️ Journal alimentaire</h2>
          <p className="text-slate-500 dark:text-gray-400">Suis tes repas et identifie les aliments déclencheurs.</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ date: '', moment: '', aliments: '', reaction: '', note: '' }) }}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition"
        >
          + Ajouter un repas
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 mb-8 shadow-sm dark:shadow-none">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
            {editId ? '✏️ Modifier le repas' : '🍴 Nouveau repas'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Moment</label>
              <div className="flex gap-2">
                {MOMENTS.map(m => (
                  <button key={m.label} onClick={() => setForm({ ...form, moment: m.label })}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition border ${
                      form.moment === m.label
                        ? 'bg-orange-50 dark:bg-orange-500/20 border-orange-300 dark:border-orange-500/50 text-orange-600 dark:text-orange-400'
                        : 'bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-500'
                    }`}
                  >
                    {m.emoji}<br/><span className="text-xs">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Aliments consommés</label>
            <textarea value={form.aliments} onChange={e => setForm({ ...form, aliments: e.target.value })}
              placeholder="Ex: Riz blanc, poulet grillé, carottes cuites..." rows={3}
              className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:border-orange-500 outline-none resize-none" />
          </div>

          <div className="mb-4">
            <label className="text-slate-500 dark:text-gray-400 text-sm mb-3 block">Réaction après le repas</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {REACTIONS.map(r => (
                <button key={r.label} onClick={() => setForm({ ...form, reaction: r.label })}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition border ${
                    form.reaction === r.label ? r.classe : 'bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-500'
                  }`}
                >
                  <span className="text-xl block mb-1">{r.emoji}</span>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Note (optionnel)</label>
            <input type="text" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
              placeholder="Remarques, aliments suspects..."
              className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:border-orange-500 outline-none" />
          </div>

          <div className="flex gap-3">
            <button onClick={handleSubmit} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition">
              {editId ? 'Modifier' : 'Enregistrer'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 font-semibold px-6 py-3 rounded-xl transition">
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
          <span className="text-4xl mb-4 block">🥗</span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-gray-200 mb-2">Aucun repas enregistré</h3>
          <p className="text-slate-500 dark:text-gray-500">Clique sur "+ Ajouter un repas" pour commencer.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groupes.map(([date, repasJour]) => {
            const badge = getBadgeJour(repasJour)
            const ouvert = joursOuverts[date]
            return (
              <div key={date} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
                <button
                  onClick={() => setJoursOuverts(prev => ({ ...prev, [date]: !prev[date] }))}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-gray-800 transition"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">📅</span>
                    <div className="text-left">
                      <p className="font-bold text-slate-900 dark:text-white capitalize">{formatDate(date)}</p>
                      <p className="text-slate-400 dark:text-gray-500 text-sm">{repasJour.length} repas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-3 py-1 rounded-full border ${badge.classe}`}>{badge.label}</span>
                    <span className="text-slate-400 dark:text-gray-500">{ouvert ? '▲' : '▼'}</span>
                  </div>
                </button>

                {ouvert && (
                  <div className="border-t border-slate-100 dark:border-gray-800">
                    {repasJour.map(r => {
                      const reaction = getReactionInfo(r.reaction)
                      const moment = MOMENTS.find(m => m.label === r.moment)
                      return (
                        <div key={r.id} className="px-6 py-4 border-b border-slate-100 dark:border-gray-800/50 last:border-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{moment?.emoji || '🍽️'}</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{r.moment}</span>
                                <span className={`text-xs font-medium ${reaction.couleur}`}>
                                  {reaction.emoji} {r.reaction}
                                </span>
                              </div>
                              <p className="text-slate-500 dark:text-gray-400 text-sm">{r.aliments}</p>
                              {r.note && <p className="text-slate-400 dark:text-gray-600 text-xs mt-1">📝 {r.note}</p>}
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button onClick={() => handleEdit(r)}
                                className="text-slate-300 dark:text-gray-600 hover:text-sky-400 text-xs transition">✏️</button>
                              <button onClick={() => handleDelete(r.id)}
                                className="text-slate-300 dark:text-gray-600 hover:text-red-400 text-xs transition">🗑️</button>
                            </div>
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