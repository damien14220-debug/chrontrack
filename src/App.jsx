import React, { useState, useEffect } from 'react'
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
  const [dark, setDark] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) setDark(savedTheme === 'dark')

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const toggleTheme = () => {
    const newTheme = !dark
    setDark(newTheme)
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
  }

  // PALETTE JOUR (blanc + bleu azur + vert espoir)
  // PALETTE NUIT (actuelle)
  const t = {
    dark,
    bg: dark ? 'bg-gray-950' : 'bg-slate-50',
    bgCard: dark ? 'bg-gray-900' : 'bg-white',
    bgHover: dark ? 'hover:bg-gray-800' : 'hover:bg-slate-100',
    bgSubtle: dark ? 'bg-gray-800' : 'bg-slate-100',
    border: dark ? 'border-gray-800' : 'border-slate-200',
    text: dark ? 'text-white' : 'text-slate-900',
    textMuted: dark ? 'text-gray-400' : 'text-slate-500',
    textFaint: dark ? 'text-gray-600' : 'text-slate-400',
    sidebar: dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200',
    header: dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200',
    bottomNav: dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200',
    navActive: dark
      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
      : 'bg-gradient-to-r from-sky-50 to-emerald-50 text-emerald-600 border border-emerald-200',
    navInactive: dark
      ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
    accent: dark ? 'text-green-400' : 'text-emerald-600',
    accentBg: dark ? 'bg-green-500' : 'bg-gradient-to-r from-sky-500 to-emerald-500',
    accentBgHover: dark ? 'hover:bg-green-600' : 'hover:from-sky-600 hover:to-emerald-600',
    input: dark
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400',
    cardBorder: dark ? 'border-gray-800' : 'border-slate-200',
    shadow: dark ? '' : 'shadow-sm',
  }

  const navItems = [
    { id: 'dashboard', label: 'Accueil', icon: '🏠' },
    { id: 'analyses', label: 'Analyses', icon: '📊' },
    { id: 'statistiques', label: 'Stats', icon: '📈' },
    { id: 'symptomes', label: 'Symptômes', icon: '🤒' },
    { id: 'repas', label: 'Repas', icon: '🍽️' },
    { id: 'medicaments', label: 'Médocs', icon: '💊' },
    { id: 'rapport', label: 'Rapport', icon: '📄' },
  ]

  const renderPage = () => {
    switch(page) {
      case 'dashboard': return <Dashboard t={t} />
      case 'analyses': return <Analyses t={t} />
      case 'statistiques': return <Statistiques t={t} />
      case 'symptomes': return <Symptomes t={t} />
      case 'repas': return <Repas t={t} />
      case 'medicaments': return <Medicaments t={t} />
      case 'rapport': return <Rapport t={t} />
      case 'parametres': return <Parametres t={t} />
      default: return <Dashboard t={t} />
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${t.bg} flex items-center justify-center`}>
        <div className="text-center">
          <img src="/icon-192.png" className="w-16 h-16 mx-auto mb-4 rounded-2xl" alt="logo" />
          <p className={`${t.accent} font-semibold`}>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session) return <Login t={t} toggleTheme={toggleTheme} />

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} flex`}>

      {/* SIDEBAR DESKTOP */}
      <aside className={`hidden md:flex w-64 ${t.sidebar} border-r min-h-screen p-6 flex-col`}>
        
        {/* Logo */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src="/icon-192.png" className="w-9 h-9 rounded-xl" alt="logo" />
            <h1 className={`text-xl font-bold ${t.accent}`}>CrohnTrack</h1>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition font-medium ${
                page === item.id ? t.navActive : t.navInactive
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bas sidebar */}
        <div className={`border-t ${t.border} pt-4 mt-4`}>
          <p className={`${t.textFaint} text-xs mb-3 truncate px-1`}>{session.user.email}</p>
          <button
            onClick={() => setPage('parametres')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition font-medium mb-1 ${
              page === 'parametres' ? t.navActive : t.navInactive
            }`}
          >
            <span className="text-lg">⚙️</span>
            Paramètres
          </button>
          <button
            onClick={async () => { await supabase.auth.signOut(); setSession(null); setPage('dashboard') }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition font-medium text-gray-500 hover:bg-red-500/10 hover:text-red-400"
          >
            <span className="text-lg">🚪</span>
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* Header mobile */}
        <header className={`md:hidden ${t.header} border-b px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <img src="/icon-192.png" className="w-8 h-8 rounded-xl" alt="logo" />
            <h1 className={`text-lg font-bold ${t.accent}`}>CrohnTrack</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className={`p-2 rounded-xl ${t.bgHover} transition text-lg`}
            >
              ☰
            </button>
          </div>
        </header>

        {/* Menu mobile déroulant */}
        {showMobileMenu && (
          <div className={`md:hidden ${t.bgCard} border-b ${t.border} px-4 py-3 flex flex-col gap-2`}>
            <p className={`${t.textFaint} text-xs truncate`}>{session.user.email}</p>
            <button
              onClick={() => { setPage('parametres'); setShowMobileMenu(false) }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${t.navInactive}`}
            >
              ⚙️ Paramètres
            </button>
            <button
              onClick={async () => { await supabase.auth.signOut(); setSession(null); setPage('dashboard') }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-red-400 hover:bg-red-500/10"
            >
              🚪 Se déconnecter
            </button>
          </div>
        )}

        {/* Contenu */}
        <main className="flex-1 overflow-auto pb-24 md:pb-0">
          {renderPage()}
        </main>

        {/* BARRE NAV MOBILE */}
        <nav className={`md:hidden fixed bottom-0 left-0 right-0 ${t.bottomNav} border-t px-2 py-2 z-50`}>
          <div className="flex items-center justify-around">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`flex flex-col items-center gap-1 px-1 py-1 rounded-xl transition flex-1 ${
                  page === item.id ? t.accent : t.textFaint
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

      </div>
    </div>
  )
}

export default App