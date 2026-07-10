import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

const MEMOIRE_KEY = 'assistant_memoire'
const MESSAGES_KEY = 'assistant_messages'

function Assistant() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(MESSAGES_KEY)
    return saved ? JSON.parse(saved) : []
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [contexte, setContexte] = useState(null)
  const [loadingContexte, setLoadingContexte] = useState(true)
  const [memoire, setMemoire] = useState(() => localStorage.getItem(MEMOIRE_KEY) || '')
  const [showMemoire, setShowMemoire] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => { fetchContexte() }, [])
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    // Sauvegarder les messages dans localStorage
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages))
  }, [messages])

  const fetchContexte = async () => {
  setLoadingContexte(true)
  const aujourd_hui = new Date()
  const il_y_a_60_jours = new Date(aujourd_hui - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [
    { data: analyses },
    { data: symptomes },
    { data: repas },
    { data: medicaments }
  ] = await Promise.all([
    supabase.from('analyses').select('*').order('date', { ascending: false }).limit(15),
    supabase.from('symptomes').select('*').gte('date', il_y_a_60_jours).order('date', { ascending: false }).limit(15),
    supabase.from('repas').select('*').gte('date', il_y_a_60_jours).order('date', { ascending: false }).limit(20),
    supabase.from('medicaments').select('*')
  ])

  const analysesAnormales = (analyses || []).filter(a =>
    a.normal_min !== null && a.normal_max !== null &&
    (a.valeur < a.normal_min || a.valeur > a.normal_max)
  )

  const repasAvecReaction = (repas || []).filter(r => r.reaction && r.reaction !== 'aucune')

  const contexteTexte = `
ANALYSES RÉCENTES :
${(analyses || []).slice(0, 10).map(a => `- ${a.type}: ${a.valeur} ${a.unite || ''} (${new Date(a.date).toLocaleDateString('fr-FR')})`).join('\n')}

ANALYSES ANORMALES :
${analysesAnormales.length > 0
  ? analysesAnormales.map(a => `- ⚠️ ${a.type}: ${a.valeur} (normal: ${a.normal_min}-${a.normal_max} ${a.unite || ''})`).join('\n')
  : '- Aucune anomalie'}

SYMPTÔMES RÉCENTS :
${(symptomes || []).slice(0, 10).map(s => `- ${s.type} (${s.intensite}/5) le ${new Date(s.date).toLocaleDateString('fr-FR')}`).join('\n') || '- Aucun'}

REPAS RÉCENTS :
${(repas || []).slice(0, 15).map(r => `- ${r.moment}: ${r.aliments} — réaction: ${r.reaction || 'aucune'} (${new Date(r.date).toLocaleDateString('fr-FR')})`).join('\n') || '- Aucun'}

REPAS AVEC RÉACTIONS :
${repasAvecReaction.slice(0, 5).map(r => `- ⚠️ ${r.aliments} → ${r.reaction}`).join('\n') || '- Aucune'}

TRAITEMENTS :
${(medicaments || []).map(m => `- ${m.nom} ${m.dosage || ''} (${m.frequence || ''})`).join('\n') || '- Aucun'}
`
  setContexte(contexteTexte)
  setLoadingContexte(false)
}

  const sauvegarderMemoire = async (messagesSession) => {
    // Extraire les points clés de la conversation pour la mémoire
    if (messagesSession.length < 2) return
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Voici une conversation médicale. Résume en 5-10 points clés les informations importantes apprises sur ce patient (préférences alimentaires, intolérances, observations, conseils donnés) en format court bullet points. Ne mentionne pas que c'est un résumé, écris directement les points.\n\nConversation:\n${messagesSession.map(m => `${m.role === 'user' ? 'Patient' : 'Assistant'}: ${m.content}`).join('\n\n')}`
          }],
          contexte: '',
          memoire: ''
        })
      })
      const data = await response.json()
      const nouveauResume = data.content?.[0]?.text || ''
      if (nouveauResume) {
        const memoireMise = `${memoire ? memoire + '\n\n---\n\n' : ''}${nouveauResume}`
        setMemoire(memoireMise)
        localStorage.setItem(MEMOIRE_KEY, memoireMise)
      }
    } catch(e) { console.error('Erreur sauvegarde mémoire:', e) }
  }

  const envoyerMessage = async () => {
    if (!input.trim() || loading) return

    const nouveauMessage = { role: 'user', content: input }
    const nouveauxMessages = [...messages, nouveauMessage]
    setMessages(nouveauxMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nouveauxMessages,
          contexte,
          memoire
        })
      })

      const data = await response.json()
      const reponseIA = data.content?.[0]?.text || "Désolé, je n'ai pas pu générer une réponse."
      const messagesFinaux = [...nouveauxMessages, { role: 'assistant', content: reponseIA }]
      setMessages(messagesFinaux)

      // Sauvegarder la mémoire toutes les 4 exchanges (8 messages)
      if (messagesFinaux.length % 8 === 0) {
        await sauvegarderMemoire(messagesFinaux)
      }

    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "❌ Erreur de connexion. Vérifie ta connexion internet."
      }])
    }

    setLoading(false)
  }

  const effacerConversation = () => {
    if (window.confirm('Effacer la conversation ? La mémoire sera conservée.')) {
      setMessages([])
      localStorage.removeItem(MESSAGES_KEY)
    }
  }

  const effacerMemoire = () => {
    if (window.confirm('Effacer toute la mémoire des conversations passées ?')) {
      setMemoire('')
      localStorage.removeItem(MEMOIRE_KEY)
    }
  }

  const suggestions = [
    "Est-ce que le pain de mie blanc est adapté à ma situation ?",
    "Pourquoi je suis si fatigué malgré mon traitement ?",
    "Que penses-tu de mes analyses récentes ?",
    "Quels aliments éviter avec mes symptômes actuels ?",
    "Explique-moi ma carence en fer",
  ]

  if (loadingContexte) return (
    <div className="px-4 py-8 text-slate-500 dark:text-gray-500 text-center">
      <p>🔄 Chargement de tes données médicales...</p>
    </div>
  )

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-2rem)] px-3 py-4 md:px-6 md:py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1">🤖 Assistant IA</h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm">
            Ton assistant personnalisé — accès à 90 jours de données.
          </p>
        </div>
        <div className="flex gap-2">
          {memoire && (
            <button
              onClick={() => setShowMemoire(!showMemoire)}
              className="text-xs px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50 rounded-xl hover:bg-purple-100 transition"
            >
              🧠 Mémoire
            </button>
          )}
          {messages.length > 0 && (
            <button
              onClick={effacerConversation}
              className="text-xs px-3 py-2 bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 rounded-xl hover:bg-slate-200 dark:hover:bg-gray-700 transition"
            >
              🗑️ Effacer
            </button>
          )}
        </div>
      </div>

      {/* Panel mémoire */}
      {showMemoire && (
        <div className="mb-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-400">🧠 Mémoire des conversations</p>
            <button
              onClick={effacerMemoire}
              className="text-xs text-red-400 hover:text-red-500"
            >
              Effacer
            </button>
          </div>
          <p className="text-xs text-purple-600 dark:text-purple-300 whitespace-pre-wrap leading-relaxed">{memoire}</p>
        </div>
      )}

      {/* Zone messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-1">

        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="bg-emerald-50 dark:bg-green-500/10 border border-emerald-200 dark:border-green-500/30 rounded-2xl p-4">
              <p className="text-emerald-700 dark:text-green-400 text-sm font-medium mb-1">🤖 Assistant Crohn</p>
              <p className="text-slate-700 dark:text-gray-300 text-sm">
                Bonjour ! Je suis ton assistant spécialisé Crohn. J'ai accès à tes analyses, symptômes, repas et activités sportives des <strong>90 derniers jours</strong>.
                {memoire && " Je me souviens aussi de nos conversations précédentes. 🧠"}
                {" "}Pose-moi n'importe quelle question sur ton alimentation, tes analyses ou ta santé ! 💚
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400 dark:text-gray-600 mb-2 px-1">Suggestions :</p>
              <div className="flex flex-col gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s)}
                    className="text-left px-4 py-3 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl text-sm text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 hover:border-emerald-300 dark:hover:border-green-500/50 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === 'user'
                ? 'bg-emerald-500 text-white rounded-br-sm'
                : 'bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-slate-700 dark:text-gray-300 rounded-bl-sm'
            }`}>
              {msg.role === 'assistant' && (
                <p className="text-xs text-emerald-500 dark:text-green-400 font-medium mb-1">🤖 Assistant</p>
              )}
              <p className="whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/^### (.*$)/gm, '<strong class="text-emerald-500">$1</strong>')
                .replace(/^## (.*$)/gm, '<strong class="text-emerald-500">$1</strong>')
                .replace(/^- (.*$)/gm, '• $1')
              }} />
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
              <p className="text-xs text-emerald-500 dark:text-green-400 font-medium mb-1">🤖 Assistant</p>
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 items-end">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              envoyerMessage()
            }
          }}
          placeholder="Pose ta question..."
          rows={2}
          className="flex-1 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:border-emerald-500 outline-none resize-none"
        />
        <button
          onClick={envoyerMessage}
          disabled={loading || !input.trim()}
          className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white p-3 rounded-2xl transition shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </div>

    </div>
  )
}

export default Assistant