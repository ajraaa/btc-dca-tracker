'use client'

import { motion } from 'framer-motion'

interface FABProps {
  onClick: () => void
  label: string
}

export default function FAB({ onClick, label }: FABProps) {
  return (
    <motion.button
      initial="rest"
      whileHover="hover"
      animate="rest"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center text-white rounded-full overflow-hidden cursor-pointer h-14"
      style={{ 
        background: 'var(--accent)',
        boxShadow: '0 4px 20px rgba(249, 115, 22, 0.35)',
      }}
    >
      <div className="flex items-center justify-center w-14 h-14 flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>
      <motion.span
        variants={{
          hover: { 
            width: 'auto', 
            opacity: 1, 
            marginLeft: 0, 
            marginRight: 24,
            transition: { width: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }
          },
          rest: { 
            width: 0, 
            opacity: 0, 
            marginLeft: 0, 
            marginRight: 0,
            transition: { width: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }
          }
        }}
        className="whitespace-nowrap font-bold overflow-hidden block"
      >
        {label}
      </motion.span>
    </motion.button>
  )
}
