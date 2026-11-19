import React, { useEffect, useState } from 'react'
import {
  Activity,
  CheckSquare,
  Key,
  Lock,
  Plus,
  Shield,
  Terminal,
  User,
} from 'lucide-react'
import type { NavItemId, ScreenId } from '../types'

interface LeftNavRailProps {
  currentScreen: ScreenId
  onSelectScreen: (screen: ScreenId) => void
  activeRunsCount?: number
  pendingSignOffCount?: number
  githubUsername?: string
  onOpenSecretModal?: () => void
}

export const LeftNavRail: React.FC<LeftNavRailProps> = ({
  currentScreen,
  onSelectScreen,
  activeRunsCount = 0,
  pendingSignOffCount = 0,
  githubUsername,
  onOpenSecretModal,
}) => {
  const [profileName, setProfileName] = useState<string>(() => {
    return (
      githubUsername ||
      (typeof window !== 'undefined' && localStorage.getItem('agentgate_github_username')) ||
      ''
    )
  })

  // Dynamically resolve GitHub Profile from token if available
  useEffect(() => {
    if (githubUsername) {
      setProfileName(githubUsername)
      return
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('agentgate_github_token') : null
    if (token) {
      fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.login) {
            setProfileName(data.login)
            localStorage.setItem('agentgate_github_username', data.login)
          }
        })
        .catch(() => {})
    } else {
      setProfileName('')
    }
  }, [githubUsername])

  const navItems: {
    id: NavItemId
    screen: ScreenId
    label: string
    icon: React.ElementType
    badge?: string
    badgeColor?: 'teal' | 'amber' | 'slate'
  }[] = [
    {
      id: 'runs',
      screen: 'live-sandbox',
      label: 'Runs',
      icon: Terminal,
      badge: activeRunsCount > 0 ? `${activeRunsCount} Active` : undefined,
      badgeColor: 'teal',
    },
    {
      id: 'sign-off',
      screen: 'approval-gate',
      label: 'Human Sign-Off',
      icon: CheckSquare,
      badge: pendingSignOffCount > 0 ? `${pendingSignOffCount} Waiting` : undefined,
      badgeColor: 'amber',
    },
    {
      id: 'policies',
      screen: 'policies',
      label: 'Repositories & Policies',
      icon: Shield,
    },
    {
      id: 'audit',
      screen: 'audit',
      label: 'Activity & Audit',
      icon: Activity,
    },
  ]

  return (
    <aside className="w-64 shrink-0 border-r border-[#e5e5e5] bg-[#fffdf8] flex flex-col justify-between p-3.5 select-none h-[calc(100vh-3.5rem)] sticky top-14">
      {/* Top Section: Individual GitHub Profile & New Run Button */}
      <div className="space-y-3">
        {/* GitHub Profile Section */}
        <div
          onClick={onOpenSecretModal}
          className="p-2.5 rounded-lg border-2 border-[#18181b] bg-white shadow-[2px_2px_0px_#18181b] flex items-center justify-between transition cursor-pointer hover:bg-[#fff4da]"
          title="Click to configure GitHub Secret"
        >
          <div className="flex items-center gap-2 truncate">
            <div className="w-6 h-6 rounded-full bg-[#18181b] text-white flex items-center justify-center font-bold text-xs shrink-0 border border-[#18181b]">
              <User className="w-3.5 h-3.5 text-[#0d9488]" />
            </div>
            <div className="truncate text-left">
              <p className="font-extrabold text-sm text-[#18181b] truncate">
                {profileName ? `@${profileName}` : 'Connect GitHub'}
              </p>
              <p className="text-xs text-[#666666]">
                {profileName ? 'GitHub Connected' : 'Secret Key Required'}
              </p>
            </div>
          </div>
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${profileName ? 'bg-[#0d9488]' : 'bg-[#d97706]'}`}
            title={profileName ? 'GitHub Connected' : 'No Secret Key'}
          />
        </div>

        {/* Quick Launch CTA (+ New Run) */}
        <button
          type="button"
          onClick={() => onSelectScreen('setup')}
          className={`w-full py-2.5 px-3 rounded-md text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            currentScreen === 'setup'
              ? 'btn-cta shadow-[3px_3px_0px_#18181b]'
              : 'bg-[#18181b] text-white border-2 border-[#18181b] shadow-[2px_2px_0px_#18181b] hover:translate-x-[-1px] hover:translate-y-[-1px]'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>New Run</span>
        </button>

        {/* Navigation Menu (Permanently Plain Mode) */}
        <nav className="space-y-1 pt-1">
          {navItems.map((item) => {
            const isSelected = currentScreen === item.screen
            const Icon = item.icon

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => onSelectScreen(item.screen)}
                className={`w-full p-2.5 rounded-lg text-left transition flex items-center justify-between cursor-pointer border ${
                  isSelected
                    ? 'border-2 border-[#18181b] bg-[#fff4da] text-[#18181b] shadow-[2px_2px_0px_#18181b] font-bold'
                    : 'border-transparent text-[#666666] hover:text-[#18181b] hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isSelected ? 'text-[#0d9488]' : 'text-[#666666]'
                    }`}
                  />
                  <p className="text-sm font-bold truncate leading-tight text-[#18181b]">
                    {item.label}
                  </p>
                </div>

                {item.badge && (
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded border shrink-0 ${
                      item.badgeColor === 'teal'
                        ? 'bg-[#ccfbf1] text-[#0f766e] border-[#0d9488]'
                        : item.badgeColor === 'amber'
                        ? 'bg-[#fef3c7] text-[#92400e] border-[#d97706] animate-pulse'
                        : 'bg-white text-[#666666] border-[#e5e5e5]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Bottom Rail: Policy Guard & GitHub Secret Indicator */}
      <div className="pt-3 border-t border-[#e5e5e5] text-xs space-y-2">
        <div className="p-2.5 rounded-md bg-white border border-[#e5e5e5] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#666666] flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#d97706]" />
              Policy Threshold
            </span>
            <span className="text-xs font-bold text-[#d97706] bg-[#fef3c7] px-1.5 py-0.5 rounded">
              0.70 locked
            </span>
          </div>
          <p className="text-xs text-[#666666] leading-tight">
            Mandatory human intercept when risk exceeds 0.70.
          </p>
        </div>

        {/* GitHub Secret Indicator */}
        <div
          onClick={onOpenSecretModal}
          className="p-2.5 rounded-md bg-[#fffdf8] border border-[#18181b] flex items-center justify-between text-xs cursor-pointer hover:bg-[#fff4da] transition"
          title="Click to update GitHub Secret"
        >
          <div className="flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-[#0d9488]" />
            <span className="font-bold text-[#18181b]">GitHub Secret</span>
          </div>
          <span className="text-xs font-mono font-bold text-[#0d9488]">
            {githubUsername ? `@${githubUsername}` : 'Configure'}
          </span>
        </div>
      </div>
    </aside>
  )
}
