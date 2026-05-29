import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const FREQUENCES = [
  'Une fois par jour',
  'Deux fois par jour',
  'Trois fois par jour',
  'Un jour sur deux',
  'Une fois toutes les 2 semaines',
  'Une fois par semaine',
  'Une fois par mois',
  'Selon les besoins',
]

function Medicaments() {
  const [medicaments, setMedicaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nom: '', dosage: '', frequence: '', heure_rappel: '', date_debut: '', note: '' })
  const [editId, setEditId] = useState(null)

  useEffect(() => { fetchMedicaments() }, [])

  const fetchMedicaments = async () => {
    setLoading(true)
    const { data } = await supabase.from('medicaments').select('*').order('nom', { ascending: true })
    if (data) setMedicaments(data)
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!form.nom || !form.dosage) return
    if (editId) {
      await supabase.from('medicaments').update(form).eq('id', editId)
      setEditId(null)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('medicaments').insert([{ ...form, user_id: user.id }])
    }
    setForm({ nom: '', dosage: '', frequence: '', heure_rappel: '', date_debut: '', note: '' })
    setShowForm(false)
    fetchMedicaments()
  }

  const handleEdit = (med) => {
    setForm({ nom: med.nom, dosage: med.dosage, frequence: med.frequence || '', heure_rappel: med.heure_rappel || '', date_debut: med.date_debut || '', note: med.note || '' })
    setEditId(med.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce médicament ?')) {
      await supabase.from('medicaments').delete().eq('id', id)
      fetchMedicaments()
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return null
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  return (
    <div className="px-6 py-8">

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">💊 Médicaments</h2>
          <p className="text-slate-500 dark:text-gray-400">Suis tes traitements en cours.</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ nom: '', dosage: '', frequence: '', heure_rappel: '', date_debut: '', note: '' }) }}
          className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-3 rounded-xl transition"
        >
          + Ajouter
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 mb-8 shadow-sm dark:shadow-none">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
            {editId ? '✏️ Modifier le médicament' : '💊 Nouveau médicament'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Nom du médicament</label>
              <input
                type="text"
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
                placeholder="Ex: Pentasa, Humira..."
                className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Dosage</label>
              <input
                type="text"
                value={form.dosage}
                onChange={e => setForm({ ...form, dosage: e.target.value })}
                placeholder="Ex: 500mg, 40mg/0.8mL..."
                className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Fréquence</label>
              <select
                value={form.frequence}
                onChange={e => setForm({ ...form, frequence: e.target.value })}
                className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 outline-none"
              >
                <option value="">-- Choisir --</option>
                {FREQUENCES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Heure de rappel</label>
              <input
                type="time"
                value={form.heure_rappel}
                onChange={e => setForm({ ...form, heure_rappel: e.target.value })}
                className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Date de début</label>
              <input
                type="date"
                value={form.date_debut}
                onChange={e => setForm({ ...form, date_debut: e.target.value })}
                className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Note (optionnel)</label>
              <input
                type="text"
                value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })}
                placeholder="Remarques, effets secondaires..."
                className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSubmit} className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-3 rounded-xl transition">
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
      ) : medicaments.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-8 text-center shadow-sm">
          <span className="text-4xl mb-4 block">💊</span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-gray-200 mb-2">Aucun médicament enregistré</h3>
          <p className="text-slate-500 dark:text-gray-500">Clique sur "+ Ajouter" pour commencer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {medicaments.map(med => (
            <div key={med.id} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm dark:shadow-none">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">💊</span>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{med.nom}</h3>
                    <p className="text-sky-600 dark:text-sky-400 font-semibold">{med.dosage}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(med)} className="bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 text-xs px-3 py-2 rounded-lg transition">✏️</button>
                  <button onClick={() => handleDelete(med.id)} className="bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-400 text-xs px-3 py-2 rounded-lg transition">🗑️</button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {med.frequence && <div className="flex items-center gap-2 text-sm"><span className="text-slate-400">🔄</span><span className="text-slate-600 dark:text-gray-300">{med.frequence}</span></div>}
                {med.heure_rappel && <div className="flex items-center gap-2 text-sm"><span className="text-slate-400">⏰</span><span className="text-slate-600 dark:text-gray-300">Rappel à {med.heure_rappel}</span></div>}
                {med.date_debut && <div className="flex items-center gap-2 text-sm"><span className="text-slate-400">📅</span><span className="text-slate-600 dark:text-gray-300">Depuis le {formatDate(med.date_debut)}</span></div>}
                {med.note && <div className="flex items-center gap-2 text-sm mt-1"><span className="text-slate-400">📝</span><span className="text-slate-500 dark:text-gray-400">{med.note}</span></div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Medicaments