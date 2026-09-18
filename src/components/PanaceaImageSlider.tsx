import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SlidableRail, type SlidableRailHandle } from './SlidableRail'

const SLIDES = [
  { id: 'heart', label: 'Heart', image: '/organs/heart/organ.webp' },
  { id: 'brain', label: 'Brain', image: '/organs/brain/organ.webp' },
  { id: 'lungs', label: 'Lungs', image: '/organs/lungs/organ.webp' },
  { id: 'kidneys', label: 'Kidneys', image: '/organs/kidneys/organ.webp' },
  { id: 'liver', label: 'Liver', image: '/organs/liver/organ.webp' },
  { id: 'skin', label: 'Skin', image: '/organs/skin/organ.webp' },
] as const

export function PanaceaImageSlider() {
  const rail = useRef<SlidableRailHandle>(null)
  const [active, setActive] = useState(0)
  const activeSlide = useMemo(() => SLIDES[active] ?? SLIDES[0], [active])

  return (
    <section className="pmd-image-story pmd-scroll-section" aria-label="Body image slider">
      <div className="pmd-section-heading">
        <span className="pmd-section-kicker">Visual shortcut</span>
        <strong className="pmd-one-line">Slide through the body</strong>
      </div>

      <SlidableRail
        ref={rail}
        ariaLabel="Human body image slider"
        mandatorySnap
        className="pmd-image-slider"
        itemClassName="w-[82vw] max-w-[460px] sm:w-[420px]"
        onActiveIndexChange={setActive}
      >
        {SLIDES.map((slide) => (
          <Link
            key={slide.id}
            to={'/fitness-hub?view=body-exposure&organ=' + slide.id}
            className="pmd-image-slide"
            aria-label={'Open ' + slide.label + ' in Your Body'}
          >
            <img src={slide.image} alt="" loading="lazy" decoding="async" />
            <span className="pmd-image-slide-shade" aria-hidden />
            <span className="pmd-image-slide-label">
              <strong className="pmd-one-line">{slide.label}</strong>
              <span aria-hidden>↗</span>
            </span>
          </Link>
        ))}
      </SlidableRail>

      <div className="pmd-slider-footer">
        <span className="pmd-one-line">{activeSlide.label}</span>
        <div className="pmd-slider-dots" aria-label="Choose image">
          {SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={'Show ' + slide.label}
              aria-current={active === index ? 'true' : undefined}
              onClick={() => rail.current?.scrollToIndex(index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default PanaceaImageSlider
