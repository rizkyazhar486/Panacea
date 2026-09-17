# Respiratory physiology replay on current main

This lane replays the bounded respiratory mechanics and gas-exchange teaching work from PR #1769 onto `main@b2227fd5a1ac25dfb7ea8b737e5c2f5a6c19d46b`.

## Educational model

The workbench uses normalized synthetic signals and directional teaching relationships:

- idealized airway resistance: `R ∝ 1 / r⁴`
- compliance: `C = ΔV / ΔP`
- alveolar ventilation identity: `V̇A = (VT − VD) × f`
- ventilation/perfusion relationship: `V̇A / Q̇`
- Fick-style diffusion proportionality

## Boundary

The model does not calculate patient spirometry, airway pressure, blood gases, oxygen saturation, measured V/Q, shunt fraction, dead-space fraction, DLCO, respiratory-failure severity, diagnosis, prognosis, treatment response, ventilator settings, oxygen prescription, bronchodilator response, or patient-specific decisions.

## Merge gate

Merge only after exact-head Validate, Stabilization Acceptance, Body 3D Render Acceptance, and security gates are green on the same head and latest-main ancestry remains clean.
