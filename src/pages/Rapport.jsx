import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const DESCRIPTIONS = {
  'CRP': 'Protéine C-réactive — marqueur principal d\'inflammation.',
  'Ferritine': 'Réserves en fer de l\'organisme.',
  'Hémoglobine': 'Protéine des globules rouges transportant l\'oxygène.',
  'VGM': 'Volume Globulaire Moyen — taille des globules rouges.',
  'Lymphocytes': 'Globules blancs du système immunitaire.',
  'Plaquettes': 'Cellules de coagulation sanguine.',
  'Leucocytes': 'Globules blancs — défenses immunitaires.',
  'Créatinine': 'Déchet musculaire éliminé par les reins.',
  'Fer sérique': 'Taux de fer circulant dans le sang.',
  'Transferrine': 'Protéine transportant le fer dans le sang.',
  'Coeff. saturation transferrine': 'Pourcentage de transferrine chargée en fer.',
  'Vitamine B12': 'Vitamine essentielle absorbée dans l\'iléon terminal.',
  'Vitamine D': 'Vitamine importante pour les os et l\'immunité.',
  'Albumine': 'Principale protéine du sang, marqueur de nutrition.',
  'Calprotectine fécale': 'Marqueur d\'inflammation intestinale dans les selles.',
  'VS': 'Vitesse de sédimentation — marqueur général d\'inflammation.',
  'Acide folique': 'Vitamine B9 — essentielle pour la production des globules rouges.',
  'Zinc': 'Oligo-élément essentiel pour l\'immunité et la cicatrisation.',
}

function Rapport() {
  const [analyses, setAnalyses] = useState([])
  const [symptomes, setSymptomes] = useState([])
  const [medicaments, setMedicaments] = useState([])
  const [repas, setRepas] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [nomPatient, setNomPatient] = useState('')
  const rapportRef = useRef(null)

  useEffect(() => {
    // Dates par défaut : 30 derniers jours
    const today = new Date()
    const il30jours = new Date(today)
    il30jours.setDate(today.getDate() - 30)
    setDateFin(today.toISOString().split('T')[0])
    setDateDebut(il30jours.toISOString().split('T')[0])
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [
      { data: analysesData },
      { data: symptomesData },
      { data: medicamentsData },
      { data: repasData },
    ] = await Promise.all([
      supabase.from('analyses').select('*').order('date', { ascending: false }),
      supabase.from('symptomes').select('*').order('date', { ascending: false }),
      supabase.from('medicaments').select('*'),
      supabase.from('repas').select('*').order('date', { ascending: false }),
    ])
    if (analysesData) setAnalyses(analysesData)
    if (symptomesData) setSymptomes(symptomesData)
    if (medicamentsData) setMedicaments(medicamentsData)
    if (repasData) setRepas(repasData)
    setLoading(false)
  }

  const isAnormal = (valeur, min, max) => {
    if (min === null || max === null) return false
    return valeur < min || valeur > max
  }

  const filtrer = (data) => {
    if (!dateDebut || !dateFin) return data
    return data.filter(d => d.date >= dateDebut && d.date <= dateFin)
  }

  const analysesFiltrees = filtrer(analyses)
  const symptomesFiltres = filtrer(symptomes)
  const repasFiltres = filtrer(repas)

  // Grouper analyses par date
  const groupAnalyses = () => {
    const groupes = {}
    analysesFiltrees.forEach(a => {
      if (!groupes[a.date]) groupes[a.date] = []
      groupes[a.date].push(a)
    })
    return Object.entries(groupes).sort((a, b) => new Date(b[0]) - new Date(a[0]))
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const generatePDF = async () => {
    setGenerating(true)
    const element = rapportRef.current
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    let heightLeft = pdfHeight
    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
    heightLeft -= 297

    while (heightLeft > 0) {
      position = heightLeft - pdfHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
      heightLeft -= 297
    }

    pdf.save(`rapport-crohn-${dateDebut}-${dateFin}.pdf`)
    setGenerating(false)
  }

  if (loading) return <div className="px-6 py-8 text-gray-500">Chargement...</div>

  const groupes = groupAnalyses()
  const anormauxTotal = analysesFiltrees.filter(a => isAnormal(a.valeur, a.normal_min, a.normal_max))

  return (
    <div className="px-6 py-8">

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">📄 Rapport médecin</h2>
          <p className="text-gray-400">Génère un rapport PDF à partager avec ton médecin.</p>
        </div>
        <button
          onClick={generatePDF}
          disabled={generating}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl transition disabled:opacity-50 flex items-center gap-2"
        >
          {generating ? '⏳ Génération...' : '⬇️ Télécharger PDF'}
        </button>
      </div>

      {/* Options du rapport */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
        <h3 className="font-bold text-white mb-4">⚙️ Options du rapport</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Nom du patient</label>
            <input
              type="text"
              value={nomPatient}
              onChange={e => setNomPatient(e.target.value)}
              placeholder="Ton nom complet"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Date de début</label>
            <input
              type="date"
              value={dateDebut}
              onChange={e => setDateDebut(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Date de fin</label>
            <input
              type="date"
              value={dateFin}
              onChange={e => setDateFin(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Aperçu du rapport — ce qui sera exporté en PDF */}
      <div
        ref={rapportRef}
        style={{ backgroundColor: '#ffffff', color: '#111827', fontFamily: 'Arial, sans-serif', padding: '40px' }}
      >
        {/* En-tête */}
        <div style={{ borderBottom: '3px solid #10b981', paddingBottom: '20px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981', margin: '0 0 4px 0' }}>
                🩺 CrohnTrack
              </h1>
              <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Rapport de suivi médical</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: 'bold', fontSize: '16px', margin: '0 0 4px 0' }}>
                {nomPatient || 'Patient'}
              </p>
              <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>
                Période : {formatDate(dateDebut)} — {formatDate(dateFin)}
              </p>
              <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>
                Généré le {formatDate(new Date().toISOString().split('T')[0])}
              </p>
            </div>
          </div>
        </div>

        {/* Résumé */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '30px' }}>
          {[
            { label: 'Bilans sanguins', valeur: groupes.length, couleur: '#10b981' },
            { label: 'Valeurs anormales', valeur: anormauxTotal.length, couleur: anormauxTotal.length > 0 ? '#ef4444' : '#10b981' },
            { label: 'Symptômes', valeur: symptomesFiltres.length, couleur: '#f59e0b' },
            { label: 'Traitements', valeur: medicaments.length, couleur: '#3b82f6' },
          ].map(item => (
            <div key={item.label} style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: item.couleur, margin: '0 0 4px 0' }}>{item.valeur}</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{item.label}</p>
            </div>
          ))}
        </div>

        {/* Traitements */}
        {medicaments.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', borderLeft: '4px solid #3b82f6', paddingLeft: '12px', marginBottom: '16px' }}>
              💊 Traitements en cours
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  {['Médicament', 'Dosage', 'Fréquence', 'Depuis'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {medicaments.map((med, i) => (
                  <tr key={med.id} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '600' }}>{med.nom}</td>
                    <td style={{ padding: '10px 12px', color: '#3b82f6' }}>{med.dosage}</td>
                    <td style={{ padding: '10px 12px', color: '#6b7280' }}>{med.frequence || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#6b7280' }}>{formatDate(med.date_debut) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bilans sanguins */}
        {groupes.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', borderLeft: '4px solid #10b981', paddingLeft: '12px', marginBottom: '16px' }}>
              📊 Bilans sanguins
            </h2>
            {groupes.map(([date, valeurs]) => {
              const nbAnormaux = valeurs.filter(v => isAnormal(v.valeur, v.normal_min, v.normal_max)).length
              return (
                <div key={date} style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <p style={{ fontWeight: '600', fontSize: '15px', margin: 0 }}>🗓️ {formatDate(date)}</p>
                    {nbAnormaux > 0 ? (
                      <span style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '2px 10px', borderRadius: '20px', fontSize: '12px' }}>
                        ⚠️ {nbAnormaux} valeur{nbAnormaux > 1 ? 's' : ''} anormale{nbAnormaux > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span style={{ backgroundColor: '#d1fae5', color: '#10b981', padding: '2px 10px', borderRadius: '20px', fontSize: '12px' }}>
                        ✅ Tout normal
                      </span>
                    )}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f3f4f6' }}>
                        {['Analyse', 'Valeur', 'Unité', 'Plage normale', 'Statut'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {valeurs.map((a, i) => {
                        const anormal = isAnormal(a.valeur, a.normal_min, a.normal_max)
                        return (
                          <tr key={a.id} style={{ backgroundColor: anormal ? '#fef2f2' : i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                            <td style={{ padding: '8px 12px', fontWeight: '500' }}>{a.type}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 'bold', color: anormal ? '#ef4444' : '#10b981' }}>{a.valeur}</td>
                            <td style={{ padding: '8px 12px', color: '#6b7280' }}>{a.unite}</td>
                            <td style={{ padding: '8px 12px', color: '#6b7280' }}>
                              {a.normal_min !== null ? `${a.normal_min} — ${a.normal_max}` : '—'}
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              {anormal ? (
                                <span style={{ color: '#ef4444', fontSize: '12px' }}>⚠️ Anormal</span>
                              ) : (
                                <span style={{ color: '#10b981', fontSize: '12px' }}>✅ Normal</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        )}

        {/* Symptômes */}
        {symptomesFiltres.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', borderLeft: '4px solid #f59e0b', paddingLeft: '12px', marginBottom: '16px' }}>
              🤒 Symptômes
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  {['Date', 'Symptôme', 'Intensité', 'Note'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {symptomesFiltres.map((s, i) => (
                  <tr key={s.id} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                    <td style={{ padding: '8px 12px', color: '#6b7280' }}>{formatDate(s.date)}</td>
                    <td style={{ padding: '8px 12px', fontWeight: '500' }}>{s.type}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{
                        color: s.intensite >= 4 ? '#ef4444' : s.intensite === 3 ? '#f59e0b' : '#10b981',
                        fontWeight: 'bold'
                      }}>
                        {s.intensite}/5
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', color: '#6b7280' }}>{s.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pied de page */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '20px', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>
            Rapport généré par CrohnTrack — Application de suivi de la maladie de Crohn
          </p>
        </div>
      </div>
    </div>
  )
}

export default Rapport