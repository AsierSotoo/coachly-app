'use client'

import { useEffect, useState } from 'react'

const DISMISSED_KEY = 'coachly_ios_banner_dismissed'

export function IosInstallBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Solo en iOS Safari, fuera de standalone
    const ua = navigator.userAgent
    const isIos = /iphone|ipad|ipod/i.test(ua)
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true

    if (!isIos || !isSafari || isStandalone) return

    try {
      if (localStorage.getItem(DISMISSED_KEY)) return
    } catch { /* private mode */ }

    setVisible(true)
  }, [])

  function dismiss() {
    try { localStorage.setItem(DISMISSED_KEY, '1') } catch { /* */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div
        className="mx-3 mb-3 rounded-2xl border shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bdr-strong)' }}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="Coachly" className="w-10 h-10 rounded-xl" />
            <div>
              <p className="text-[14px] font-bold" style={{ color: 'var(--tx)', fontFamily: 'Sora, sans-serif' }}>
                Instala Coachly
              </p>
              <p className="text-[11px]" style={{ color: 'var(--tx-2)' }}>
                Úsala como una app nativa
              </p>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer"
            style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--tx-3)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
          </button>
        </div>

        {/* Pasos */}
        <div className="flex items-center gap-2 px-4 pb-4 pt-1">
          {/* Paso 1 */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)' }}>
              {/* Icono de compartir de iOS — la caja con flecha hacia arriba */}
              <svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 1v12M4.5 5.5L9 1l4.5 4.5" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 9.5V17a1 1 0 001 1h14a1 1 0 001-1V9.5" stroke="var(--tx-2)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-[10px] text-center leading-tight" style={{ color: 'var(--tx-2)' }}>Pulsa</p>
            <p className="text-[10px] font-bold text-center leading-tight" style={{ color: 'var(--tx)' }}>Compartir</p>
          </div>

          <span className="material-symbols-outlined flex-shrink-0" style={{ color: 'var(--tx-3)', fontSize: 16 }}>chevron_right</span>

          {/* Paso 2 */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr-strong)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 20 }}>add_box</span>
            </div>
            <p className="text-[10px] text-center leading-tight" style={{ color: 'var(--tx-2)' }}>Elige</p>
            <p className="text-[10px] font-bold text-center leading-tight" style={{ color: 'var(--tx)' }}>Añadir pantalla</p>
          </div>

          <span className="material-symbols-outlined flex-shrink-0" style={{ color: 'var(--tx-3)', fontSize: 16 }}>chevron_right</span>

          {/* Paso 3 */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{ backgroundColor: 'rgba(var(--accent-rgb),0.1)', borderColor: 'rgba(var(--accent-rgb),0.3)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 20 }}>check_circle</span>
            </div>
            <p className="text-[10px] text-center leading-tight" style={{ color: 'var(--tx-2)' }}>Pulsa</p>
            <p className="text-[10px] font-bold text-center leading-tight" style={{ color: 'var(--accent)' }}>Añadir</p>
          </div>
        </div>

        {/* Nota */}
        <p className="text-[10px] text-center pb-3 px-4" style={{ color: 'var(--tx-3)' }}>
          Solo funciona desde <strong>Safari</strong> en iPhone · Chrome iOS no lo admite
        </p>
      </div>
    </div>
  )
}
