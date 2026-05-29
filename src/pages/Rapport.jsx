import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'

function Rapport() {
  const [analyses, setAnalyses] = useState([])
  const [symptomes, setSymptomes] = useState([])
  const [medicaments, setMedicaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [nomPatient, setNomPatient] = useState('')
  const rapportRef = useRef(null)

  useEffect(() => {
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
    ] = await Promise.all([
      supabase.from('analyses').select('*').order('date', { ascending: true }),
      supabase.from('symptomes').select('*').order('date', { ascending: false }),
      supabase.from('medicaments').select('*'),
    ])
    if (analysesData) setAnalyses(analysesData)
    if (symptomesData) setSymptomes(symptomesData)
    if (medicamentsData) setMedicaments(medicamentsData)
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

  const groupAnalyses = () => {
    const groupes = {}
    analysesFiltrees.forEach(a => {
      if (!groupes[a.date]) groupes[a.date] = []
      groupes[a.date].push(a)
    })
    return Object.entries(groupes).sort((a, b) => new Date(b[0]) - new Date(a[0]))
  }

  // Données pour graphiques par type
  const getGraphiqueData = (type) => {
    return analysesFiltrees
      .filter(a => a.type === type)
      .map(a => ({
        date: new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        valeur: a.valeur,
      }))
  }

  const getTypesUniques = () => [...new Set(analysesFiltrees.map(a => a.type))]

  const getParamsType = (type) => {
    const a = analysesFiltrees.find(a => a.type === type)
    return a ? { normal_min: a.normal_min, normal_max: a.normal_max, unite: a.unite } : null
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const generatePDF = async () => {
    setGenerating(true)
    const element = rapportRef.current
    const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
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

  if (loading) return <div className="px-6 py-8 text-slate-500 dark:text-gray-500">Chargement...</div>

  const groupes = groupAnalyses()
  const anormauxTotal = analysesFiltrees.filter(a => isAnormal(a.valeur, a.normal_min, a.normal_max))
  const typesUniques = getTypesUniques()

  return (
    <div className="px-6 py-8">

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">📄 Rapport médecin</h2>
          <p className="text-slate-500 dark:text-gray-400">Génère un rapport PDF à partager avec ton médecin.</p>
        </div>
        <button
          onClick={generatePDF}
          disabled={generating}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl transition disabled:opacity-50 flex items-center gap-2"
        >
          {generating ? '⏳ Génération...' : '⬇️ Télécharger PDF'}
        </button>
      </div>

      {/* Options */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 mb-8 shadow-sm dark:shadow-none">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4">⚙️ Options du rapport</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Nom du patient</label>
            <input type="text" value={nomPatient} onChange={e => setNomPatient(e.target.value)} placeholder="Ton nom complet"
              className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-emerald-500 outline-none" />
          </div>
          <div>
            <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Date de début</label>
            <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
              className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-emerald-500 outline-none" />
          </div>
          <div>
            <label className="text-slate-500 dark:text-gray-400 text-sm mb-2 block">Date de fin</label>
            <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
              className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-emerald-500 outline-none" />
          </div>
        </div>
      </div>

      {/* RAPPORT PDF */}
      <div ref={rapportRef} style={{ backgroundColor: '#ffffff', color: '#111827', fontFamily: 'Arial, sans-serif', padding: '40px', maxWidth: '800px' }}>

        {/* En-tête */}
        <div style={{ background: 'linear-gradient(135deg, #059669, #0ea5e9)', borderRadius: '16px', padding: '30px', marginBottom: '30px', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 6px 0' }}>🩺 CrohnTrack</h1>
              <p style={{ margin: 0, opacity: 0.85, fontSize: '15px' }}>Rapport de suivi médical — Maladie de Crohn</p>
            </div>
            <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '16px' }}>
              <p style={{ fontWeight: 'bold', fontSize: '18px', margin: '0 0 4px 0' }}>{nomPatient || 'Patient'}</p>
              <p style={{ fontSize: '13px', margin: '0 0 2px 0', opacity: 0.85 }}>{formatDate(dateDebut)} — {formatDate(dateFin)}</p>
              <p style={{ fontSize: '12px', margin: 0, opacity: 0.7 }}>Généré le {formatDate(new Date().toISOString().split('T')[0])}</p>
            </div>
          </div>
        </div>

        {/* Résumé visuel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '30px' }}>
          {[
            { label: 'Bilans sanguins', valeur: groupes.length, couleur: '#059669', bg: '#d1fae5', icon: '📊' },
            { label: 'Valeurs anormales', valeur: anormauxTotal.length, couleur: anormauxTotal.length > 0 ? '#ef4444' : '#059669', bg: anormauxTotal.length > 0 ? '#fee2e2' : '#d1fae5', icon: anormauxTotal.length > 0 ? '⚠️' : '✅' },
            { label: 'Symptômes', valeur: symptomesFiltres.length, couleur: '#d97706', bg: '#fef3c7', icon: '🤒' },
            { label: 'Traitements', valeur: medicaments.length, couleur: '#0ea5e9', bg: '#e0f2fe', icon: '💊' },
          ].map(item => (
            <div key={item.label} style={{ backgroundColor: item.bg, borderRadius: '12px', padding: '20px', textAlign: 'center', border: `2px solid ${item.couleur}20` }}>
              <p style={{ fontSize: '24px', margin: '0 0 6px 0' }}>{item.icon}</p>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: item.couleur, margin: '0 0 4px 0' }}>{item.valeur}</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{item.label}</p>
            </div>
          ))}
        </div>

        {/* Traitements */}
        {medicaments.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', borderLeft: '4px solid #0ea5e9', paddingLeft: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💊 Traitements en cours
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', borderRadius: '12px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ backgroundColor: '#0ea5e9', color: 'white' }}>
                  {['Médicament', 'Dosage', 'Fréquence', 'Depuis'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {medicaments.map((med, i) => (
                  <tr key={med.id} style={{ backgroundColor: i % 2 === 0 ? '#f0f9ff' : '#ffffff' }}>
                    <td style={{ padding: '10px 16px', fontWeight: '600', color: '#0369a1' }}>{med.nom}</td>
                    <td style={{ padding: '10px 16px' }}>{med.dosage}</td>
                    <td style={{ padding: '10px 16px', color: '#6b7280' }}>{med.frequence || '—'}</td>
                    <td style={{ padding: '10px 16px', color: '#6b7280' }}>{formatDate(med.date_debut) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Graphiques d'évolution */}
        {typesUniques.length > 0 && analysesFiltrees.length > 1 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', borderLeft: '4px solid #059669', paddingLeft: '12px', marginBottom: '20px' }}>
              📈 Évolution des analyses
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {typesUniques.map(type => {
                const data = getGraphiqueData(type)
                const params = getParamsType(type)
                if (data.length < 2) return null
                return (
                  <div key={type} style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
                    <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '8px', color: '#111827' }}>
                      {type} {params ? `(${params.unite})` : ''}
                    </p>
                    {params && (
                      <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>
                        Normal : {params.normal_min} — {params.normal_max}
                      </p>
                    )}
                    <ResponsiveContainer width="100%" height={120}>
                      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#9ca3af" />
                        <YAxis tick={{ fontSize: 9 }} stroke="#9ca3af" />
                        {params && params.normal_max && (
                          <ReferenceLine y={params.normal_max} stroke="#ef4444" strokeDasharray="3 3" />
                        )}
                        {params && params.normal_min && (
                          <ReferenceLine y={params.normal_min} stroke="#f59e0b" strokeDasharray="3 3" />
                        )}
                        <Line type="monotone" dataKey="valeur" stroke="#059669" strokeWidth={2} dot={{ r: 3, fill: '#059669' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Bilans détaillés */}
        {groupes.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', borderLeft: '4px solid #059669', paddingLeft: '12px', marginBottom: '16px' }}>
              📊 Bilans sanguins détaillés
            </h2>
            {groupes.map(([date, valeurs]) => {
              const nbAnormaux = valeurs.filter(v => isAnormal(v.valeur, v.normal_min, v.normal_max)).length
              return (
                <div key={date} style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', padding: '10px 16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <p style={{ fontWeight: '700', fontSize: '15px', margin: 0 }}>🗓️ {formatDate(date)}</p>
                    {nbAnormaux > 0 ? (
                      <span style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                        ⚠️ {nbAnormaux} valeur{nbAnormaux > 1 ? 's' : ''} anormale{nbAnormaux > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span style={{ backgroundColor: '#d1fae5', color: '#059669', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                        ✅ Tout normal
                      </span>
                    )}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#059669', color: 'white' }}>
                        {['Analyse', 'Valeur', 'Unité', 'Plage normale', 'Statut'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {valeurs.map((a, i) => {
                        const anormal = isAnormal(a.valeur, a.normal_min, a.normal_max)
                        return (
                          <tr key={a.id} style={{ backgroundColor: anormal ? '#fef2f2' : i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                            <td style={{ padding: '10px 12px', fontWeight: '500' }}>{a.type}</td>
                            <td style={{ padding: '10px 12px', fontWeight: 'bold', color: anormal ? '#ef4444' : '#059669', fontSize: '15px' }}>{a.valeur}</td>
                            <td style={{ padding: '10px 12px', color: '#6b7280' }}>{a.unite}</td>
                            <td style={{ padding: '10px 12px', color: '#6b7280' }}>
                              {a.normal_min !== null ? `${a.normal_min} — ${a.normal_max}` : '—'}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              {anormal ? (
                                <span style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>⚠️ Anormal</span>
                              ) : (
                                <span style={{ backgroundColor: '#d1fae5', color: '#059669', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>✅ Normal</span>
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
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', borderLeft: '4px solid #d97706', paddingLeft: '12px', marginBottom: '16px' }}>
              🤒 Symptômes
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#d97706', color: 'white' }}>
                  {['Date', 'Symptôme', 'Intensité', 'Note'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {symptomesFiltres.map((s, i) => (
                  <tr key={s.id} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#fffbeb' }}>
                    <td style={{ padding: '8px 12px', color: '#6b7280' }}>{formatDate(s.date)}</td>
                    <td style={{ padding: '8px 12px', fontWeight: '500' }}>{s.type}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{
                        backgroundColor: s.intensite >= 4 ? '#fee2e2' : s.intensite === 3 ? '#fef3c7' : '#d1fae5',
                        color: s.intensite >= 4 ? '#ef4444' : s.intensite === 3 ? '#d97706' : '#059669',
                        padding: '2px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'
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
        <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '20px', marginTop: '20px', textAlign: 'center', background: '#f9fafb', borderRadius: '0 0 12px 12px', padding: '20px' }}>
          <p style={{ color: '#059669', fontWeight: '600', fontSize: '14px', margin: '0 0 4px 0' }}>🩺 CrohnTrack</p>
          <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 4px 0' }}>Créé par Damien Chereau — atteint de la maladie de Crohn</p>
          <p style={{ color: '#d1d5db', fontSize: '11px', margin: 0 }}>Ce rapport est un outil de suivi personnel et ne remplace pas un avis médical professionnel.</p>
        </div>

      </div>
    </div>
  )
}

export default Rapport