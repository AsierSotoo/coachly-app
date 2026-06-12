'use client'

import { useEffect, useRef } from 'react'
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion'

export function StatCounter({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { duration: 800, bounce: 0 })
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  useEffect(() => {
    if (isInView) motionValue.set(value)
  }, [isInView, value, motionValue])

  useEffect(() => {
    spring.on('change', (v) => {
      if (ref.current) ref.current.textContent = Math.round(v).toString()
    })
  }, [spring])

  return <span ref={ref} className={className}>0</span>
}
