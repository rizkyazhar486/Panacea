/** T-CLIN-ADV-03: Neural Decoding & Closed-Loop BCI Intent Latency Simulation Engine */
export interface BciDecodingState {
  channelBandwidthHz: number;
  spikeSortingPrecisionPct: number;
  neuralManifoldStability: number; // 0.0 to 1.0
  roundtripLatencyMs: number; // target 10-50ms
  decodingFidelityIndex: number;
  bciOperationalStatus: 'optimal_streaming' | 'artifact_interference' | 'recalibration_required';
}

export function simulateBciNeuralDecoding(
  activeChannels: number, 
  signalToNoiseRatioDb: number, 
  modelAdaptationRate: number
): BciDecodingState {
  const channels = Math.max(1, activeChannels);
  const snr = Math.max(0, signalToNoiseRatioDb);
  
  const spikeSortingPrecisionPct = Math.min(100, 70.0 + (snr * 1.5) + (channels > 64 ? 10.0 : 0.0));
  const neuralManifoldStability = Math.min(1.0, Math.max(0.0, 0.5 + (modelAdaptationRate * 0.4) + (snr / 100.0)));
  const roundtripLatencyMs = Math.max(12, 85.0 - (channels * 0.05) - (snr * 1.2));
  const decodingFidelityIndex = Number(((spikeSortingPrecisionPct / 100.0) * neuralManifoldStability).toFixed(4));
  
  let status: BciDecodingState['bciOperationalStatus'] = 'optimal_streaming';
  if (snr < 12.0) {
    status = 'artifact_interference';
  } else if (neuralManifoldStability < 0.65) {
    status = 'recalibration_required';
  }

  return {
    channelBandwidthHz: channels * 30000, // 30 kHz per channel sampling standard
    spikeSortingPrecisionPct: Number(spikeSortingPrecisionPct.toFixed(2)),
    neuralManifoldStability: Number(neuralManifoldStability.toFixed(4)),
    roundtripLatencyMs: Number(roundtripLatencyMs.toFixed(2)),
    decodingFidelityIndex,
    bciOperationalStatus: status
  };
}
