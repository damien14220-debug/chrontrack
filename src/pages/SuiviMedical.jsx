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

// Cache local pour les fiches médicaments
const FICHES_CACHE_KEY = 'medicaments_fiches_cache'

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
  const [ficheOuverte, setFicheOuverte] = useState(null)
  const [ficheContenu, setFicheContenu] = useState(null)
  const [ficheLoading, setFicheLoading] = useState(false)
  const [fichesCache, setFichesCache] = useState(() => {
    const saved = localStorage.getItem(FICHES_CACHE_KEY)
    return saved ? JSON.parse(saved) : {}
  })

  const [formMed, setFormMed] = useState({
    nom: '', dosage: '', frequence: '', heure_rappel: '',
    date_debut: '', date_fin: '', note: ''
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

  const medsEnCours = medicaments.filter(m => !m.date_fin)
  const medsHistorique = medicaments.filter(m => m.date_fin)

  const handleSubmitMed = async () => {
    if (!formMed.nom || !formMed.dosage) return
    const { data: { user } } = await supabase.auth.getUser()
    if (editIdMed) {
      await supabase.from('medicaments').update(formMed).eq('id', editIdMed)
      setEditIdMed(null)
    } else {
      await supabase.from('medicaments').insert([{ ...formMed, user_id: user.id }])
    }
    setFormMed({ nom: '', dosage: '', frequence: '', heure_rappel: '', date_debut: '', date_fin: '', note: '' })
    setShowFormMed(false)
    fetchAll()
  }

  const handleEditMed = (med) => {
    setFormMed({
      nom: med.nom, dosage: med.dosage, frequence: med.frequence || '',
      heure_rappel: med.heure_rappel || '', date_debut: med.date_debut || '',
      date_fin: med.date_fin || '', note: med.note || ''
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

  // ===== FICHE MÉDICAMENT IA =====

  const ouvrirFiche = async (med) => {
    setFicheOuverte(med)
    setFicheContenu(null)

    // Vérifier le cache
    const cacheKey = med.nom.toLowerCase().trim()
    if (fichesCache[cacheKey]) {
      setFicheContenu(fichesCache[cacheKey])
      return
    }

    setFicheLoading(true)
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Génère une fiche médicament complète et claire pour : ${med.nom} (${med.dosage}).
            
La fiche doit contenir ces sections avec ce format exact :

🔵 QU'EST-CE QUE C'EST ?
[Explication simple de ce médicament, sa classe thérapeutique, comment il fonctionne]

💊 UTILISATION DANS LE CROHN
[Pourquoi ce médicament est utilisé dans la maladie de Crohn spécifiquement]

⚠️ EFFETS SECONDAIRES POSSIBLES
[Liste des effets secondaires les plus fréquents et ceux à surveiller absolument]

🚫 PRÉCAUTIONS IMPORTANTES
[Ce qu'il ne faut pas faire, interactions médicamenteuses importantes, contre-indications]

✅ CONSEILS PRATIQUES
[Comment bien prendre ce médicament, à quelle heure, avec ou sans repas, etc.]

📊 SURVEILLANCE MÉDICALE
[Analyses de sang ou examens à faire régulièrement pendant ce traitement]

Réponds de façon claire, en français, sans jargon médical excessif. Sois précis et utile.`
          }],
          contexte: '',
          memoire: ''
        })
      })
      const data = await response.json()
      const contenu = data.content?.[0]?.text || 'Impossible de générer la fiche.'

      // Sauvegarder dans le cache
      const nouveauCache = { ...fichesCache, [cacheKey]: contenu }
      setFichesCache(nouveauCache)
      localStorage.setItem(FICHES_CACHE_KEY, JSON.stringify(nouveauCache))
      setFicheContenu(contenu)
    } catch(e) {
      setFicheContenu('Erreur lors de la génération de la fiche.')
    }
    setFicheLoading(false)
  }

  const viderCacheFiche = (nom) => {
    const cacheKey = nom.toLowerCase().trim()
    const nouveauCache = { ...fichesCache }
    delete nouveauCache[cacheKey]
    setFichesCache(nouveauCache)
    localStorage.setItem(FICHES_CACHE_KEY, JSON.stringify(nouveauCache))
    setFicheContenu(null)
    if (ficheOuverte) ouvrirFiche(ficheOuverte)
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

  const renderMarkdown = (text) => text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*$)/gm, '• $1')

  const CardMed = ({ med, enCours }) => (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-2xl shrink-0">{enCours ? '💊' : '📋'}</span>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 dark:text-white truncate">{med.nom}</h3>
            <p className="text-sky-600 dark:text-sky-400 font-semibold text-sm">{med.dosage}</p>
          </div>
        </div>
        <div className="flex gap-1.5 shrink-0 ml-2">
          <button
            onClick={() => ouvrirFiche(med)}
            className="bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 text-purple-600 dark:text-purple-400 text-xs px-2.5 py-2 rounded-lg transition"
            title="Fiche médicament"
          >📖</button>
          <button onClick={() => handleEditMed(med)} className="bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 text-xs px-2.5 py-2 rounded-lg transition">✏️</button>
          <button onClick={() => handleDeleteMed(med.id)} className="bg-red-50 dark:bg-red-900/30 hover:bg-red-100 text-red-400 text-xs px-2.5 py-2 rounded-lg transition">🗑️</button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {med.frequence && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">🔄</span>
            <span className="text-slate-600 dark:text-gray-300 text-sm">{med.frequence}</span>
          </div>
        )}
        {med.heure_rappel && enCours && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${
            notifPermission === 'granted'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-gray-300'
          }`}>
            <span className="text-sm">🔔</span>
            <span className="font-medium text-sm">Rappel à {med.heure_rappel}</span>
          </div>
        )}
        {med.date_debut && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">📅</span>
            <span className="text-slate-600 dark:text-gray-300 text-sm">
              {enCours ? `Depuis le ${formatDate(med.date_debut)}` : `Du ${formatDate(med.date_debut)} au ${formatDate(med.date_fin)}`}
            </span>
          </div>
        )}
        {med.note && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-slate-400 text-sm">📝</span>
            <span className="text-slate-500 dark:text-gray-400 text-sm">{med.note}</span>
          </div>
        )}
      </div>
    </div>
  )

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
              setFormMed({ nom: '', dosage: '', frequence: '', heure_rappel: '', date_debut: '', date_fin: '', note: '' })
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
          {showFormEv && (
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 mb-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5">
                {editIdEv ? '✏️ Modifier l\'événement' : '🏥 Nouvel événement médical'}
              </h3>

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

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Date de début</label>
                  <input type="date" value={formEv.date_debut} onChange={e => setFormEv({ ...formEv, date_debut: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 outline-none" />
                </div>
                <div>
                  <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Date de fin (optionnel)</label>
                  <input type="date" value={formEv.date_fin} onChange={e => setFormEv({ ...formEv, date_fin: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 outline-none" />
                </div>
              </div>

              <div className="mb-4">
                <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Description / Contexte</label>
                <textarea value={formEv.description} onChange={e => setFormEv({ ...formEv, description: e.target.value })}
                  placeholder="Ex: Hospitalisation suite à une poussée sévère..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:border-sky-500 outline-none resize-none" />
              </div>

              <div className="mb-5">
                <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Résultats / Conclusions</label>
                <textarea value={formEv.resultats} onChange={e => setFormEv({ ...formEv, resultats: e.target.value })}
                  placeholder="Ex: Ulcère de 7mm détecté en iléon terminal, score SES-CD = 6..."
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:border-sky-500 outline-none resize-none" />
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
          {/* Notifications */}
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
                  <button onClick={demanderPermissionNotif} className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-xl transition text-sm">Activer</button>
                )}
                {notifPermission === 'granted' && (
                  <button onClick={testerNotification} className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-xl transition text-sm">🔔 Tester</button>
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
                    placeholder="Ex: Pentasa, Humira, Amoxicilline..."
                    className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 outline-none" />
                </div>
                <div>
                  <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Dosage / Posologie</label>
                  <input type="text" value={formMed.dosage} onChange={e => setFormMed({ ...formMed, dosage: e.target.value })}
                    placeholder="Ex: 500mg 3x/jour..."
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
                  <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Date de fin <span className="text-slate-400">(laisser vide si en cours)</span></label>
                  <input type="date" value={formMed.date_fin} onChange={e => setFormMed({ ...formMed, date_fin: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Note</label>
                  <input type="text" value={formMed.note} onChange={e => setFormMed({ ...formMed, note: e.target.value })}
                    placeholder="Effets secondaires ressentis, remarques..."
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

          {/* ===== TRAITEMENTS EN COURS ===== */}
          <div className="mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Traitements en cours
              <span className="text-xs text-slate-400 dark:text-gray-500 font-normal">({medsEnCours.length})</span>
            </h3>
            {medsEnCours.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 text-center">
                <p className="text-slate-400 dark:text-gray-500 text-sm">Aucun traitement en cours.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {medsEnCours.map(med => <CardMed key={med.id} med={med} enCours={true} />)}
              </div>
            )}
          </div>

          {/* ===== HISTORIQUE DES TRAITEMENTS ===== */}
          {medsHistorique.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                Historique des traitements
                <span className="text-xs text-slate-400 dark:text-gray-500 font-normal">({medsHistorique.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {medsHistorique.map(med => <CardMed key={med.id} med={med} enCours={false} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== MODAL FICHE MÉDICAMENT ===== */}
      {ficheOuverte && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setFicheOuverte(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 w-full md:max-w-2xl md:rounded-2xl rounded-t-3xl max-h-[92vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Poignée mobile */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1 bg-slate-200 dark:bg-gray-700 rounded-full"></div>
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-gray-800">
              <span className="text-3xl">💊</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 dark:text-gray-500 uppercase tracking-wide">Fiche médicament</p>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">{ficheOuverte.nom}</h3>
                <p className="text-sky-500 text-sm">{ficheOuverte.dosage}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => viderCacheFiche(ficheOuverte.nom)}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition"
                  title="Régénérer la fiche"
                >🔄</button>
                <button
                  onClick={() => setFicheOuverte(null)}
                  className="text-slate-400 dark:text-gray-600 hover:text-slate-600 dark:hover:text-gray-400 text-2xl leading-none p-1"
                >✕</button>
              </div>
            </div>

            {/* Contenu */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {ficheLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <p className="text-slate-400 dark:text-gray-500 text-sm">Génération de la fiche en cours...</p>
                </div>
              ) : ficheContenu ? (
                <>
                  <p
                    className="text-slate-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-4"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(ficheContenu) }}
                  />
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3">
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      ⚠️ Ces informations sont générées par IA à titre informatif. Elles ne remplacent pas l'avis de ton médecin ou pharmacien. En cas de doute, consulte un professionnel de santé.
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default SuiviMedical