import React, { useEffect, useState } from 'react'
import { Activity, ExternalLink, PlusCircle, Server, ShieldCheck } from 'lucide-react'
import { checkBackendHealth } from '../services/api'

interface HeaderProps {
  onOpenCreate: () => void
  activeThreadId?: string | null
}

export const Header: React.FC<HeaderProps> = ({ onOpenCreate, activeThreadId }) => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [backendMeta, setBackendMeta] = useState<{ service?: string; version?: string }>({})

  useEffect(() => {
    let isMounted = true
    const check = async () => {
      try {
        const data = await checkBackendHealth()
        if (isMounted) {
          setBackendStatus('online')
          setBackendMeta({ service: data.service, version: data.version })
        }
      } catch {
        if (isMounted) {
          setBackendStatus('offline')
        }
      }
    }
    check()
    const interval = setInterval(check, 10000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between shadow-md">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/25">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg leading-tight tracking-tight text-white">AgentGate</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              v0.1.0
            </span>
          </div>
          <p className="text-xs text-slate-400">Autonomous SWE Agent &amp; HITL Safety Guardrails</p>
        </div>
      </div>

      {/* Center status indicator */}
      <div className="hidden md:flex items-center gap-3 bg-slate-950/60 border border-slate-800/80 rounded-lg px-3 py-1.5 text-xs">
        <Server className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-400">Backend API:</span>
        <div className="flex items-center gap-1.5 font-medium">
          {backendStatus === 'online' && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-emerald-400">Online ({backendMeta.service || 'agentgate-backend'})</span>
            </>
          )}
          {backendStatus === 'checking' && (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span className="text-amber-400">Connecting...</span>
            </>
          )}
          {backendStatus === 'offline' && (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="text-rose-400">Offline (FastAPI :8000)</span>
            </>
          )}
        </div>

        {activeThreadId && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-800 text-slate-300">
            <Activity className="w-3 h-3 text-indigo-400" />
            <span className="text-slate-400">Active Run:</span>
            <span className="font-mono text-indigo-300 font-semibold">{activeThreadId}</span>
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <a
          href="/docs"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/50 transition"
        >
          API Docs <ExternalLink className="w-3 h-3" />
        </a>

        <button
          onClick={onOpenCreate}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 transition active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New SWE Run</span>
        </button>
      </div>
    </header>
  )
}

