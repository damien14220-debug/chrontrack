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

    const analysesFiltrees = filtrer(analyses)
    const symptomesFiltres = filtrer(symptomes)

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = 210
    const pageH = 297
    const margin = 15
    const contentW = pageW - margin * 2
    let y = margin

    // Couleurs
    const VERT = [5, 150, 105]
    const BLEU = [14, 165, 233]
    const ROUGE = [239, 68, 68]
    const ORANGE = [217, 119, 6]
    const GRIS = [107, 114, 128]
    const GRIS_CLAIR = [249, 250, 251]
    const BLANC = [255, 255, 255]
    const NOIR = [17, 24, 39]

    const checkPage = (needed = 10) => {
      if (y + needed > pageH - margin) {
        pdf.addPage()
        y = margin
      }
    }

    const drawRect = (x, ry, w, h, color, radius = 0) => {
      pdf.setFillColor(...color)
      pdf.roundedRect(x, ry, w, h, radius, radius, 'F')
    }

    const writeText = (text, x, ry, size, color, style = 'normal', maxWidth = null) => {
      pdf.setFontSize(size)
      pdf.setTextColor(...color)
      pdf.setFont('helvetica', style)
      if (maxWidth) {
        const lines = pdf.splitTextToSize(String(text), maxWidth)
        pdf.text(lines, x, ry)
        return lines.length * size * 0.4
      }
      pdf.text(String(text), x, ry)
      return size * 0.4
    }

    // ===== EN-TÊTE =====
    drawRect(margin, y, contentW, 35, VERT, 4)
    writeText('CrohnTrack', margin + 5, y + 10, 20, BLANC, 'bold')
    writeText('Rapport de suivi medical - Maladie de Crohn', margin + 5, y + 17, 10, [200, 240, 220])
    writeText(nomPatient || 'Patient', margin + contentW - 5, y + 9, 13, BLANC, 'bold')
    pdf.setFont('helvetica', 'normal')
    writeText(`${formatDate(dateDebut)} - ${formatDate(dateFin)}`, margin + contentW - 5, y + 15, 9, [200, 240, 220])
    writeText(`Genere le ${formatDate(new Date().toISOString().split('T')[0])}`, margin + contentW - 5, y + 20, 8, [180, 220, 200])
    // Alignement droite
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(13)
    pdf.setTextColor(255, 255, 255)
    const nomW = pdf.getTextWidth(nomPatient || 'Patient')
    pdf.text(nomPatient || 'Patient', pageW - margin - nomW, y + 9)
    y += 42

    // ===== RÉSUMÉ =====
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

    const carteW = (contentW - 9) / 4
    cartes.forEach((c, i) => {
      const x = margin + i * (carteW + 3)
      drawRect(x, y, carteW, 22, c.bg, 3)
      pdf.setFontSize(16)
      pdf.setTextColor(...c.couleur)
      pdf.setFont('helvetica', 'bold')
      const numW = pdf.getTextWidth(String(c.valeur))
      pdf.text(String(c.valeur), x + carteW / 2 - numW / 2, y + 11)
      pdf.setFontSize(8)
      pdf.setTextColor(...GRIS)
      pdf.setFont('helvetica', 'normal')
      const lblW = pdf.getTextWidth(c.label)
      pdf.text(c.label, x + carteW / 2 - lblW / 2, y + 18)
    })
    y += 28

    // ===== TRAITEMENTS =====
    if (medicaments.length > 0) {
      checkPage(20)
      drawRect(margin, y, 3, 8, BLEU, 1)
      writeText('Traitements en cours', margin + 6, y + 6, 13, NOIR, 'bold')
      y += 12

      // En-tête tableau
      drawRect(margin, y, contentW, 8, BLEU, 2)
      const colsMed = [55, 35, 55, 40]
      const headersMed = ['Medicament', 'Dosage', 'Frequence', 'Depuis']
      let xCol = margin + 2
      headersMed.forEach((h, i) => {
        writeText(h, xCol, y + 5.5, 8, BLANC, 'bold')
        xCol += colsMed[i]
      })
      y += 8

      medicaments.forEach((med, idx) => {
        checkPage(8)
        drawRect(margin, y, contentW, 7, idx % 2 === 0 ? BLANC : GRIS_CLAIR, 0)
        xCol = margin + 2
        const rowData = [med.nom, med.dosage, med.frequence || '—', formatDate(med.date_debut) || '—']
        rowData.forEach((val, i) => {
          writeText(val, xCol, y + 5, 8, i === 0 ? [3, 105, 161] : NOIR, i === 0 ? 'bold' : 'normal', colsMed[i] - 2)
          xCol += colsMed[i]
        })
        y += 7
      })
      y += 8
    }

    // ===== RÉSUMÉ VALEURS =====
    const typesUniques = [...new Set(analysesFiltrees.map(a => a.type))]
    if (typesUniques.length > 0) {
      checkPage(20)
      drawRect(margin, y, 3, 8, VERT, 1)
      writeText('Resume des dernieres valeurs', margin + 6, y + 6, 13, NOIR, 'bold')
      y += 12

      const barW = (contentW - 6) / 2
      let col = 0
      let rowY = y

      typesUniques.forEach(type => {
        const valeursType = analysesFiltrees.filter(a => a.type === type)
        const derniere = valeursType[valeursType.length - 1]
        if (!derniere) return

        const anormal = isAnormal(derniere.valeur, derniere.normal_min, derniere.normal_max)
        const x = margin + col * (barW + 6)

        checkPage(20)
        if (col === 0) rowY = y

        drawRect(x, rowY, barW, 18, anormal ? [254, 242, 242] : GRIS_CLAIR, 3)

        writeText(type, x + 3, rowY + 5, 8, NOIR, 'bold', barW - 20)
        pdf.setFontSize(9)
        pdf.setTextColor(...(anormal ? ROUGE : VERT))
        pdf.setFont('helvetica', 'bold')
        const valStr = `${derniere.valeur} ${derniere.unite || ''}`
        const valW = pdf.getTextWidth(valStr)
        pdf.text(valStr, x + barW - valW - 3, rowY + 5)

        if (derniere.normal_min !== null && derniere.normal_max !== null) {
          const pct = Math.min(1, Math.max(0, derniere.valeur / derniere.normal_max))
          drawRect(x + 3, rowY + 8, barW - 6, 3, [229, 231, 235], 1)
          drawRect(x + 3, rowY + 8, (barW - 6) * pct, 3, anormal ? ROUGE : VERT, 1)
          writeText(`Normal: ${derniere.normal_min}-${derniere.normal_max}`, x + 3, rowY + 16, 7, GRIS)
        }

        col++
        if (col === 2) {
          col = 0
          y = rowY + 22
        }
      })

      if (col === 1) y = rowY + 22
      y += 6
    }

    // ===== BILANS DÉTAILLÉS =====
    if (groupes.length > 0) {
      checkPage(20)
      drawRect(margin, y, 3, 8, VERT, 1)
      writeText('Bilans sanguins détaillés', margin + 6, y + 6, 13, NOIR, 'bold')
      y += 12

      groupes.forEach(([date, valeurs]) => {
        checkPage(25)
        const nbAnormaux = valeurs.filter(v => isAnormal(v.valeur, v.normal_min, v.normal_max)).length

        drawRect(margin, y, contentW, 8, GRIS_CLAIR, 2)
        writeText(`  ${formatDate(date)}`, margin + 2, y + 5.5, 9, NOIR, 'bold')
        if (nbAnormaux > 0) {
          drawRect(margin + contentW - 42, y + 1, 40, 6, [254, 226, 226], 2)
          writeText(`⚠ ${nbAnormaux} anormal${nbAnormaux > 1 ? 'aux' : ''}`, margin + contentW - 41, y + 5.5, 7, ROUGE, 'bold')
        } else {
          drawRect(margin + contentW - 30, y + 1, 28, 6, [209, 250, 229], 2)
          writeText('✓ Normal', margin + contentW - 29, y + 5.5, 7, VERT, 'bold')
        }
        y += 9

        // En-tête
        drawRect(margin, y, contentW, 7, VERT, 0)
        const colsAn = [55, 22, 20, 40, 30]
        const headersAn = ['Analyse', 'Valeur', 'Unite', 'Plage normale', 'Statut']
        xCol = margin + 2
        headersAn.forEach((h, i) => {
          writeText(h, xCol, y + 5, 7.5, BLANC, 'bold')
          xCol += colsAn[i]
        })
        y += 7

        valeurs.forEach((a, idx) => {
          checkPage(7)
          const anormal = isAnormal(a.valeur, a.normal_min, a.normal_max)
          drawRect(margin, y, contentW, 6.5, anormal ? [254, 242, 242] : idx % 2 === 0 ? BLANC : GRIS_CLAIR, 0)
          xCol = margin + 2
          const rowData = [
            a.type,
            String(a.valeur),
            a.unite || '—',
            a.normal_min !== null ? `${a.normal_min} - ${a.normal_max}` : '—',
            anormal ? '⚠ Anormal' : '✓ Normal'
          ]
          rowData.forEach((val, i) => {
            const color = i === 1 ? (anormal ? ROUGE : VERT) : i === 4 ? (anormal ? ROUGE : VERT) : NOIR
            writeText(val, xCol, y + 4.5, 7.5, color, i === 1 || i === 4 ? 'bold' : 'normal', colsAn[i] - 2)
            xCol += colsAn[i]
          })
          y += 6.5
        })
        y += 6
      })
    }

    // ===== SYMPTÔMES =====
    if (symptomesFiltres.length > 0) {
      checkPage(20)
      drawRect(margin, y, 3, 8, ORANGE, 1)
      writeText('Symptomes', margin + 6, y + 6, 13, NOIR, 'bold')
      y += 12

      drawRect(margin, y, contentW, 7, ORANGE, 2)
      const colsSym = [45, 55, 22, 55]
      const headersSym = ['Date', 'Symptome', 'Intensite', 'Note']
      xCol = margin + 2
      headersSym.forEach((h, i) => {
        writeText(h, xCol, y + 5, 7.5, BLANC, 'bold')
        xCol += colsSym[i]
      })
      y += 7

      symptomesFiltres.forEach((s, idx) => {
        checkPage(7)
        drawRect(margin, y, contentW, 6.5, idx % 2 === 0 ? BLANC : [255, 251, 235], 0)
        xCol = margin + 2
        const rowData = [formatDate(s.date), s.type, `${s.intensite}/5`, s.note || '—']
        rowData.forEach((val, i) => {
          const color = i === 2 ? (s.intensite >= 4 ? ROUGE : s.intensite === 3 ? ORANGE : VERT) : NOIR
          writeText(val, xCol, y + 4.5, 7.5, color, i === 2 ? 'bold' : 'normal', colsSym[i] - 2)
          xCol += colsSym[i]
        })
        y += 6.5
      })
      y += 6
    }

    // ===== PIED DE PAGE =====
    const totalPages = pdf.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      drawRect(0, pageH - 12, pageW, 12, [249, 250, 251], 0)
      pdf.setDrawColor(229, 231, 235)
      pdf.line(0, pageH - 12, pageW, pageH - 12)
      writeText('CrohnTrack — Cree par Damien Chereau — Ce rapport ne remplace pas un avis medical', pageW / 2, pageH - 5, 7, GRIS)
      pdf.setFontSize(7)
      pdf.setTextColor(...GRIS)
      pdf.text(`Page ${i} / ${totalPages}`, pageW - margin, pageH - 5)
    }

    pdf.save(`rapport-crohn-${dateDebut}-${dateFin}.pdf`)
    setGenerating(false)
  }

  if (loading) return <div className="px-6 py-8 text-slate-500 dark:text-gray-500">Chargement...</div>

  const analysesFiltrees = filtrer(analyses)
  const symptomesFiltres = filtrer(symptomes)
  const groupes = (() => {
    const g = {}
    analysesFiltrees.forEach(a => { if (!g[a.date]) g[a.date] = []; g[a.date].push(a) })
    return Object.entries(g).sort((a, b) => new Date(b[0]) - new Date(a[0]))
  })()
  const anormauxTotal = analysesFiltrees.filter(a => {
    return a.normal_min !== null && a.normal_max !== null && (a.valeur < a.normal_min || a.valeur > a.normal_max)
  })

  return (
    <div className="px-6 py-8">

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">📄 Rapport médecin</h2>
          <p className="text-slate-500 dark:text-gray-400">Génère un rapport PDF professionnel à partager avec ton médecin.</p>
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

      {/* Aperçu */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm dark:shadow-none">
        <h3 className="font-bold text-slate-900 dark:text-white mb-6">👁️ Aperçu du rapport</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Bilans', valeur: groupes.length, couleur: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'Anomalies', valeur: anormauxTotal.length, couleur: anormauxTotal.length > 0 ? 'text-red-500' : 'text-emerald-500', bg: anormauxTotal.length > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'Symptômes', valeur: symptomesFiltres.length, couleur: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Traitements', valeur: medicaments.length, couleur: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-900/20' },
          ].map(item => (
            <div key={item.label} className={`${item.bg} rounded-xl p-4 text-center`}>
              <p className={`text-3xl font-bold ${item.couleur}`}>{item.valeur}</p>
              <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-4 text-center">
          <p className="text-slate-500 dark:text-gray-400 text-sm mb-3">
            Le PDF sera généré avec toutes tes données pour la période sélectionnée — bilans, résumé des valeurs, symptômes et traitements.
          </p>
          <button
            onClick={generatePDF}
            disabled={generating}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-3 rounded-xl transition disabled:opacity-50"
          >
            {generating ? '⏳ Génération en cours...' : '⬇️ Télécharger le rapport PDF'}
          </button>
        </div>
      </div>

    </div>
  )
}

export default Rapport