import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// [F429] Informa se o dispositivo ou usuário prefere reduzir animações.
export default function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    let active = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', value => {
      changed = true;
      setReduceMotion(value);
    });
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (active && !changed) setReduceMotion(value);
    }).catch(() => {});
    return () => { active = false; subscription?.remove?.(); };
  }, []);
  return reduceMotion;
}
