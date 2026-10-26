import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ArrowUpRight, Plus } from '../icons'
import { Reveal } from './Reveal'
import { testimonials } from '../data/products'
import { scrollToSection } from '../utils'

const scienceSteps = [
  {
    title: 'Sourcing',
    label: 'Begin with better inputs',
    description: 'Ingredient selection starts with identity, origin, and suitability for the formula. Every choice should have a reason to be there.',
    note: 'Ingredient identity · supplier review · traceability',
    image: '/images/sourcing.webp',
    position: '50% 50%',
  },
  {
    title: 'Formulation',
    label: 'Purpose over complexity',
    description: 'A formula is more than a list of ingredients. Format, combination, and intended routine are considered together to keep each product focused.',
    note: 'formula rationale · format · routine fit',
    image: '/images/sourcing.webp',
    position: '72% 60%',
  },
  {
    title: 'Manufacturing',
    label: 'Precision, repeated',
    description: 'Controlled processes and documented quality systems help turn a considered formula into a consistent product, batch after batch.',
    note: 'process controls · batch records · hygiene',
    image: '/images/manufacturing.webp',
    position: '60% 50%',
  },
  {
    title: 'Testing',
    label: 'Check before it reaches you',
    description: 'Quality review is part of the process, not an afterthought. Testing and release checks support product integrity and consistency.',
    note: 'quality review · release checks · records',
    image: '/images/manufacturing.webp',
    position: '82% 45%',
  },
]

const faqs = [
  {
    question: 'How does the Private Vault work?',
    answer: 'Name your collection, choose your areas of focus and routine, then edit the recommended formulas. Every Private Vault receives a 20% saving, with no subscription required.',
  },
  {
    question: 'Can I change the recommended formulas?',
    answer: 'Yes. Recommendations are only a starting point. You can remove or swap any eligible formula before generating your Vault, and return to edit it before adding it to your cart.',
  },
  {
    question: 'Where is my saved Vault stored?',
    answer: 'In this storefront preview, your saved Vault and cart are stored only in your current browser. They do not sync across devices, and clearing browser data will remove them.',
  },
  {
    question: 'Are PanaceaMed products medicine?',
    answer: 'No. These are dietary supplement products, not medicines. They are not intended to diagnose, treat, cure, or prevent any disease. Always read the product label and consult a qualified healthcare professional about your individual needs.',
  },
]

export function WhyPanacea() {
  return (
    <section className="why section-space" id="why-panacea">
      <div className="page-shell">
        <Reveal className="section-heading section-heading--split">
          <div><p className="eyebrow">Why PanaceaMed</p><h2>Less noise.<br /><em>More knowing.</em></h2></div>
          <p>We believe premium wellness should feel calm, clear, and exact. Every detail—from the formula to the way you choose it—should earn its place.</p>
        </Reveal>
        <div className="why__grid">
          <Reveal className="why__image">
            <img src="/images/sourcing.webp" alt="Gloved hands carefully inspecting a botanical leaf beside ingredient dishes" loading="lazy" />
            <div className="image-caption"><span>INGREDIENT STUDY / 01</span><p>Thoughtful choices begin at the source.</p></div>
          </Reveal>
          <div className="why__principles">
            <Reveal className="principle"><span>Purposeful formulation</span><h3>Nothing added for show.</h3><p>Focused products built around a clear role in your routine, not an intimidating ingredient list.</p></Reveal>
            <Reveal className="principle" delay={0.06}><span>Radical clarity</span><h3>Understand what you choose.</h3><p>Plain language, visible pricing, and room to make your own informed decision.</p></Reveal>
            <Reveal className="principle" delay={0.12}><span>Personal by default</span><h3>Your routine sets the rhythm.</h3><p>The Private Vault starts with your preferences and leaves every final choice with you.</p></Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

export function ScienceQuality() {
  const [active, setActive] = useState(0)
  const reduceMotion = useReducedMotion()
  const step = scienceSteps[active]

  return (
    <section className="science section-space" id="our-standard">
      <div className="page-shell">
        <Reveal className="section-heading section-heading--split">
          <div><p className="eyebrow">Science & quality</p><h2>Rigor, from<br /><em>source to shelf.</em></h2></div>
          <p>Quality is a chain of deliberate decisions. Explore the four stages that shape our approach to making supplements with care.</p>
        </Reveal>
        <div className="science__workspace">
          <div className="science__timeline" role="tablist" aria-label="Science and quality stages">
            {scienceSteps.map((item, index) => (
              <button key={item.title} type="button" role="tab" aria-selected={active === index} aria-controls="science-panel" className={active === index ? 'is-active' : ''} onClick={() => setActive(index)}>
                <span>0{index + 1}</span><strong>{item.title}</strong><ArrowUpRight size={18} aria-hidden="true" />
              </button>
            ))}
          </div>
          <div className="science__panel" id="science-panel" role="tabpanel">
            <div className="science__image">
              <AnimatePresence mode="wait" initial={false}>
                <motion.img key={`${active}-${step.image}`} src={step.image} alt={active < 2 ? 'Ingredient selection and formulation in a clinical setting' : 'Laboratory scientist reviewing supplement quality'} style={{ objectPosition: step.position }} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduceMotion ? undefined : { opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.22 }} loading="lazy" />
              </AnimatePresence>
              <span>PROCESS / 0{active + 1}</span>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div className="science__copy" key={active} initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.2 }}>
                <p className="eyebrow">{step.title}</p><h3>{step.label}</h3><p>{step.description}</p><small>{step.note}</small>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <div className="standards" aria-label="Quality standards and registrations">
          <div><strong>GMP</strong><span>Manufacturing practices</span></div>
          <div><strong>FDA</strong><span>Facility registration</span></div>
          <div><strong>ISO</strong><span>Quality systems</span></div>
          <div><strong>BPOM</strong><span>Local compliance</span></div>
        </div>
        <p className="standards__note">Registrations and quality-system references describe manufacturing or regulatory context; they are not efficacy endorsements. FDA registration does not denote FDA approval.</p>
      </div>
    </section>
  )
}

export function Services() {
  return (
    <section className="services section-space" id="services">
      <div className="page-shell services__grid">
        <Reveal className="services__intro"><p className="eyebrow">The PanaceaMed service</p><h2>Considered care,<br /><em>beyond the jar.</em></h2><p>Less friction between wanting to feel your best and building a routine that makes sense to you.</p></Reveal>
        <div className="services__list">
          <details><summary><span>Personalized formulas</span><Plus size={20} aria-hidden="true" /></summary><div><p>Build a collection around your preferred areas of focus and routine. Recommendations are editable at every step, because personalization should never mean giving up control.</p><button type="button" onClick={() => scrollToSection('vault-builder')} className="text-link">Create your collection <ArrowRight size={15} /></button></div></details>
          <details><summary><span>Bundle savings</span><Plus size={20} aria-hidden="true" /></summary><div><p>Every Private Vault saves 20% on the formulas inside it. The discount is shown clearly before you add the collection to your cart, with no subscription required.</p><button type="button" onClick={() => scrollToSection('vault-builder')} className="text-link">See your saving <ArrowRight size={15} /></button></div></details>
          <details><summary><span>Scientifically tested</span><Plus size={20} aria-hidden="true" /></summary><div><p>Our quality approach centers on ingredient review, controlled manufacturing, and product testing. Testing supports quality and consistency; it does not turn a supplement into a treatment or guarantee an outcome.</p><button type="button" onClick={() => scrollToSection('our-standard')} className="text-link">Explore our standard <ArrowRight size={15} /></button></div></details>
        </div>
      </div>
    </section>
  )
}

export function Testimonials() {
  const [active, setActive] = useState(0)
  const reduceMotion = useReducedMotion()
  const previous = () => setActive((active - 1 + testimonials.length) % testimonials.length)
  const next = () => setActive((active + 1) % testimonials.length)
  const testimonial = testimonials[active]

  return (
    <section className="testimonials section-space" id="testimonials">
      <div className="page-shell">
        <div className="testimonials__top"><p className="eyebrow">In their words</p><span>5.0 / 5 · MEMBER EXPERIENCES</span></div>
        <div className="testimonials__stage" aria-live="polite">
          <span className="testimonials__mark" aria-hidden="true">“</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.figure key={active} initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: reduceMotion ? 0 : 0.22 }}>
              <blockquote>{testimonial.quote}</blockquote>
              <figcaption><strong>{testimonial.name}</strong><span>{testimonial.detail}</span></figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
        <div className="testimonials__controls"><span>0{active + 1} / 0{testimonials.length}</span><div><button type="button" className="icon-button" onClick={previous} aria-label="Previous testimonial"><ArrowLeft size={20} /></button><button type="button" className="icon-button" onClick={next} aria-label="Next testimonial"><ArrowRight size={20} /></button></div></div>
      </div>
    </section>
  )
}

export function Faq() {
  return (
    <section className="faq section-space" id="faq">
      <div className="page-shell faq__grid">
        <Reveal className="faq__intro"><p className="eyebrow">Good to know</p><h2>A few clear<br /><em>answers.</em></h2><p>Still deciding? Begin with the essentials, then make the routine your own.</p><button type="button" onClick={() => scrollToSection('vault-builder')} className="text-link">Build your Private Vault <ArrowUpRight size={16} /></button></Reveal>
        <div className="faq__list">
          {faqs.map((faq) => <details key={faq.question}><summary>{faq.question}<Plus size={19} aria-hidden="true" /></summary><p>{faq.answer}</p></details>)}
        </div>
      </div>
    </section>
  )
}

export function ClosingCta() {
  return (
    <section className="closing-cta">
      <div className="page-shell closing-cta__inner">
        <Reveal><p className="eyebrow">Your next ritual</p><h2>Wellness, well considered.<br /><em>Made yours.</em></h2></Reveal>
        <Reveal className="closing-cta__action" delay={0.08}><p>Start with one formula, or save 20% on a collection built around you.</p><button type="button" onClick={() => scrollToSection('vault-builder')} className="button button--orange">Build your private vault <ArrowRight size={18} /></button></Reveal>
      </div>
    </section>
  )
}
