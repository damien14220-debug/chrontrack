import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const PUBMED_CACHE_KEY = 'pubmed_cache'
const CACHE_DUREE = 7 * 24 * 60 * 60 * 1000

const FICHES_STATIQUES = [
  {
    id: 's1',
    titre: "L'Hepcidine et la carence en fer",
    categorie: "Biologie",
    emoji: "🩸",
    pertinence: ["Ferritine", "Fer sérique", "Transferrine"],
    resume: "Pourquoi ton corps bloque l'absorption du fer malgré ta carence.",
    contenu: `L'hepcidine est une hormone peptidique produite par le foie. C'est le régulateur central du métabolisme du fer dans l'organisme.

Dans la maladie de Crohn, l'inflammation chronique provoque une élévation des cytokines pro-inflammatoires (notamment l'IL-6). Ces cytokines stimulent massivement la production d'hepcidine par le foie.

L'hepcidine agit en bloquant la ferroportine, la protéine qui permet au fer de passer des cellules intestinales vers le sang. Résultat : même si tu manges des aliments riches en fer ou prends des suppléments, le fer reste bloqué dans les cellules et ne peut pas être utilisé.

Ton corps fait cela car évolutivement, les bactéries pathogènes ont besoin de fer pour survivre et se multiplier. En bloquant le fer, le corps tente de "priver" les bactéries. Mais dans le Crohn, l'inflammation n'est pas d'origine bactérienne — c'est une réponse immunitaire dysrégulée — donc cette stratégie se retourne contre toi.

C'est pourquoi la supplémentation orale en fer est souvent inefficace dans le Crohn actif : le fer par voie intraveineuse (perfusion) contourne ce blocage et est nettement plus efficace.`,
    sources: ["Ganz T. Hepcidin and iron regulation. Blood. 2011", "Dignass AU et al. Iron deficiency in IBD. J Crohns Colitis. 2018"]
  },
  {
    id: 's2',
    titre: "Le TNF-α et l'inflammation intestinale",
    categorie: "Immunologie",
    emoji: "🔥",
    pertinence: ["CRP", "VS", "Leucocytes"],
    resume: "La cytokine centrale de l'inflammation dans le Crohn.",
    contenu: `Le TNF-α (Tumor Necrosis Factor alpha) est une cytokine pro-inflammatoire jouant un rôle central dans la maladie de Crohn.

Dans l'intestin des patients Crohn, les macrophages et lymphocytes T activés produisent des quantités excessives de TNF-α. Cette cytokine déclenche une cascade inflammatoire : elle active d'autres cellules immunitaires, augmente la perméabilité intestinale, et favorise la destruction tissulaire.

Le TNF-α est la cible principale des biothérapies anti-TNF comme l'infliximab (Remicade) et l'adalimumab (Humira). Ces médicaments neutralisent le TNF-α circulant et permettent une rémission chez 50 à 70% des patients en poussée.

Une CRP élevée dans tes analyses reflète directement l'activité inflammatoire médiée notamment par le TNF-α et l'IL-6.`,
    sources: ["Neurath MF. Cytokines in inflammatory bowel disease. Nat Rev Immunol. 2014", "Targan SR et al. Anti-TNF therapy in Crohn's disease. NEJM. 1997"]
  },
  {
    id: 's3',
    titre: "La perméabilité intestinale (Leaky Gut)",
    categorie: "Physiologie",
    emoji: "🧱",
    pertinence: ["CRP", "Albumine", "Calprotectine fécale"],
    resume: "Comment la barrière intestinale devient perméable dans le Crohn.",
    contenu: `La muqueuse intestinale est normalement une barrière sélective maintenue par des protéines de jonction serrée (occludine, claudines, zonuline). Dans le Crohn, cette barrière est altérée.

L'inflammation chronique dégrade ces protéines de jonction, créant des "fuites" entre les cellules intestinales. Des antigènes bactériens, des toxines et des fragments alimentaires passent alors dans la circulation sanguine, amplifiant la réponse immunitaire.

Ce phénomène crée un cercle vicieux : l'inflammation altère la barrière → la barrière perméable laisse passer des antigènes → les antigènes activent le système immunitaire → l'inflammation s'amplifie.

La calprotectine fécale est un excellent marqueur de cette inflammation muqueuse.`,
    sources: ["Odenwald MA et al. Intestinal permeability defects. Gastroenterology. 2013", "Turner JR. Intestinal mucosal barrier. Nat Rev Immunol. 2009"]
  },
  {
    id: 's4',
    titre: "Le microbiote intestinal et le Crohn",
    categorie: "Microbiologie",
    emoji: "🦠",
    pertinence: ["CRP", "Calprotectine fécale"],
    resume: "La dysbiose : quand l'écosystème bactérien intestinal déraille.",
    contenu: `L'intestin humain abrite environ 100 000 milliards de bactéries représentant plus de 1000 espèces différentes. Dans le Crohn, on observe une dysbiose caractéristique : une réduction de la diversité microbienne et un déséquilibre entre bactéries protectrices et pathogènes.

Les patients Crohn présentent notamment une réduction des Firmicutes (bactéries productrices de butyrate) et une augmentation des Proteobacteria pro-inflammatoires.

Le butyrate produit par certaines bactéries (Faecalibacterium prausnitzii notamment) est le carburant principal des colonocytes et a des effets anti-inflammatoires puissants.`,
    sources: ["Manichanh C et al. The gut microbiota in IBD. Nat Rev Gastroenterol. 2012", "Sokol H et al. Faecalibacterium prausnitzii in Crohn's disease. PNAS. 2008"]
  },
  {
    id: 's5',
    titre: "L'anémie dans le Crohn : 3 mécanismes",
    categorie: "Hématologie",
    emoji: "💉",
    pertinence: ["Hémoglobine", "Ferritine", "Vitamine B12", "Acide folique", "VGM"],
    resume: "Pourquoi l'anémie est si fréquente et comment distinguer ses causes.",
    contenu: `L'anémie touche 30 à 50% des patients Crohn. Elle peut avoir trois origines distinctes :

1. ANÉMIE PAR CARENCE EN FER (microcytaire, VGM bas) — saignements + malabsorption + hepcidine
2. ANÉMIE PAR CARENCE EN B12 ET FOLATES (macrocytaire, VGM élevé) — atteinte iléale
3. ANÉMIE INFLAMMATOIRE — cytokines inhibant la moelle osseuse

Le VGM est clé : bas → fer ; élevé → B12/folates ; normal → inflammatoire.`,
    sources: ["Gasche C et al. Iron, anemia and IBD. Inflamm Bowel Dis. 2004"]
  },
  {
    id: 's6',
    titre: "La calprotectine fécale : marqueur clé",
    categorie: "Biologie",
    emoji: "🧪",
    pertinence: ["Calprotectine fécale"],
    resume: "Le meilleur marqueur non invasif de l'inflammation intestinale.",
    contenu: `La calprotectine est une protéine contenue dans les neutrophiles. Lors d'une inflammation intestinale, les neutrophiles migrent vers la muqueuse et libèrent de la calprotectine dans les selles.

Valeurs : moins de 50 µg/g = normal | 50-200 = zone grise | plus de 200 = inflammation active | plus de 500 = poussée sévère

Elle distingue le Crohn du syndrome de l'intestin irritable et prédit les rechutes.`,
    sources: ["Tibble JA et al. Surrogate markers of intestinal inflammation. Am J Gastroenterol. 2002"]
  },
  {
    id: 's7',
    titre: "La vitamine D et l'immunité intestinale",
    categorie: "Immunologie",
    emoji: "☀️",
    pertinence: ["Vitamine D"],
    resume: "Bien plus qu'une vitamine pour les os : un modulateur immunitaire essentiel.",
    contenu: `La vitamine D est déficiente chez 60-70% des patients Crohn. Elle joue un rôle immunomodulateur majeur : renforce les jonctions serrées, stimule les défensines, favorise un profil Treg plutôt qu'inflammatoire Th17.

Des niveaux bas sont associés à plus de poussées et une moins bonne réponse aux biothérapies. Objectif : supérieur à 30 ng/mL, idéalement 40-60 ng/mL.`,
    sources: ["Cantorna MT et al. Vitamin D and IBD. Proc Nutr Soc. 2008"]
  },
  {
    id: 's8',
    titre: "La sténose intestinale",
    categorie: "Physiologie",
    emoji: "🔩",
    pertinence: [],
    resume: "Comment l'inflammation répétée crée des rétrécissements intestinaux.",
    contenu: `La sténose peut être inflammatoire (réversible) ou fibrotique (irréversible). La fibrotique résulte de la cicatrisation excessive après inflammations répétées.

Conséquence nutritionnelle : les fibres insolubles peuvent créer un blocage. Le pain blanc peut être le meilleur choix malgré son faible index nutritionnel.`,
    sources: ["Rieder F et al. Intestinal fibrosis in Crohn's disease. Gut. 2017"]
  },
  {
    id: 's9',
    titre: "Le zinc et la cicatrisation muqueuse",
    categorie: "Micronutriments",
    emoji: "🔬",
    pertinence: ["Zinc"],
    resume: "Un oligo-élément essentiel pour la réparation intestinale.",
    contenu: `Carence fréquente dans le Crohn (20-40%). Le zinc est indispensable à la cicatrisation muqueuse, à l'immunité des lymphocytes T et à la stabilité des jonctions serrées.`,
    sources: ["Sturniolo GC et al. Zinc supplementation in Crohn's disease. Aliment Pharmacol Ther. 2001"]
  },
  {
    id: 's10',
    titre: "La fatigue dans le Crohn",
    categorie: "Symptômes",
    emoji: "😴",
    pertinence: ["Hémoglobine", "Ferritine", "Vitamine D", "Vitamine B12", "Albumine"],
    resume: "Comprendre pourquoi la fatigue persiste même en rémission.",
    contenu: `Présente chez 50-80% des patients, y compris en rémission. Causes : anémie, cytokines pro-inflammatoires (sickness behavior), carences nutritionnelles, troubles du sommeil, composante psychologique.

La fatigue en rémission doit faire rechercher une carence avant d'être attribuée à la maladie.`,
    sources: ["Minderhoud IM et al. Fatigue in Crohn's disease. Aliment Pharmacol Ther. 2003"]
  },
  {
    id: 's11',
    titre: "Les corticoïdes dans le Crohn",
    categorie: "Traitements",
    emoji: "💊",
    pertinence: ["Albumine", "Vitamine D", "Zinc"],
    resume: "Puissants anti-inflammatoires aux effets secondaires importants.",
    contenu: `Efficaces à court terme (70%) mais non recommandés en maintenance. Effets : ostéoporose (vitamine D/calcium), catabolisme protéique (albumine basse), immunosuppression.

Le budésonide (Entocort) a moins d'effets systémiques — préféré pour les atteintes iléo-caecales.`,
    sources: ["Travis SP et al. European consensus on Crohn's disease treatment. Gut. 2006"]
  },
  {
    id: 's12',
    titre: "L'axe intestin-cerveau",
    categorie: "Neurologie",
    emoji: "🧠",
    pertinence: [],
    resume: "Le lien bidirectionnel entre ton intestin et ton cerveau.",
    contenu: `Communication bidirectionnelle : le stress aggrave le Crohn (axe HPA), et l'inflammation intestinale perturbe l'humeur (90% de la sérotonine produite dans l'intestin).

La méditation, cohérence cardiaque et TCC ont des effets bénéfiques documentés sur l'activité du Crohn.`,
    sources: ["Mayer EA et al. Gut-brain axis in IBD. Gastroenterology. 2014"]
  },
  {
    id: 's13',
    titre: "La nutrition entérale",
    categorie: "Nutrition",
    emoji: "🥤",
    pertinence: ["Albumine"],
    resume: "Quand la nutrition liquide exclusive devient un traitement.",
    contenu: `La NEE (nutrition entérale exclusive) remplace totalement l'alimentation pendant 6-8 semaines. Efficacité comparable aux corticoïdes chez l'enfant (80%). Albumine inférieure à 30 g/L = signal de dénutrition sévère.`,
    sources: ["Lochs H et al. ESPEN guidelines on enteral nutrition. Clin Nutr. 2006"]
  },
  {
    id: 's14',
    titre: "Les biothérapies anti-TNF",
    categorie: "Traitements",
    emoji: "💉",
    pertinence: ["CRP", "Leucocytes"],
    resume: "Le mécanisme des traitements biologiques les plus utilisés.",
    contenu: `Infliximab et adalimumab neutralisent le TNF-α. 30% de non-répondeurs primaires, 30-40% perdent leur réponse (immunisation). Bilan TB obligatoire avant instauration.

Nouvelles alternatives : védolizumab (anti-intégrine), ustekinumab (anti-IL12/23).`,
    sources: ["Hanauer SB et al. Infliximab in Crohn's disease. Lancet. 2002"]
  },
  {
    id: 's15',
    titre: "Génétique du Crohn : NOD2",
    categorie: "Génétique",
    emoji: "🧬",
    pertinence: [],
    resume: "Les bases génétiques de la susceptibilité au Crohn.",
    contenu: `Plus de 200 loci génétiques identifiés. NOD2 : risque multiplié par 20-40 pour le Crohn iléal (30% des patients européens). Autres gènes : ATG16L1 (autophagie), IL23R (voie Th17), PTPN22.

Risque familial : 10-15% si parent du 1er degré atteint.`,
    sources: ["Hugot JP et al. Association of NOD2 mutations with Crohn's disease. Nature. 2001"]
  },
  {
    id: 's16',
    titre: "Le sport et le Crohn",
    categorie: "Mode de vie",
    emoji: "🏃",
    pertinence: ["CRP", "Hémoglobine"],
    resume: "L'activité physique comme outil thérapeutique.",
    contenu: `L'exercice modéré réduit les cytokines pro-inflammatoires et améliore la diversité du microbiote. Bénéfices : moins de rechutes, densité osseuse, fatigue, humeur.

Pour les sportifs intensifs : surveiller la ferritine (hémolyse mécanique augmente les besoins en fer).`,
    sources: ["Ng V et al. Exercise in IBD. World J Gastroenterol. 2016"]
  },
  {
    id: 's17',
    titre: "La grossesse et le Crohn",
    categorie: "Situations particulières",
    emoji: "🤱",
    pertinence: ["Acide folique", "Vitamine B12", "Albumine"],
    resume: "Ce que toute femme Crohn doit savoir.",
    contenu: `Rémission 3-6 mois avant conception recommandée. Méthotrexate CONTRE-INDIQUÉ. Acide folique 5mg/jour. Anti-TNF généralement poursuivis jusqu'au 3ème trimestre.`,
    sources: ["van der Woude CJ et al. Management of IBD during pregnancy. Gut. 2015"]
  },
  {
    id: 's18',
    titre: "La colonoscopie et ses marqueurs",
    categorie: "Diagnostic",
    emoji: "🔭",
    pertinence: ["Calprotectine fécale", "CRP"],
    resume: "Comment interpréter les résultats de la coloscopie.",
    contenu: `Score SES-CD inférieur à 3 = rémission endoscopique. CRP supérieur à 5 mg/L et calprotectine supérieur à 250 µg/g = inflammation active probable. L'entéro-IRM évalue l'intestin grêle inaccessible à la coloscopie.`,
    sources: ["Daperno M et al. SES-CD score. Gastrointest Endosc. 2004"]
  },
  {
    id: 's19',
    titre: "Les manifestations extra-intestinales",
    categorie: "Clinique",
    emoji: "🦴",
    pertinence: ["CRP", "Vitamine D"],
    resume: "Le Crohn ne touche pas seulement l'intestin.",
    contenu: `25-40% des patients. Articulaires (20-30%) : arthrites périphériques, spondylarthropathies. Cutanées : érythème noueux, pyoderma gangrenosum. Oculaires : épisclérite, uvéite. Ostéoporose très fréquente.`,
    sources: ["Vavricka SR et al. Extraintestinal manifestations of IBD. Inflamm Bowel Dis. 2015"]
  },
  {
    id: 's20',
    titre: "Stress oxydatif et antioxydants",
    categorie: "Biochimie",
    emoji: "⚡",
    pertinence: ["CRP", "Albumine", "Zinc"],
    resume: "Le rôle des radicaux libres dans l'inflammation intestinale.",
    contenu: `Production excessive de ROS par les neutrophiles activés. Défenses réduites : glutathion, vitamine E, zinc, sélénium. L'albumine représente 70% de la capacité antioxydante du plasma.

Alimentation riche en antioxydants bénéfique : huile d'olive, curcuma, fruits cuits.`,
    sources: ["Kruidenier L et al. Oxidative stress in IBD. Gut. 2003"]
  }
]

function Science() {
  const [categorieActive, setCategorieActive] = useState('Toutes')
  const [ficheOuverte, setFicheOuverte] = useState(null)
  const [analyses, setAnalyses] = useState([])
  const [recherche, setRecherche] = useState('')
  const [fichesPerso, setFichesPerso] = useState([])
  const [onglet, setOnglet] = useState('fiches')
  const [requetePubmed, setRequetePubmed] = useState('')
  const [pubmedLoading, setPubmedLoading] = useState(false)
  const [pubmedResultats, setPubmedResultats] = useState([])
  const [pubmedCache, setPubmedCache] = useState(() => {
    const saved = localStorage.getItem(PUBMED_CACHE_KEY)
    return saved ? JSON.parse(saved) : {}
  })
  const [showFormFiche, setShowFormFiche] = useState(false)
  const [formFiche, setFormFiche] = useState({
    titre: '', categorie: '', emoji: '🔬', resume: '', contenu: '', sources: ''
  })
  const [savingFiche, setSavingFiche] = useState(false)

  useEffect(() => {
    fetchAnalyses()
    fetchFichesPerso()
  }, [])

  const fetchAnalyses = async () => {
    const { data } = await supabase.from('analyses').select('*').order('date', { ascending: false }).limit(30)
    if (data) setAnalyses(data)
  }

  const fetchFichesPerso = async () => {
    const { data } = await supabase.from('fiches_science').select('*').order('created_at', { ascending: false })
    if (data) setFichesPerso(data.map(f => ({ ...f, id: `p_${f.id}`, pertinence: f.pertinence || [] })))
  }

  const toutesLesFiches = [...FICHES_STATIQUES, ...fichesPerso]
  const toutesLesCategories = ['Toutes', ...new Set(toutesLesFiches.map(f => f.categorie))]

  const typesAnormaux = analyses
    .filter(a => a.normal_min !== null && a.normal_max !== null && (a.valeur < a.normal_min || a.valeur > a.normal_max))
    .map(a => a.type)

  const fichesPertinentes = (fiche) => (fiche.pertinence || []).some(p => typesAnormaux.includes(p))

  const fichesFiltrees = toutesLesFiches.filter(f => {
    const matchCategorie = categorieActive === 'Toutes' || f.categorie === categorieActive
    const matchRecherche = recherche === '' ||
      f.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      (f.resume || '').toLowerCase().includes(recherche.toLowerCase()) ||
      f.categorie.toLowerCase().includes(recherche.toLowerCase())
    return matchCategorie && matchRecherche
  })

  const fichesPrio = fichesFiltrees.filter(f => fichesPertinentes(f))
  const fichesNormales = fichesFiltrees.filter(f => !fichesPertinentes(f))
  const fichesOrdonnees = [...fichesPrio, ...fichesNormales]

  const handleSaveFiche = async () => {
    if (!formFiche.titre || !formFiche.categorie || !formFiche.contenu) return
    setSavingFiche(true)
    const { data: { user } } = await supabase.auth.getUser()
    const sources = formFiche.sources.split('\n').map(s => s.trim()).filter(s => s.length > 0)
    await supabase.from('fiches_science').insert([{
      titre: formFiche.titre,
      categorie: formFiche.categorie,
      emoji: formFiche.emoji || '🔬',
      resume: formFiche.resume,
      contenu: formFiche.contenu,
      sources,
      pertinence: [],
      user_id: user.id
    }])
    setFormFiche({ titre: '', categorie: '', emoji: '🔬', resume: '', contenu: '', sources: '' })
    setShowFormFiche(false)
    setSavingFiche(false)
    fetchFichesPerso()
  }

  const handleDeleteFiche = async (fiche) => {
    if (!String(fiche.id).startsWith('p_')) return
    const realId = fiche.id.replace('p_', '')
    if (window.confirm('Supprimer cette fiche ?')) {
      await supabase.from('fiches_science').delete().eq('id', realId)
      fetchFichesPerso()
    }
  }

  const rechercherPubmed = async () => {
    if (!requetePubmed.trim()) return
    const cacheKey = requetePubmed.toLowerCase().trim()
    const cache = pubmedCache[cacheKey]
    if (cache && Date.now() - cache.timestamp < CACHE_DUREE) {
      setPubmedResultats(cache.resultats)
      return
    }
    setPubmedLoading(true)
    setPubmedResultats([])
    try {
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(requetePubmed + ' Crohn')}&retmax=5&sort=relevance&retmode=json`
      const searchRes = await fetch(searchUrl)
      const searchData = await searchRes.json()
      const ids = searchData.esearchresult?.idlist || []
      if (ids.length === 0) {
        setPubmedResultats([{ erreur: 'Aucun article trouvé sur PubMed pour cette recherche.' }])
        setPubmedLoading(false)
        return
      }
      const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=xml`
      const fetchRes = await fetch(fetchUrl)
      const xmlText = await fetchRes.text()
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
      const articles = xmlDoc.querySelectorAll('PubmedArticle')
      const articlesData = []
      articles.forEach(article => {
        const titre = article.querySelector('ArticleTitle')?.textContent || ''
        const abstract = article.querySelector('AbstractText')?.textContent || ''
        const annee = article.querySelector('PubDate Year')?.textContent || article.querySelector('PubDate MedlineDate')?.textContent || ''
        const journal = article.querySelector('Title')?.textContent || ''
        const pmid = article.querySelector('PMID')?.textContent || ''
        const auteurs = [...article.querySelectorAll('Author')].slice(0, 3).map(a => {
          const last = a.querySelector('LastName')?.textContent || ''
          const initials = a.querySelector('Initials')?.textContent || ''
          return `${last} ${initials}`.trim()
        }).join(', ')
        if (titre && abstract) {
          articlesData.push({ titre, abstract, annee, journal, pmid, auteurs })
        }
      })
      if (articlesData.length === 0) {
        setPubmedResultats([{ erreur: 'Articles trouvés mais abstracts non disponibles.' }])
        setPubmedLoading(false)
        return
      }
      const prompt = `Tu es un expert en gastroentérologie et maladie de Crohn. Voici ${articlesData.length} articles scientifiques PubMed sur "${requetePubmed}" en lien avec le Crohn.

Pour CHAQUE article, génère un résumé structuré de 20 à 30 lignes en français, clair et vulgarisé mais fidèle aux données scientifiques.

Format de réponse (respecte exactement ce format JSON) :
[
  {
    "pmid": "PMID_ICI",
    "resume_fr": "Ton résumé détaillé de 20-30 lignes ici..."
  }
]

Articles à résumer :
${articlesData.map(a => `
PMID: ${a.pmid}
Titre: ${a.titre}
Auteurs: ${a.auteurs} (${a.annee})
Journal: ${a.journal}
Abstract: ${a.abstract}
`).join('\n---\n')}

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`

      const iaRes = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          contexte: '',
          memoire: ''
        })
      })
      const iaData = await iaRes.json()
      let iaText = iaData.content?.[0]?.text || '[]'
      iaText = iaText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      let resumesIA = []
      try { resumesIA = JSON.parse(iaText) } catch(e) { resumesIA = [] }
      const resultats = articlesData.map(a => {
        const resumeIA = resumesIA.find(r => r.pmid === a.pmid)
        return { ...a, resume_fr: resumeIA?.resume_fr || 'Résumé non disponible.' }
      })
      const nouveauCache = { ...pubmedCache, [cacheKey]: { resultats, timestamp: Date.now() } }
      setPubmedCache(nouveauCache)
      localStorage.setItem(PUBMED_CACHE_KEY, JSON.stringify(nouveauCache))
      setPubmedResultats(resultats)
    } catch(e) {
      console.error('Erreur PubMed:', e)
      setPubmedResultats([{ erreur: 'Erreur lors de la recherche. Réessaie.' }])
    }
    setPubmedLoading(false)
  }

  return (
    <div className="px-3 py-4 md:px-6 md:py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1">🔬 Science et Crohn</h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm">
            {toutesLesFiches.length} fiches + recherche PubMed en temps réel.
          </p>
        </div>
        {onglet === 'fiches' && (
          <button
            onClick={() => setShowFormFiche(!showFormFiche)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2.5 rounded-xl transition text-sm"
          >
            + Nouvelle fiche
          </button>
        )}
      </div>

      {/* Onglets principaux */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'fiches', label: '📚 Fiches', count: toutesLesFiches.length },
          { id: 'pubmed', label: '🔬 PubMed', count: null },
        ].map(o => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id)}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition border flex items-center gap-2 ${
              onglet === o.id
                ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800 text-slate-500 dark:text-gray-400'
            }`}
          >
            {o.label}
            {o.count !== null && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                onglet === o.id ? 'bg-emerald-100 dark:bg-emerald-500/30' : 'bg-slate-100 dark:bg-gray-800'
              }`}>{o.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ===== ONGLET FICHES ===== */}
      {onglet === 'fiches' && (
        <>
          {showFormFiche && (
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 mb-6 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4">✍️ Nouvelle fiche scientifique</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-slate-500 dark:text-gray-400 text-xs mb-1 block">Titre *</label>
                  <input type="text" value={formFiche.titre} onChange={e => setFormFiche({ ...formFiche, titre: e.target.value })}
                    placeholder="Ex: Le kéfir et le microbiote dans le Crohn"
                    className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="text-slate-500 dark:text-gray-400 text-xs mb-1 block">Catégorie *</label>
                  <input type="text" value={formFiche.categorie} onChange={e => setFormFiche({ ...formFiche, categorie: e.target.value })}
                    placeholder="Ex: Nutrition, Microbiologie..."
                    list="categories-list"
                    className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none" />
                  <datalist id="categories-list">
                    {toutesLesCategories.filter(c => c !== 'Toutes').map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className="text-slate-500 dark:text-gray-400 text-xs mb-1 block">Emoji</label>
                  <input type="text" value={formFiche.emoji} onChange={e => setFormFiche({ ...formFiche, emoji: e.target.value })}
                    placeholder="🔬"
                    className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="text-slate-500 dark:text-gray-400 text-xs mb-1 block">Résumé court</label>
                  <input type="text" value={formFiche.resume} onChange={e => setFormFiche({ ...formFiche, resume: e.target.value })}
                    placeholder="Une phrase résumant le sujet"
                    className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none" />
                </div>
              </div>
              <div className="mb-3">
                <label className="text-slate-500 dark:text-gray-400 text-xs mb-1 block">Contenu détaillé *</label>
                <textarea value={formFiche.contenu} onChange={e => setFormFiche({ ...formFiche, contenu: e.target.value })}
                  placeholder="Le contenu complet de ta fiche scientifique..."
                  rows={8}
                  className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none resize-none" />
              </div>
              <div className="mb-4">
                <label className="text-slate-500 dark:text-gray-400 text-xs mb-1 block">Sources (une par ligne)</label>
                <textarea value={formFiche.sources} onChange={e => setFormFiche({ ...formFiche, sources: e.target.value })}
                  placeholder="Auteur et al. Titre. Journal. Année"
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleSaveFiche} disabled={savingFiche}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl transition disabled:opacity-50 text-sm">
                  {savingFiche ? 'Sauvegarde...' : '💾 Sauvegarder'}
                </button>
                <button onClick={() => setShowFormFiche(false)}
                  className="bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 font-semibold px-6 py-3 rounded-xl transition text-sm">
                  Annuler
                </button>
              </div>
            </div>
          )}

          {fichesPrio.length > 0 && categorieActive === 'Toutes' && recherche === '' && (
            <div className="mb-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4">
              <p className="text-amber-700 dark:text-amber-400 text-sm font-semibold">
                ⚡ {fichesPrio.length} fiche{fichesPrio.length > 1 ? 's' : ''} liée{fichesPrio.length > 1 ? 's' : ''} à tes analyses anormales
              </p>
            </div>
          )}

          <div className="mb-3">
            <input type="text" placeholder="🔍 Rechercher une fiche..." value={recherche}
              onChange={e => setRecherche(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:border-emerald-500 outline-none" />
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-5" style={{ WebkitOverflowScrolling: 'touch' }}>
            {toutesLesCategories.map(cat => (
              <button key={cat} onClick={() => setCategorieActive(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition border shrink-0 ${
                  categorieActive === cat
                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/50'
                    : 'bg-white dark:bg-gray-900 text-slate-500 dark:text-gray-400 border-slate-200 dark:border-gray-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:grid md:grid-cols-2 gap-3 mb-6">
            {fichesOrdonnees.map(fiche => {
              const estPertinente = fichesPertinentes(fiche)
              const estPerso = String(fiche.id).startsWith('p_')
              return (
                <button key={fiche.id} onClick={() => setFicheOuverte(fiche)}
                  className={`text-left p-4 rounded-2xl border transition active:scale-[0.98] ${
                    estPertinente
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50'
                      : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl shrink-0 leading-none mt-0.5">{fiche.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          estPertinente
                            ? 'bg-amber-200 dark:bg-amber-800/50 text-amber-700 dark:text-amber-400'
                            : 'bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400'
                        }`}>{fiche.categorie}</span>
                        {estPertinente && <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">⚡ Pertinent</span>}
                        {estPerso && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">✍️ Ma fiche</span>}
                      </div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-base leading-snug mb-1">{fiche.titre}</h3>
                      <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed">{fiche.resume}</p>
                      <p className="text-emerald-500 dark:text-green-400 text-xs mt-2 font-medium">Lire la fiche →</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {fichesOrdonnees.length === 0 && (
            <div className="text-center py-12 text-slate-400 dark:text-gray-600">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-sm">Aucune fiche trouvée.</p>
            </div>
          )}
        </>
      )}

      {/* ===== ONGLET PUBMED ===== */}
      {onglet === 'pubmed' && (
        <div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 mb-6 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">🔬 Recherche PubMed</h3>
            <p className="text-slate-400 dark:text-gray-500 text-xs mb-4">
              Recherche des articles scientifiques réels et reçois un résumé détaillé en français. Résultats mis en cache 7 jours.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={requetePubmed}
                onChange={e => setRequetePubmed(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && rechercherPubmed()}
                placeholder="Ex: amoxicilline Crohn, kéfir inflammation..."
                className="flex-1 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none"
              />
              <button
                onClick={rechercherPubmed}
                disabled={pubmedLoading || !requetePubmed.trim()}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-semibold px-5 py-3 rounded-xl transition text-sm shrink-0"
              >
                {pubmedLoading ? '⏳' : '🔍 Chercher'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {['kéfir Crohn', 'amoxicilline microbiote', 'curcuma inflammation intestinale', 'probiotiques MICI', 'stress Crohn poussée'].map(s => (
                <button key={s} onClick={() => setRequetePubmed(s)}
                  className="text-xs px-3 py-1.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 rounded-xl hover:border-emerald-400 transition">
                  {s}
                </button>
              ))}
            </div>
          </div>

          {pubmedLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <p className="text-slate-400 dark:text-gray-500 text-sm">Recherche PubMed + résumé IA en cours...</p>
            </div>
          )}

          {pubmedResultats.length > 0 && !pubmedLoading && (
            <div className="flex flex-col gap-4">
              {pubmedResultats.map((res, i) => {
                if (res.erreur) {
                  return (
                    <div key={i} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl p-4">
                      <p className="text-red-500 text-sm">{res.erreur}</p>
                    </div>
                  )
                }
                return (
                  <div key={res.pmid} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug mb-1">{res.titre}</h3>
                        <p className="text-slate-400 dark:text-gray-500 text-xs">
                          {res.auteurs && `${res.auteurs} · `}{res.journal && `${res.journal} · `}{res.annee}
                        </p>
                      </div>

                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/${res.pmid}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition"
                        onClick={e => e.stopPropagation()}
                      >
                        PubMed →
                      </a>
                    </div>
                    <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-4">
                      <p className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wide mb-2">📝 Résumé en français</p>
                      <p className="text-slate-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{res.resume_fr}</p>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <p className="text-xs text-slate-300 dark:text-gray-600">PMID: {res.pmid}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== MODAL FICHE ===== */}
      {ficheOuverte && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setFicheOuverte(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 w-full md:max-w-2xl md:rounded-2xl rounded-t-3xl max-h-[92vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1 bg-slate-200 dark:bg-gray-700 rounded-full"></div>
            </div>
            <div className="flex items-start gap-3 px-5 py-4 border-b border-slate-100 dark:border-gray-800">
              <span className="text-4xl shrink-0">{ficheOuverte.emoji}</span>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-slate-400 dark:text-gray-500 uppercase tracking-wide">{ficheOuverte.categorie}</span>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-snug mt-0.5">{ficheOuverte.titre}</h3>
              </div>
              <div className="flex gap-2 shrink-0">
                {String(ficheOuverte.id).startsWith('p_') && (
                  <button
                    onClick={() => { handleDeleteFiche(ficheOuverte); setFicheOuverte(null) }}
                    className="text-red-400 hover:text-red-500 text-sm px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    🗑️
                  </button>
                )}
                <button
                  onClick={() => setFicheOuverte(null)}
                  className="text-slate-400 dark:text-gray-600 hover:text-slate-600 shrink-0 p-1 text-2xl leading-none"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="text-slate-700 dark:text-gray-300 text-base leading-relaxed whitespace-pre-wrap mb-6">
                {ficheOuverte.contenu}
              </p>
              {ficheOuverte.sources && ficheOuverte.sources.length > 0 && (
                <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
                  <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-3">📚 Sources scientifiques</p>
                  {ficheOuverte.sources.map((source, i) => (
                    <p key={i} className="text-sm text-slate-400 dark:text-gray-500 mb-1.5 leading-relaxed">• {source}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Science