/**
 * PanaceaMed Super-OS Real-Time Cross-Studio Biometric Bridge + Global 1-Click/1-Scan/1-Tap Omni-Dock
 * Compacts User Journey across all pages into 1 Click, 1 Scan, and 1 Tap (Cmd+K / Ctrl+K)
 */
(function () {
  var CHANNEL_NAME = 'panacea_superos_bus_v1';
  var bus = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;

  function readUnifiedTelemetry() {
    var state = {
      ownerId: 'rizkyazhar486',
      name: 'dr. Rizky Azhar',
      hr: 62,
      hrv: 78,
      spo2: 99,
      vo2max: 56.4,
      heightCm: 173,
      weightKg: 68,
      musclePct: 44,
      bodyFatPct: 14,
      workoutCount: 0,
      networkTier: (navigator.connection && navigator.connection.effectiveType) || (navigator.onLine ? '5g-fiber' : 'offline-3t-mesh'),
      ts: Date.now()
    };
    try {
      var prof = JSON.parse(localStorage.getItem('pmd_health_profile') || '{}');
      var p = prof.value || prof.data || prof;
      if (p.restingHeartRate || p.heartRate) state.hr = Number(p.restingHeartRate || p.heartRate) || state.hr;
      if (p.hrv) state.hrv = Number(p.hrv) || state.hrv;
      if (p.spo2) state.spo2 = Number(p.spo2) || state.spo2;
      if (p.vo2max || p.vo2Max) state.vo2max = Number(p.vo2max || p.vo2Max) || state.vo2max;
      if (p.heightCm || p.height) state.heightCm = Number(p.heightCm || p.height) || state.heightCm;
      if (p.weightKg || p.weight) state.weightKg = Number(p.weightKg || p.weight) || state.weightKg;

      var comp = JSON.parse(localStorage.getItem('pm_bodycomp_v1') || '{}');
      var c = comp.value || comp.data || comp;
      if (c.musclePct || c.skeletalMusclePct) state.musclePct = Number(c.musclePct || c.skeletalMusclePct) || state.musclePct;
      if (c.bodyFatPct || c.bodyFat) state.bodyFatPct = Number(c.bodyFatPct || c.bodyFat) || state.bodyFatPct;

      var self = JSON.parse(localStorage.getItem('pmd_personal_digital_self_v1') || '{}');
      if (self.heightCm) state.heightCm = Number(self.heightCm);
      if (self.musclePct) state.musclePct = Number(self.musclePct);
      if (self.bodyFatPct) state.bodyFatPct = Number(self.bodyFatPct);
    } catch (e) {}
    return state;
  }

  function computeRecoveryPrescription(t) {
    var strainFactor = Math.max(0, (75 - t.hrv) * 0.6 + (t.hr - 60) * 0.4);
    return {
      hbot: { ata: strainFactor > 10 ? 2.0 : 1.5, durationMin: 60, fio2Pct: 100, expectedSpo2PlasmaGain: '+6.2 vol%' },
      cryo: { tempC: -130, durationSec: 180, expectedHrvRebound: '+14 ms RMSSD' },
      pbm: { wavelengthNm: '660nm + 850nm', doseJcm2: 45, durationMin: 20, expectedAtpBoost: '+32% Cytochrome-C' },
      xtone: { freqHz: 50, intensityTesla: 2.5, durationMin: 30, recruitmentPct: '96% Supramaximal' },
      xcryo: { targetTempC: -32, durationMin: 8, edemaReduction: 'Optimal Joint Clearance' }
    };
  }

  function buildFhirR4Bundle(t) {
    var rx = computeRecoveryPrescription(t);
    return {
      resourceType: 'Bundle',
      id: 'panaceamed-satusehat-r4-' + t.ts,
      type: 'collection',
      timestamp: new Date(t.ts).toISOString(),
      meta: { profile: ['https://fhir.kemkes.go.id/r4/StructureDefinition/Bundle'] },
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            id: t.ownerId,
            name: [{ text: t.name }],
            extension: [{ url: 'https://panaceamed.id/fhir/network-3t-tier', valueString: t.networkTier }]
          }
        },
        {
          resource: {
            resourceType: 'Observation',
            id: 'vital-panel',
            status: 'final',
            code: { coding: [{ system: 'http://loinc.org', code: '85353-1', display: 'Vital signs & 1:1 Digital Twin panel' }] },
            component: [
              { code: { text: 'Heart Rate (bpm)' }, valueQuantity: { value: t.hr, unit: 'bpm' } },
              { code: { text: 'HRV RMSSD (ms)' }, valueQuantity: { value: t.hrv, unit: 'ms' } },
              { code: { text: 'SpO2 (%)' }, valueQuantity: { value: t.spo2, unit: '%' } },
              { code: { text: 'VO2Max (mL/kg/min)' }, valueQuantity: { value: t.vo2max, unit: 'mL/kg/min' } },
              { code: { text: 'Skeletal Muscle (%)' }, valueQuantity: { value: t.musclePct, unit: '%' } },
              { code: { text: 'Body Fat (%)' }, valueQuantity: { value: t.bodyFatPct, unit: '%' } }
            ]
          }
        },
        {
          resource: {
            resourceType: 'CarePlan',
            id: 'holistic-5-modality-recovery',
            status: 'active',
            intent: 'plan',
            title: 'Autonomous 5-Modality Recovery Prescription (HBOT, Cryo, PBM, X-Tone, X-Cryo)',
            description: JSON.stringify(rx)
          }
        }
      ]
    };
  }

  function broadcastUpdate(sourceLabel) {
    var payload = {
      source: sourceLabel || 'panacea-studio',
      telemetry: readUnifiedTelemetry(),
      prescription: null
    };
    payload.prescription = computeRecoveryPrescription(payload.telemetry);
    if (bus) {
      try { bus.postMessage(payload); } catch (e) {}
    }
    window.dispatchEvent(new CustomEvent('panacea:superos-sync', { detail: payload }));
    return payload;
  }

  if (bus) {
    bus.onmessage = function (ev) {
      if (ev && ev.data) {
        window.dispatchEvent(new CustomEvent('panacea:superos-sync', { detail: ev.data }));
      }
    };
  }

  window.addEventListener('storage', function () {
    broadcastUpdate('storage-event');
  });

  window.PanaceaSuperOSBridge = {
    readUnifiedTelemetry: readUnifiedTelemetry,
    computeRecoveryPrescription: computeRecoveryPrescription,
    buildFhirR4Bundle: buildFhirR4Bundle,
    broadcastUpdate: broadcastUpdate,
    exportFhirJson: function () {
      var t = readUnifiedTelemetry();
      var bundle = buildFhirR4Bundle(t);
      var blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'PanaceaMed-FHIR-R4-' + t.ownerId + '.json';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    }
  };

  // Inject Global 1-Click · 1-Scan · 1-Tap Floating Dynamic Omni-Pill into every studio page
  function injectGlobalOneTapDock() {
    if (typeof document === 'undefined' || document.getElementById('pnc-global-1tap-pill')) return;
    var wrap = document.createElement('div');
    wrap.id = 'pnc-global-1tap-pill';
    wrap.style.cssText = 'position:fixed;bottom:46px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;align-items:center;gap:6px;background:rgba(2,6,23,0.92);backdrop-filter:blur(20px);border:1px solid rgba(16,185,129,0.55);border-radius:999px;padding:5px 12px;box-shadow:0 10px 30px rgba(0,0,0,0.75);font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:11px;color:#f8fafc;';
    wrap.innerHTML =
      '<a href="/panaceamed-1tap-hypervisor-os.html" style="text-decoration:none;color:#fde68a;font-weight:800;padding:4px 8px;border-radius:999px;background:rgba(245,158,11,0.2);border:1px solid rgba(245,158,11,0.5);">⚡ 1-Tap Hypervisor (Cmd+K)</a>' +
      '<a href="/#/body-exposure" style="text-decoration:none;color:#38bdf8;font-weight:700;padding:4px 8px;">Cockpit</a>' +
      '<a href="/panaceamed-frontier-civilization-superos.html" style="text-decoration:none;color:#34d399;font-weight:700;padding:4px 8px;">0-Queue RS</a>' +
      '<a href="/panaceamed-omni-athletic-geomed-os.html" style="text-decoration:none;color:#fb923c;font-weight:700;padding:4px 8px;">Garmin/Dive/Club</a>' +
      '<a href="/panaceamed-legit-clinical-science-os.html" style="text-decoration:none;color:#c084fc;font-weight:700;padding:4px 8px;">QSP/ICU</a>' +
      '<button onclick="window.PanaceaSuperOSBridge.exportFhirJson()" style="background:rgba(16,185,129,0.22);color:#34d399;border:1px solid rgba(16,185,129,0.5);border-radius:999px;padding:3px 9px;font-size:10.5px;font-weight:800;cursor:pointer;">1-Tap FHIR</button>';
    document.body.appendChild(wrap);

    window.addEventListener('keydown', function (ev) {
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') {
        ev.preventDefault();
        window.location.href = '/panaceamed-1tap-hypervisor-os.html';
      }
    });
  }

  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectGlobalOneTapDock);
    } else {
      injectGlobalOneTapDock();
    }
  }
})();
