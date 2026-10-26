import { useRef } from 'react'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 64])
  const badgeY = useTransform(scrollYProgress, [0, 1], [0, -28])

  return (
    <section ref={sectionRef} className="hero" id="top">
      <div className="hero__grid page-shell">
        <div className="hero__copy">
          <motion.p
            className="eyebrow"
            initial={reduceMotion ? false : { y: 16 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            Precision nutraceuticals <span>·</span> Personal by design
          </motion.p>
          <h1 className="hero__title">
            <span className="hero__title-line"><motion.span initial={reduceMotion ? false : { y: '105%' }} animate={{ y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>Science,</motion.span></span>
            <span className="hero__title-line"><motion.span initial={reduceMotion ? false : { y: '105%' }} animate={{ y: 0 }} transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}><em>made personal.</em></motion.span></span>
          </h1>
          <motion.p
            className="hero__lede"
            initial={reduceMotion ? false : { y: 18 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
          >
            Targeted formulas, uncompromising standards, and a Private Vault built around your routine—not someone else’s.
          </motion.p>
          <motion.div
            className="hero__actions"
            initial={reduceMotion ? false : { y: 18 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.55, delay: 0.27 }}
          >
            <a href="#vault-builder" className="button button--orange">Build your private vault <ArrowUpRight size={18} aria-hidden="true" /></a>
            <a href="#catalog" className="text-link">Explore the formulas <ArrowDown size={16} aria-hidden="true" /></a>
          </motion.div>
          <div className="hero__proof" aria-label="PanaceaMed principles">
            <div><strong>04</strong><span>Targeted formulas</span></div>
            <div><strong>20%</strong><span>Private Vault saving</span></div>
            <div><strong>01</strong><span>Considered routine</span></div>
          </div>
        </div>

        <div className="hero__visual">
          <motion.div className="hero__image-wrap" style={{ y: reduceMotion ? 0 : imageY }}>
            <img src="/images/hero-products.webp" alt="Three PanaceaMed amber glass supplement jars arranged on brushed steel plinths with a botanical leaf" fetchPriority="high" />
          </motion.div>
          <motion.div className="hero__badge" style={{ y: reduceMotion ? 0 : badgeY }} aria-label="Save 20 percent with a Private Vault">
            <span>SAVE</span><strong>20%</strong><span>WITH A VAULT</span>
          </motion.div>
          <div className="hero__caption">
            <span>THE DAILY EDIT</span>
            <p>Precision in every detail.<br />Simplicity in every ritual.</p>
          </div>
        </div>
      </div>
      <div className="hero__marquee" aria-hidden="true">
        <span>FORMULATED WITH PURPOSE</span><i />
        <span>PRODUCED WITH PRECISION</span><i />
        <span>SELECTED FOR YOU</span>
      </div>
    </section>
  )
}
