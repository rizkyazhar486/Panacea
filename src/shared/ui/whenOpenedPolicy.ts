// Kebijakan murni untuk WhenOpened: kapan isi panel boleh dipasang.

/** Panel dipasang seketika bila tidak berada di dalam <details>, atau <details> itu sudah terbuka. */
export function mountsAtOnce(details: { readonly open: boolean } | null): boolean {
  return details === null || details.open
}
