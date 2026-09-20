'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 360)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="scroll-top"
          initial={{ opacity: 0, scale: 0.7, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={scrollTop}
          aria-label="Volver arriba"
          className="fixed z-40 flex items-center justify-center rounded-full border shadow-lg cursor-pointer transition-colors"
          style={{
            bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
            right: 16,
            width: 42,
            height: 42,
            backgroundColor: '#111713',
            borderColor: '#2a342d',
            color: '#89968e',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
          whileHover={{ scale: 1.1, borderColor: 'var(--accent)', color: 'var(--accent)' }}
          whileTap={{ scale: 0.92 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>keyboard_arrow_up</span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
