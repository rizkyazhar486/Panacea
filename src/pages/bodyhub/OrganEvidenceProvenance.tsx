import { getBodyKnowledgeEvidenceForOrganKey } from '../../lib/anatomy/bodyKnowledgeEvidenceIndex'

// Compact, source-linked view of this organ's PubMed-backed educational
// relationships (see bodyKnowledgeEvidenceIndex.ts / data/body-knowledge/).
// Renders nothing when no seed exists yet for this organKey — evidence
// coverage is still partial by design, and an empty seed is not shown as if
// it were "no evidence exists", it simply is not registered here yet.
//
// Kept to one collapsed summary line plus a native <details> disclosure
// (the repository's copy rule: one concise sentence on the persistent
// scroll, longer content behind disclosure) so a fully-populated dossier
// does not grow another always-open section.
export function OrganEvidenceProvenance({ organKey }: { organKey: string }) {
  const evidence = getBodyKnowledgeEvidenceForOrganKey(organKey)
  if (!evidence) return null

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 dark:border-white/10 dark:bg-white/5">
      <details>
        <summary className="cursor-pointer text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
          {evidence.relationshipCount} source-checked relationship{evidence.relationshipCount === 1 ? '' : 's'} from{' '}
          {evidence.sourceCount} PubMed source{evidence.sourceCount === 1 ? '' : 's'} (updated {evidence.updatedAt}).
        </summary>
        <div className="mt-2 space-y-2">
          <ul className="space-y-1.5">
            {evidence.relationships.map((relationship) => (
              <li key={relationship.id} className="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                {relationship.claim}{' '}
                <span className="text-neutral-400">
                  (
                  {relationship.evidencePmids.map((pmid, i) => (
                    <span key={pmid}>
                      {i > 0 && ', '}
                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        PMID {pmid}
                      </a>
                    </span>
                  ))}
                  )
                </span>
              </li>
            ))}
          </ul>
          {/* The boundary sentence is never separated from the claims it
              bounds — "source-checked" means a human matched the claim to a
              cited PubMed review; it does not mean guideline-recommended,
              clinically validated, human-reviewed in Panacea, or
              patient-specific. */}
          <p className="text-[10px] leading-relaxed text-neutral-400">{evidence.sourceCheckedMeans}</p>
        </div>
      </details>
    </div>
  )
}

export default OrganEvidenceProvenance
