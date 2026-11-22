import gsap from 'gsap'

/**
 * GSAP Micro-Interaction: Smooth character / word reveal for hero titles
 */
export const animateHeroReveal = (element, delay = 0) => {
  if (!element) return
  gsap.fromTo(
    element,
    { opacity: 0, y: 16, filter: 'blur(4px)' },
    {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 0.65,
      delay,
      ease: 'power3.out'
    }
  )
}

/**
 * GSAP Micro-Interaction: Smooth number count-up or metric pulse
 */
export const animateNumberCount = (element, start, end, duration = 0.8) => {
  if (!element) return
  const obj = { val: start }
  gsap.to(obj, {
    val: end,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      element.innerText = Math.round(obj.val)
    }
  })
}

/**
 * GSAP Micro-Interaction: Staggered entrance for list/card rows
 */
export const animateStaggeredChildren = (containerSelector, childSelector, delay = 0.1) => {
  gsap.fromTo(
    `${containerSelector} ${childSelector}`,
    { opacity: 0, y: 14 },
    {
      opacity: 1,
      y: 0,
      duration: 0.45,
      stagger: 0.08,
      delay,
      ease: 'power2.out'
    }
  )
}

/**
 * Framer Motion Reusable Variants for consistent layout and micro-interactions
 */
export const springTransition = {
  type: 'spring',
  stiffness: 420,
  damping: 28
}

export const buttonMicroHover = {
  scale: 1.025,
  transition: { duration: 0.15, ease: 'easeOut' }
}

export const buttonMicroTap = {
  scale: 0.965,
  transition: { duration: 0.1 }
}

export const cardHoverMotion = {
  y: -3,
  transition: { duration: 0.2, ease: 'easeOut' }
}

export const modalBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } }
}

export const modalDialogVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 380, damping: 26 }
  },
  exit: { opacity: 0, scale: 0.96, y: 6, transition: { duration: 0.15 } }
}

export const pageFadeVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.2 } }
}
