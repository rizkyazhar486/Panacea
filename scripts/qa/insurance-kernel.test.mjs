import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateCanonicalInsurance } from '../../src/domains/insurance/universalInsuranceKernel.ts'

test('Canonical Insurance: Correctional Inmate (Narapidana) routes to Kemenimipas/Kemenkes at 100%', () => {
  const res = evaluateCanonicalInsurance({
    beneficiaryId: 'WBP-00912',
    category: 'CORRECTIONAL_INMATE',
    institutionCode: 'KEMENIMIPAS_LAPAS',
    coverageTier: 'SPECIAL_CORRECTIONAL_CARE',
    activeStatus: true,
    verifiedTimestamp: new Date().toISOString()
  }, 2500000);

  assert.equal(res.eligible, true);
  assert.equal(res.routingAgency, 'CORRECTIONAL_HEALTH_DIVISION');
  assert.equal(res.reimbursementPercentage, 100.0);
  assert.equal(res.coveredAmountIdr, 2500000);
  assert.equal(res.patientOutOfPocketIdr, 0);
  console.log('✅ Correctional Inmate verified:', res);
});

test('Canonical Insurance: TNI/POLRI routes to ASABRI and PNS routes to BPJS at 100%', () => {
  const tni = evaluateCanonicalInsurance({
    beneficiaryId: 'TNI-4412',
    category: 'TNI_POLRI',
    institutionCode: 'ASABRI',
    coverageTier: 'CLASS_1',
    activeStatus: true,
    verifiedTimestamp: new Date().toISOString()
  }, 4000000);

  const pns = evaluateCanonicalInsurance({
    beneficiaryId: 'NIP-199001',
    category: 'PNS',
    institutionCode: 'ASN_PUSAT',
    coverageTier: 'CLASS_1',
    activeStatus: true,
    verifiedTimestamp: new Date().toISOString()
  }, 3000000);

  assert.equal(tni.routingAgency, 'ASABRI_SERVICE');
  assert.equal(tni.coveredAmountIdr, 4000000);
  assert.equal(pns.routingAgency, 'BPJS_KESEHATAN');
  assert.equal(pns.coveredAmountIdr, 3000000);
  console.log('✅ TNI/POLRI & PNS verified.');
});

test('Negative Control: Inactive profile fails closed with 0 reimbursement', () => {
  const res = evaluateCanonicalInsurance({
    beneficiaryId: 'GEN-999',
    category: 'GENERAL_PUBLIC',
    institutionCode: 'BPJS_MANDIRI',
    coverageTier: 'CLASS_3',
    activeStatus: false,
    verifiedTimestamp: new Date().toISOString()
  }, 1000000);

  assert.equal(res.eligible, false);
  assert.equal(res.reimbursementPercentage, 0);
  assert.equal(res.coveredAmountIdr, 0);
  assert.equal(res.patientOutOfPocketIdr, 1000000);
  console.log('✅ Negative Control passed:', res);
});
