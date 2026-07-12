import { Card, SectionTitle } from '../components/ui'
import { IconShield, IconLock, IconCheck } from '../components/icons'

// Public legal & compliance content — Privacy Policy, Terms, Informed Consent,
// and the data-residency / security statement (UU PDP 27/2022, Permenkes 24/2022).
export function Legal() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <SectionTitle icon={<IconShield size={20} />} title="Privacy & Data Protection Policy" subtitle="In accordance with Law No. 27/2022 on Personal Data Protection (UU PDP)" />
        <div className="space-y-3 text-sm leading-relaxed text-neutral-600">
          <p>Panaceamed.id respects your privacy. Health data is classified as <b>specific personal data</b> and receives enhanced protection.</p>
          <ul className="ml-4 list-disc space-y-1.5">
            <li><b>Data collected:</b> identity, demographic data, health history, vital signs, diagnostic results, and usage activity.</li>
            <li><b>Purpose:</b> to provide AI-EMR services, education, consultations, and healthspan monitoring — always verified by licensed clinicians.</li>
            <li><b>Your rights:</b> to access, correct, withdraw consent, and <b>delete</b> your data at any time (Settings → Privacy & Data).</li>
            <li><b>Not shared</b> with third parties without consent, except as required by law.</li>
            <li>The <b>Data Protection Officer (DPO)</b> can be reached through the Support channel.</li>
          </ul>
        </div>
      </Card>

      <Card>
        <SectionTitle icon={<IconLock size={20} />} title="Data Security & Sovereignty" subtitle="Minister of Health Regulation No. 24/2022 on Electronic Medical Records" />
        <div className="space-y-3 text-sm leading-relaxed text-neutral-600">
          <div className="flex items-start gap-2 rounded-xl bg-brand-50 p-3 text-brand-dark">
            <IconLock size={16} className="mt-0.5 shrink-0" />
            <span><b>Stored in Indonesia & encrypted.</b> Electronic medical records are stored encrypted (in-transit &amp; at-rest) on infrastructure located in Indonesia, with role-based access controls and an <b>audit log</b> for every access.</span>
          </div>
          <p>The system is designed for <b>interoperability with SATUSEHAT</b> (the Ministry of Health's national health data platform).</p>
        </div>
      </Card>

      <Card>
        <SectionTitle icon={<IconCheck size={20} />} title="Terms & Conditions of Service" />
        <ol className="ml-4 list-decimal space-y-1.5 text-sm leading-relaxed text-neutral-600">
          <li>Panaceamed.id is a clinical support tool. <b>AI assists, but does not replace, licensed clinicians.</b> Final medical decisions rest with the physician.</li>
          <li>AI-EMR features are available only to certified clinicians with a <b>verified STR/SIP license</b>.</li>
          <li>Pharmacy &amp; prescription services are subject to oversight by licensed pharmacists and BPOM regulations.</li>
          <li>Users are responsible for the accuracy of the data they enter.</li>
          <li>Misuse, including giving medical advice without authorization, is prohibited.</li>
        </ol>
      </Card>

      <Card>
        <SectionTitle icon={<IconShield size={20} />} title="Informed Consent" />
        <div className="space-y-2 text-sm leading-relaxed text-neutral-600">
          <p>By using Panaceamed.id, you understand and agree that:</p>
          <ul className="ml-4 list-disc space-y-1.5">
            <li>AI interactions are <b>educational &amp; supportive</b>; not a final diagnosis.</li>
            <li>Diagnosis &amp; treatment still require verification by a human physician.</li>
            <li>Your health data is processed for service purposes as described in the Privacy Policy.</li>
            <li>In an emergency, contact the nearest healthcare facility immediately (Emergency SOS feature).</li>
          </ul>
        </div>
      </Card>

      <p className="px-1 text-center text-xs text-neutral-400">
        This document is informational and will be refined together with healthcare legal counsel. Last updated: {new Date().toLocaleDateString('en-US')}.
      </p>
    </div>
  )
}
