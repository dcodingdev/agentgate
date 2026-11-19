import React from 'react'
import { Key } from 'lucide-react'
import type { ScreenId } from '../types'

interface TopAppBarProps {
  currentScreen?: ScreenId
  onSelectScreen: (screen: ScreenId) => void
  githubUsername?: string
  onOpenSecretModal?: () => void
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  onSelectScreen,
  githubUsername,
  onOpenSecretModal,
}) => {
  return (
    <header className="h-14 border-b border-[#e5e5e5] bg-[#fffdf8] px-4 lg:px-6 flex items-center justify-between select-none z-30 sticky top-0">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onSelectScreen('setup')}
          className="font-extrabold text-xl text-[#18181b] tracking-normal flex items-center gap-1 cursor-pointer"
        >
          <span>AgentGate</span>
          <span className="text-[#0d9488]">.</span>
        </button>
      </div>

      {/* GitHub Secret Configure Button */}
      {onOpenSecretModal && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSecretModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-[#18181b] bg-white text-xs font-bold text-[#18181b] shadow-[2px_2px_0px_#18181b] hover:bg-[#fff4da] transition cursor-pointer"
            title="Configure GitHub Secret"
          >
            <Key className="w-3.5 h-3.5 text-[#0d9488]" />
            <span>{githubUsername ? `@${githubUsername}` : 'Connect GitHub'}</span>
          </button>
        </div>
      )}
    </header>
  )
}
