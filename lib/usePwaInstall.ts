"use client";

import { useEffect, useState } from "react";
import { getDeferredEvent, clearDeferredEvent, subscribe, isIOS, isStandalone } from "./installPrompt";

export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setCanInstall(!!getDeferredEvent());
    setStandalone(isStandalone());
    return subscribe(() => {
      setCanInstall(!!getDeferredEvent());
      setStandalone(isStandalone());
    });
  }, []);

  const promptInstall = async () => {
    const evt = getDeferredEvent();
    if (!evt) return false;
    await evt.prompt();
    const choice = await evt.userChoice;
    clearDeferredEvent();
    return choice.outcome === "accepted";
  };

  return { canInstall, ios: isIOS(), standalone, promptInstall };
}
