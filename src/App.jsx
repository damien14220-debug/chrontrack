import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Analyses from './pages/Analyses'
import Statistiques from './pages/Statistiques'
import Symptomes from './pages/Symptomes'
import Repas from './pages/Repas'
import Medicaments from './pages/Medicaments'
import Rapport from './pages/Rapport'
import Parametres from './pages/Parametres'

function App() {
  const [page, setPage] = useState('dashboard')
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Vérifie la session au chargement
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Écoute les changements de session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setPage('dashboard')
  }

  const renderPage = () => {
    switch(page) {
      case 'dashboard': return <Dashboard />
      case 'analyses': return <Analyses />
      case 'statistiques': return <Statistiques />
      case 'symptomes': return <Symptomes />
      case 'repas': return <Repas />
      case 'medicaments': return <Medicaments />
      case 'rapport': return <Rapport />
      case 'parametres': return <Parametres />
      default: return <Dashboard />
    }
  }

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: '🏠' },
    { id: 'analyses', label: 'Analyses', icon: '📊' },
    { id: 'statistiques', label: 'Statistiques', icon: '📈' },
    { id: 'symptomes', label: 'Symptômes', icon: '🤒' },
    { id: 'repas', label: 'Repas', icon: '🍽️' },
    { id: 'medicaments', label: 'Médicaments', icon: '💊' },
    { id: 'rapport', label: 'Rapport médecin', icon: '📄' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <span className="text-5xl block mb-4">🩺</span>
          <p className="text-green-400 font-semibold">Chargement...</p>
        </div>
      </div>
    )
  }

  // Si pas connecté → page de login
  if (!session) {
    return <Login />
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">

      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 min-h-screen p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <span className="text-2xl">🩺</span>
          <h1 className="text-xl font-bold text-green-400">CrohnTrack</h1>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition font-medium ${
                page === item.id
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Infos utilisateur + déconnexion */}
        <div className="border-t border-gray-800 pt-4 mt-4">
          <p className="text-gray-600 text-xs mb-3 truncate px-1">
            {session.user.email}
          </p>
          <button
            onClick={() => setPage('parametres')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition font-medium mb-2 ${
              page === 'parametres'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span className="text-xl">⚙️</span>
            Paramètres
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition font-medium text-gray-500 hover:bg-red-900/20 hover:text-red-400"
          >
            <span className="text-xl">🚪</span>
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 overflow-auto">
        {renderPage()}
      </main>

    </div>
  )
}

export default App