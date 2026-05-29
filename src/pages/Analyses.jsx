import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const DESCRIPTIONS = {
  'CRP': {
    description: 'Protéine C-réactive — marqueur principal d\'inflammation.',
    trop_haut: '⚠️ CRP élevée : signe d\'une inflammation active, souvent liée à une poussée de Crohn.',
    trop_bas: '✅ CRP basse : pas de signe d\'inflammation significative.'
  },
  'Ferritine': {
    description: 'Réserves en fer de l\'organisme.',
    trop_haut: '⚠️ Ferritine élevée : peut indiquer une inflammation ou une surcharge en fer.',
    trop_bas: '⚠️ Ferritine basse : carence en fer, fréquente dans le Crohn. Fatigue et essoufflement possibles.'
  },
  'Hémoglobine': {
    description: 'Protéine des globules rouges transportant l\'oxygène.',
    trop_haut: '⚠️ Hémoglobine élevée : peut indiquer une déshydratation.',
    trop_bas: '⚠️ Hémoglobine basse : anémie. Très fréquente dans le Crohn. Provoque fatigue intense et essoufflement.'
  },
  'VGM': {
    description: 'Volume Globulaire Moyen — taille des globules rouges.',
    trop_haut: '⚠️ VGM élevé : globules rouges trop grands, souvent liés à une carence en B12 ou acide folique.',
    trop_bas: '⚠️ VGM bas : globules rouges trop petits, signe typique d\'une carence en fer.'
  },
  'Lymphocytes': {
    description: 'Globules blancs du système immunitaire.',
    trop_haut: '⚠️ Lymphocytes élevés : peut indiquer une infection virale ou réaction immunitaire.',
    trop_bas: '⚠️ Lymphocytes bas : effet secondaire possible des immunosuppresseurs. À surveiller.'
  },
  'Plaquettes': {
    description: 'Cellules de coagulation sanguine.',
    trop_haut: '⚠️ Plaquettes élevées : souvent signe d\'inflammation active dans le Crohn.',
    trop_bas: '⚠️ Plaquettes basses : risque de saignements. Peut être lié à certains médicaments.'
  },
  'Leucocytes': {
    description: 'Globules blancs — défenses immunitaires.',
    trop_haut: '⚠️ Leucocytes élevés : signe d\'infection ou d\'inflammation active.',
    trop_bas: '⚠️ Leucocytes bas : risque d\'infection augmenté. Signaler à ton médecin rapidement.'
  },
  'Créatinine': {
    description: 'Déchet musculaire éliminé par les reins.',
    trop_haut: '⚠️ Créatinine élevée : signe d\'insuffisance rénale ou déshydratation.',
    trop_bas: '✅ Créatinine basse : généralement sans signification clinique.'
  },
  'Fer sérique': {
    description: 'Taux de fer circulant dans le sang.',
    trop_haut: '⚠️ Fer sérique élevé : peut indiquer une surcharge en fer.',
    trop_bas: '⚠️ Fer sérique bas : carence en fer, fréquente dans le Crohn.'
  },
  'Transferrine': {
    description: 'Protéine transportant le fer dans le sang.',
    trop_haut: '⚠️ Transferrine élevée : signe que l\'organisme cherche plus de fer.',
    trop_bas: '⚠️ Transferrine basse : peut indiquer une dénutrition ou inflammation chronique.'
  },
  'Coeff. saturation transferrine': {
    description: 'Pourcentage de transferrine chargée en fer.',
    trop_haut: '⚠️ Coefficient élevé : risque de surcharge en fer.',
    trop_bas: '⚠️ Coefficient bas : carence en fer fonctionnelle.'
  },
  'Vitamine B12': {
    description: 'Vitamine essentielle absorbée dans l\'iléon terminal.',
    trop_haut: '✅ Vitamine B12 élevée : généralement sans danger.',
    trop_bas: '⚠️ Vitamine B12 basse : très fréquente si l\'iléon terminal est atteint. Supplémentation nécessaire.'
  },
  'Vitamine D': {
    description: 'Vitamine importante pour les os et l\'immunité.',
    trop_haut: '⚠️ Vitamine D très élevée : risque de toxicité en cas de supplémentation excessive.',
    trop_bas: '⚠️ Vitamine D basse : très fréquente dans les MICI. Fragilise les os et affaiblit l\'immunité.'
  },
  'Albumine': {
    description: 'Principale protéine du sang, marqueur de nutrition.',
    trop_haut: '✅ Albumine élevée : généralement sans signification.',
    trop_bas: '⚠️ Albumine basse : signe de dénutrition ou d\'inflammation sévère.'
  },
  'Calprotectine fécale': {
    description: 'Marqueur d\'inflammation intestinale dans les selles.',
    trop_haut: '⚠️ Calprotectine élevée : inflammation intestinale active très probable. Marqueur spécifique des poussées.',
    trop_bas: '✅ Calprotectine basse : pas d\'inflammation intestinale significative détectée.'
  },
  'VS': {
    description: 'Vitesse de sédimentation — marqueur général d\'inflammation.',
    trop_haut: '⚠️ VS élevée : inflammation présente. Moins spécifique que la CRP.',
    trop_bas: '✅ VS normale : pas d\'inflammation majeure détectée.'
  },
  'Acide folique': {
    description: 'Vitamine B9 — essentielle pour la production des globules rouges.',
    trop_haut: '✅ Acide folique élevé : généralement sans danger.',
    trop_bas: '⚠️ Acide folique bas : carence fréquente avec le méthotrexate ou malabsorption.'
  },
  'Zinc': {
    description: 'Oligo-élément essentiel pour l\'immunité et la cicatrisation.',
    trop_haut: '⚠️ Zinc élevé : rare, peut indiquer une supplémentation excessive.',
    trop_bas: '⚠️ Zinc bas : fréquent dans le Crohn. Affaiblit l\'immunité et ralentit la cicatrisation.'
  },
}

function groupParDate(analyses) {
  const groupes = {}
  analyses.forEach(a => {
    if (!groupes[a.date]) groupes[a.date] = []
    groupes[a.date].push(a)
  })
  return Object.entries(groupes).sort((a, b) => new Date(b[0]) - new Date(a[0]))
}

function Analyses() {
  const [analyses, setAnalyses] = useState([])
  const [parametres, setParametres] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState('')
  const [valeurs, setValeurs] = useState({})
  const [autreNom, setAutreNom] = useState('')
  const [autreValeur, setAutreValeur] = useState('')
  const [autreUnite, setAutreUnite] = useState('')
  const [bilansOuverts, setBilansOuverts] = useState({})
  const [editAnalyse, setEditAnalyse] = useState(null)
  const [editValeur, setEditValeur] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: analysesData }, { data: paramsData }] = await Promise.all([
      supabase.from('analyses').select('*').order('date', { ascending: false }),
      supabase.from('parametres_analyses').select('*')
    ])
    if (analysesData) {
      setAnalyses(analysesData)
      if (analysesData.length > 0) setBilansOuverts({ [analysesData[0].date]: true })
    }
    if (paramsData) setParametres(paramsData)
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!date) return
    const lignes = []
    parametres.forEach(p => {
      if (valeurs[p.type] !== undefined && valeurs[p.type] !== '') {
        lignes.push({
          date, type: p.type, valeur: parseFloat(valeurs[p.type]),
          unite: p.unite, normal_min: p.normal_min, normal_max: p.normal_max, note: ''
        })
      }
    })
    if (autreNom && autreValeur) {
      lignes.push({ date, type: autreNom, valeur: parseFloat(autreValeur), unite: autreUnite, normal_min: null, normal_max: null, note: '' })
    }
    if (lignes.length === 0) return
    const { data: { user } } = await supabase.auth.getUser()
    lignes.forEach(l => l.user_id = user.id)
    await supabase.from('analyses').insert(lignes)
    setValeurs({})
    setAutreNom('')
    setAutreValeur('')
    setAutreUnite('')
    setDate('')
    setShowForm(false)
    fetchAll()
  }

  const handleEdit = (analyse) => {
    setEditAnalyse(analyse)
    setEditValeur(String(analyse.valeur))
    setShowEditModal(true)
  }

  const handleEditSubmit = async () => {
    if (!editValeur) return
    await supabase
      .from('analyses')
      .update({ valeur: parseFloat(editValeur) })
      .eq('id', editAnalyse.id)
    setShowEditModal(false)
    setEditAnalyse(null)
    fetchAll()
  }

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette analyse ?')) {
      await supabase.from('analyses').delete().eq('id', id)
      fetchAll()
    }
  }

  const isAnormal = (valeur, min, max) => {
    if (min === null || max === null) return false
    return valeur < min || valeur > max
  }

  const getExplication = (type, valeur, min, max) => {
    const info = DESCRIPTIONS[type]
    if (!info) return null
    if (valeur > max) return info.trop_haut
    if (valeur < min) return info.trop_bas
    return null
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const groupes = groupParDate(analyses)

  return (
    <div className="px-6 py-8">

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">📊 Analyses sanguines</h2>
          <p className="text-slate-500 dark:text-gray-400">Enregistre et suis tes bilans dans le temps.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl transition"
        >
          + Nouveau bilan
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 mb-8 shadow-sm dark:shadow-none">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">🔬 Nouveau bilan sanguin</h3>
          <div className="mb-6">
            <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Date du bilan</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white"
            />
          </div>
          {parametres.length === 0 ? (
            <div className="text-center text-slate-500 dark:text-gray-500 py-8">
              <p>⚙️ Aucun paramètre configuré.</p>
              <p className="text-sm mt-1">Va dans <strong>Paramètres</strong> pour configurer tes analyses.</p>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-gray-800 mb-6">
              <div className="grid grid-cols-4 bg-slate-50 dark:bg-gray-800 px-4 py-3 text-xs text-slate-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                <span>Analyse</span>
                <span>Valeur</span>
                <span>Unité</span>
                <span>Plage normale</span>
              </div>
              {parametres.map((p, i) => (
                <div key={p.type} className={`grid grid-cols-4 items-center px-4 py-3 ${i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-slate-50/50 dark:bg-gray-900/50'}`}>
                  <div>
                    <span className="font-medium text-slate-900 dark:text-white text-sm">{p.type}</span>
                    {DESCRIPTIONS[p.type] && (
                      <p className="text-slate-400 dark:text-gray-600 text-xs mt-0.5">{DESCRIPTIONS[p.type].description}</p>
                    )}
                  </div>
                  <input
                    type="number"
                    value={valeurs[p.type] || ''}
                    onChange={e => setValeurs({ ...valeurs, [p.type]: e.target.value })}
                    placeholder="—"
                    className="w-24 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-emerald-500 outline-none"
                  />
                  <span className="text-slate-400 dark:text-gray-500 text-sm">{p.unite}</span>
                  <span className="text-slate-400 dark:text-gray-600 text-xs">{p.normal_min} — {p.normal_max}</span>
                </div>
              ))}
              <div className="grid grid-cols-4 items-center px-4 py-3 bg-slate-50 dark:bg-gray-800/30 border-t border-slate-200 dark:border-gray-700 gap-2">
                <input type="text" value={autreNom} onChange={e => setAutreNom(e.target.value)} placeholder="Autre analyse..." className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-emerald-500 outline-none" />
                <input type="number" value={autreValeur} onChange={e => setAutreValeur(e.target.value)} placeholder="—" className="w-24 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-emerald-500 outline-none" />
                <input type="text" value={autreUnite} onChange={e => setAutreUnite(e.target.value)} placeholder="unité" className="w-20 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-emerald-500 outline-none" />
                <span className="text-slate-400 dark:text-gray-600 text-xs">personnalisé</span>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl transition">
              Enregistrer le bilan
            </button>
            <button onClick={() => { setShowForm(false); setValeurs({}); setDate('') }} className="bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 font-semibold px-6 py-3 rounded-xl transition">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Bilans */}
      {loading ? (
        <div className="text-center text-slate-500 dark:text-gray-500 py-12">Chargement...</div>
      ) : groupes.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-8 text-center shadow-sm">
          <span className="text-4xl mb-4 block">🔬</span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-gray-200 mb-2">Aucun bilan enregistré</h3>
          <p className="text-slate-500 dark:text-gray-500">Clique sur "+ Nouveau bilan" pour commencer.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groupes.map(([dateBilan, valeursBilan]) => {
            const nbAnormaux = valeursBilan.filter(v => isAnormal(v.valeur, v.normal_min, v.normal_max)).length
            const ouvert = bilansOuverts[dateBilan]
            return (
              <div key={dateBilan} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
                <button
                  onClick={() => setBilansOuverts(prev => ({ ...prev, [dateBilan]: !prev[dateBilan] }))}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-gray-800 transition"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">🗓️</span>
                    <div className="text-left">
                      <p className="font-bold text-slate-900 dark:text-white capitalize">{formatDate(dateBilan)}</p>
                      <p className="text-slate-400 dark:text-gray-500 text-sm">{valeursBilan.length} valeur{valeursBilan.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {nbAnormaux > 0 ? (
                      <span className="bg-red-50 dark:bg-red-500/20 text-red-500 text-xs px-3 py-1 rounded-full border border-red-200 dark:border-red-500/30">
                        ⚠️ {nbAnormaux} anormal{nbAnormaux > 1 ? 'aux' : ''}
                      </span>
                    ) : (
                      <span className="bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                        ✅ Tout normal
                      </span>
                    )}
                    <span className="text-slate-400 dark:text-gray-500">{ouvert ? '▲' : '▼'}</span>
                  </div>
                </button>

                {ouvert && (
                  <div className="border-t border-slate-100 dark:border-gray-800">
                    <div className="grid grid-cols-4 bg-slate-50 dark:bg-gray-800/50 px-6 py-2 text-xs text-slate-400 dark:text-gray-500 font-semibold uppercase tracking-wider">
                      <span>Analyse</span>
                      <span>Valeur</span>
                      <span>Unité</span>
                      <span>Statut</span>
                    </div>
                    {valeursBilan.map(analyse => {
                      const anormal = isAnormal(analyse.valeur, analyse.normal_min, analyse.normal_max)
                      const explication = getExplication(analyse.type, analyse.valeur, analyse.normal_min, analyse.normal_max)
                      return (
                        <div key={analyse.id} className={`border-b border-slate-100 dark:border-gray-800/50 last:border-0 ${anormal ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}>
                          <div className="grid grid-cols-4 items-center px-6 py-3">
                            <div>
                              <span className="font-medium text-slate-900 dark:text-white text-sm">{analyse.type}</span>
                              {DESCRIPTIONS[analyse.type] && (
                                <p className="text-slate-400 dark:text-gray-600 text-xs mt-0.5">{DESCRIPTIONS[analyse.type].description}</p>
                              )}
                            </div>
                            <span className={`font-bold text-lg ${anormal ? 'text-red-500' : 'text-emerald-500'}`}>
                              {analyse.valeur}
                            </span>
                            <span className="text-slate-400 dark:text-gray-500 text-sm">{analyse.unite}</span>
                            <div className="flex items-center gap-3">
                              {anormal ? (
                                <span className="text-red-500 text-xs">⚠️ Anormal</span>
                              ) : (
                                <span className="text-emerald-500 text-xs">✅ Normal</span>
                              )}
                              <button onClick={() => handleEdit(analyse)} className="text-slate-300 dark:text-gray-600 hover:text-sky-400 text-xs transition">✏️</button>
                              <button onClick={() => handleDelete(analyse.id)} className="text-slate-300 dark:text-gray-600 hover:text-red-400 text-xs transition">🗑️</button>
                            </div>
                          </div>
                          {anormal && explication && (
                            <div className="mx-6 mb-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3">
                              <p className="text-red-600 dark:text-red-300 text-xs leading-relaxed">{explication}</p>
                            </div>
                          )}
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

      {/* Modal modification */}
      {showEditModal && editAnalyse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              ✏️ Modifier — {editAnalyse.type}
            </h3>
            <p className="text-slate-500 dark:text-gray-400 text-sm mb-4">
              Plage normale : {editAnalyse.normal_min} — {editAnalyse.normal_max} {editAnalyse.unite}
            </p>
            <div className="mb-6">
              <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Nouvelle valeur</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={editValeur}
                  onChange={e => setEditValeur(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-emerald-500 outline-none text-lg font-bold"
                  autoFocus
                />
                <span className="text-slate-400 dark:text-gray-500">{editAnalyse.unite}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleEditSubmit}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition"
              >
                Enregistrer
              </button>
              <button
                onClick={() => { setShowEditModal(false); setEditAnalyse(null) }}
                className="flex-1 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 font-semibold py-3 rounded-xl transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Analyses