/** Boost the SDK's playback stream while preserving its audio element and device routing. */
export async function amplifyInterviewer(audio: HTMLAudioElement): Promise<() => void> {
  const original = audio.srcObject;
  if (!(original instanceof MediaStream)) return () => {};
  const context = new AudioContext();
  try {
    const source = context.createMediaStreamSource(original);
    const gain = context.createGain();
    gain.gain.value = 2;
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -6;
    compressor.knee.value = 6;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.15;
    const destination = context.createMediaStreamDestination();
    source.connect(gain).connect(compressor).connect(destination);
    await context.resume();
    audio.srcObject = destination.stream;
    await audio.play();
    return () => {
      if (audio.srcObject === destination.stream) audio.srcObject = original;
      destination.stream.getTracks().forEach(track => track.stop());
      void context.close().catch(() => {});
    };
  } catch (error) {
    audio.srcObject = original;
    void audio.play().catch(() => {});
    await context.close().catch(() => {});
    throw error;
  }
}
