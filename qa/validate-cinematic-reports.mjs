// Verify actual image bytes and controlled comparison settings, without Blender.
// node qa/validate-cinematic-reports.mjs bodyexposure/qa_reports/cinematic-studio
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const directories = process.argv.slice(2);
assert.ok(directories.length, 'Provide one or more render report directories');
for (const directory of directories) {
  const report = JSON.parse(readFileSync(path.join(directory, 'report.json'), 'utf8'));
  assert.ok(report.renders.length > 0, 'No actual captures');
  if (report.compare_mode === 'lighting') {
    const beforeCount = report.renders.filter(r => r.variant === 'before').length;
    assert.ok(beforeCount > 0, 'No lighting baseline');
    assert.equal(beforeCount, report.renders.filter(r => r.variant === 'after').length, 'Unpaired lighting captures');
  }
  assert.equal(Object.values(report.audit.review_status_counts).reduce((a, b) => a + b, 0),
    report.audit.visible_meshes, 'Review inventory must cover visible meshes');
  for (const capture of report.renders) {
    assert.equal(path.basename(capture.path), capture.path, 'Capture must be local to report');
    const png = readFileSync(path.join(directory, capture.path));
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'PNG signature');
    assert.equal(createHash('sha256').update(png).digest('hex'), capture.sha256, 'Image hash');
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], capture.resolution, 'Pixel dimensions');
    assert.equal(png[24], 16, '16-bit output required');
    assert.ok(Number.isFinite(capture.render_seconds) && capture.render_seconds > 0, 'Measured duration');
    if ('lighting_state_restored' in capture) assert.equal(capture.lighting_state_restored, true);
    if (capture.lighting === 'studio') {
      assert.equal(capture.studio_lights.length, 3, 'Key, fill and rim required');
      for (const light of capture.studio_lights) {
        assert.ok(Number.isFinite(light.energy_watts) && light.energy_watts > 0);
        assert.ok(Number.isFinite(light.diameter_metres) && light.diameter_metres > 0);
        assert.equal(light.location_metres.length, 3);
        assert.ok(light.location_metres.every(Number.isFinite));
      }
    }
    if (report.compare_mode === 'lighting' && capture.variant === 'before') {
      const after = report.renders.find(r => r.path === capture.path.replace('_before.png', '_after.png'));
      assert.ok(after, 'Missing paired lighting capture');
      for (const key of ['resolution', 'sample_limit', 'time_limit_seconds', 'adaptive_sampling', 'denoising']) {
        assert.deepEqual(capture[key], after[key], `Lighting comparison changed ${key}`);
      }
      assert.equal(capture.lighting, 'original');
      assert.equal(after.lighting, 'studio');
    }
  }
  console.log(`${directory}: ${report.renders.length} captures verified`);
}
