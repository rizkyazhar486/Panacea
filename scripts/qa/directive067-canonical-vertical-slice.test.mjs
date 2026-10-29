import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  computeRealBufferSha256,
  renderCanonicalAnatomySlice
} from '../../src/domains/body-exposure-canonical/canonicalBodyExposureEngine.ts';
import { evaluateBodyExposureEvidence } from '../../src/domains/body-exposure-evidence/bodyExposureEvidenceEngine.ts';

/**
 * Builds a minimal valid binary PNG buffer with exact width and height in the IHDR chunk.
 */
function createValidPngHeaderBuffer(width, height) {
  const buf = Buffer.alloc(33);
  // PNG signature
  buf.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  // IHDR length (13) + 'IHDR'
  buf.writeUInt32BE(13, 8);
  buf.write('IHDR', 12, 'ascii');
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  buf[24] = 8; // bit depth
  buf[25] = 6; // color type RGBA
  return buf;
}

/**
 * Builds a real binary GLB v2 buffer containing measurable accessors and an embedded PNG texture.
 */
function createSyntheticValidGlbBuffer({
  structureId = 'CANONICAL-MALE-HEART-ROOT',
  vertexCount = 128,
  triangleCount = 216,
  textureWidth = 4096,
  textureHeight = 4096,
  corruptIndices = false
} = {}) {
  const pngBuffer = createValidPngHeaderBuffer(textureWidth, textureHeight);
  // Pad binary chunk to 4-byte alignment
  const binPad = (4 - (pngBuffer.byteLength % 4)) % 4;
  const binChunkData = Buffer.concat([pngBuffer, Buffer.alloc(binPad)]);

  const indexCount = corruptIndices ? 10 : triangleCount * 3; // 10 is not divisible by 3 -> invalid triangle indices

  const gltfJson = {
    asset: { version: '2.0', generator: 'PanaceaMed-Canonical-GLB-Test-Harness' },
    nodes: [
      {
        name: structureId,
        mesh: 0,
        extras: {
          panacea_structure_id: structureId,
          laterality: 'MIDLINE'
        }
      }
    ],
    meshes: [
      {
        name: `${structureId}_MESH`,
        primitives: [
          {
            attributes: { POSITION: 0 },
            indices: 1,
            material: 0,
            mode: 4
          }
        ]
      }
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: vertexCount,
        type: 'VEC3'
      },
      {
        bufferView: 0,
        componentType: 5123,
        count: indexCount,
        type: 'SCALAR',
        max: [corruptIndices ? vertexCount + 50 : vertexCount - 1]
      }
    ],
    materials: [
      {
        name: 'CanonicalCardiacMyocardiumPBR',
        pbrMetallicRoughness: {
          baseColorTexture: { index: 0 }
        }
      }
    ],
    textures: [{ source: 0 }],
    images: [
      {
        bufferView: 0,
        mimeType: 'image/png',
        name: 'albedo_4k.png'
      }
    ],
    bufferViews: [
      {
        buffer: 0,
        byteOffset: 0,
        byteLength: pngBuffer.byteLength
      }
    ]
  };

  const jsonBytes = Buffer.from(JSON.stringify(gltfJson), 'utf8');
  const jsonPad = (4 - (jsonBytes.byteLength % 4)) % 4;
  const jsonChunkData = Buffer.concat([jsonBytes, Buffer.alloc(jsonPad, 0x20)]);

  const totalByteLength = 12 + 8 + jsonChunkData.byteLength + 8 + binChunkData.byteLength;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // 'glTF'
  header.writeUInt32LE(2, 4); // version 2
  header.writeUInt32LE(totalByteLength, 8);

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(jsonChunkData.byteLength, 0);
  jsonChunkHeader.writeUInt32LE(0x4e4f534a, 4); // 'JSON'

  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(binChunkData.byteLength, 0);
  binChunkHeader.writeUInt32LE(0x004e4942, 4); // 'BIN\0'

  return Buffer.concat([header, jsonChunkHeader, jsonChunkData, binChunkHeader, binChunkData]);
}

function createTempRepoFixture(options = {}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'panacea-067r-'));
  const bodyExpDir = path.join(tmpDir, 'public', 'bodyexposure');
  fs.mkdirSync(bodyExpDir, { recursive: true });

  const glbBuffer =
    options.rawGlbBuffer ??
    createSyntheticValidGlbBuffer({
      structureId: 'CANONICAL-MALE-HEART-ROOT',
      vertexCount: 384,
      triangleCount: 640,
      textureWidth: 4096,
      textureHeight: 4096,
      corruptIndices: Boolean(options.corruptIndices)
    });

  const glbPath = path.join(bodyExpDir, 'canonical_male_heart.glb');
  if (!options.omitGlbFile) {
    fs.writeFileSync(glbPath, glbBuffer);
  }

  const realSha256 = !options.omitGlbFile && glbBuffer.byteLength > 0
    ? computeRealBufferSha256(glbBuffer)
    : null;

  const matrix = {
    cardiovascular: [
      {
        structureId: 'CANONICAL-MALE-HEART-ROOT',
        panacea_structure_id: 'CANONICAL-MALE-HEART-ROOT',
        semanticName: 'Cor (Adult Male Canonical Heart)',
        laterality: 'MIDLINE',
        system: 'CARDIOVASCULAR',
        glbPath: 'bodyexposure/canonical_male_heart.glb',
        sourceAttribution: options.omitProvenance ? '' : 'BodyParts3D / Canonical Adult Male Atlas v1',
        license: 'CC-BY-SA-2.1-JP',
        sha256: realSha256
      }
    ]
  };

  fs.writeFileSync(path.join(bodyExpDir, 'body_matrix.json'), JSON.stringify(matrix, null, 2));
  return { tmpDir, realSha256 };
}

test('Positive Control (067-R): Parses real GLB bytes, measures exact vertices/triangles, verifies 4K PNG header and SHA-256', () => {
  const { tmpDir, realSha256 } = createTempRepoFixture();
  const result = renderCanonicalAnatomySlice({
    structureId: 'CANONICAL-MALE-HEART-ROOT',
    requestedLodLevel: 'LOD_0_FULL',
    allowPersonalizationContract: false,
    repositoryRootPath: tmpDir,
    expectedManifestSha256: realSha256,
    rendererCapabilities: { backend: 'WEBGPU', maxTextureSize: 8192 }
  });

  assert.equal(result.verificationVerdict, 'VERIFIED_EMPIRICAL_ASSET');
  assert.equal(result.geometryMeasured.hasValidMesh, true);
  // Must match exact accessor counts (384 vertices, 640 triangles), NOT hardcoded 45200 / 90400
  assert.equal(result.geometryMeasured.vertexCount, 384);
  assert.equal(result.geometryMeasured.triangleCount, 640);
  assert.equal(result.materialEvidence.textureResolution, '4K');
  assert.equal(result.materialEvidence.maxVerifiedDimensionPx, 4096);
  assert.equal(result.materialEvidence.pbrMapsVerified, true);
  assert.equal(result.materialEvidence.sha256Checksum, realSha256);
  assert.equal(result.materialEvidence.manifestHashMatched, true);
  assert.equal(result.clinicalGovernanceStatus.isReferenceAtlasOnly, true);
  assert.equal(result.clinicalGovernanceStatus.isClinicallyAuthoritative, false);
  assert.ok(result.provenanceHash && /^[a-f0-9]{64}$/.test(result.provenanceHash));
});

test('Negative Control 1 (067-R): Rejects nonexistent structure ID and never returns hasValidMesh: true', () => {
  const { tmpDir } = createTempRepoFixture();
  const result = renderCanonicalAnatomySlice({
    structureId: 'NONEXISTENT_ORGAN_9999',
    requestedLodLevel: 'LOD_0_FULL',
    allowPersonalizationContract: false,
    repositoryRootPath: tmpDir
  });

  assert.equal(result.verificationVerdict, 'REJECTED_NONEXISTENT_STRUCTURE');
  assert.equal(result.geometryMeasured.hasValidMesh, false);
  assert.equal(result.geometryMeasured.vertexCount, 0);
  assert.equal(result.provenanceHash, null);
});

test('Negative Control 2 (067-R): Fails closed when physical GLB file is missing from disk', () => {
  const { tmpDir } = createTempRepoFixture({ omitGlbFile: true });
  const result = renderCanonicalAnatomySlice({
    structureId: 'CANONICAL-MALE-HEART-ROOT',
    requestedLodLevel: 'LOD_0_FULL',
    allowPersonalizationContract: false,
    repositoryRootPath: tmpDir
  });

  assert.equal(result.verificationVerdict, 'UNVERIFIED_MISSING_SOURCE_ASSET');
  assert.equal(result.geometryMeasured.hasValidMesh, false);
  assert.equal(result.materialEvidence.sha256Checksum, null);
});

test('Negative Control 3 (067-R): Rejects corrupted GLB binary header', () => {
  const { tmpDir } = createTempRepoFixture({
    rawGlbBuffer: Buffer.from('NOT_A_VALID_GLB_FILE_HEADER_00000000', 'utf8')
  });
  const result = renderCanonicalAnatomySlice({
    structureId: 'CANONICAL-MALE-HEART-ROOT',
    requestedLodLevel: 'LOD_0_FULL',
    allowPersonalizationContract: false,
    repositoryRootPath: tmpDir
  });

  assert.equal(result.verificationVerdict, 'REJECTED_CORRUPTED_GLB');
  assert.equal(result.geometryMeasured.hasValidMesh, false);
});

test('Negative Control 4 (067-R): Rejects malformed/out-of-bounds triangle indices', () => {
  const { tmpDir } = createTempRepoFixture({ corruptIndices: true });
  const result = renderCanonicalAnatomySlice({
    structureId: 'CANONICAL-MALE-HEART-ROOT',
    requestedLodLevel: 'LOD_0_FULL',
    allowPersonalizationContract: false,
    repositoryRootPath: tmpDir
  });

  assert.equal(result.verificationVerdict, 'REJECTED_INVALID_INDICES');
  assert.equal(result.geometryMeasured.hasValidMesh, false);
  assert.equal(result.geometryMeasured.indicesValidated, false);
});

test('Negative Control 5 (067-R): Rejects mismatched manifest SHA-256 digest', () => {
  const { tmpDir } = createTempRepoFixture();
  const wrongSha = crypto.createHash('sha256').update('wrong-payload').digest('hex');
  const result = renderCanonicalAnatomySlice({
    structureId: 'CANONICAL-MALE-HEART-ROOT',
    requestedLodLevel: 'LOD_0_FULL',
    allowPersonalizationContract: false,
    repositoryRootPath: tmpDir,
    expectedManifestSha256: wrongSha
  });

  assert.equal(result.verificationVerdict, 'REJECTED_HASH_MISMATCH');
  assert.equal(result.geometryMeasured.hasValidMesh, false);
});

test('Negative Control 6 (067-R): Rejects unsupported LOD level', () => {
  const { tmpDir } = createTempRepoFixture();
  const result = renderCanonicalAnatomySlice({
    structureId: 'CANONICAL-MALE-HEART-ROOT',
    // @ts-expect-error Intentional invalid LOD negative control
    requestedLodLevel: 'LOD_99_FAKE_INFINITE',
    allowPersonalizationContract: false,
    repositoryRootPath: tmpDir
  });

  assert.equal(result.verificationVerdict, 'REJECTED_UNSUPPORTED_LOD');
  assert.equal(result.geometryMeasured.hasValidMesh, false);
});

test('Negative Control 7 (067-R): Rejects missing clinical/anatomical source provenance', () => {
  const { tmpDir } = createTempRepoFixture({ omitProvenance: true });
  const result = renderCanonicalAnatomySlice({
    structureId: 'CANONICAL-MALE-HEART-ROOT',
    requestedLodLevel: 'LOD_0_FULL',
    allowPersonalizationContract: false,
    repositoryRootPath: tmpDir
  });

  assert.equal(result.verificationVerdict, 'REJECTED_MISSING_PROVENANCE');
  assert.equal(result.geometryMeasured.hasValidMesh, false);
});

test('Negative Control 8 (067-R): Rejects renderer context loss / unavailable GPU backend', () => {
  const { tmpDir } = createTempRepoFixture();
  const result = renderCanonicalAnatomySlice({
    structureId: 'CANONICAL-MALE-HEART-ROOT',
    requestedLodLevel: 'LOD_0_FULL',
    allowPersonalizationContract: false,
    repositoryRootPath: tmpDir,
    rendererCapabilities: { backend: 'UNAVAILABLE', contextLost: true }
  });

  assert.equal(result.verificationVerdict, 'REJECTED_RENDERER_FAILURE');
  assert.equal(result.geometryMeasured.hasValidMesh, false);
});

test('Negative Control 9 (067-R): Evidence gate explicitly rejects the SHA-256 of an empty string', () => {
  const emptyStringSha = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const gateResult = evaluateBodyExposureEvidence({
    assetId: 'FAKE-EMPTY-HASH-ASSET',
    meshFileExists: true,
    triangleCount: 50000,
    textureResolution: '8K',
    sha256Hash: emptyStringSha,
    subsurfaceScatteringVerified: true
  });

  assert.equal(gateResult.evidenceStatus, 'ARTIFACT_HASH_MISMATCH');
  assert.equal(gateResult.measuredQualityScore, 0);
  assert.equal(gateResult.provenanceHash, null);
});
