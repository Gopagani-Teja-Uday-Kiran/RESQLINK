import { useState, useEffect, useCallback, useRef } from "react";
import { notificationService } from "../utils/notifications";
function useFallDetection({
  threshold = 20,
  onFallDetected,
  onCountdownComplete,
  enabled = true
} = {}) {
  const [isFallDetected, setIsFallDetected] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [lastAcceleration, setLastAcceleration] = useState(0);
  const audioRef = useRef(null);
  const playAlertSound = useCallback(() => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }, []);
  const vibrateDevice = useCallback(() => {
    if ("vibrate" in navigator) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }
  }, []);
  const cancelFallDetection = useCallback(() => {
    setIsFallDetected(false);
    setCountdown(null);
    if ("vibrate" in navigator) {
      navigator.vibrate(0);
    }
  }, []);
  useEffect(() => {
    if (!enabled) return;
    const handleDeviceMotion = (event) => {
      const { accelerationIncludingGravity } = event;
      if (!accelerationIncludingGravity) return;
      const { x = 0, y = 0, z = 0 } = accelerationIncludingGravity;
      const acceleration = Math.sqrt(x * x + y * y + z * z);
      setLastAcceleration(acceleration);
      const accelerationChange = Math.abs(acceleration - lastAcceleration);
      if (accelerationChange > threshold && !isFallDetected) {
        setIsFallDetected(true);
        setCountdown(3);
        onFallDetected?.();
        playAlertSound();
        vibrateDevice();
        notificationService.sendEmergencyAlert(
          "Fall detected! Emergency will be triggered in 3 seconds. Cancel if you're okay.",
          "high"
        );
      }
    };
    if (typeof DeviceMotionEvent.requestPermission === "function") {
      DeviceMotionEvent.requestPermission().then((permissionState) => {
        if (permissionState === "granted") {
          window.addEventListener("devicemotion", handleDeviceMotion);
        }
      }).catch(console.error);
    } else {
      window.addEventListener("devicemotion", handleDeviceMotion);
    }
    return () => {
      window.removeEventListener("devicemotion", handleDeviceMotion);
    };
  }, [enabled, threshold, lastAcceleration, isFallDetected, onFallDetected, playAlertSound, vibrateDevice]);
  useEffect(() => {
    if (countdown === null || countdown <= 0) {
      if (countdown === 0) {
        onCountdownComplete?.();
        setIsFallDetected(false);
        setCountdown(null);
      }
      return;
    }
    playAlertSound();
    vibrateDevice();
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1e3);
    return () => clearTimeout(timer);
  }, [countdown, onCountdownComplete, playAlertSound, vibrateDevice]);
  return {
    isFallDetected,
    countdown,
    cancelFallDetection,
    lastAcceleration
  };
}
export {
  useFallDetection
};
