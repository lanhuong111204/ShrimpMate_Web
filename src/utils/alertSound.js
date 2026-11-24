/**
 * Phát âm thanh cảnh báo khẩn cấp ngắn qua Web Audio API (không cần file audio ngoài).
 * Trình duyệt có thể chặn nếu chưa có tương tác người dùng; luôn bọc an toàn.
 */
export const playCriticalAlertBeep = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const beep = (startOffset, freq, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + startOffset);
      gain.gain.setValueAtTime(0.001, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.14, now + startOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.02);
    };

    beep(0, 880, 0.16);
    beep(0.22, 660, 0.22);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 800);
  } catch {
    // Bỏ qua nếu thiết bị/trình duyệt không hỗ trợ Web Audio
  }
};
