import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const ANALYSES_DEFAULT = [
  { type: 'CRP', unite: 'mg/L', normal_min: 0, normal_max: 5, description: 'Protéine C-réactive — marqueur d\'inflammation. Élevée lors des poussées de Crohn.' },
  { type: 'Ferritine', unite: 'µg/L', normal_min: 20, normal_max: 200, description: 'Réserves en fer de l\'organisme. Souvent basse en cas de Crohn actif ou de saignements.' },
  { type: 'Hémoglobine', unite: 'g/dL', normal_min: 12, normal_max: 17, description: 'Protéine des globules rouges transportant l\'oxygène. Une valeur basse indique une anémie.' },
  { type: 'VGM', unite: 'fL', normal_min: 80, normal_max: 100, description: 'Volume Globulaire Moyen — taille des globules rouges. Utile pour identifier le type d\'anémie.' },
  { type: 'Lymphocytes', unite: 'G/L', normal_min: 1, normal_max: 4, description: 'Globules blancs du système immunitaire. Peuvent être affectés par certains traitements.' },
  { type: 'Plaquettes', unite: 'G/L', normal_min: 150, normal_max: 400, description: 'Cellules de coagulation sanguine. Souvent élevées lors d\'une inflammation active.' },
  { type: 'Leucocytes', unite: 'G/L', normal_min: 4, normal_max: 10, description: 'Globules blancs — défenses immunitaires. Élevés en cas d\'infection ou inflammation.' },
  { type: 'Créatinine', unite: 'µmol/L', normal_min: 50, normal_max: 110, description: 'Déchet musculaire éliminé par les reins. Permet de surveiller la fonction rénale.' },
  { type: 'Fer sérique', unite: 'µmol/L', normal_min: 10, normal_max: 30, description: 'Taux de fer circulant dans le sang. Bas en cas de carence martiale fréquente dans le Crohn.' },
  { type: 'Transferrine', unite: 'g/L', normal_min: 2, normal_max: 3.6, description: 'Protéine transportant le fer dans le sang. Augmente quand les réserves de fer sont basses.' },
  { type: 'Coeff. saturation transferrine', unite: '%', normal_min: 20, normal_max: 40, description: 'Pourcentage de transferrine chargée en fer. Bas en cas de carence en fer.' },
  { type: 'Vitamine B12', unite: 'pg/mL', normal_min: 200, normal_max: 900, description: 'Vitamine essentielle absorbée dans l\'iléon terminal — zone souvent touchée par le Crohn.' },
  { type: 'Vitamine D', unite: 'ng/mL', normal_min: 30, normal_max: 100, description: 'Vitamine importante pour les os et l\'immunité. Souvent déficiente dans les MICI.' },
  { type: 'Albumine', unite: 'g/L', normal_min: 35, normal_max: 50, description: 'Protéine de nutrition. Basse en cas de dénutrition ou inflammation sévère.' },
  { type: 'Calprotectine fécale', unite: 'µg/g', normal_min: 0, normal_max: 50, description: 'Marqueur d\'inflammation intestinale dans les selles. Très spécifique des poussées de Crohn.' },
  { type: 'VS', unite: 'mm/h', normal_min: 0, normal_max: 20, description: 'Vitesse de sédimentation — marqueur général d\'inflammation, moins spécifique que la CRP.' },
  { type: 'Acide folique', unite: 'ng/mL', normal_min: 3, normal_max: 17, description: 'Vitamine B9 essentielle. Souvent diminuée avec le méthotrexate ou en cas de malabsorption.' },
  { type: 'Zinc', unite: 'µmol/L', normal_min: 10, normal_max: 18, description: 'Oligo-élément important pour l\'immunité et la cicatrisation. Fréquemment bas dans le Crohn.' },
]

const NAV_DEFAULT = [
  { id: 'dashboard', label: 'Accueil', icon: '🏠' },
  { id: 'analyses', label: 'Analyses', icon: '📊' },
  { id: 'statistiques', label: 'Stats', icon: '📈' },
  { id: 'symptomes', label: 'Symptômes', icon: '🤒' },
  { id: 'repas', label: 'Repas', icon: '🍽️' },
  { id: 'medicaments', label: 'Médocs', icon: '💊' },
  { id: 'sport', label: 'Sport', icon: '🏃' },
  { id: 'journal', label: 'Journal', icon: '📓' },
  { id: 'rapport', label: 'Rapport', icon: '📄' },
  { id: 'assistant', label: 'IA', icon: '🤖' },
  { id: 'science', label: 'Science', icon: '🔬' },
]

function Parametres({ toggleTheme, dark }) {
  const [parametres, setParametres] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [analysesOuvertes, setAnalysesOuvertes] = useState(false)
  const [navItems, setNavItems] = useState([])
  const [dragIndex, setDragIndex] = useState(null)
  const [navSaved, setNavSaved] = useState(false)

  useEffect(() => {
    fetchParametres()
    // Charger l'ordre des onglets depuis localStorage
    const savedNav = localStorage.getItem('navOrder')
    if (savedNav) {
      setNavItems(JSON.parse(savedNav))
    } else {
      setNavItems(NAV_DEFAULT)
    }
  }, [])

  const fetchParametres = async () => {
    setLoading(true)
    const { data } = await supabase.from('parametres_analyses').select('*')
    if (data && data.length > 0) {
      const merged = ANALYSES_DEFAULT.map(def => {
        const saved = data.find(d => d.type === def.type)
        return saved ? { ...def, unite: saved.unite, normal_min: saved.normal_min, normal_max: saved.normal_max } : def
      })
      setParametres(merged)
    } else {
      setParametres(ANALYSES_DEFAULT)
    }
    setLoading(false)
  }

  const handleChange = (type, field, value) => {
    setParametres(prev => prev.map(p =>
      p.type === type ? { ...p, [field]: value } : p
    ))
  }

  const handleSave = async () => {
    setSaving(true)
    for (const p of parametres) {
      const { data } = await supabase.from('parametres_analyses').select('*').eq('type', p.type)
      if (data && data.length > 0) {
        await supabase.from('parametres_analyses')
          .update({ unite: p.unite, normal_min: parseFloat(p.normal_min), normal_max: parseFloat(p.normal_max) })
          .eq('type', p.type)
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from('parametres_analyses')
          .insert({ type: p.type, unite: p.unite, normal_min: parseFloat(p.normal_min), normal_max: parseFloat(p.normal_max), user_id: user.id })
      }
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  // Drag & drop onglets
  const handleDragStart = (index) => setDragIndex(index)

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    const newItems = [...navItems]
    const dragged = newItems.splice(dragIndex, 1)[0]
    newItems.splice(index, 0, dragged)
    setNavItems(newItems)
    setDragIndex(index)
  }

  const handleDragEnd = () => setDragIndex(null)

  const moveItem = (index, direction) => {
    const newItems = [...navItems]
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= newItems.length) return
    ;[newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]]
    setNavItems(newItems)
  }

  const saveNavOrder = () => {
    localStorage.setItem('navOrder', JSON.stringify(navItems))
    setNavSaved(true)
    setTimeout(() => setNavSaved(false), 3000)
    // Forcer le rechargement pour que App.jsx prenne en compte le nouvel ordre
    window.dispatchEvent(new Event('navOrderChanged'))
  }

  const resetNavOrder = () => {
    setNavItems(NAV_DEFAULT)
    localStorage.removeItem('navOrder')
  }

  if (loading) return <div className="px-6 py-8 text-slate-500 dark:text-gray-500">Chargement...</div>

  return (
    <div className="px-3 py-4 md:px-6 md:py-8 max-w-4xl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1">⚙️ Paramètres</h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm">Personnalise ton expérience CrohnTrack.</p>
        </div>
        <button
          onClick={toggleTheme}
          className="bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-700 dark:text-white font-semibold px-4 py-3 rounded-xl transition flex items-center gap-2 self-start sm:self-auto"
        >
          {dark ? '☀️ Mode jour' : '🌙 Mode nuit'}
        </button>
      </div>

      {/* ===== SECTION ORDRE DES ONGLETS ===== */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl mb-4 shadow-sm dark:shadow-none overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-gray-800">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">🗂️ Ordre des onglets</h3>
          <p className="text-slate-400 dark:text-gray-500 text-xs mt-0.5">
            Glisse pour réordonner — ou utilise les flèches sur mobile.
          </p>
        </div>

        <div className="p-4 flex flex-col gap-2">
          {navItems.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition cursor-grab active:cursor-grabbing ${
                dragIndex === index
                  ? 'bg-emerald-50 dark:bg-green-500/10 border-emerald-300 dark:border-green-500/50 opacity-70'
                  : 'bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700'
              }`}
            >
              {/* Poignée drag */}
              <span className="text-slate-300 dark:text-gray-600 text-lg select-none">⠿</span>
              {/* Icône + label */}
              <span className="text-xl">{item.icon}</span>
              <span className="flex-1 text-sm font-medium text-slate-700 dark:text-gray-300">{item.label}</span>
              {/* Flèches mobile */}
              <div className="flex gap-1">
                <button
                  onClick={() => moveItem(index, -1)}
                  disabled={index === 0}
                  className="p-1.5 rounded-lg bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 text-slate-400 dark:text-gray-400 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-gray-600 transition text-xs"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveItem(index, 1)}
                  disabled={index === navItems.length - 1}
                  className="p-1.5 rounded-lg bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 text-slate-400 dark:text-gray-400 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-gray-600 transition text-xs"
                >
                  ▼
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={saveNavOrder}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition text-sm"
          >
            {navSaved ? '✅ Sauvegardé !' : '💾 Sauvegarder l\'ordre'}
          </button>
          <button
            onClick={resetNavOrder}
            className="px-4 py-3 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-400 dark:text-gray-500 hover:bg-slate-50 dark:hover:bg-gray-800 transition text-sm"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* ===== SECTION ANALYSES — RÉTRACTABLE ===== */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl shadow-sm dark:shadow-none overflow-hidden">

        {/* Header cliquable */}
        <button
          onClick={() => setAnalysesOuvertes(!analysesOuvertes)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-gray-800/50 transition"
        >
          <div className="text-left">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">🧪 Valeurs normales des analyses</h3>
            <p className="text-slate-400 dark:text-gray-500 text-xs mt-0.5">
              {analysesOuvertes ? 'Cliquer pour masquer' : `${parametres.length} analyses configurées — cliquer pour modifier`}
            </p>
          </div>
          <span className={`text-slate-400 dark:text-gray-500 text-lg transition-transform duration-200 ${analysesOuvertes ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {/* Contenu rétractable */}
        {analysesOuvertes && (
          <>
            {/* En-têtes — masqués sur mobile */}
            <div className="hidden md:grid grid-cols-12 bg-slate-50 dark:bg-gray-800 px-6 py-3 text-xs text-slate-500 dark:text-gray-400 font-semibold uppercase tracking-wider border-t border-slate-100 dark:border-gray-800">
              <span className="col-span-3">Analyse</span>
              <span className="col-span-4">Description</span>
              <span className="col-span-2">Unité</span>
              <span className="col-span-1">Min</span>
              <span className="col-span-2">Max</span>
            </div>

            {parametres.map((p, i) => (
              <div
                key={p.type}
                className={`border-t border-slate-100 dark:border-gray-800/50 ${
                  i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-slate-50/50 dark:bg-gray-900/50'
                }`}
              >
                {/* Vue desktop */}
                <div className="hidden md:grid grid-cols-12 items-center px-6 py-4 gap-2">
                  <div className="col-span-3">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{p.type}</p>
                  </div>
                  <div className="col-span-4">
                    <p className="text-slate-400 dark:text-gray-500 text-xs leading-relaxed">{p.description}</p>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={p.unite}
                      onChange={e => handleChange(p.type, 'unite', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-2 text-slate-900 dark:text-white text-sm focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      value={p.normal_min}
                      onChange={e => handleChange(p.type, 'normal_min', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-2 text-slate-900 dark:text-white text-sm focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={p.normal_max}
                      onChange={e => handleChange(p.type, 'normal_max', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-2 text-slate-900 dark:text-white text-sm focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Vue mobile — cards empilées */}
                <div className="md:hidden px-4 py-3">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm mb-1">{p.type}</p>
                  <p className="text-slate-400 dark:text-gray-500 text-xs mb-3 leading-relaxed">{p.description}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-xs text-slate-400 dark:text-gray-500 mb-1">Unité</p>
                      <input
                        type="text"
                        value={p.unite}
                        onChange={e => handleChange(p.type, 'unite', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-2 text-slate-900 dark:text-white text-sm focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 dark:text-gray-500 mb-1">Min</p>
                      <input
                        type="number"
                        value={p.normal_min}
                        onChange={e => handleChange(p.type, 'normal_min', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-2 text-slate-900 dark:text-white text-sm focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 dark:text-gray-500 mb-1">Max</p>
                      <input
                        type="number"
                        value={p.normal_max}
                        onChange={e => handleChange(p.type, 'normal_max', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-2 text-slate-900 dark:text-white text-sm focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Bouton sauvegarder analyses */}
            <div className="px-5 py-4 border-t border-slate-100 dark:border-gray-800">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 text-sm"
              >
                {saving ? 'Sauvegarde...' : saved ? '✅ Sauvegardé !' : '💾 Sauvegarder les valeurs'}
              </button>
            </div>
          </>
        )}
      </div>

      <p className="text-slate-400 dark:text-gray-600 text-xs mt-4 text-center">
        Ces valeurs sont utilisées comme référence dans tous tes bilans sanguins.
      </p>

    </div>
  )
}

export default Parametres