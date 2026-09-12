import { useEffect } from 'react';

let lockCount = 0;

/**
 * Custom hook to lock body scrolling when a modal or dialog is open,
 * preventing background page scroll bleed / scroll chaining.
 */
export function useBodyScrollLock(isLocked: boolean = true) {
  useEffect(() => {
    if (!isLocked) return;

    lockCount++;
    if (lockCount === 1) {
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
    }

    return () => {
      lockCount--;
      if (lockCount <= 0) {
        lockCount = 0;
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.overscrollBehavior = '';
      }
    };
  }, [isLocked]);
}
