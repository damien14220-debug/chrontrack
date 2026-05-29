import { useState } from 'react'
import { supabase } from '../supabase'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('accueil')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [erreur, setErreur] = useState(null)

  const handleSubmit = async () => {
    setLoading(true)
    setErreur(null)
    setMessage(null)

    if (!email || !password) {
      setErreur('Remplis tous les champs.')
      setLoading(false)
      return
    }

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setErreur('Email ou mot de passe incorrect.')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setErreur('Erreur lors de la création du compte.')
      } else {
        setMessage('Compte créé ! Vérifie ton email pour confirmer ton inscription.')
      }
    }
    setLoading(false)
  }

  // PAGE D'ACCUEIL
  if (mode === 'accueil') {
    return (
      <div className="min-h-screen bg-gray-950 text-white">

        {/* Header */}
        <header className="border-b border-gray-800 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🩺</span>
              <h1 className="text-xl font-bold text-green-400">CrohnTrack</h1>
            </div>
            <button
              onClick={() => setMode('login')}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-2 rounded-xl transition text-sm"
            >
              Se connecter
            </button>
          </div>
        </header>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-green-900/30 border border-green-800/50 rounded-full px-4 py-2 text-green-400 text-sm mb-8">
            🚧 Version bêta — Site en cours de développement
          </div>
          <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
            Le suivi de la maladie de Crohn,<br/>
            <span className="text-green-400">enfin simplifié.</span>
          </h2>
          <p className="text-gray-400 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            CrohnTrack te permet de centraliser tes analyses sanguines, tes symptômes, tes repas et tes médicaments — et de générer des rapports pour ton médecin.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setMode('signup')}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-4 rounded-xl transition text-lg"
            >
              Créer mon compte gratuit
            </button>
            <button
              onClick={() => setMode('login')}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold px-8 py-4 rounded-xl transition text-lg"
            >
              Se connecter
            </button>
          </div>
        </section>

        {/* Fonctionnalités */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <h3 className="text-2xl font-bold text-white text-center mb-12">Ce que tu peux faire avec CrohnTrack</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '📊', titre: 'Analyses sanguines', desc: 'Enregistre tes bilans, visualise l\'évolution avec des graphiques et reçois des alertes pour les valeurs anormales.' },
              { icon: '🤒', titre: 'Suivi des symptômes', desc: 'Note tes symptômes quotidiens avec leur intensité pour mieux comprendre tes poussées.' },
              { icon: '🍽️', titre: 'Journal alimentaire', desc: 'Identifie les aliments déclencheurs en suivant tes repas et tes réactions.' },
              { icon: '💊', titre: 'Médicaments', desc: 'Garde un historique de tes traitements et ne rate plus jamais une prise.' },
              { icon: '📄', titre: 'Rapport médecin', desc: 'Génère un rapport PDF complet à partager avec ton gastro-entérologue.' },
              { icon: '📈', titre: 'Statistiques', desc: 'Visualise l\'évolution de toutes tes analyses dans le temps avec des courbes détaillées.' },
            ].map(f => (
              <div key={f.titre} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <span className="text-3xl block mb-3">{f.icon}</span>
                <h4 className="font-bold text-white mb-2">{f.titre}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Mon histoire */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">Pourquoi j'ai créé CrohnTrack</h3>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-shrink-0 text-center">
                  <div className="w-20 h-20 bg-green-900/40 border border-green-800 rounded-full flex items-center justify-center text-4xl mx-auto mb-3">
                    👨‍💻
                  </div>
                  <p className="text-green-400 font-semibold">Damien Chereau</p>
                  <p className="text-gray-600 text-xs">Créateur de CrohnTrack</p>
                </div>
                <div className="flex-1">
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Je m'appelle Damien Chereau et j'ai la maladie de Crohn. Comme beaucoup de malades, je me retrouvais à chercher mes anciens résultats d'analyses dans des piles de papier, à essayer de me rappeler quand avait commencé tel symptôme, ou à ne plus savoir quel aliment me posait problème.
                  </p>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    J'ai cherché une application qui centralise tout ça — les analyses sanguines, les symptômes, les repas, les médicaments — sans en trouver une qui me convenait vraiment. Alors j'ai décidé de la créer moi-même.
                  </p>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    CrohnTrack est né de ce besoin personnel. Je la partage gratuitement avec tous les malades de Crohn et de MICI, en espérant qu'elle puisse aider d'autres personnes à mieux suivre leur maladie et à mieux communiquer avec leurs médecins.
                  </p>
                  <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-xl px-4 py-3">
                    <p className="text-yellow-400 text-sm">
                      ⚠️ <strong>Site en version bêta</strong> — CrohnTrack est encore en développement actif. Des bugs peuvent apparaître et de nouvelles fonctionnalités sont ajoutées régulièrement. N'hésitez pas à me faire part de vos retours !
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-800 px-6 py-8 text-center">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="text-xl">🩺</span>
              <h1 className="text-lg font-bold text-green-400">CrohnTrack</h1>
            </div>
            <p className="text-gray-600 text-sm mb-2">Créé avec ❤️ par Damien Chereau — atteint de la maladie de Crohn</p>
            <p className="text-gray-700 text-xs">CrohnTrack est un outil de suivi personnel et ne remplace pas un avis médical professionnel.</p>
          </div>
        </footer>

      </div>
    )
  }

  // PAGE LOGIN / SIGNUP
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <span className="text-6xl block mb-4">🩺</span>
          <h1 className="text-3xl font-bold text-green-400 mb-2">CrohnTrack</h1>
          <p className="text-gray-400">Ton suivi personnalisé de la maladie de Crohn</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-6">
            {mode === 'login' ? 'Se connecter' : 'Créer un compte'}
          </h2>

          <div className="flex flex-col gap-4 mb-6">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Adresse email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ton@email.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          </div>

          {erreur && (
            <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 mb-4">
              <p className="text-red-400 text-sm">❌ {erreur}</p>
            </div>
          )}

          {message && (
            <div className="bg-green-900/30 border border-green-800 rounded-xl px-4 py-3 mb-4">
              <p className="text-green-400 text-sm">✅ {message}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>

          <div className="flex flex-col gap-2 text-center mt-4">
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErreur(null); setMessage(null) }}
              className="text-gray-500 hover:text-green-400 text-sm transition"
            >
              {mode === 'login' ? 'Pas encore de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter'}
            </button>
            <button
              onClick={() => { setMode('accueil'); setErreur(null); setMessage(null) }}
              className="text-gray-600 hover:text-gray-400 text-sm transition"
            >
              ← Retour à l'accueil
            </button>
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Tes données sont privées et sécurisées 🔒
        </p>
      </div>
    </div>
  )
}

export default Login