import { HomeCommandDeck } from '../components/HomeCommandDeck'

/**
 * Home is intentionally a single compact super-page.
 * Deep product areas stay available through the universal capability registry
 * instead of competing as permanent Home tabs.
 */
export function HomeSocialWorkspace() {
  return (
    <main className="mx-auto w-full max-w-[1540px] px-1 pb-12 sm:px-2 lg:px-4">
      <HomeCommandDeck />
    </main>
  )
}

export default HomeSocialWorkspace
