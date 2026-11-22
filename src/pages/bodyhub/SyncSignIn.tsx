export function SyncSignIn() {
  return (
    <span>
      Sign in to the same account with Google or a verified email code to reconnect.
      <button type="button" onClick={() => window.dispatchEvent(new Event('panacea:logout'))} className="ml-2 font-bold underline">Sign in again</button>
    </span>
  )
}
