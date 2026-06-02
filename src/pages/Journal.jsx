import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const CATEGORIES = [
  { label: 'Observation', emoji: '🔍' },
  { label: 'Article', emoji: '📰' },
  { label: 'Note', emoji: '📝' },
  { label: 'Mémoire', emoji: '💭' },
  { label: 'Conseil', emoji: '💡' },
  { label: 'Humeur', emoji: '😊' },
]

function Journal() {
  const [entrees, setEntrees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ date: '', titre: '', contenu: '', categorie: '' })
  const [recherche, setRecherche] = useState('')
  const [categorieFiltre, setCategorieFiltre] = useState('')
  const [entreeOuverte, setEntreeOuverte] = useState(null)

  useEffect(() => { fetchEntrees() }, [])

  const fetchEntrees = async () => {
    setLoading(true)
    const { data } = await supabase.from('journal').select('*').order('date', { ascending: false })
    if (data) setEntrees(data)
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!form.date || !form.titre || !form.contenu) return
    const { data: { user } } = await supabase.auth.getUser()
    if (editId) {
      await supabase.from('journal').update({ ...form, user_id: user.id }).eq('id', editId)
      setEditId(null)
    } else {
      await supabase.from('journal').insert([{ ...form, user_id: user.id }])
    }
    setForm({ date: '', titre: '', contenu: '', categorie: '' })
    setShowForm(false)
    fetchEntrees()
  }

  const handleEdit = (entree) => {
    setForm({ date: entree.date, titre: entree.titre, contenu: entree.contenu, categorie: entree.categorie || '' })
    setEditId(entree.id)
    setShowForm(true)
    setEntreeOuverte(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette entrée ?')) {
      await supabase.from('journal').delete().eq('id', id)
      fetchEntrees()
    }
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const getCategorieInfo = (label) => CATEGORIES.find(c => c.label === label) || { emoji: '📝', label: 'Note' }

  const entreesFiltrees = entrees.filter(e => {
    const matchRecherche = recherche === '' ||
      e.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      e.contenu.toLowerCase().includes(recherche.toLowerCase())
    const matchCategorie = categorieFiltre === '' || e.categorie === categorieFiltre
    return matchRecherche && matchCategorie
  })

  return (
    <div className="px-6 py-8">

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">📓 Journal Personnel</h2>
          <p className="text-slate-500 dark:text-gray-400">Tes articles, observations, notes et mémoires.</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ date: '', titre: '', contenu: '', categorie: '' }) }}
          className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-xl transition"
        >
          + Nouvelle entrée
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 mb-8 shadow-sm dark:shadow-none">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
            {editId ? '✏️ Modifier l\'entrée' : '📝 Nouvelle entrée'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-purple-500 outline-none" />
            </div>
            <div>
              <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Titre</label>
              <input type="text" value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })}
                placeholder="Titre de ton entrée..."
                className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-purple-500 outline-none" />
            </div>
          </div>

          <div className="mb-4">
            <label className="text-slate-500 dark:text-gray-400 text-sm mb-3 block">Catégorie</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button key={c.label} onClick={() => setForm({ ...form, categorie: c.label })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition font-medium text-sm ${
                    form.categorie === c.label
                      ? 'bg-purple-50 dark:bg-purple-500/20 border-purple-300 dark:border-purple-500/50 text-purple-600 dark:text-purple-400'
                      : 'bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400'
                  }`}
                >
                  <span>{c.emoji}</span>{c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Contenu</label>
            <textarea value={form.contenu} onChange={e => setForm({ ...form, contenu: e.target.value })}
              placeholder="Écris ici ton article, observation, note..." rows={10}
              className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:border-purple-500 outline-none resize-none leading-relaxed" />
          </div>

          <div className="flex gap-3">
            <button onClick={handleSubmit} className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-xl transition">
              {editId ? 'Modifier' : 'Enregistrer'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 font-semibold px-6 py-3 rounded-xl transition">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Filtres */}
      {entrees.length > 0 && (
        <div className="flex flex-col gap-3 mb-6">
          <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
            placeholder="🔍 Rechercher dans le journal..."
            className="w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-purple-500 outline-none shadow-sm" />
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setCategorieFiltre('')}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                categorieFiltre === ''
                  ? 'bg-purple-50 dark:bg-purple-500/20 border-purple-300 dark:border-purple-500/50 text-purple-600 dark:text-purple-400'
                  : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800 text-slate-500 dark:text-gray-400'
              }`}
            >
              Tout
            </button>
            {CATEGORIES.map(c => (
              <button key={c.label} onClick={() => setCategorieFiltre(c.label)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                  categorieFiltre === c.label
                    ? 'bg-purple-50 dark:bg-purple-500/20 border-purple-300 dark:border-purple-500/50 text-purple-600 dark:text-purple-400'
                    : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800 text-slate-500 dark:text-gray-400'
                }`}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Liste — titre seulement, contenu sur clic */}
      {loading ? (
        <div className="text-center text-slate-500 dark:text-gray-500 py-12">Chargement...</div>
      ) : entreesFiltrees.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-8 text-center shadow-sm">
          <span className="text-4xl mb-4 block">📓</span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-gray-200 mb-2">
            {entrees.length === 0 ? 'Aucune entrée' : 'Aucun résultat'}
          </h3>
          <p className="text-slate-500 dark:text-gray-500">
            {entrees.length === 0 ? 'Clique sur "+ Nouvelle entrée" pour commencer.' : 'Essaie une autre recherche.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entreesFiltrees.map(entree => {
            const cat = getCategorieInfo(entree.categorie)
            const ouverte = entreeOuverte === entree.id
            const nbMots = entree.contenu.split(' ').length
            const tempsLecture = Math.max(1, Math.round(nbMots / 200))
            return (
              <div key={entree.id} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">

                {/* En-tête — toujours visible */}
                <div className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl mt-0.5">{cat.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-slate-900 dark:text-white">{entree.titre}</h3>
                          {entree.categorie && (
                            <span className="bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-500/30">
                              {entree.categorie}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-gray-500">
                          <span className="capitalize">{formatDate(entree.date)}</span>
                          <span>·</span>
                          <span>{nbMots} mots</span>
                          <span>·</span>
                          <span>{tempsLecture} min de lecture</span>
                        </div>
                        {/* Aperçu du contenu — 1 ligne */}
                        {!ouverte && (
                          <p className="text-slate-400 dark:text-gray-500 text-sm mt-2 line-clamp-1">
                            {entree.contenu}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => handleEdit(entree)}
                        className="text-slate-300 dark:text-gray-600 hover:text-sky-400 transition text-sm p-1">✏️</button>
                      <button onClick={() => handleDelete(entree.id)}
                        className="text-slate-300 dark:text-gray-600 hover:text-red-400 transition text-sm p-1">🗑️</button>
                      <button
                        onClick={() => setEntreeOuverte(ouverte ? null : entree.id)}
                        className="text-slate-400 dark:text-gray-500 hover:text-purple-500 transition text-sm px-3 py-1 rounded-lg border border-slate-200 dark:border-gray-700 hover:border-purple-300"
                      >
                        {ouverte ? 'Fermer ▲' : 'Lire ▼'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Contenu — visible seulement si ouvert */}
                {ouverte && (
                  <div className="border-t border-slate-100 dark:border-gray-800 px-6 py-5">
                    <p className="text-slate-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {entree.contenu}
                    </p>
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

export default Journal