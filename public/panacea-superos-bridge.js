/**
 * PanaceaMed "THE ONE" Singularity Bridge
 * One Connection · One Database (pmd_the_one_db_v1) · One Log (pmd_the_one_log_v1) · One Sync Across Multiple Devices
 */
(function () {
  var CHANNEL_NAME = 'panacea_the_one_bus_v1';
  var bus = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;

  function readTheOneDatabase() {
    var db = {
      ownerId: 'rizkyazhar486',
      name: 'dr. Rizky Muhammad Azrissal',
      hr: 62,
      hrv: 78,
      sbp: 118,
      dbp: 75,
      rr: 15,
      spo2: 99,
      vo2max: 56.4,
      tempC: 36.6,
      heightCm: 173,
      weightKg: 68,
      musclePct: 44,
      bodyFatPct: 14,
      paco2: 40,
      hco3: 24,
      lactate: 1.1,
      creatinine: 0.90,
      glucose: 86,
      triglycerides: 92,
      devices: ['MacBook Air M-Series', 'iPhone / iOS HealthKit', 'Garmin / WHOOP / Oura BLE', 'Hospital Zero-Queue Terminal', 'Starlink / 2G Frontier Node'],
      networkTier: (navigator.connection && navigator.connection.effectiveType) || (navigator.onLine ? '5g-fiber-multi-device' : 'offline-local-first'),
      ts: Date.now()
    };
    try {
      var savedOne = JSON.parse(localStorage.getItem('pmd_the_one_db_v1') || '{}');
      Object.assign(db, savedOne);

      var prof = JSON.parse(localStorage.getItem('pmd_health_profile') || '{}');
      var p = prof.value || prof.data || prof;
      if (p.restingHeartRate || p.heartRate) db.hr = Number(p.restingHeartRate || p.heartRate) || db.hr;
      if (p.hrv) db.hrv = Number(p.hrv) || db.hrv;
      if (p.spo2) db.spo2 = Number(p.spo2) || db.spo2;
      if (p.vo2max || p.vo2Max) db.vo2max = Number(p.vo2max || p.vo2Max) || db.vo2max;
      if (p.heightCm || p.height) db.heightCm = Number(p.heightCm || p.height) || db.heightCm;
      if (p.weightKg || p.weight) db.weightKg = Number(p.weightKg || p.weight) || db.weightKg;

      var comp = JSON.parse(localStorage.getItem('pm_bodycomp_v1') || '{}');
      var c = comp.value || comp.data || comp;
      if (c.musclePct || c.skeletalMusclePct) db.musclePct = Number(c.musclePct || c.skeletalMusclePct) || db.musclePct;
      if (c.bodyFatPct || c.bodyFat) db.bodyFatPct = Number(c.bodyFatPct || c.bodyFat) || db.bodyFatPct;
    } catch (e) {}
    return db;
  }

  function appendTheOneLog(eventTitle, detailText) {
    var entry = {
      id: 'LOG-' + Date.now(),
      iso: new Date().toISOString(),
      event: eventTitle,
      detail: detailText
    };
    try {
      var logs = JSON.parse(localStorage.getItem('pmd_the_one_log_v1') || '[]');
      logs.unshift(entry);
      if (logs.length > 60) logs.length = 60;
      localStorage.setItem('pmd_the_one_log_v1', JSON.stringify(logs));
    } catch (e) {}
    return entry;
  }

  function writeTheOneDatabase(patch, reasonLabel) {
    var cur = readTheOneDatabase();
    var next = Object.assign({}, cur, patch, { ts: Date.now() });
    try {
      localStorage.setItem('pmd_the_one_db_v1', JSON.stringify(next));
    } catch (e) {}
    var logEntry = appendTheOneLog(reasonLabel || 'ONE_SYNC_UPDATE', 'HR ' + next.hr + ' bpm | HRV ' + next.hrv + ' ms | SpO2 ' + next.spo2 + '% | Cr ' + next.creatinine + ' mg/dL');
    if (bus) {
      try { bus.postMessage({ db: next, log: logEntry }); } catch (e) {}
    }
    window.dispatchEvent(new CustomEvent('panacea:the-one-sync', { detail: { db: next, log: logEntry } }));
    return next;
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
      id: 'panaceamed-the-one-r4-' + t.ts,
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
            id: 'the-one-vital-panel',
            status: 'final',
            component: [
              { code: { text: 'Heart Rate (bpm)' }, valueQuantity: { value: t.hr, unit: 'bpm' } },
              { code: { text: 'HRV RMSSD (ms)' }, valueQuantity: { value: t.hrv, unit: 'ms' } },
              { code: { text: 'SpO2 (%)' }, valueQuantity: { value: t.spo2, unit: '%' } },
              { code: { text: 'VO2Max (mL/kg/min)' }, valueQuantity: { value: t.vo2max, unit: 'mL/kg/min' } },
              { code: { text: 'Serum Creatinine (mg/dL)' }, valueQuantity: { value: t.creatinine, unit: 'mg/dL' } }
            ]
          }
        },
        {
          resource: {
            resourceType: 'CarePlan',
            id: 'the-one-holistic-plan',
            status: 'active',
            intent: 'plan',
            title: 'PanaceaMed THE ONE Unified Multi-Diagnosis & 5-Modality CarePlan',
            description: JSON.stringify(rx)
          }
        }
      ]
    };
  }

  window.PanaceaSuperOSBridge = {
    readUnifiedTelemetry: readTheOneDatabase,
    readTheOneDatabase: readTheOneDatabase,
    writeTheOneDatabase: writeTheOneDatabase,
    appendTheOneLog: appendTheOneLog,
    computeRecoveryPrescription: computeRecoveryPrescription,
    buildFhirR4Bundle: buildFhirR4Bundle,
    broadcastUpdate: function (src) {
      return writeTheOneDatabase({}, src || 'ONE_BROADCAST');
    },
    exportFhirJson: function () {
      var t = readTheOneDatabase();
      appendTheOneLog('ONE_FHIR_EXPORT', 'Exported SATUSEHAT FHIR R4 Bundle for ' + t.ownerId);
      var bundle = buildFhirR4Bundle(t);
      var blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'PanaceaMed-THE-ONE-FHIR-R4-' + t.ownerId + '.json';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    }
  };

  function injectTheOneOmniPill() {
    if (typeof document === 'undefined' || document.getElementById('pnc-global-1tap-pill')) return;
    var wrap = document.createElement('div');
    wrap.id = 'pnc-global-1tap-pill';
    wrap.style.cssText = 'position:fixed;bottom:44px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;align-items:center;gap:8px;background:rgba(2,6,23,0.94);backdrop-filter:blur(20px);border:1.5px solid rgba(16,185,129,0.7);border-radius:999px;padding:5px 14px;box-shadow:0 12px 32px rgba(0,0,0,0.8);font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:11px;color:#f8fafc;';
    wrap.innerHTML =
      '<a href="/panaceamed-the-one-singularity-os.html" style="text-decoration:none;color:#ffffff;font-weight:800;padding:4px 10px;border-radius:999px;background:linear-gradient(90deg,#10b981,#0284c7);">☝️ THE ONE Ultra-Page</a>' +
      '<a href="/#/body-exposure" style="text-decoration:none;color:#38bdf8;font-weight:700;padding:4px 6px;">Cockpit</a>' +
      '<a href="/panaceamed-1tap-hypervisor-os.html" style="text-decoration:none;color:#fde68a;font-weight:700;padding:4px 6px;">Cmd+K</a>' +
      '<button onclick="window.PanaceaSuperOSBridge.exportFhirJson()" style="background:rgba(16,185,129,0.22);color:#34d399;border:1px solid rgba(16,185,129,0.5);border-radius:999px;padding:3px 9px;font-size:10.5px;font-weight:800;cursor:pointer;">1-Tap Sync & FHIR</button>';
    document.body.appendChild(wrap);
  }

  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectTheOneOmniPill);
    } else {
      injectTheOneOmniPill();
    }
  }
})();
