# Dynamic physiology (breathing, heartbeat): source audit

Checked 2026-10-10 on the publishers' own pages. Three things are kept apart and must stay apart on screen: **acquired data** (measured on real people), **simulation** (a rule we wrote, with parameters), and **validation** (a measured comparison of one against the other). Today only simulations of joint range of motion exist in Body Exposure; there is no acquired breathing or heartbeat motion and no validation of either.

| Need | Candidate | What was verified | Usable here? |
|---|---|---|---|
| Respiratory motion | TCIA "4D-Lung" | Licence CC BY 3.0 with the data citation required; 20 lung-cancer radiotherapy patients; 4D fan-beam CT and cone-beam CT, 10 breathing phases each; radiotherapy structures on every phase; DICOM; TCIA data usage policy applies. | Licence allows attributed reuse. It is patient data with tumours, not a healthy reference, and motion fields would have to come from deformable registration that we have not run or validated. Not built. |
| Respiratory motion | DIR-Lab 4DCT | The site refused the connection on 2026-10-10 (ECONNREFUSED); its terms were not read. | Not used until the terms are read. |
| Cardiac motion | ACDC cardiac cine MRI (Creatis) | The challenge page requires a specific citation for any use; it states no licence, no commercial-use or redistribution terms, and annotates end-diastole and end-systole only. | Not used: terms not verified and two phases are not a motion. |
| Cardiac motion | other cine-MRI sets (UK Biobank, Cardiac Atlas Project, M&Ms) | Not checked. Several are access-restricted by agreement. | Not used. |

## Educational simulations

None were implemented. A breathing or heartbeat animation needs numbers (rib rotation angles, diaphragm excursion, ventricular volumes over time). We have no source for them that we read and verified, and a number we choose ourselves would be an invented one on screen. The rule for a future simulation: the parameters come from a cited measurement (for example rib-cage excursion measured on 4D-Lung after the registration is run and checked), the clip says "simulation" and names the source of every parameter, and it is never shown as measured motion.

## What would unblock it
1. Read the DIR-Lab terms when the site is reachable, or use 4D-Lung (CC BY 3.0).
2. Run and validate a deformable registration on one case against the landmarks or structures provided, and record the error.
3. Only then derive rib-cage and diaphragm excursions, attach them to a rig, and label the clip with the dataset, the registration error and the fact that it is another person's motion.
