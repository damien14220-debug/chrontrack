import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// ============================================================
// POUR AJOUTER UNE NOUVELLE FICHE : copie ce bloc et remplis
// ============================================================
// {
//   id: 21,                          ← incrément +1
//   titre: "Titre de la fiche",
//   categorie: "Biologie",           ← ou nouvelle catégorie
//   emoji: "🧬",
//   pertinence: ["CRP", "Ferritine"], ← types d'analyses liés (vide [] si aucun)
//   resume: "Résumé en une phrase.",
//   contenu: `Contenu détaillé...`,
//   sources: ["Auteur et al. Titre. Journal. Année"]
// },
// ============================================================

const FICHES = [
  {
    id: 1,
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
    id: 2,
    titre: "Le TNF-α et l'inflammation intestinale",
    categorie: "Immunologie",
    emoji: "🔥",
    pertinence: ["CRP", "VS", "Leucocytes"],
    resume: "La cytokine centrale de l'inflammation dans le Crohn.",
    contenu: `Le TNF-α (Tumor Necrosis Factor alpha) est une cytokine pro-inflammatoire jouant un rôle central dans la maladie de Crohn.

Dans l'intestin des patients Crohn, les macrophages et lymphocytes T activés produisent des quantités excessives de TNF-α. Cette cytokine déclenche une cascade inflammatoire : elle active d'autres cellules immunitaires, augmente la perméabilité intestinale, et favorise la destruction tissulaire.

Le TNF-α est la cible principale des biothérapies anti-TNF comme l'infliximab (Remicade) et l'adalimumab (Humira). Ces médicaments neutralisent le TNF-α circulant et permettent une rémission chez 50 à 70% des patients en poussée.

Une CRP élevée dans tes analyses reflète directement l'activité inflammatoire médiée notamment par le TNF-α et l'IL-6. C'est pourquoi la CRP est le marqueur de suivi principal des poussées.`,
    sources: ["Neurath MF. Cytokines in inflammatory bowel disease. Nat Rev Immunol. 2014", "Targan SR et al. Anti-TNF therapy in Crohn's disease. NEJM. 1997"]
  },
  {
    id: 3,
    titre: "La perméabilité intestinale (Leaky Gut)",
    categorie: "Physiologie",
    emoji: "🧱",
    pertinence: ["CRP", "Albumine", "Calprotectine fécale"],
    resume: "Comment la barrière intestinale devient perméable dans le Crohn.",
    contenu: `La muqueuse intestinale est normalement une barrière sélective maintenue par des protéines de jonction serrée (occludine, claudines, zonuline). Dans le Crohn, cette barrière est altérée.

L'inflammation chronique dégrade ces protéines de jonction, créant des "fuites" entre les cellules intestinales. Des antigènes bactériens, des toxines et des fragments alimentaires passent alors dans la circulation sanguine, amplifiant la réponse immunitaire.

Ce phénomène crée un cercle vicieux : l'inflammation altère la barrière → la barrière perméable laisse passer des antigènes → les antigènes activent le système immunitaire → l'inflammation s'amplifie.

La calprotectine fécale est un excellent marqueur de cette inflammation muqueuse. Une valeur élevée indique une activation des neutrophiles dans l'intestin, signe d'une muqueuse enflammée et potentiellement perméable.

L'albumine basse peut aussi refléter une malabsorption liée à cette perméabilité altérée.`,
    sources: ["Odenwald MA et al. Intestinal permeability defects. Gastroenterology. 2013", "Turner JR. Intestinal mucosal barrier. Nat Rev Immunol. 2009"]
  },
  {
    id: 4,
    titre: "Le microbiote intestinal et le Crohn",
    categorie: "Microbiologie",
    emoji: "🦠",
    pertinence: ["CRP", "Calprotectine fécale"],
    resume: "La dysbiose : quand l'écosystème bactérien intestinal déraille.",
    contenu: `L'intestin humain abrite environ 100 000 milliards de bactéries représentant plus de 1000 espèces différentes. Dans le Crohn, on observe une dysbiose caractéristique : une réduction de la diversité microbienne et un déséquilibre entre bactéries protectrices et pathogènes.

Les patients Crohn présentent notamment une réduction des Firmicutes (bactéries productrices de butyrate, un acide gras à chaîne courte essentiel pour les cellules du côlon) et une augmentation des Proteobacteria pro-inflammatoires.

Le butyrate produit par certaines bactéries (Faecalibacterium prausnitzii notamment) est le carburant principal des colonocytes et a des effets anti-inflammatoires puissants. Sa carence dans le Crohn contribue à l'inflammation muqueuse.

Des études récentes s'intéressent aux probiotiques, aux prébiotiques et à la transplantation fécale comme approches thérapeutiques, mais les résultats restent variables dans le Crohn comparé à la rectocolite hémorragique.`,
    sources: ["Manichanh C et al. The gut microbiota in IBD. Nat Rev Gastroenterol. 2012", "Sokol H et al. Faecalibacterium prausnitzii in Crohn's disease. PNAS. 2008"]
  },
  {
    id: 5,
    titre: "L'anémie dans le Crohn : 3 mécanismes",
    categorie: "Hématologie",
    emoji: "💉",
    pertinence: ["Hémoglobine", "Ferritine", "Vitamine B12", "Acide folique", "VGM"],
    resume: "Pourquoi l'anémie est si fréquente et comment distinguer ses causes.",
    contenu: `L'anémie touche 30 à 50% des patients Crohn. Elle peut avoir trois origines distinctes, souvent combinées :

1. ANÉMIE PAR CARENCE EN FER (microcytaire, VGM bas)
Cause principale : saignements digestifs chroniques + malabsorption + blocage par l'hepcidine. La ferritine est basse, mais attention : dans l'inflammation active, la ferritine peut être faussement normale car c'est une protéine de la phase aiguë.

2. ANÉMIE PAR CARENCE EN B12 ET FOLATES (macrocytaire, VGM élevé)
L'iléon terminal (zone souvent touchée dans le Crohn iléal) est le seul site d'absorption de la vitamine B12. Une atteinte iléale ou une résection chirurgicale peut entraîner une carence sévère. Les folates sont absorbés dans le jéjunum et peuvent aussi être déficients.

3. ANÉMIE INFLAMMATOIRE
Directement liée à l'activité de la maladie. Les cytokines inhibent la production de globules rouges dans la moelle osseuse. Elle se normalise généralement avec la mise en rémission.

Le VGM (volume des globules rouges) est clé : bas → carence en fer ; élevé → carence en B12/folates ; normal → anémie inflammatoire.`,
    sources: ["Gasche C et al. Iron, anemia and IBD. Inflamm Bowel Dis. 2004", "Kulnigg S et al. Anemia in IBD. J Crohns Colitis. 2009"]
  },
  {
    id: 6,
    titre: "La calprotectine fécale : marqueur clé",
    categorie: "Biologie",
    emoji: "🧪",
    pertinence: ["Calprotectine fécale"],
    resume: "Le meilleur marqueur non invasif de l'inflammation intestinale.",
    contenu: `La calprotectine est une protéine contenue dans les neutrophiles (globules blancs). Lors d'une inflammation intestinale, les neutrophiles migrent massivement vers la muqueuse et libèrent de la calprotectine dans les selles.

C'est un marqueur remarquable car il est spécifique de l'inflammation digestive (contrairement à la CRP qui reflète toute inflammation systémique) et très sensible aux variations d'activité de la maladie.

Valeurs de référence :
- < 50 µg/g : normal, absence d'inflammation significative
- 50-200 µg/g : zone grise, à surveiller
- > 200 µg/g : inflammation active probable
- > 500 µg/g : poussée sévère

La calprotectine est particulièrement utile pour distinguer le Crohn en rémission d'un syndrome de l'intestin irritable (SII), qui lui ne provoque pas d'élévation. Elle est aussi utilisée pour prédire les rechutes : une élévation progressive peut annoncer une poussée plusieurs semaines avant les symptômes cliniques.`,
    sources: ["Tibble JA et al. Surrogate markers of intestinal inflammation. Am J Gastroenterol. 2002", "Costa F et al. Calprotectin in IBD monitoring. Eur J Gastroenterol. 2003"]
  },
  {
    id: 7,
    titre: "La vitamine D et l'immunité intestinale",
    categorie: "Immunologie",
    emoji: "☀️",
    pertinence: ["Vitamine D"],
    resume: "Bien plus qu'une vitamine pour les os : un modulateur immunitaire essentiel.",
    contenu: `La vitamine D est souvent déficiente dans le Crohn (60-70% des patients). Au-delà de son rôle osseux classique, elle joue un rôle immunomodulateur majeur.

La forme active de la vitamine D (1,25-dihydroxyvitamine D3) se lie aux récepteurs VDR présents sur pratiquement toutes les cellules immunitaires. Elle régule l'expression de nombreux gènes impliqués dans la réponse inflammatoire.

Dans l'intestin, la vitamine D renforce les jonctions serrées de la barrière épithéliale, stimule la production de peptides antimicrobiens (défensines) et favorise un profil immunitaire tolérant (Treg) plutôt qu'inflammatoire (Th17).

Des études épidémiologiques montrent que des niveaux bas de vitamine D sont associés à une plus grande sévérité du Crohn, plus de poussées et une moins bonne réponse aux biothérapies. La supplémentation vise généralement à maintenir un taux > 30 ng/mL, idéalement 40-60 ng/mL dans le Crohn.

La malabsorption intestinale et la faible exposition solaire contribuent souvent à cette déficience.`,
    sources: ["Cantorna MT et al. Vitamin D and IBD. Proc Nutr Soc. 2008", "Pappa HM et al. Vitamin D status in IBD. Inflamm Bowel Dis. 2011"]
  },
  {
    id: 8,
    titre: "La sténose intestinale : mécanisme et conséquences",
    categorie: "Physiologie",
    emoji: "🔩",
    pertinence: [],
    resume: "Comment l'inflammation répétée crée des rétrécissements intestinaux.",
    contenu: `La sténose est un rétrécissement de la lumière intestinale. Dans le Crohn, elle peut être de deux types fondamentalement différents :

1. STÉNOSE INFLAMMATOIRE
Liée à l'œdème et à l'inflammation active de la paroi. Elle est potentiellement réversible avec le traitement médical (corticoïdes, biothérapies). Elle répond généralement bien au traitement.

2. STÉNOSE FIBROTIQUE
Résulte de la fibrose cicatricielle après des épisodes répétés d'inflammation. Des myofibroblastes produisent du collagène en excès, épaississant et rigidifiant la paroi intestinale. Elle est irréversible médicalement et peut nécessiter une dilatation endoscopique ou une chirurgie.

Conséquences nutritionnelles importantes : une sténose modifie profondément les choix alimentaires. Les fibres insolubles (légumes crus, céréales complètes, légumineuses) peuvent créer un blocage mécanique. Le régime pauvre en résidus (fibres solubles uniquement, aliments bien cuits) est souvent recommandé non pas pour ses qualités nutritionnelles intrinsèques, mais pour prévenir l'obstruction.

C'est pourquoi un aliment "nutritionnellement sous-optimal" comme le pain blanc peut être le meilleur choix dans ce contexte.`,
    sources: ["Rieder F et al. Intestinal fibrosis in Crohn's disease. Gut. 2017", "Bettenworth D et al. Stricture management in Crohn's. Gut. 2021"]
  },
  {
    id: 9,
    titre: "Le zinc et la cicatrisation muqueuse",
    categorie: "Micronutriments",
    emoji: "🔬",
    pertinence: ["Zinc"],
    resume: "Un oligo-élément souvent négligé, essentiel pour la réparation intestinale.",
    contenu: `Le zinc est un oligo-élément impliqué dans plus de 300 réactions enzymatiques. Dans le Crohn, une carence en zinc est fréquente (20-40% des patients) pour plusieurs raisons : malabsorption intestinale, pertes digestives augmentées lors des diarrhées, et apports alimentaires réduits.

Le zinc joue plusieurs rôles critiques dans le Crohn :

CICATRISATION MUQUEUSE : le zinc est indispensable à la prolifération et la migration des entérocytes qui réparent la muqueuse lésée. Une carence retarde la cicatrisation et maintient la perméabilité intestinale élevée.

IMMUNITÉ : le zinc est nécessaire au développement et à la fonction des lymphocytes T. Sa carence altère la réponse immunitaire adaptative.

BARRIÈRE INTESTINALE : le zinc stabilise les protéines de jonction serrée (notamment via les métalloprotéines), renforçant la barrière épithéliale.

Les symptômes d'une carence en zinc incluent : fatigue, retard de cicatrisation, troubles de l'immunité, dermatite péri-orificielle caractéristique. La supplémentation orale est généralement efficace sauf en cas de malabsorption sévère.`,
    sources: ["Sturniolo GC et al. Zinc supplementation in Crohn's disease. Aliment Pharmacol Ther. 2001", "Naber TH et al. Zinc status in IBD. Am J Clin Nutr. 1998"]
  },
  {
    id: 10,
    titre: "La fatigue dans le Crohn : causes multifactorielles",
    categorie: "Symptômes",
    emoji: "😴",
    pertinence: ["Hémoglobine", "Ferritine", "Vitamine D", "Vitamine B12", "Albumine"],
    resume: "Comprendre pourquoi la fatigue persiste même en rémission.",
    contenu: `La fatigue est le symptôme le plus invalidant rapporté par les patients Crohn, présent chez 50-80% d'entre eux, y compris en rémission. Elle est multifactorielle :

1. ANÉMIE : quelle qu'en soit la cause (fer, B12, folates, inflammatoire), l'anémie réduit l'apport d'oxygène aux tissus et génère une fatigue profonde.

2. INFLAMMATION CHRONIQUE : les cytokines pro-inflammatoires (TNF-α, IL-6, IL-1β) agissent directement sur le cerveau, induisant un état de "sickness behavior" : fatigue, somnolence, repli, diminution des activités. C'est un mécanisme évolutif de conservation d'énergie pendant la maladie.

3. CARENCES NUTRITIONNELLES : vitamine D basse, zinc insuffisant, magnésium déficient — toutes ces carences contribuent à la fatigue musculaire et cognitive.

4. TROUBLES DU SOMMEIL : douleurs nocturnes, passages aux toilettes, anxiété liée à la maladie altèrent la qualité du sommeil.

5. COMPOSANTE PSYCHOLOGIQUE : le fardeau d'une maladie chronique, l'anxiété anticipatoire, la dépression réactionnelle sont fréquents et amplifiants.

La fatigue persistante en rémission biologique doit faire rechercher systématiquement une carence (fer, vitamine D, B12) avant d'être attribuée à la maladie elle-même.`,
    sources: ["Minderhoud IM et al. Fatigue in Crohn's disease. Aliment Pharmacol Ther. 2003", "Vogelaar L et al. Fatigue in IBD. J Crohns Colitis. 2011"]
  },
  {
    id: 11,
    titre: "Les corticoïdes dans le Crohn : effets et limites",
    categorie: "Traitements",
    emoji: "💊",
    pertinence: ["Albumine", "Vitamine D", "Zinc"],
    resume: "Puissants anti-inflammatoires mais aux effets secondaires importants.",
    contenu: `Les corticoïdes (prednisone, prednisolone, budésonide) sont utilisés pour traiter les poussées du Crohn. Ils agissent en inhibant massivement la transcription des gènes pro-inflammatoires, réduisant rapidement l'inflammation.

Ils sont efficaces à court terme (70% de réponse) mais ne sont pas des thérapies de maintenance en raison de leurs effets secondaires :

EFFETS MÉTABOLIQUES : réduction de l'absorption intestinale du calcium et de la vitamine D → risque d'ostéoporose. Catabolisme protéique → baisse de l'albumine. Perturbation du métabolisme du zinc.

EFFETS IMMUNITAIRES : immunosuppression générale augmentant le risque infectieux.

DÉPENDANCE AUX STÉROÏDES : 30-40% des patients deviennent cortico-dépendants, nécessitant une transition vers les immunosuppresseurs ou biothérapies.

Le budésonide (Entocort) est une forme à action locale avec un premier passage hépatique important qui réduit les effets systémiques — il est préféré pour les atteintes iléo-caecales.

Si tu prends des corticoïdes, une supplémentation en vitamine D et calcium est généralement recommandée pour protéger ta densité osseuse.`,
    sources: ["Benchimol EI et al. Steroid use in Crohn's disease. Can J Gastroenterol. 2008", "Travis SP et al. European consensus on Crohn's disease treatment. Gut. 2006"]
  },
  {
    id: 12,
    titre: "L'axe intestin-cerveau dans le Crohn",
    categorie: "Neurologie",
    emoji: "🧠",
    pertinence: [],
    resume: "Le lien bidirectionnel entre ton intestin et ton cerveau.",
    contenu: `L'axe intestin-cerveau est un système de communication bidirectionnel entre le système nerveux central et le système nerveux entérique (le "deuxième cerveau" intestinal contenant 500 millions de neurones).

Dans le Crohn, cet axe est perturbé dans les deux sens :

DU CERVEAU VERS L'INTESTIN : le stress psychologique active l'axe hypothalamo-hypophyso-surrénalien (HPA), libérant du cortisol et des neuropeptides qui augmentent la perméabilité intestinale, modifient le microbiote et peuvent déclencher des poussées. Des études montrent clairement que les événements stressants précèdent souvent les rechutes.

DE L'INTESTIN VERS LE CERVEAU : l'inflammation intestinale envoie des signaux via le nerf vague et la circulation sanguine (cytokines) qui modifient l'humeur, la cognition et le comportement. 90% de la sérotonine du corps est produite dans l'intestin — sa dysrégulation dans le Crohn contribue aux troubles de l'humeur.

Pratiquement : les techniques de gestion du stress (méditation, cohérence cardiaque, TCC) ont montré des effets bénéfiques documentés sur l'activité du Crohn, au-delà de leur effet sur le bien-être psychologique.`,
    sources: ["Mayer EA et al. Gut-brain axis in IBD. Gastroenterology. 2014", "Bonaz BL et al. Brain-gut interactions in IBD. Gastroenterology. 2013"]
  },
  {
    id: 13,
    titre: "La nutrition entérale dans le Crohn",
    categorie: "Nutrition",
    emoji: "🥤",
    pertinence: ["Albumine"],
    resume: "Quand la nutrition liquide exclusive devient un traitement.",
    contenu: `La nutrition entérale exclusive (NEE) consiste à remplacer totalement l'alimentation par des préparations nutritionnelles liquides pendant 6 à 8 semaines. C'est un traitement à part entière du Crohn, particulièrement chez l'enfant.

Mécanismes d'action (encore partiellement compris) :
- Mise au repos fonctionnel de l'intestin
- Modification du microbiote intestinal
- Apport de nutriments spécifiques (glutamine, acides gras oméga-3)
- Réduction des antigènes alimentaires pouvant activer le système immunitaire

Efficacité : comparable aux corticoïdes pour induire la rémission chez l'enfant (80% de réponse), légèrement inférieure chez l'adulte mais sans les effets secondaires des stéroïdes sur la croissance.

L'albumine basse dans tes analyses est un signal de dénutrition qui peut indiquer un besoin d'enrichissement nutritionnel. Une albumine < 30 g/L est associée à des complications post-opératoires augmentées et une moins bonne réponse aux traitements.

La collaboration avec un diététicien spécialisé en MICI est fortement recommandée, surtout en cas d'albumine basse ou de perte de poids.`,
    sources: ["Dziechciarz P et al. Enteral nutrition in Crohn's disease. J Pediatr Gastroenterol. 2007", "Lochs H et al. ESPEN guidelines on enteral nutrition. Clin Nutr. 2006"]
  },
  {
    id: 14,
    titre: "Les biothérapies anti-TNF : comment elles fonctionnent",
    categorie: "Traitements",
    emoji: "💉",
    pertinence: ["CRP", "Leucocytes"],
    resume: "Le mécanisme des traitements biologiques les plus utilisés dans le Crohn.",
    contenu: `Les anti-TNF sont des anticorps monoclonaux qui neutralisent le TNF-α, cytokine centrale de l'inflammation dans le Crohn. Les principaux sont l'infliximab (Remicade, Inflectra) administré en perfusion, et l'adalimumab (Humira) en injection sous-cutanée.

Mécanisme d'action :
Les anti-TNF se lient au TNF-α soluble et membranaire, empêchant son interaction avec ses récepteurs. Ils induisent aussi l'apoptose (mort programmée) des lymphocytes T activés qui expriment le TNF membranaire, réduisant ainsi l'inflammation à la source.

Suivi biologique sous anti-TNF :
- CRP et calprotectine : marqueurs d'efficacité, doivent se normaliser
- Leucocytes : surveillance de l'immunosuppression
- Dosage des anticorps anti-médicament : une immunisation contre le traitement peut expliquer une perte d'efficacité secondaire

Limites :
30% de patients ne répondent pas (non-répondeurs primaires). 30-40% perdent leur réponse dans le temps (non-répondeurs secondaires) souvent par immunisation. Le risque infectieux est augmenté, notamment pour la tuberculose (bilan TB obligatoire avant instauration).

Les nouvelles biothérapies (anti-intégrines comme védolizumab, anti-IL12/23 comme ustekinumab) offrent des alternatives avec des profils de sécurité différents.`,
    sources: ["Hanauer SB et al. Infliximab in Crohn's disease. Lancet. 2002", "Colombel JF et al. Adalimumab in Crohn's disease. Gastroenterology. 2007"]
  },
  {
    id: 15,
    titre: "Génétique du Crohn : NOD2 et au-delà",
    categorie: "Génétique",
    emoji: "🧬",
    pertinence: [],
    resume: "Les bases génétiques de la susceptibilité au Crohn.",
    contenu: `Le Crohn est une maladie polygénique : plus de 200 loci génétiques de susceptibilité ont été identifiés par les études GWAS (Genome-Wide Association Studies). Mais la génétique n'explique qu'une partie du risque — l'environnement joue un rôle majeur.

NOD2/CARD15 est le premier gène de susceptibilité identifié (2001). NOD2 est un récepteur intracellulaire qui reconnaît les composants bactériens (muramyl dipeptide). Les mutations de NOD2 altèrent cette reconnaissance et la réponse antimicrobienne intestinale, favorisant une dysbiose et une inflammation chronique.

Les porteurs de mutations NOD2 ont un risque 20 à 40 fois plus élevé de développer un Crohn iléal. Ces mutations sont présentes chez 30% des patients Crohn d'origine européenne.

Autres gènes importants :
- ATG16L1 et IRGM : impliqués dans l'autophagie (élimination des bactéries intracellulaires)
- IL23R : régulation de la voie Th17, cible des nouvelles biothérapies
- PTPN22 : régulation de l'activation des lymphocytes T

La génétique explique pourquoi le risque familial est réel : 10-15% des patients ont un parent du premier degré atteint. Le risque pour un enfant de deux parents atteints atteint 35%.`,
    sources: ["Hugot JP et al. Association of NOD2 mutations with Crohn's disease. Nature. 2001", "Jostins L et al. Host-microbe interactions in IBD. Nature. 2012"]
  },
  {
    id: 16,
    titre: "Le sport et le Crohn : effets sur l'inflammation",
    categorie: "Mode de vie",
    emoji: "🏃",
    pertinence: ["CRP", "Hémoglobine"],
    resume: "L'activité physique comme outil thérapeutique dans le Crohn.",
    contenu: `L'exercice physique régulier a des effets anti-inflammatoires documentés, particulièrement pertinents dans le Crohn.

EFFETS ANTI-INFLAMMATOIRES DE L'EXERCICE :
L'exercice modéré réduit les niveaux de cytokines pro-inflammatoires (TNF-α, IL-6) et augmente les cytokines anti-inflammatoires (IL-10). Il favorise aussi la diversité du microbiote intestinal, réduite dans le Crohn.

BÉNÉFICES SPÉCIFIQUES AU CROHN :
- Réduction du risque de rechute (études observationnelles)
- Amélioration de la densité osseuse (protège contre l'ostéoporose liée aux corticoïdes)
- Réduction de la fatigue chronique
- Effets positifs sur l'humeur et l'anxiété (axe intestin-cerveau)
- Amélioration de la qualité de vie

LIMITES ET PRÉCAUTIONS :
L'exercice intense peut temporairement augmenter la perméabilité intestinale (ischémie mésentérique transitoire lors d'efforts intenses). En poussée active, l'exercice doit être modéré. L'anémie peut limiter les performances et doit être corrigée avant de reprendre un entraînement intensif.

Pour quelqu'un pratiquant un volume important (comme la course à pied ~50km/semaine), la surveillance de la ferritine est particulièrement importante car le sport de haut niveau augmente lui-même les besoins en fer (hémolyse mécanique, pertes sudorales, régénération des globules rouges).`,
    sources: ["Ng V et al. Exercise in IBD. World J Gastroenterol. 2016", "Cronin O et al. The gut microbiota in athletes. Gut. 2018"]
  },
  {
    id: 17,
    titre: "La grossesse et le Crohn",
    categorie: "Situations particulières",
    emoji: "🤱",
    pertinence: ["Acide folique", "Vitamine B12", "Albumine"],
    resume: "Ce que toute femme Crohn doit savoir sur la grossesse.",
    contenu: `La maladie de Crohn n'est pas une contre-indication à la grossesse, mais nécessite une planification soigneuse.

IMPACT DE L'ACTIVITÉ SUR LA GROSSESSE :
Une grossesse débutée en rémission a un pronostic comparable à la population générale. En revanche, une grossesse débutée en poussée active multiplie par 3 le risque de fausse couche, prématurité et retard de croissance intra-utérin. La rémission d'au moins 3-6 mois avant la conception est recommandée.

MÉDICAMENTS ET GROSSESSE :
- 5-ASA (mésalazine) : sûr pendant la grossesse
- Azathioprine : données rassurantes, bénéfice/risque généralement favorable
- Anti-TNF : à discuter avec le gastroentérologue, généralement poursuivis jusqu'au 3ème trimestre
- Méthotrexate : CONTRE-INDIQUÉ (tératogène), arrêt 3-6 mois avant conception
- Corticoïdes : utilisés si nécessaire

SUPPLÉMENTATION INDISPENSABLE :
- Acide folique : 5mg/jour (dose plus élevée que pour la population générale) dès la conception
- Vitamine D : supplémentation maintenue
- Fer : selon les analyses

L'allaitement est généralement possible sous la plupart des traitements du Crohn. Une discussion préalable avec gastroentérologue et obstétricien est indispensable.`,
    sources: ["van der Woude CJ et al. Management of IBD during pregnancy. Gut. 2015", "Mahadevan U et al. Pregnancy in IBD. Am J Gastroenterol. 2019"]
  },
  {
    id: 18,
    titre: "La colonoscopie et ses marqueurs : comprendre son bilan",
    categorie: "Diagnostic",
    emoji: "🔭",
    pertinence: ["Calprotectine fécale", "CRP"],
    resume: "Comment interpréter les résultats de la coloscopie dans le Crohn.",
    contenu: `La colonoscopie reste l'examen de référence pour évaluer l'activité endoscopique du Crohn et surveiller les lésions. Elle permet une vision directe de la muqueuse et des biopsies.

SCORES D'ACTIVITÉ ENDOSCOPIQUE :
Le score SES-CD (Simple Endoscopic Score for Crohn's Disease) évalue la taille des ulcères, la surface touchée, la présence de sténoses et l'étendue des lésions. Un SES-CD < 3 correspond à une rémission endoscopique.

RÉMISSION MUQUEUSE VS CLINIQUE :
Un patient peut être en rémission clinique (pas de symptômes) mais avoir une inflammation muqueuse persistante visible en endoscopie — c'est la rémission "profonde" ou muqueuse qui est désormais l'objectif thérapeutique car elle prédit mieux le pronostic à long terme.

CORRÉLATION AVEC LES MARQUEURS BIOLOGIQUES :
- CRP > 5 mg/L : corrèle avec une activité modérée à sévère
- Calprotectine > 250 µg/g : forte probabilité d'activité endoscopique
- Une calprotectine normale (< 50 µg/g) a une valeur prédictive négative élevée pour l'absence d'inflammation muqueuse significative

L'IRM intestinale (entéro-IRM) est complémentaire pour évaluer les segments inaccessibles à la coloscopie (intestin grêle) et la profondeur des lésions.`,
    sources: ["Daperno M et al. SES-CD score. Gastrointest Endosc. 2004", "Ferrante M et al. Deep remission in Crohn's disease. J Crohns Colitis. 2010"]
  },
  {
    id: 19,
    titre: "Les manifestations extra-intestinales du Crohn",
    categorie: "Clinique",
    emoji: "🦴",
    pertinence: ["CRP", "Vitamine D"],
    resume: "Le Crohn ne touche pas seulement l'intestin.",
    contenu: `Le Crohn est une maladie systémique dont les manifestations dépassent souvent le tube digestif. Elles concernent 25-40% des patients.

MANIFESTATIONS ARTICULAIRES (les plus fréquentes, 20-30%) :
- Arthropathies périphériques : arthrites des grosses articulations (genoux, chevilles, poignets), souvent parallèles à l'activité digestive
- Spondylarthropathies : atteinte du rachis et des sacro-iliaques, évoluant indépendamment de l'intestin

MANIFESTATIONS CUTANÉES (10-15%) :
- Érythème noueux : nodules douloureux des membres inférieurs, liés à l'activité inflammatoire
- Pyoderma gangrenosum : ulcérations cutanées sévères, nécessitant un traitement spécifique

MANIFESTATIONS OCULAIRES (5-10%) :
- Épisclérite, uvéite : inflammation oculaire pouvant menacer la vision si non traitée

MANIFESTATIONS HÉPATOBILIAIRES :
- Cholangite sclérosante primitive (plus fréquente dans la RCH mais possible dans le Crohn)
- Lithiase biliaire : fréquence augmentée par la malabsorption des sels biliaires dans l'iléon terminal

OSTÉOPOROSE :
Très fréquente dans le Crohn : inflammation chronique + corticoïdes + malabsorption en vitamine D/calcium. Une densitométrie osseuse est recommandée régulièrement.`,
    sources: ["Vavricka SR et al. Extraintestinal manifestations of IBD. Inflamm Bowel Dis. 2015", "Harbord M et al. Extraintestinal manifestations in IBD. J Crohns Colitis. 2016"]
  },
  {
    id: 20,
    titre: "Stress oxydatif et antioxydants dans le Crohn",
    categorie: "Biochimie",
    emoji: "⚡",
    pertinence: ["CRP", "Albumine", "Zinc"],
    resume: "Le rôle des radicaux libres dans l'inflammation intestinale.",
    contenu: `Le stress oxydatif est un déséquilibre entre la production de radicaux libres (espèces réactives de l'oxygène, ROS) et les défenses antioxydantes de l'organisme. Il joue un rôle amplificateur important dans le Crohn.

PRODUCTION DE ROS DANS LE CROHN :
Les neutrophiles et macrophages activés dans la muqueuse enflammée produisent massivement des ROS dans le cadre de la "burst oxydatif" pour tenter d'éliminer les pathogènes. Dans le Crohn, cette production est chronique et contribue aux lésions tissulaires.

DÉFENSES ANTIOXYDANTES RÉDUITES :
Les patients Crohn ont souvent des niveaux réduits de : glutathion (antioxydant majeur), vitamine E, vitamine C, zinc, sélénium et superoxyde dismutase. Cette insuffisance aggrave les dommages oxydatifs.

ALBUMINE ET STRESS OXYDATIF :
L'albumine est le principal antioxydant circulant du sang (représente 70% de la capacité antioxydante du plasma). Une albumine basse réduit donc aussi les défenses antioxydantes.

IMPLICATIONS PRATIQUES :
Une alimentation riche en antioxydants (dans les limites du régime adapté au Crohn) peut avoir des effets bénéfiques : fruits cuits, légumes bien cuits, huile d'olive (polyphénols), curcuma (curcumine anti-inflammatoire). Le zinc alimentaire ou en supplémentation participe aussi aux défenses antioxydantes via la superoxyde dismutase.`,
    sources: ["Kruidenier L et al. Oxidative stress in IBD. Gut. 2003", "Rezaie A et al. Oxidative stress and IBD. J Gastroenterol. 2007"]
  }
]

const CATEGORIES = ['Toutes', ...new Set(FICHES.map(f => f.categorie))]

function Science() {
  const [categorieActive, setCategorieActive] = useState('Toutes')
  const [ficheOuverte, setFicheOuverte] = useState(null)
  const [analyses, setAnalyses] = useState([])
  const [recherche, setRecherche] = useState('')

  useEffect(() => { fetchAnalyses() }, [])

  const fetchAnalyses = async () => {
    const { data } = await supabase.from('analyses').select('*').order('date', { ascending: false }).limit(30)
    if (data) setAnalyses(data)
  }

  const typesAnormaux = analyses
    .filter(a => a.normal_min !== null && a.normal_max !== null && (a.valeur < a.normal_min || a.valeur > a.normal_max))
    .map(a => a.type)

  const fichesPertinentes = (fiche) => fiche.pertinence.some(p => typesAnormaux.includes(p))

  const fichesFiltrees = FICHES.filter(f => {
    const matchCategorie = categorieActive === 'Toutes' || f.categorie === categorieActive
    const matchRecherche = recherche === '' ||
      f.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      f.resume.toLowerCase().includes(recherche.toLowerCase()) ||
      f.categorie.toLowerCase().includes(recherche.toLowerCase())
    return matchCategorie && matchRecherche
  })

  const fichesPrio = fichesFiltrees.filter(f => fichesPertinentes(f))
  const fichesNormales = fichesFiltrees.filter(f => !fichesPertinentes(f))
  const fichesOrdonnees = [...fichesPrio, ...fichesNormales]

  return (
    <div className="px-3 py-4 md:px-6 md:py-8">

      {/* Header */}
      <div className="mb-5">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1">🔬 Science & Crohn</h2>
        <p className="text-slate-500 dark:text-gray-400 text-sm">
          {FICHES.length} fiches scientifiques sourcées — personnalisées selon tes analyses.
        </p>
      </div>

      {/* Bandeau fiches pertinentes */}
      {fichesPrio.length > 0 && categorieActive === 'Toutes' && recherche === '' && (
        <div className="mb-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4">
          <p className="text-amber-700 dark:text-amber-400 text-sm font-semibold">
            ⚡ {fichesPrio.length} fiche{fichesPrio.length > 1 ? 's' : ''} liée{fichesPrio.length > 1 ? 's' : ''} à tes analyses anormales
          </p>
          <p className="text-amber-600 dark:text-amber-500 text-xs mt-0.5">
            Elles apparaissent en premier ci-dessous.
          </p>
        </div>
      )}

      {/* Recherche */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="🔍 Rechercher une fiche..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          className="w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:border-emerald-500 outline-none"
        />
      </div>

      {/* Filtres catégories — scroll horizontal */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-5" style={{ WebkitOverflowScrolling: 'touch' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategorieActive(cat)}
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

      {/* Liste fiches — 1 colonne sur mobile, 2 sur desktop */}
      <div className="flex flex-col md:grid md:grid-cols-2 gap-3 mb-6">
        {fichesOrdonnees.map(fiche => {
          const estPertinente = fichesPertinentes(fiche)
          return (
            <button
              key={fiche.id}
              onClick={() => setFicheOuverte(fiche)}
              className={`text-left p-4 rounded-2xl border transition active:scale-[0.98] ${
                estPertinente
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50'
                  : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Emoji grand et lisible */}
                <span className="text-3xl shrink-0 leading-none mt-0.5">{fiche.emoji}</span>
                <div className="flex-1 min-w-0">
                  {/* Badge catégorie + pertinent */}
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      estPertinente
                        ? 'bg-amber-200 dark:bg-amber-800/50 text-amber-700 dark:text-amber-400'
                        : 'bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400'
                    }`}>
                      {fiche.categorie}
                    </span>
                    {estPertinente && (
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">⚡ Pertinent</span>
                    )}
                  </div>
                  {/* Titre plus grand */}
                  <h3 className="font-semibold text-slate-900 dark:text-white text-base leading-snug mb-1">
                    {fiche.titre}
                  </h3>
                  {/* Résumé lisible */}
                  <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed">
                    {fiche.resume}
                  </p>
                  {/* Chevron */}
                  <p className="text-emerald-500 dark:text-green-400 text-xs mt-2 font-medium">
                    Lire la fiche →
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {fichesOrdonnees.length === 0 && (
        <div className="text-center py-12 text-slate-400 dark:text-gray-600">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm">Aucune fiche trouvée pour cette recherche.</p>
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
            {/* Poignée mobile */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1 bg-slate-200 dark:bg-gray-700 rounded-full"></div>
            </div>

            {/* Header modal */}
            <div className="flex items-start gap-3 px-5 py-4 border-b border-slate-100 dark:border-gray-800">
              <span className="text-4xl shrink-0">{ficheOuverte.emoji}</span>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-slate-400 dark:text-gray-500 uppercase tracking-wide">
                  {ficheOuverte.categorie}
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-snug mt-0.5">
                  {ficheOuverte.titre}
                </h3>
              </div>
              <button
                onClick={() => setFicheOuverte(null)}
                className="text-slate-400 dark:text-gray-600 hover:text-slate-600 dark:hover:text-gray-400 shrink-0 p-1 text-2xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="text-slate-700 dark:text-gray-300 text-base leading-relaxed whitespace-pre-wrap mb-6">
                {ficheOuverte.contenu}
              </p>

              {/* Sources */}
              <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  📚 Sources scientifiques
                </p>
                {ficheOuverte.sources.map((source, i) => (
                  <p key={i} className="text-sm text-slate-400 dark:text-gray-500 mb-1.5 leading-relaxed">
                    • {source}
                  </p>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default Science