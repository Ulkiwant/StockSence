"use client";

import { useState } from "react";
import { usePwaInstall } from "@/lib/usePwaInstall";
import InstallModal from "./InstallModal";

export default function InstallAppLink({
  children,
  style,
  onNavigate,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onNavigate?: () => void;
}) {
  const { canInstall, ios, standalone, promptInstall } = usePwaInstall();
  const [showModal, setShowModal] = useState(false);

  if (standalone) return null;

  const handleClick = async () => {
    if (canInstall) {
      await promptInstall();
      onNavigate?.();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button onClick={handleClick} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", font: "inherit", color: "inherit", ...style }}>
        {children}
      </button>
      {showModal && <InstallModal ios={ios} onClose={() => { setShowModal(false); onNavigate?.(); }} />}
    </>
  );
}
