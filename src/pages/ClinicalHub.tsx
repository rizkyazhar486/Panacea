import { HelpServicesWorkspace } from './HelpServicesWorkspace'

// Search-catalog compatibility for PencarianGlobal. ClinicalHub now delegates
// to HelpServicesWorkspace, while global search still consumes GROUPS.
export const GROUPS = [
  {
    name: 'Help & Services',
    tools: [
      { to: '/clinical-hub?t=assistant', name: 'AI Health Assistant', kw: 'ai assistant symptoms health chatbot' },
      { to: '/clinical-hub?t=records', name: 'AI-EMR', kw: 'medical records emr clinical documentation' },
      { to: '/clinical-hub?t=emergency', name: 'Emergency Card', kw: 'emergency identity medical card critical information' },
    ],
  },
]

export function ClinicalHub() {
  return <HelpServicesWorkspace />
}

export default ClinicalHub
