import type { Variants } from "motion/react"

export const motionEase = [0.22, 1, 0.36, 1] as const

export const motionTiming = {
  quick: 0.16,
  page: 0.28,
  reveal: 0.34,
  chart: 0.65,
  count: 0.8,
  stagger: 0.055,
} as const

export const pageGroup: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: motionTiming.stagger, delayChildren: 0.04 } },
}

export const listGroup: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.035 } },
}

export function reveal(reducedMotion: boolean): Variants {
  return {
    hidden: reducedMotion ? { opacity: 1 } : { opacity: 0, y: 9 },
    visible: { opacity: 1, y: 0, transition: { duration: reducedMotion ? 0 : motionTiming.reveal, ease: motionEase } },
  }
}

export function cardInteraction(reducedMotion: boolean) {
  return reducedMotion ? {} : {
    whileHover: { y: -3 },
    whileTap: { scale: 0.99 },
    transition: { duration: motionTiming.quick, ease: motionEase },
  }
}
