/**
 * BX-3 Pathological Gait Library Engine
 * Mengelola klip simulasi gaya berjalan patologis dengan label truth_class: simulated.
 * Sesuai Directive D-101: Do not touch bodyexposure/pipeline/* rig files, add clips as separate layer.
 */
export interface GaitClip {
  clipId: string;
  pathologyName: string;
  editedJointChannels: string[];
  truthClass: 'simulated';
  loopContinuous: boolean;
}

export function getPathologicalGaitClip(clipId: string): GaitClip {
  const clips: Record<string, { name: string; channels: string[] }> = {
    'trendelenburg': { name: 'Trendelenburg Gait', channels: ['hip_abductor_left', 'pelvic_tilt'] },
    'foot-drop': { name: 'Steppage / Foot Drop', channels: ['ankle_dorsiflexors', 'knee_flexion_swing'] },
    'antalgic': { name: 'Antalgic Gait', channels: ['stance_phase_duration', 'weight_bearing_load'] },
    'circumduction': { name: 'Circumduction', channels: ['hip_circumduction_arc', 'pelvis_rotation'] }
  };

  const matched = clips[clipId];
  if (!matched) {
    return {
      clipId: 'unknown',
      pathologyName: 'not available',
      editedJointChannels: [],
      truthClass: 'simulated',
      loopContinuous: false
    };
  }

  return {
    clipId,
    pathologyName: matched.name,
    editedJointChannels: matched.channels,
    truthClass: 'simulated',
    loopContinuous: true
  };
}
