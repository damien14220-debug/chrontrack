import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const SYMPTOMES_PREDEFINIES = [
  { label: 'Douleurs abdominales', emoji: '🤢' },
  { label: 'Diarrhée', emoji: '🚽' },
  { label: 'Fatigue', emoji: '😴' },
  { label: 'Nausées', emoji: '🤮' },
  { label: 'Ballonnements', emoji: '🫃' },
  { label: 'Sang dans les selles', emoji: '🔴' },
  { label: 'Fièvre', emoji: '🌡️' },
  { label: 'Perte d\'appétit', emoji: '🍽️' },
  { label: 'Douleurs articulaires', emoji: '🦴' },
  { label: 'Aphtes', emoji: '👄' },
]

const INTENSITES = [
  { valeur: 1, label: 'Très léger', couleur: 'text-green-400' },
  { valeur: 2, label: 'Léger', couleur: 'text-lime-400' },
  { valeur: 3, label: 'Modéré', couleur: 'text-yellow-400' },
  { valeur: 4, label: 'Intense', couleur: 'text-orange-400' },
  { valeur: 5, label: 'Très intense', couleur: 'text-red-400' },
]

function Symptomes() {
  const [symptomes, setSymptomes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState('')
  const [selections, setSelections] = useState({})
  const [autreSymptome, setAutreSymptome] = useState('')
  const [autreIntensite, setAutreIntensite] = useState(1)
  const [note, setNote] = useState('')
  const [joursOuverts, setJoursOuverts] = useState({})

  useEffect(() => { fetchSymptomes() }, [])

  const fetchSymptomes = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('symptomes')
      .select('*')
      .order('date', { ascending: false })
    if (data) {
      setSymptomes(data)
      if (data.length > 0) setJoursOuverts({ [data[0].date]: true })
    }
    setLoading(false)
  }

  const toggleSymptome = (label) => {
    setSelections(prev => {
      if (prev[label]) {
        const next = { ...prev }
        delete next[label]
        return next
      }
      return { ...prev, [label]: 3 }
    })
  }

  const setIntensite = (label, val) => {
    setSelections(prev => ({ ...prev, [label]: val }))
  }

  const handleSubmit = async () => {
    if (!date) return
    const lignes = []

    Object.entries(selections).forEach(([label, intensite]) => {
      lignes.push({ date, type: label, intensite, note })
    })

    if (autreSymptome) {
      lignes.push({ date, type: autreSymptome, intensite: autreIntensite, note })
    }

    if (lignes.length === 0) return

    await supabase.from('symptomes').insert(lignes)
    setSelections({})
    setAutreSymptome('')
    setAutreIntensite(1)
    setNote('')
    setDate('')
    setShowForm(false)
    fetchSymptomes()
  }

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce symptôme ?')) {
      await supabase.from('symptomes').delete().eq('id', id)
      fetchSymptomes()
    }
  }

  const groupParDate = (data) => {
    const groupes = {}
    data.forEach(s => {
      if (!groupes[s.date]) groupes[s.date] = []
      groupes[s.date].push(s)
    })
    return Object.entries(groupes).sort((a, b) => new Date(b[0]) - new Date(a[0]))
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const getIntensiteInfo = (val) => INTENSITES.find(i => i.valeur === val) || INTENSITES[2]

  const getBadgeJour = (symptomesJour) => {
    const maxIntensite = Math.max(...symptomesJour.map(s => s.intensite))
    if (maxIntensite >= 4) return { label: '🔴 Difficile', classe: 'bg-red-500/20 text-red-400 border-red-500/30' }
    if (maxIntensite === 3) return { label: '🟡 Modéré', classe: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
    return { label: '🟢 Léger', classe: 'bg-green-500/20 text-green-400 border-green-500/30' }
  }

  const groupes = groupParDate(symptomes)

  return (
    <div className="px-6 py-8">

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">🤒 Symptômes</h2>
          <p className="text-gray-400">Enregistre tes symptômes quotidiens.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-6 py-3 rounded-xl transition"
        >
          + Ajouter
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-bold text-white mb-6">📝 Nouveau rapport de symptômes</h3>

          <div className="mb-6">
            <label className="text-gray-400 text-sm mb-2 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white"
            />
          </div>

          <p className="text-gray-400 text-sm mb-3">Sélectionne tes symptômes et leur intensité :</p>
          <div className="flex flex-col gap-3 mb-6">
            {SYMPTOMES_PREDEFINIES.map(s => {
              const selectionne = selections[s.label] !== undefined
              return (
                <div key={s.label} className={`rounded-xl border transition ${selectionne ? 'border-yellow-500/40 bg-yellow-950/20' : 'border-gray-800 bg-gray-800/30'}`}>
                  <button
                    onClick={() => toggleSymptome(s.label)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  >
                    <span className="text-xl">{s.emoji}</span>
                    <span className={`font-medium ${selectionne ? 'text-yellow-400' : 'text-gray-400'}`}>{s.label}</span>
                    <span className="ml-auto text-gray-600">{selectionne ? '✓' : '+'}</span>
                  </button>

                  {selectionne && (
                    <div className="px-4 pb-4">
                      <p className="text-gray-500 text-xs mb-2">Intensité :</p>
                      <div className="flex gap-2">
                        {INTENSITES.map(i => (
                          <button
                            key={i.valeur}
                            onClick={() => setIntensite(s.label, i.valeur)}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition border ${
                              selections[s.label] === i.valeur
                                ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                                : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600'
                            }`}
                          >
                            {i.valeur} — {i.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Autre symptôme */}
            <div className="rounded-xl border border-gray-700 bg-gray-800/30 p-4">
              <p className="text-gray-500 text-sm mb-3">Autre symptôme :</p>
              <div className="flex gap-3 mb-3">
                <input
                  type="text"
                  value={autreSymptome}
                  onChange={e => setAutreSymptome(e.target.value)}
                  placeholder="Décris ton symptôme..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:border-yellow-500 outline-none"
                />
              </div>
              {autreSymptome && (
                <div className="flex gap-2">
                  {INTENSITES.map(i => (
                    <button
                      key={i.valeur}
                      onClick={() => setAutreIntensite(i.valeur)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition border ${
                        autreIntensite === i.valeur
                          ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                          : 'bg-gray-800 border-gray-700 text-gray-500'
                      }`}
                    >
                      {i.valeur} — {i.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="text-gray-400 text-sm mb-2 block">Note générale (optionnel)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Contexte, remarques..."
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:border-yellow-500 outline-none resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={handleSubmit} className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-6 py-3 rounded-xl transition">
              Enregistrer
            </button>
            <button onClick={() => { setShowForm(false); setSelections({}); setDate('') }} className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold px-6 py-3 rounded-xl transition">
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
          <span className="text-4xl mb-4 block">📝</span>
          <h3 className="text-xl font-bold text-gray-200 mb-2">Aucun symptôme enregistré</h3>
          <p className="text-gray-500">Clique sur "+ Ajouter" pour commencer.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groupes.map(([date, syms]) => {
            const badge = getBadgeJour(syms)
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
                      <p className="text-gray-500 text-sm">{syms.length} symptôme{syms.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-3 py-1 rounded-full border ${badge.classe}`}>{badge.label}</span>
                    <span className="text-gray-500">{ouvert ? '▲' : '▼'}</span>
                  </div>
                </button>

                {ouvert && (
                  <div className="border-t border-gray-800">
                    {syms.map(s => {
                      const info = getIntensiteInfo(s.intensite)
                      return (
                        <div key={s.id} className="flex items-center justify-between px-6 py-3 border-b border-gray-800/50 last:border-0">
                          <div>
                            <p className="font-medium text-white">{s.type}</p>
                            {s.note && <p className="text-gray-500 text-xs mt-0.5">{s.note}</p>}
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`text-sm font-semibold ${info.couleur}`}>
                              {s.intensite}/5 — {info.label}
                            </span>
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="text-gray-600 hover:text-red-400 text-xs transition"
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

export default Symptomes