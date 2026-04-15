'use client'

import React from 'react'

interface RefreshProgressBarProps {
  intervalMs: number
}

export default function RefreshProgressBar({ intervalMs }: RefreshProgressBarProps) {
  return (
    <div className="fixed top-0 left-0 w-full h-[2px] z-[9999] bg-transparent pointer-events-none">
      <div
        className="h-full bg-orange-500 shadow-[0_0_10px_#f97316]"
        style={{
          animation: `price-progress ${intervalMs}ms linear forwards`,
        }}
      />
    </div>
  )
}
