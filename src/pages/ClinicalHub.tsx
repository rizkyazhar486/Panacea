import { HelpServicesWorkspace } from './HelpServicesWorkspace'

// Search-catalog compatibility for PencarianGlobal. ClinicalHub now delegates
// to one compact HelpServicesWorkspace; search points to its intent-level modes
// rather than reintroducing every underlying service as a top-level surface.
export const GROUPS = [
  {
    name: 'Help & Services',
    tools: [
      { to: '/clinical-hub?t=assistant', name: 'AI Health Assistant', kw: 'ai assistant symptoms health chatbot' },
      { to: '/clinical-hub?t=records', name: 'AI-EMR', kw: 'medical records emr clinical documentation' },
      { to: '/clinical-hub?t=planning', name: 'Care Planning', kw: 'care plan care episode longitudinal planning' },
      { to: '/clinical-hub?t=access', name: 'Care Access', kw: 'consultation facilities hospital pharmacy second opinion medication reminders' },
      { to: '/clinical-hub?t=emergency', name: 'Emergency Card', kw: 'emergency identity medical card critical information' },
    ],
  },
]

export function ClinicalHub() {
  return <HelpServicesWorkspace />
}

export default ClinicalHub
