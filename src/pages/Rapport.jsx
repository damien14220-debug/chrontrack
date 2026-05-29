import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import jsPDF from 'jspdf'

function Rapport() {
  const [analyses, setAnalyses] = useState([])
  const [symptomes, setSymptomes] = useState([])
  const [medicaments, setMedicaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [nomPatient, setNomPatient] = useState('')

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

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const generatePDF = () => {
    setGenerating(true)

    setTimeout(() => {
      const analysesFiltrees = filtrer(analyses)
      const symptomesFiltres = filtrer(symptomes)

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = 210
      const pageH = 297
      const margin = 15
      const contentW = pageW - margin * 2
      let y = margin

      const VERT = [5, 150, 105]
      const BLEU = [14, 165, 233]
      const ROUGE = [239, 68, 68]
      const ORANGE = [217, 119, 6]
      const GRIS = [107, 114, 128]
      const GRIS_CLAIR = [245, 247, 250]
      const BLANC = [255, 255, 255]
      const NOIR = [17, 24, 39]

      const checkPage = (needed = 10) => {
        if (y + needed > pageH - 15) {
          pdf.addPage()
          y = margin
        }
      }

      const rect = (x, ry, w, h, color, r = 0) => {
        pdf.setFillColor(...color)
        if (r > 0) {
          pdf.roundedRect(x, ry, w, h, r, r, 'F')
        } else {
          pdf.rect(x, ry, w, h, 'F')
        }
      }

      const txt = (text, x, ry, size, color, style = 'normal', maxW = null) => {
        pdf.setFontSize(size)
        pdf.setTextColor(...color)
        pdf.setFont('helvetica', style)
        const str = String(text)
        if (maxW) {
          const lines = pdf.splitTextToSize(str, maxW)
          pdf.text(lines, x, ry)
        } else {
          pdf.text(str, x, ry)
        }
      }

      // ===== EN-TÊTE =====
      rect(margin, y, contentW, 35, VERT, 4)

      txt('CrohnTrack', margin + 5, y + 13, 20, BLANC, 'bold')
      txt('Rapport de suivi medical - Maladie de Crohn', margin + 5, y + 21, 9, [200, 240, 220], 'italic')
      txt('crohntrack.fr', margin + 5, y + 28, 8, [160, 220, 190])

      pdf.setFontSize(13)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...BLANC)
      const nomStr = nomPatient || 'Patient'
      const nomW = pdf.getTextWidth(nomStr)
      pdf.text(nomStr, pageW - margin - nomW - 3, y + 13)

      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'italic')
      pdf.setTextColor(200, 240, 220)
      const periodeStr = `Du ${formatDate(dateDebut)} au ${formatDate(dateFin)}`
      const periodeW = pdf.getTextWidth(periodeStr)
      pdf.text(periodeStr, pageW - margin - periodeW - 3, y + 21)

      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(160, 210, 185)
      const dateGenStr = `Genere le ${formatDate(new Date().toISOString().split('T')[0])}`
      const dateGenW = pdf.getTextWidth(dateGenStr)
      pdf.text(dateGenStr, pageW - margin - dateGenW - 3, y + 28)
      y += 41

      // ===== RÉSUMÉ CARTES =====
      const groupes = (() => {
        const g = {}
        analysesFiltrees.forEach(a => { if (!g[a.date]) g[a.date] = []; g[a.date].push(a) })
        return Object.entries(g).sort((a, b) => new Date(b[0]) - new Date(a[0]))
      })()
      const anormauxTotal = analysesFiltrees.filter(a => isAnormal(a.valeur, a.normal_min, a.normal_max))

      const cartes = [
        { label: 'Bilans', valeur: groupes.length, couleur: VERT, bg: [209, 250, 229] },
        { label: 'Anomalies', valeur: anormauxTotal.length, couleur: anormauxTotal.length > 0 ? ROUGE : VERT, bg: anormauxTotal.length > 0 ? [254, 226, 226] : [209, 250, 229] },
        { label: 'Symptomes', valeur: symptomesFiltres.length, couleur: ORANGE, bg: [254, 243, 199] },
        { label: 'Traitements', valeur: medicaments.length, couleur: BLEU, bg: [224, 242, 254] },
      ]

      const cW = (contentW - 9) / 4
      cartes.forEach((c, i) => {
        const x = margin + i * (cW + 3)
        rect(x, y, cW, 20, c.bg, 3)
        txt(String(c.valeur), x + 3, y + 12, 16, c.couleur, 'bold')
        txt(c.label, x + 3, y + 18, 7.5, GRIS)
      })
      y += 26

      // ===== TRAITEMENTS =====
      if (medicaments.length > 0) {
        checkPage(15)
        rect(margin, y, 3, 7, BLEU, 1)
        txt('Traitements en cours', margin + 5, y + 5.5, 11, NOIR, 'bold')
        y += 10

        rect(margin, y, contentW, 7, BLEU, 2)
        const cMed = [55, 30, 60, 35]
        const hMed = ['Medicament', 'Dosage', 'Frequence', 'Depuis']
        let xc = margin + 2
        hMed.forEach((h, i) => { txt(h, xc, y + 5, 7.5, BLANC, 'bold'); xc += cMed[i] })
        y += 7

        medicaments.forEach((med, idx) => {
          checkPage(7)
          rect(margin, y, contentW, 6.5, idx % 2 === 0 ? BLANC : GRIS_CLAIR)
          xc = margin + 2
          const row = [med.nom, med.dosage, med.frequence || '—', formatDate(med.date_debut) || '—']
          row.forEach((v, i) => {
            txt(v, xc, y + 4.5, 7.5, i === 0 ? [3, 105, 161] : NOIR, i === 0 ? 'bold' : 'normal', cMed[i] - 2)
            xc += cMed[i]
          })
          y += 6.5
        })
        y += 6
      }

      // ===== RÉSUMÉ VALEURS =====
      const typesUniques = [...new Set(analysesFiltrees.map(a => a.type))]
      if (typesUniques.length > 0) {
        checkPage(15)
        rect(margin, y, 3, 7, VERT, 1)
        txt('Resume des dernieres valeurs', margin + 5, y + 5.5, 11, NOIR, 'bold')
        y += 10

        const bW = (contentW - 4) / 2
        let col = 0
        let rowY = y

        typesUniques.forEach(type => {
          const vt = analysesFiltrees.filter(a => a.type === type)
          const last = vt[vt.length - 1]
          if (!last) return
          const anormal = isAnormal(last.valeur, last.normal_min, last.normal_max)
          const x = margin + col * (bW + 4)
          if (col === 0) { checkPage(20); rowY = y }

          rect(x, rowY, bW, 18, anormal ? [255, 245, 245] : GRIS_CLAIR, 3)
          txt(type, x + 3, rowY + 6, 8, NOIR, 'bold', bW - 28)
          const valStr = `${last.valeur} ${last.unite || ''}`
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(...(anormal ? ROUGE : VERT))
          const valW = pdf.getTextWidth(valStr)
          pdf.text(valStr, x + bW - valW - 3, rowY + 6)

          if (last.normal_min !== null && last.normal_max !== null) {
            const pct = Math.min(1, Math.max(0, last.valeur / last.normal_max))
            rect(x + 3, rowY + 9, bW - 6, 2.5, [220, 225, 230], 1)
            rect(x + 3, rowY + 9, (bW - 6) * pct, 2.5, anormal ? ROUGE : VERT, 1)
            txt(`Normal: ${last.normal_min} - ${last.normal_max}`, x + 3, rowY + 15, 6.5, GRIS)
          }

          col++
          if (col === 2) { col = 0; y = rowY + 22 }
        })
        if (col === 1) y = rowY + 22
        y += 6
      }

      // ===== BILANS DÉTAILLÉS =====
      if (groupes.length > 0) {
        checkPage(15)
        rect(margin, y, 3, 7, VERT, 1)
        txt('Bilans sanguins detailles', margin + 5, y + 5.5, 11, NOIR, 'bold')
        y += 10

        groupes.forEach(([date, valeurs]) => {
          checkPage(22)
          const nbAn = valeurs.filter(v => isAnormal(v.valeur, v.normal_min, v.normal_max)).length

          rect(margin, y, contentW, 7.5, GRIS_CLAIR, 2)
          txt(formatDate(date), margin + 3, y + 5.5, 9, NOIR, 'bold')
          if (nbAn > 0) {
            rect(margin + contentW - 40, y + 1.5, 38, 5, [254, 226, 226], 2)
            txt(`⚠ ${nbAn} anormal${nbAn > 1 ? 'aux' : ''}`, margin + contentW - 39, y + 5.5, 7.5, ROUGE, 'bold')
          } else {
            rect(margin + contentW - 28, y + 1.5, 26, 5, [209, 250, 229], 2)
            txt('✓ Tout normal', margin + contentW - 27, y + 5.5, 7.5, VERT, 'bold')
          }
          y += 7.5

          rect(margin, y, contentW, 6.5, VERT)
          const cAn = [52, 22, 20, 42, 28]
          const hAn = ['Analyse', 'Valeur', 'Unite', 'Plage normale', 'Statut']
          let xc = margin + 2
          hAn.forEach((h, i) => { txt(h, xc, y + 4.8, 7.5, BLANC, 'bold'); xc += cAn[i] })
          y += 6.5

          valeurs.forEach((a, idx) => {
            checkPage(6.5)
            const an = isAnormal(a.valeur, a.normal_min, a.normal_max)
            rect(margin, y, contentW, 6.5, an ? [255, 245, 245] : idx % 2 === 0 ? BLANC : GRIS_CLAIR)
            xc = margin + 2
            const row = [a.type, String(a.valeur), a.unite || '—', a.normal_min !== null ? `${a.normal_min}-${a.normal_max}` : '—', an ? '⚠ Anormal' : '✓ Normal']
            row.forEach((v, i) => {
              const c = i === 1 || i === 4 ? (an ? ROUGE : VERT) : NOIR
              txt(v, xc, y + 4.6, 7.5, c, i === 1 || i === 4 ? 'bold' : 'normal', cAn[i] - 2)
              xc += cAn[i]
            })
            y += 6.5
          })
          y += 5
        })
      }

      // ===== SYMPTÔMES =====
      if (symptomesFiltres.length > 0) {
        checkPage(15)
        rect(margin, y, 3, 7, ORANGE, 1)
        txt('Symptomes', margin + 5, y + 5.5, 11, NOIR, 'bold')
        y += 10

        rect(margin, y, contentW, 6.5, ORANGE, 2)
        const cSym = [42, 58, 22, 58]
        const hSym = ['Date', 'Symptome', 'Int.', 'Note']
        let xc = margin + 2
        hSym.forEach((h, i) => { txt(h, xc, y + 4.8, 7.5, BLANC, 'bold'); xc += cSym[i] })
        y += 6.5

        symptomesFiltres.forEach((s, idx) => {
          checkPage(6.5)
          rect(margin, y, contentW, 6.5, idx % 2 === 0 ? BLANC : [255, 251, 235])
          xc = margin + 2
          const row = [formatDate(s.date), s.type, `${s.intensite}/5`, s.note || '—']
          row.forEach((v, i) => {
            const c = i === 2 ? (s.intensite >= 4 ? ROUGE : s.intensite === 3 ? ORANGE : VERT) : NOIR
            txt(v, xc, y + 4.6, 7.5, c, i === 2 ? 'bold' : 'normal', cSym[i] - 2)
            xc += cSym[i]
          })
          y += 6.5
        })
      }

      // ===== PIED DE PAGE =====
      const total = pdf.getNumberOfPages()
      for (let i = 1; i <= total; i++) {
        pdf.setPage(i)
        rect(0, pageH - 10, pageW, 10, GRIS_CLAIR)
        txt('CrohnTrack — Cree par Damien Chereau — Ne remplace pas un avis medical', margin, pageH - 4, 6.5, GRIS)
        pdf.setFontSize(7)
        pdf.setTextColor(...GRIS)
        pdf.setFont('helvetica', 'bold')
        pdf.text(`Page ${i} / ${total}`, pageW - margin, pageH - 4)
      }

      pdf.save(`rapport-crohn-${dateDebut}-${dateFin}.pdf`)
      setGenerating(false)
    }, 50)
  }

  if (loading) return <div className="px-6 py-8 text-slate-500 dark:text-gray-500">Chargement...</div>

  const analysesFiltrees = filtrer(analyses)
  const symptomesFiltres = filtrer(symptomes)
  const groupes = (() => {
    const g = {}
    analysesFiltrees.forEach(a => { if (!g[a.date]) g[a.date] = []; g[a.date].push(a) })
    return Object.entries(g).sort((a, b) => new Date(b[0]) - new Date(a[0]))
  })()
  const anormauxTotal = analysesFiltrees.filter(a => isAnormal(a.valeur, a.normal_min, a.normal_max))

  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">📄 Rapport médecin</h2>
          <p className="text-slate-500 dark:text-gray-400">Génère un rapport PDF professionnel à partager avec ton médecin.</p>
        </div>
        <button onClick={generatePDF} disabled={generating}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl transition disabled:opacity-50 flex items-center gap-2">
          {generating ? '⏳ Génération...' : '⬇️ Télécharger PDF'}
        </button>
      </div>

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

      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm dark:shadow-none">
        <h3 className="font-bold text-slate-900 dark:text-white mb-6">👁️ Aperçu du rapport</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Bilans', valeur: groupes.length, couleur: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'Anomalies', valeur: anormauxTotal.length, couleur: anormauxTotal.length > 0 ? 'text-red-500' : 'text-emerald-500', bg: anormauxTotal.length > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'Symptômes', valeur: symptomesFiltres.length, couleur: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Traitements', valeur: medicaments.length, couleur: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-900/20' },
          ].map(item => (
            <div key={item.label} className={`${item.bg} rounded-2xl p-5 text-center`}>
              <p className={`text-3xl font-bold ${item.couleur}`}>{item.valeur}</p>
              <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-5 text-center">
          <p className="text-slate-500 dark:text-gray-400 text-sm mb-4">
            Le PDF inclut : entête avec tes informations, résumé des valeurs, bilans détaillés, symptômes et traitements.
          </p>
          <button onClick={generatePDF} disabled={generating}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-3 rounded-xl transition disabled:opacity-50">
            {generating ? '⏳ Génération...' : '⬇️ Télécharger le rapport PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Rapport