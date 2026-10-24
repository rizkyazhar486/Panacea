import { PRIVACY_DISCLOSURE } from '../../domains/privacy'
import { Card, SectionTitle } from '../../components/ui'
import { IconShield, IconLock, IconCheck } from '../../components/icons'

// Describe implemented controls without asserting unverified deployment or legal approval.
export function Legal() {
  return (
    <div data-pmd-unclamped="true" className="mx-auto max-w-3xl space-y-6">
      <Card>
        <SectionTitle icon={<IconShield size={20} />} title="Privacy & Data Protection Policy" subtitle="Current data controls and their scope" />
        <div className="space-y-3 text-sm leading-relaxed text-neutral-600">
          <p>This page describes data handling controls and their current limits. Health information requires careful access and sharing decisions.</p>
          <ul className="ml-4 list-disc space-y-1.5">
            <li><b>Data collected:</b> identity, demographic data, health history, vital signs, diagnostic results, and usage activity.</li>
            <li><b>Purpose:</b> AI-assisted documentation, education and health monitoring. {PRIVACY_DISCLOSURE.draftReview}</li>
            <li><b>Data requests:</b> {PRIVACY_DISCLOSURE.requests} {PRIVACY_DISCLOSURE.localReset}</li>
            <li><b>Sharing controls:</b> {PRIVACY_DISCLOSURE.sharing}</li>
            <li><b>Retention:</b> {PRIVACY_DISCLOSURE.retention}</li>
          </ul>
        </div>
      </Card>

      <Card>
        <SectionTitle icon={<IconLock size={20} />} title="Deployment Security" subtitle="Hosting and encryption require deployment evidence" />
        <div className="space-y-3 text-sm leading-relaxed text-neutral-600">
          <div className="flex items-start gap-2 rounded-xl bg-brand-50 p-3 text-brand-dark">
            <IconLock size={16} className="mt-0.5 shrink-0" />
            <span><b>Deployment settings.</b> {PRIVACY_DISCLOSURE.deployment}</span>
          </div>
          <p>{PRIVACY_DISCLOSURE.integration}</p>
        </div>
      </Card>

      <Card>
        <SectionTitle icon={<IconCheck size={20} />} title="Terms & Conditions of Service" />
        <ol className="ml-4 list-decimal space-y-1.5 text-sm leading-relaxed text-neutral-600">
          <li>Panaceamed.id is a clinical support tool. <b>AI assists, but does not replace, licensed clinicians.</b> Final medical decisions rest with the physician.</li>
          <li>{PRIVACY_DISCLOSURE.clinicalAuthority}</li>
          <li>Medication information does not authorize prescribing or dispensing. Treatment decisions remain with authorized healthcare professionals.</li>
          <li>Users are responsible for the accuracy of the data they enter.</li>
          <li>Misuse, including giving medical advice without authority, is prohibited.</li>
        </ol>
      </Card>

      <Card>
        <SectionTitle icon={<IconShield size={20} />} title="Informed Consent" />
        <div className="space-y-2 text-sm leading-relaxed text-neutral-600">
          <p>By using Panaceamed.id, you understand and agree that:</p>
          <ul className="ml-4 list-disc space-y-1.5">
            <li>Interactions with the AI are <b>educational &amp; supportive</b> in nature; not a final diagnosis.</li>
            <li>Diagnosis &amp; treatment still require re-examination by a doctor.</li>
            <li>Your health data is processed for service purposes as described in the Privacy Policy.</li>
            <li>In an emergency, immediately contact the nearest healthcare facility (Emergency SOS feature).</li>
          </ul>
        </div>
      </Card>

      <p className="px-1 text-center text-xs text-neutral-500">
        These control descriptions are informational, not a certification of legal compliance. Deployment and retention details require operator confirmation. Last updated: {PRIVACY_DISCLOSURE.reviewedAt}.
      </p>
    </div>
  )
}
