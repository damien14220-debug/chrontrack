import React, { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Analyses from './pages/Analyses'
import Statistiques from './pages/Statistiques'
import Symptomes from './pages/Symptomes'
import Repas from './pages/Repas'
import SuiviMedical from './pages/SuiviMedical'
import Rapport from './pages/Rapport'
import Parametres from './pages/Parametres'
import Sport from './pages/Sport'
import Journal from './pages/Journal'
import Assistant from './pages/Assistant'
import Science from './pages/Science'

const NAV_DEFAULT = [
  { id: 'dashboard', label: 'Accueil', icon: '🏠' },
  { id: 'analyses', label: 'Analyses', icon: '📊' },
  { id: 'statistiques', label: 'Stats', icon: '📈' },
  { id: 'symptomes', label: 'Symptômes', icon: '🤒' },
  { id: 'repas', label: 'Repas', icon: '🍽️' },
  { id: 'suivimedical', label: 'Médical', icon: '🏥' },
  { id: 'sport', label: 'Sport', icon: '🏃' },
  { id: 'journal', label: 'Journal', icon: '📓' },
  { id: 'rapport', label: 'Rapport', icon: '📄' },
  { id: 'assistant', label: 'IA', icon: '🤖' },
  { id: 'science', label: 'Science', icon: '🔬' },
]

function App() {
  const [page, setPage] = useState('dashboard')
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dark, setDark] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [navItems, setNavItems] = useState(() => {
    const saved = localStorage.getItem('navOrder')
    return saved ? JSON.parse(saved) : NAV_DEFAULT
  })

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const isDark = savedTheme ? savedTheme === 'dark' : true
    setDark(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Écouter les changements d'ordre depuis Paramètres
  useEffect(() => {
    const handleNavChange = () => {
      const saved = localStorage.getItem('navOrder')
      if (saved) setNavItems(JSON.parse(saved))
    }
    window.addEventListener('navOrderChanged', handleNavChange)
    return () => window.removeEventListener('navOrderChanged', handleNavChange)
  }, [])

  const toggleTheme = () => {
    const newDark = !dark
    setDark(newDark)
    localStorage.setItem('theme', newDark ? 'dark' : 'light')
    if (newDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const renderPage = () => {
    switch(page) {
      case 'dashboard': return <Dashboard />
      case 'analyses': return <Analyses />
      case 'statistiques': return <Statistiques />
      case 'symptomes': return <Symptomes />
      case 'repas': return <Repas />
      case 'suivimedical': return <SuiviMedical />
      case 'sport': return <Sport />
      case 'journal': return <Journal />
      case 'rapport': return <Rapport />
      case 'assistant': return <Assistant />
      case 'science': return <Science />
      case 'parametres': return <Parametres toggleTheme={toggleTheme} dark={dark} />
      default: return <Dashboard />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <img src="/apple-touch-icon.png" className="w-16 h-16 mx-auto mb-4 rounded-2xl" alt="logo" />
          <p className="text-emerald-600 dark:text-green-400 font-semibold">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session) return <Login toggleTheme={toggleTheme} dark={dark} />

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white flex">

      {/* ======================== SIDEBAR DESKTOP ======================== */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-800 h-screen sticky top-0 p-6 flex-col overflow-hidden">

        <div className="flex items-center gap-3 mb-8 shrink-0">
          <img src="/apple-touch-icon.png" className="w-9 h-9 rounded-xl" alt="logo" />
          <h1 className="text-xl font-bold text-emerald-600 dark:text-green-400">CrohnTrack</h1>
        </div>

        <nav className="flex-1 min-h-0 flex flex-col gap-1 overflow-y-auto scrollbar-hide">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition font-medium shrink-0 ${
                page === item.id
                  ? 'bg-emerald-50 dark:bg-green-500/20 text-emerald-600 dark:text-green-400 border border-emerald-200 dark:border-green-500/30'
                  : 'text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-200 dark:border-gray-800 pt-4 mt-4 shrink-0">
          <p className="text-slate-400 dark:text-gray-600 text-xs mb-3 truncate px-1">{session.user.email}</p>
          <button
            onClick={() => setPage('parametres')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition font-medium mb-1 ${
              page === 'parametres'
                ? 'bg-emerald-50 dark:bg-green-500/20 text-emerald-600 dark:text-green-400 border border-emerald-200 dark:border-green-500/30'
                : 'text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800'
            }`}
          >
            <span className="text-lg">⚙️</span>
            Paramètres
          </button>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition font-medium mb-1 text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800"
          >
            <span className="text-lg">{dark ? '☀️' : '🌙'}</span>
            {dark ? 'Mode jour' : 'Mode nuit'}
          </button>
          <button
            onClick={async () => { await supabase.auth.signOut(); setSession(null); setPage('dashboard') }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition font-medium text-slate-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
          >
            <span className="text-lg">🚪</span>
            Se déconnecter
          </button>
        </div>

      </aside>

      {/* ======================== CONTENU PRINCIPAL ======================== */}
      <div className="flex-1 flex flex-col min-h-screen">

        <header className="md:hidden bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/apple-touch-icon.png" className="w-8 h-8 rounded-xl" alt="logo" />
            <h1 className="text-lg font-bold text-emerald-600 dark:text-green-400">CrohnTrack</h1>
          </div>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 transition text-xl"
          >
            ☰
          </button>
        </header>

        {showMobileMenu && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 px-4 py-3 flex flex-col gap-2">
            <p className="text-slate-400 dark:text-gray-600 text-xs truncate">{session.user.email}</p>
            <button
              onClick={() => { setPage('parametres'); setShowMobileMenu(false) }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800"
            >
              ⚙️ Paramètres
            </button>
            <button
              onClick={() => { toggleTheme(); setShowMobileMenu(false) }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800"
            >
              {dark ? '☀️' : '🌙'} {dark ? 'Mode jour' : 'Mode nuit'}
            </button>
            <button
              onClick={async () => { await supabase.auth.signOut(); setSession(null); setPage('dashboard') }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              🚪 Se déconnecter
            </button>
          </div>
        )}

        <main className="flex-1 overflow-auto pb-24 md:pb-0">
          {renderPage()}
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-gray-800 z-50">
          <div
            className="flex overflow-x-auto scrollbar-hide px-2 py-2 gap-1"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition shrink-0 ${
                  page === item.id
                    ? 'text-emerald-600 dark:text-green-400 bg-emerald-50 dark:bg-green-500/10'
                    : 'text-slate-400 dark:text-gray-600'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

      </div>

    </div>
  )
}

export default App