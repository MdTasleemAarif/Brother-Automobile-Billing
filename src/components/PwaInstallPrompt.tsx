"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      setInstallPrompt(promptEvent);

      if (!isStandaloneMode() && sessionStorage.getItem("ba-install-dismissed") !== "1") {
        setIsVisible(true);
      }
    };

    const handleAppInstalled = () => {
      setIsVisible(false);
      setInstallPrompt(null);
      sessionStorage.setItem("ba-install-dismissed", "1");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;

    setIsVisible(false);
    await installPrompt.prompt();
    await installPrompt.userChoice.catch(() => undefined);
    setInstallPrompt(null);
  };

  const dismissPrompt = () => {
    sessionStorage.setItem("ba-install-dismissed", "1");
    setIsVisible(false);
  };

  if (!isVisible || !installPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-xl border border-[#87d8d8] bg-[#fffaf0] p-3 shadow-2xl shadow-[#082342]/20 sm:left-auto sm:right-5">
      <img
        src="/icon-192.png"
        alt=""
        className="h-11 w-11 rounded-xl border border-[#87d8d8] bg-white object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-[#082342]">BA Billing</p>
        <p className="text-xs font-semibold text-slate-600">Install app</p>
      </div>
      <button
        type="button"
        onClick={installApp}
        className="rounded-lg bg-[#0f9fa6] px-3 py-2 text-xs font-black text-white shadow-sm hover:bg-[#087d86]"
      >
        Install
      </button>
      <button
        type="button"
        onClick={dismissPrompt}
        aria-label="Dismiss install prompt"
        className="rounded-lg px-2 py-1 text-lg font-black leading-none text-slate-500 hover:bg-white hover:text-[#082342]"
      >
        ×
      </button>
    </div>
  );
}
