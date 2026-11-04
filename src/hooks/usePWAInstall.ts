/**
 * PWA Installation state and deferral logic hook for MelonQuest.
 * Strict zero-emoji policy applied.
 */

import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isReminder, setIsReminder] = useState(false);

  useEffect(() => {
    // Detect standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Track sessions and usage
    const sessionCount = parseInt(localStorage.getItem('melonquest_sessions') || '0', 10) + 1;
    localStorage.setItem('melonquest_sessions', String(sessionCount));

    const dismissed = localStorage.getItem('melonquest_pwa_dismissed') === 'true';
    const dismissedTime = parseInt(localStorage.getItem('melonquest_pwa_dismissed_time') || '0', 10);
    const now = Date.now();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      if (!isStandalone) {
        if (!dismissed) {
          // First use prompt
          setShowInstallPrompt(true);
          setIsReminder(false);
        } else if (sessionCount >= 2 || (now - dismissedTime > 120000)) {
          // Deferral reminder logic: after 2 sessions or 2 minutes
          setShowInstallPrompt(true);
          setIsReminder(true);
        }
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  const dismissPrompt = useCallback(() => {
    setShowInstallPrompt(false);
    localStorage.setItem('melonquest_pwa_dismissed', 'true');
    localStorage.setItem('melonquest_pwa_dismissed_time', String(Date.now()));
  }, []);

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    showInstallPrompt,
    isReminder,
    install,
    dismissPrompt,
    openManualPrompt: () => setShowInstallPrompt(true),
  };
}
