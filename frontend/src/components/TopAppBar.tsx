import React from 'react'
import type { ScreenId } from '../types'

interface TopAppBarProps {
  currentScreen?: ScreenId
  onSelectScreen: (screen: ScreenId) => void
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  onSelectScreen,
}) => {
  return (
    <header className="h-14 border-b border-[#e5e5e5] bg-[#fffdf8] px-4 lg:px-6 flex items-center justify-between select-none z-30 sticky top-0">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onSelectScreen('setup')}
          className="font-extrabold text-xl text-[#18181b] tracking-[-0.04em] flex items-center gap-1 cursor-pointer"
        >
          <span>AgentGate</span>
          <span className="text-[#0d9488]">.</span>
        </button>
      </div>
    </header>
  )
}
