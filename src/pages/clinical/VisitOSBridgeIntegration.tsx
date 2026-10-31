/** PanaceaMed - Canonical VisitOS Integration Wrapper */
import React from 'react';
import { VisitOSJourneyBridge } from '../../domains/clinical-operations/journey/VisitOSJourneyIntegration';

export const VisitOSPage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#030712', padding: '32px 16px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <header style={{ marginBottom: '24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#f9fafb', marginBottom: '8px' }}>PanaceaMed Clinical Operating System</h1>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>Authorized Longitudinal Encounter & Evidence-Based Clinical Decision Support</p>
        </header>
        <VisitOSJourneyBridge />
      </div>
    </div>
  );
};

export default VisitOSPage;
