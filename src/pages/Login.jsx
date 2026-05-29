import { useState } from 'react'
import { supabase } from '../supabase'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
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

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-6xl block mb-4">🩺</span>
          <h1 className="text-3xl font-bold text-green-400 mb-2">CrohnTrack</h1>
          <p className="text-gray-400">Ton suivi personnalisé de la maladie de Crohn</p>
        </div>

        {/* Formulaire */}
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

          <div className="text-center mt-4">
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErreur(null); setMessage(null) }}
              className="text-gray-500 hover:text-green-400 text-sm transition"
            >
              {mode === 'login' ? 'Pas encore de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter'}
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