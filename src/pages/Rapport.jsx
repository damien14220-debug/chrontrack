import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import jsPDF from 'jspdf'

function Rapport() {
  const [analyses, setAnalyses] = useState([])
  const [symptomes, setSymptomes] = useState([])
  const [medicaments, setMedicaments] = useState([])
  const [sport, setSport] = useState([])
  const [evenements, setEvenements] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [nomPatient, setNomPatient] = useState('')

  useEffect(() => {
    const today = new Date()
    const il90jours = new Date(today)
    il90jours.setDate(today.getDate() - 90)
    setDateFin(today.toISOString().split('T')[0])
    setDateDebut(il90jours.toISOString().split('T')[0])
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [
      { data: analysesData },
      { data: symptomesData },
      { data: medicamentsData },
      { data: sportData },
      { data: evenementsData },
    ] = await Promise.all([
      supabase.from('analyses').select('*').order('date', { ascending: true }),
      supabase.from('symptomes').select('*').order('date', { ascending: false }),
      supabase.from('medicaments').select('*'),
      supabase.from('sport').select('*').order('date', { ascending: false }),
      supabase.from('evenements_medicaux').select('*').order('date_debut', { ascending: false }),
    ])
    if (analysesData) setAnalyses(analysesData)
    if (symptomesData) setSymptomes(symptomesData)
    if (medicamentsData) setMedicaments(medicamentsData)
    if (sportData) setSport(sportData)
    if (evenementsData) setEvenements(evenementsData)
    setLoading(false)
  }

  const todayStr = new Date().toISOString().split('T')[0]

  const isAnormal = (valeur, min, max) => {
    if (min === null || max === null) return false
    return valeur < min || valeur > max
  }

  const filtrer = (data) => {
    if (!dateDebut || !dateFin) return data
    return data.filter(d => d.date >= dateDebut && d.date <= dateFin)
  }

  // Un événement est inclus s'il chevauche la période sélectionnée
  const filtrerEvenements = (data) => {
    if (!dateDebut || !dateFin) return data
    return data.filter(e => {
      const debut = e.date_debut
      const fin = e.date_fin || e.date_debut
      return debut <= dateFin && fin >= dateDebut
    })
  }

  // Traitements en cours = pas de date de fin OU fin à venir
  const estEnCours = (m) => !m.date_fin || m.date_fin >= todayStr

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const formatDateCourt = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatDuree = (min) => {
    if (!min) return '0 min'
    const h = Math.floor(min / 60)
    const m = Math.round(min % 60)
    if (h === 0) return `${m} min`
    return m === 0 ? `${h}h` : `${h}h${m < 10 ? '0' + m : m}`
  }

  const generatePDF = () => {
    setGenerating(true)

    setTimeout(() => {
      const analysesFiltrees = filtrer(analyses)
      const symptomesFiltres = filtrer(symptomes)
      const sportFiltres = filtrer(sport)
      const evenementsFiltres = filtrerEvenements(evenements)
      const medsEnCours = medicaments.filter(estEnCours)
      const medsHistorique = medicaments
        .filter(m => !estEnCours(m) && (!dateDebut || m.date_fin >= dateDebut))
        .sort((a, b) => new Date(b.date_fin) - new Date(a.date_fin))

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
      const VIOLET = [124, 58, 237]
      const INDIGO = [79, 70, 229]
      const INDIGO_FONCE = [67, 56, 202]
      const GRIS = [107, 114, 128]
      const GRIS_TEXTE = [55, 65, 81]
      const GRIS_CLAIR = [246, 248, 250]
      const BORDURE = [226, 232, 240]
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
        if (r > 0) pdf.roundedRect(x, ry, w, h, r, r, 'F')
        else pdf.rect(x, ry, w, h, 'F')
      }

      const txt = (text, x, ry, size, color, style = 'normal', maxW = null) => {
        pdf.setFontSize(size)
        pdf.setTextColor(...color)
        pdf.setFont('helvetica', style)
        const str = String(text)
        if (maxW) pdf.text(pdf.splitTextToSize(str, maxW), x, ry)
        else pdf.text(str, x, ry)
      }

      // Texte multi-ligne : renvoie la hauteur consommée (mm)
      const wrapped = (text, x, ry, size, color, style, maxW, lineH = 4) => {
        pdf.setFontSize(size)
        pdf.setFont('helvetica', style)
        pdf.setTextColor(...color)
        const lines = pdf.splitTextToSize(String(text), maxW)
        pdf.text(lines, x, ry)
        return lines.length * lineH
      }

      // Tronque un texte sur une seule ligne avec …
      const truncate = (text, maxW, size, style = 'normal') => {
        pdf.setFontSize(size)
        pdf.setFont('helvetica', style)
        let s = String(text)
        if (pdf.getTextWidth(s) <= maxW) return s
        while (s.length > 1 && pdf.getTextWidth(s + '…') > maxW) s = s.slice(0, -1)
        return s + '…'
      }

      // Titre de section homogène
      const sectionTitle = (label, color) => {
        checkPage(16)
        rect(margin, y, 3, 7, color, 1)
        txt(label, margin + 6, y + 5.5, 11.5, NOIR, 'bold')
        y += 9
        rect(margin, y, contentW, 0.3, BORDURE)
        y += 4
      }

      // En-tête de tableau
      const tableHeader = (labels, colW, color) => {
        checkPage(9)
        rect(margin, y, contentW, 7, color, 2)
        let xc = margin + 2
        labels.forEach((h, i) => { txt(h, xc, y + 4.8, 7.5, BLANC, 'bold'); xc += colW[i] })
        y += 7
      }

      // Ligne de tableau à hauteur automatique (aucun chevauchement possible)
      const tableRow = (cells, colW, bg, size = 7.5) => {
        const lineH = 3.8
        let maxLines = 1
        const prepared = cells.map((c, i) => {
          pdf.setFontSize(size)
          pdf.setFont('helvetica', c.style || 'normal')
          const val = (c.text === null || c.text === undefined || c.text === '') ? '—' : String(c.text)
          const lines = pdf.splitTextToSize(val, colW[i] - 3)
          if (lines.length > maxLines) maxLines = lines.length
          return lines
        })
        const rowH = maxLines * lineH + 2.8
        checkPage(rowH)
        rect(margin, y, contentW, rowH, bg)
        let xc = margin + 2
        prepared.forEach((lines, i) => {
          pdf.setFontSize(size)
          pdf.setFont('helvetica', cells[i].style || 'normal')
          pdf.setTextColor(...(cells[i].color || NOIR))
          pdf.text(lines, xc, y + 3.7)
          xc += colW[i]
        })
        y += rowH
      }

      // ===== EN-TÊTE =====
      rect(margin, y, contentW, 35, VERT, 4)
      txt('CrohnTrack', margin + 5, y + 13, 20, BLANC, 'bold')
      txt('Rapport de suivi medical - Maladie de Crohn', margin + 5, y + 21, 9, [200, 240, 220], 'italic')
      txt('crohntrack.fr', margin + 5, y + 28, 8, [160, 220, 190])

      pdf.setFontSize(13); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...BLANC)
      const nomStr = nomPatient || 'Patient'
      pdf.text(nomStr, pageW - margin - pdf.getTextWidth(nomStr) - 3, y + 13)

      pdf.setFontSize(8); pdf.setFont('helvetica', 'italic'); pdf.setTextColor(200, 240, 220)
      const periodeStr = `Du ${formatDate(dateDebut)} au ${formatDate(dateFin)}`
      pdf.text(periodeStr, pageW - margin - pdf.getTextWidth(periodeStr) - 3, y + 21)

      pdf.setFontSize(7); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(160, 210, 185)
      const dateGenStr = `Genere le ${formatDate(todayStr)}`
      pdf.text(dateGenStr, pageW - margin - pdf.getTextWidth(dateGenStr) - 3, y + 28)
      y += 42

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
        { label: 'Traitements', valeur: medsEnCours.length, couleur: BLEU, bg: [224, 242, 254] },
        { label: 'Evenements', valeur: evenementsFiltres.length, couleur: INDIGO, bg: [224, 231, 255] },
      ]
      const cW = (contentW - 12) / 5
      cartes.forEach((c, i) => {
        const x = margin + i * (cW + 3)
        rect(x, y, cW, 21, c.bg, 3)
        txt(String(c.valeur), x + 4, y + 12, 16, c.couleur, 'bold')
        txt(c.label, x + 4, y + 18, 7, GRIS)
      })
      y += 28

      // ===== ÉVÉNEMENTS MÉDICAUX =====
      if (evenementsFiltres.length > 0) {
        sectionTitle('Evenements medicaux', INDIGO)
        const evTries = [...evenementsFiltres].sort((a, b) => new Date(b.date_debut) - new Date(a.date_debut))

        evTries.forEach(ev => {
          checkPage(20)
          const dateStr = ev.date_fin && ev.date_fin !== ev.date_debut
            ? `${formatDate(ev.date_debut)}  ->  ${formatDate(ev.date_fin)}`
            : formatDate(ev.date_debut)

          // Bandeau date
          rect(margin, y, contentW, 8, [238, 242, 255], 2)
          txt(dateStr, margin + 3, y + 5.4, 8.5, INDIGO_FONCE, 'bold')
          y += 8

          // Titre
          if (ev.titre) {
            y += 2
            y += wrapped(ev.titre, margin + 3, y + 2, 9.5, NOIR, 'bold', contentW - 6, 4.6)
          }
          // Type
          if (ev.type) {
            txt(`Type : ${ev.type}`, margin + 3, y + 3.5, 7.5, GRIS, 'italic')
            y += 5
          }
          // Description
          if (ev.description) {
            y += 1
            y += wrapped(ev.description, margin + 3, y + 2.5, 7.5, GRIS_TEXTE, 'normal', contentW - 6, 4)
            y += 1
          }
          // Résultats
          if (ev.resultats) {
            checkPage(10)
            y += 1
            txt('Resultats', margin + 3, y + 3, 7.5, INDIGO, 'bold')
            y += 4
            y += wrapped(ev.resultats, margin + 3, y + 2, 7.5, GRIS_TEXTE, 'normal', contentW - 6, 4)
          }
          y += 6
        })
        y += 2
      }

      // ===== TRAITEMENTS EN COURS =====
      if (medsEnCours.length > 0) {
        sectionTitle('Traitements en cours', BLEU)
        const colW = [50, 28, 45, 47]
        tableHeader(['Medicament', 'Dosage', 'Frequence', 'Periode'], colW, BLEU)
        medsEnCours.forEach((med, idx) => {
          const periode = med.date_fin
            ? `${formatDateCourt(med.date_debut)} -> ${formatDateCourt(med.date_fin)}`
            : `Depuis ${formatDateCourt(med.date_debut)}`
          tableRow([
            { text: med.nom, color: [3, 105, 161], style: 'bold' },
            { text: med.dosage },
            { text: med.frequence },
            { text: periode },
          ], colW, idx % 2 === 0 ? BLANC : GRIS_CLAIR)
        })
        y += 6
      }

      // ===== HISTORIQUE DES TRAITEMENTS =====
      if (medsHistorique.length > 0) {
        sectionTitle('Historique des traitements', GRIS)
        const colW = [50, 28, 92]
        tableHeader(['Medicament', 'Dosage', 'Periode'], colW, GRIS)
        medsHistorique.forEach((med, idx) => {
          const periode = `${formatDateCourt(med.date_debut)}  ->  ${formatDateCourt(med.date_fin)}`
          tableRow([
            { text: med.nom, style: 'bold' },
            { text: med.dosage, color: GRIS_TEXTE },
            { text: periode, color: GRIS_TEXTE },
          ], colW, idx % 2 === 0 ? BLANC : GRIS_CLAIR)
        })
        y += 6
      }

      // ===== RÉSUMÉ VALEURS =====
      const typesUniques = [...new Set(analysesFiltrees.map(a => a.type))]
      if (typesUniques.length > 0) {
        sectionTitle('Resume des dernieres valeurs', VERT)
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
          txt(truncate(type, bW - 30, 8, 'bold'), x + 3, rowY + 6, 8, NOIR, 'bold')
          const valStr = `${last.valeur} ${last.unite || ''}`
          pdf.setFontSize(9); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...(anormal ? ROUGE : VERT))
          pdf.text(valStr, x + bW - pdf.getTextWidth(valStr) - 3, rowY + 6)

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
        sectionTitle('Bilans sanguins detailles', VERT)
        const colW = [52, 22, 20, 42, 28]

        groupes.forEach(([date, valeurs]) => {
          checkPage(22)
          const nbAn = valeurs.filter(v => isAnormal(v.valeur, v.normal_min, v.normal_max)).length

          rect(margin, y, contentW, 7.5, GRIS_CLAIR, 2)
          txt(formatDate(date), margin + 3, y + 5.3, 9, NOIR, 'bold')
          if (nbAn > 0) {
            rect(margin + contentW - 40, y + 1.5, 38, 5, [254, 226, 226], 2)
            txt(`${nbAn} anormal${nbAn > 1 ? 'aux' : ''}`, margin + contentW - 37, y + 5, 7.5, ROUGE, 'bold')
          } else {
            rect(margin + contentW - 28, y + 1.5, 26, 5, [209, 250, 229], 2)
            txt('Tout normal', margin + contentW - 25, y + 5, 7.5, VERT, 'bold')
          }
          y += 7.5

          tableHeader(['Analyse', 'Valeur', 'Unite', 'Plage normale', 'Statut'], colW, VERT)
          valeurs.forEach((a, idx) => {
            const an = isAnormal(a.valeur, a.normal_min, a.normal_max)
            const statutColor = an ? ROUGE : VERT
            tableRow([
              { text: a.type },
              { text: a.valeur, color: statutColor, style: 'bold' },
              { text: a.unite },
              { text: a.normal_min !== null ? `${a.normal_min} - ${a.normal_max}` : '—' },
              { text: an ? 'Anormal' : 'Normal', color: statutColor, style: 'bold' },
            ], colW, an ? [255, 245, 245] : idx % 2 === 0 ? BLANC : GRIS_CLAIR)
          })
          y += 5
        })
      }

      // ===== SYMPTÔMES =====
      if (symptomesFiltres.length > 0) {
        sectionTitle('Symptomes', ORANGE)
        const colW = [40, 52, 20, 68]
        tableHeader(['Date', 'Symptome', 'Int.', 'Note'], colW, ORANGE)
        symptomesFiltres.forEach((s, idx) => {
          const intColor = s.intensite >= 4 ? ROUGE : s.intensite === 3 ? ORANGE : VERT
          tableRow([
            { text: formatDateCourt(s.date) },
            { text: s.type, style: 'bold' },
            { text: `${s.intensite}/5`, color: intColor, style: 'bold' },
            { text: s.note },
          ], colW, idx % 2 === 0 ? BLANC : [255, 251, 235])
        })
        y += 6
      }

      // ===== ACTIVITÉ PHYSIQUE =====
      if (sportFiltres.length > 0) {
        sectionTitle('Activite physique', VIOLET)

        const totalSeances = sportFiltres.length
        const totalDist = sportFiltres.reduce((sum, s) => sum + (Number(s.distance) || 0), 0)
        const totalDuree = sportFiltres.reduce((sum, s) => sum + (Number(s.duree) || 0), 0)
        const ressentis = sportFiltres.map(s => Number(s.sensation_ventre)).filter(v => !Number.isNaN(v))
        const ressentiMoy = ressentis.length ? ressentis.reduce((a, b) => a + b, 0) / ressentis.length : null

        const synth = [
          { label: 'Seances', val: totalSeances },
          { label: 'Distance', val: totalDist > 0 ? `${totalDist.toFixed(1)} km` : '—' },
          { label: 'Duree totale', val: formatDuree(totalDuree) },
          { label: 'Ressenti ventre', val: ressentiMoy !== null ? `${ressentiMoy.toFixed(1)}/5` : '—' },
        ]
        const sW = (contentW - 9) / 4
        synth.forEach((c, i) => {
          const x = margin + i * (sW + 3)
          rect(x, y, sW, 16, GRIS_CLAIR, 3)
          txt(String(c.val), x + 3, y + 8, 11, VIOLET, 'bold')
          txt(c.label, x + 3, y + 13.5, 6.5, GRIS)
        })
        y += 22

        const parType = {}
        sportFiltres.forEach(s => {
          const key = s.sport || 'Autre'
          if (!parType[key]) parType[key] = { nb: 0, distance: 0, duree: 0 }
          parType[key].nb++
          parType[key].distance += Number(s.distance) || 0
          parType[key].duree += Number(s.duree) || 0
        })
        const typesTries = Object.entries(parType).sort((a, b) => b[1].nb - a[1].nb)

        if (typesTries.length > 0) {
          const colW = [70, 30, 45, 35]
          tableHeader(['Activite', 'Seances', 'Distance', 'Duree'], colW, VIOLET)
          typesTries.forEach(([type, d], idx) => {
            tableRow([
              { text: type, color: [109, 40, 217], style: 'bold' },
              { text: String(d.nb) },
              { text: d.distance > 0 ? `${d.distance.toFixed(1)} km` : '—' },
              { text: formatDuree(d.duree) },
            ], colW, idx % 2 === 0 ? BLANC : GRIS_CLAIR)
          })
          y += 6
        }
      }

      // ===== PIED DE PAGE =====
      const total = pdf.getNumberOfPages()
      for (let i = 1; i <= total; i++) {
        pdf.setPage(i)
        rect(0, pageH - 10, pageW, 10, GRIS_CLAIR)
        txt('CrohnTrack — Cree par Damien Chereau — Ne remplace pas un avis medical', margin, pageH - 4, 6.5, GRIS)
        pdf.setFontSize(7); pdf.setTextColor(...GRIS); pdf.setFont('helvetica', 'bold')
        pdf.text(`Page ${i} / ${total}`, pageW - margin, pageH - 4)
      }

      pdf.save(`rapport-crohn-${dateDebut}-${dateFin}.pdf`)
      setGenerating(false)
    }, 50)
  }

  if (loading) return <div className="px-6 py-8 text-slate-500 dark:text-gray-500">Chargement...</div>

  const analysesFiltrees = filtrer(analyses)
  const symptomesFiltres = filtrer(symptomes)
  const evenementsFiltres = filtrerEvenements(evenements)
  const medsEnCours = medicaments.filter(estEnCours)
  const evenementsHorsPeriode = evenements.length - evenementsFiltres.length
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
        {evenementsHorsPeriode > 0 && (
          <div className="mt-4 flex items-start gap-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/30 rounded-xl px-4 py-3">
            <span className="text-lg">ℹ️</span>
            <p className="text-indigo-700 dark:text-indigo-300 text-sm">
              {evenementsHorsPeriode} événement{evenementsHorsPeriode > 1 ? 's' : ''} médical{evenementsHorsPeriode > 1 ? 'aux' : ''} en dehors de la période sélectionnée
              {' '}(ex. hospitalisation). Élargis la <strong>date de début</strong> pour l'inclure dans le rapport.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm dark:shadow-none">
        <h3 className="font-bold text-slate-900 dark:text-white mb-6">👁️ Aperçu du rapport</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Bilans', valeur: groupes.length, couleur: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'Anomalies', valeur: anormauxTotal.length, couleur: anormauxTotal.length > 0 ? 'text-red-500' : 'text-emerald-500', bg: anormauxTotal.length > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'Symptômes', valeur: symptomesFiltres.length, couleur: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Traitements', valeur: medsEnCours.length, couleur: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-900/20' },
            { label: 'Événements', valeur: evenementsFiltres.length, couleur: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          ].map(item => (
            <div key={item.label} className={`${item.bg} rounded-2xl p-5 text-center`}>
              <p className={`text-3xl font-bold ${item.couleur}`}>{item.valeur}</p>
              <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-5 text-center">
          <p className="text-slate-500 dark:text-gray-400 text-sm mb-4">
            Le PDF inclut : entête avec tes informations, événements médicaux, traitements (en cours et historique), résumé des valeurs, bilans détaillés, symptômes et activité physique.
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