import { useEffect } from "react"
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react"
import { motionEase, motionTiming } from "./motion-system"

export function AnimatedCounter({ value }: { value: number }) {
  const reducedMotion = useReducedMotion() ?? false
  const count = useMotionValue(reducedMotion ? value : 0)
  const display = useTransform(count, (current) => Math.round(current).toLocaleString("en-IN"))

  useEffect(() => {
    if (reducedMotion) {
      count.set(value)
      return
    }
    const controls = animate(count, value, { duration: motionTiming.count, ease: motionEase })
    return () => controls.stop()
  }, [count, reducedMotion, value])

  return <><span className="sr-only">{value.toLocaleString("en-IN")}</span><motion.span aria-hidden="true">{display}</motion.span></>
}
