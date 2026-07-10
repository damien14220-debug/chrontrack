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

const TYPES_EVENEMENTS = [
  { id: 'hospitalisation', label: 'Hospitalisation', emoji: '🏥' },
  { id: 'perfusion', label: 'Perfusion', emoji: '💉' },
  { id: 'coloscopie', label: 'Coloscopie / Endoscopie', emoji: '🔭' },
  { id: 'irm', label: 'IRM / Scanner', emoji: '🧲' },
  { id: 'consultation', label: 'Consultation', emoji: '👨‍⚕️' },
  { id: 'chirurgie', label: 'Chirurgie', emoji: '🔪' },
  { id: 'urgences', label: 'Urgences', emoji: '🚨' },
  { id: 'autre', label: 'Autre', emoji: '📋' },
]

function SuiviMedical() {
  const [onglet, setOnglet] = useState('evenements')
  const [medicaments, setMedicaments] = useState([])
  const [evenements, setEvenements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFormMed, setShowFormMed] = useState(false)
  const [showFormEv, setShowFormEv] = useState(false)
  const [notifPermission, setNotifPermission] = useState('default')
  const [editIdMed, setEditIdMed] = useState(null)
  const [editIdEv, setEditIdEv] = useState(null)

  const [formMed, setFormMed] = useState({
    nom: '', dosage: '', frequence: '', heure_rappel: '', date_debut: '', note: ''
  })

  const [formEv, setFormEv] = useState({
    type: '', titre: '', date_debut: '', date_fin: '', description: '', resultats: ''
  })

  useEffect(() => {
    fetchAll()
    if ('Notification' in window) setNotifPermission(Notification.permission)
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: meds }, { data: evs }] = await Promise.all([
      supabase.from('medicaments').select('*').order('nom', { ascending: true }),
      supabase.from('evenements_medicaux').select('*').order('date_debut', { ascending: false })
    ])
    if (meds) setMedicaments(meds)
    if (evs) setEvenements(evs)
    setLoading(false)
  }

  // ===== MÉDICAMENTS =====

  const handleSubmitMed = async () => {
    if (!formMed.nom || !formMed.dosage) return
    const { data: { user } } = await supabase.auth.getUser()
    if (editIdMed) {
      await supabase.from('medicaments').update(formMed).eq('id', editIdMed)
      setEditIdMed(null)
    } else {
      await supabase.from('medicaments').insert([{ ...formMed, user_id: user.id }])
    }
    setFormMed({ nom: '', dosage: '', frequence: '', heure_rappel: '', date_debut: '', note: '' })
    setShowFormMed(false)
    fetchAll()
  }

  const handleEditMed = (med) => {
    setFormMed({
      nom: med.nom, dosage: med.dosage, frequence: med.frequence || '',
      heure_rappel: med.heure_rappel || '', date_debut: med.date_debut || '', note: med.note || ''
    })
    setEditIdMed(med.id)
    setShowFormMed(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteMed = async (id) => {
    if (window.confirm('Supprimer ce médicament ?')) {
      await supabase.from('medicaments').delete().eq('id', id)
      fetchAll()
    }
  }

  // ===== ÉVÉNEMENTS MÉDICAUX =====

  const handleSubmitEv = async () => {
    if (!formEv.type || !formEv.titre || !formEv.date_debut) return
    const { data: { user } } = await supabase.auth.getUser()
    if (editIdEv) {
      await supabase.from('evenements_medicaux').update(formEv).eq('id', editIdEv)
      setEditIdEv(null)
    } else {
      await supabase.from('evenements_medicaux').insert([{ ...formEv, user_id: user.id }])
    }
    setFormEv({ type: '', titre: '', date_debut: '', date_fin: '', description: '', resultats: '' })
    setShowFormEv(false)
    fetchAll()
  }

  const handleEditEv = (ev) => {
    setFormEv({
      type: ev.type, titre: ev.titre, date_debut: ev.date_debut || '',
      date_fin: ev.date_fin || '', description: ev.description || '', resultats: ev.resultats || ''
    })
    setEditIdEv(ev.id)
    setShowFormEv(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteEv = async (id) => {
    if (window.confirm('Supprimer cet événement ?')) {
      await supabase.from('evenements_medicaux').delete().eq('id', id)
      fetchAll()
    }
  }

  // ===== NOTIFICATIONS =====

  const demanderPermissionNotif = async () => {
    if (!('Notification' in window)) return
    const permission = await Notification.requestPermission()
    setNotifPermission(permission)
  }

  const testerNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('💊 Test CrohnTrack', {
        body: 'Les notifications médicaments sont activées !',
        icon: '/apple-touch-icon.png',
      })
    }
  }

  // ===== HELPERS =====

  const formatDate = (dateStr) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const getTypeEv = (type) => TYPES_EVENEMENTS.find(t => t.id === type) || TYPES_EVENEMENTS[7]

  if (loading) return (
    <div className="px-4 py-8 text-slate-500 dark:text-gray-500 text-center">Chargement...</div>
  )

  return (
    <div className="px-3 py-4 md:px-6 md:py-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1">🏥 Suivi Médical</h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm">Médicaments, hospitalisations, examens et événements.</p>
        </div>
        <button
          onClick={() => {
            if (onglet === 'medicaments') {
              setShowFormMed(!showFormMed)
              setEditIdMed(null)
              setFormMed({ nom: '', dosage: '', frequence: '', heure_rappel: '', date_debut: '', note: '' })
            } else {
              setShowFormEv(!showFormEv)
              setEditIdEv(null)
              setFormEv({ type: '', titre: '', date_debut: '', date_fin: '', description: '', resultats: '' })
            }
          }}
          className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-5 py-3 rounded-xl transition text-sm self-start sm:self-auto"
        >
          + Ajouter
        </button>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'evenements', label: '🏥 Événements', count: evenements.length },
          { id: 'medicaments', label: '💊 Médicaments', count: medicaments.length },
        ].map(o => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id)}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition border flex items-center gap-2 ${
              onglet === o.id
                ? 'bg-sky-50 dark:bg-sky-500/20 border-sky-300 dark:border-sky-500/50 text-sky-600 dark:text-sky-400'
                : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800 text-slate-500 dark:text-gray-400'
            }`}
          >
            {o.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              onglet === o.id ? 'bg-sky-100 dark:bg-sky-500/30' : 'bg-slate-100 dark:bg-gray-800'
            }`}>{o.count}</span>
          </button>
        ))}
      </div>

      {/* ===== ONGLET ÉVÉNEMENTS ===== */}
      {onglet === 'evenements' && (
        <>
          {/* Formulaire événement */}
          {showFormEv && (
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 mb-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5">
                {editIdEv ? '✏️ Modifier l\'événement' : '🏥 Nouvel événement médical'}
              </h3>

              {/* Type */}
              <div className="mb-4">
                <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Type d'événement</label>
                <div className="flex flex-wrap gap-2">
                  {TYPES_EVENEMENTS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setFormEv({ ...formEv, type: t.id })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition text-sm font-medium ${
                        formEv.type === t.id
                          ? 'bg-sky-50 dark:bg-sky-500/20 border-sky-300 dark:border-sky-500/50 text-sky-600 dark:text-sky-400'
                          : 'bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400'
                      }`}
                    >
                      {t.emoji} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Titre */}
              <div className="mb-4">
                <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Titre</label>
                <input
                  type="text"
                  value={formEv.titre}
                  onChange={e => setFormEv({ ...formEv, titre: e.target.value })}
                  placeholder="Ex: Hospitalisation CHU Caen, Perfusion fer Venofer..."
                  className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 outline-none"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Date de début</label>
                  <input
                    type="date"
                    value={formEv.date_debut}
                    onChange={e => setFormEv({ ...formEv, date_debut: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Date de fin (optionnel)</label>
                  <input
                    type="date"
                    value={formEv.date_fin}
                    onChange={e => setFormEv({ ...formEv, date_fin: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Description / Contexte</label>
                <textarea
                  value={formEv.description}
                  onChange={e => setFormEv({ ...formEv, description: e.target.value })}
                  placeholder="Ex: Hospitalisation suite à une poussée sévère, douleurs abdominales intenses, fièvre à 39°C..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:border-sky-500 outline-none resize-none"
                />
              </div>

              {/* Résultats */}
              <div className="mb-5">
                <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Résultats / Conclusions</label>
                <textarea
                  value={formEv.resultats}
                  onChange={e => setFormEv({ ...formEv, resultats: e.target.value })}
                  placeholder="Ex: Ulcère de 7mm détecté en iléon terminal, score SES-CD = 6, mise sous Vedolizumab..."
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:border-sky-500 outline-none resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={handleSubmitEv} className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-3 rounded-xl transition">
                  {editIdEv ? 'Modifier' : 'Enregistrer'}
                </button>
                <button onClick={() => { setShowFormEv(false); setEditIdEv(null) }} className="bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 font-semibold px-6 py-3 rounded-xl transition">
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Liste événements */}
          {evenements.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-8 text-center shadow-sm">
              <span className="text-4xl mb-4 block">🏥</span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-gray-200 mb-2">Aucun événement enregistré</h3>
              <p className="text-slate-500 dark:text-gray-500">Ajoute tes hospitalisations, perfusions, coloscopies...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {evenements.map(ev => {
                const type = getTypeEv(ev.type)
                return (
                  <div key={ev.id} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-4 md:p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="text-3xl shrink-0">{type.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/50">
                              {type.label}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">{ev.titre}</h3>
                          <p className="text-slate-400 dark:text-gray-500 text-xs mb-3">
                            📅 {formatDate(ev.date_debut)}
                            {ev.date_fin && ` → ${formatDate(ev.date_fin)}`}
                          </p>

                          {ev.description && (
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wide mb-1">Contexte</p>
                              <p className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{ev.description}</p>
                            </div>
                          )}

                          {ev.resultats && (
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3">
                              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">Résultats</p>
                              <p className="text-slate-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{ev.resultats}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        <button onClick={() => handleEditEv(ev)} className="bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 text-xs px-3 py-2 rounded-lg transition">✏️</button>
                        <button onClick={() => handleDeleteEv(ev.id)} className="bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-400 text-xs px-3 py-2 rounded-lg transition">🗑️</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ===== ONGLET MÉDICAMENTS ===== */}
      {onglet === 'medicaments' && (
        <>
          {/* Bloc notifications */}
          <div className={`rounded-2xl p-4 mb-5 border shadow-sm dark:shadow-none ${
            notifPermission === 'granted'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40'
              : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800'
          }`}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                  notifPermission === 'granted' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-gray-700'
                }`}>🔔</div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">Rappels médicaments</p>
                  <p className="text-slate-500 dark:text-gray-400 text-xs">
                    {notifPermission === 'granted' ? '✅ Notifications activées' : '⏳ Active les notifications pour les rappels'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {notifPermission !== 'granted' && notifPermission !== 'denied' && (
                  <button onClick={demanderPermissionNotif} className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-xl transition text-sm">
                    Activer
                  </button>
                )}
                {notifPermission === 'granted' && (
                  <button onClick={testerNotification} className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-xl transition text-sm">
                    🔔 Tester
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Formulaire médicament */}
          {showFormMed && (
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 mb-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5">
                {editIdMed ? '✏️ Modifier' : '💊 Nouveau médicament'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Nom</label>
                  <input type="text" value={formMed.nom} onChange={e => setFormMed({ ...formMed, nom: e.target.value })}
                    placeholder="Ex: Pentasa, Humira..."
                    className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 outline-none" />
                </div>
                <div>
                  <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Dosage</label>
                  <input type="text" value={formMed.dosage} onChange={e => setFormMed({ ...formMed, dosage: e.target.value })}
                    placeholder="Ex: 500mg..."
                    className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 outline-none" />
                </div>
                <div>
                  <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Fréquence</label>
                  <select value={formMed.frequence} onChange={e => setFormMed({ ...formMed, frequence: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 outline-none">
                    <option value="">-- Choisir --</option>
                    {FREQUENCES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Heure de rappel 🔔</label>
                  <input type="time" value={formMed.heure_rappel} onChange={e => setFormMed({ ...formMed, heure_rappel: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 outline-none" />
                </div>
                <div>
                  <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Date de début</label>
                  <input type="date" value={formMed.date_debut} onChange={e => setFormMed({ ...formMed, date_debut: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 outline-none" />
                </div>
                <div>
                  <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Note</label>
                  <input type="text" value={formMed.note} onChange={e => setFormMed({ ...formMed, note: e.target.value })}
                    placeholder="Effets secondaires, remarques..."
                    className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 outline-none" />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={handleSubmitMed} className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-3 rounded-xl transition">
                  {editIdMed ? 'Modifier' : 'Enregistrer'}
                </button>
                <button onClick={() => { setShowFormMed(false); setEditIdMed(null) }} className="bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 font-semibold px-6 py-3 rounded-xl transition">
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Liste médicaments */}
          {medicaments.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-8 text-center shadow-sm">
              <span className="text-4xl mb-4 block">💊</span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-gray-200 mb-2">Aucun médicament</h3>
              <p className="text-slate-500 dark:text-gray-500">Clique sur "+ Ajouter" pour commencer.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {medicaments.map(med => (
                <div key={med.id} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💊</span>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{med.nom}</h3>
                        <p className="text-sky-600 dark:text-sky-400 font-semibold text-sm">{med.dosage}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditMed(med)} className="bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 text-xs px-3 py-2 rounded-lg transition">✏️</button>
                      <button onClick={() => handleDeleteMed(med.id)} className="bg-red-50 dark:bg-red-900/30 hover:bg-red-100 text-red-400 text-xs px-3 py-2 rounded-lg transition">🗑️</button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {med.frequence && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">🔄</span>
                        <span className="text-slate-600 dark:text-gray-300 text-sm">{med.frequence}</span>
                      </div>
                    )}
                    {med.heure_rappel && (
                      <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-xl ${
                        notifPermission === 'granted'
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-gray-300'
                      }`}>
                        <span>🔔</span>
                        <span className="font-medium text-sm">Rappel à {med.heure_rappel}</span>
                      </div>
                    )}
                    {med.date_debut && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">📅</span>
                        <span className="text-slate-600 dark:text-gray-300 text-sm">Depuis le {formatDate(med.date_debut)}</span>
                      </div>
                    )}
                    {med.note && (
                      <div className="flex items-center gap-2 text-sm mt-1">
                        <span className="text-slate-400">📝</span>
                        <span className="text-slate-500 dark:text-gray-400 text-sm">{med.note}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default SuiviMedical