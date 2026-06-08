"use client";

/**
 * SessionGuard — surveille l'inactivité et le retour après fermeture de fenêtre.
 *
 * Comportement :
 *  - Après INACTIVITY_MS (30 min) sans interaction → alerte "session sur le point d'expirer"
 *    avec compte à rebours de GRACE_MS (2 min). L'utilisateur peut "Rester connecté" ou
 *    laisser le timer expirer → déconnexion automatique.
 *  - Au retour sur la page (visibilitychange / montage) → si la dernière activité date de
 *    plus de INACTIVITY_MS → déconnexion immédiate + modal "reconnexion requise".
 *  - Le composant est inactif (no-op) si l'utilisateur n'est pas connecté.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

/* ── Constantes ── */
const INACTIVITY_MS  = 30 * 60 * 1000;   // 30 min d'inactivité → avertissement
const GRACE_MS       = 2  * 60 * 1000;   // 2 min supplémentaires avant déco forcée
const STORAGE_KEY    = "finazen_last_activity";
const CHECK_INTERVAL = 30_000;            // vérification toutes les 30 s

type ModalState = "hidden" | "warning" | "expired";

export default function SessionGuard() {
  const router        = useRouter();
  const supabase      = createClient();
  const [isLoggedIn,  setIsLoggedIn]  = useState(false);
  const [modal,       setModal]       = useState<ModalState>("hidden");
  const [countdown,   setCountdown]   = useState(Math.round(GRACE_MS / 1000));

  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer  = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Helpers ── */
  const clearAllTimers = useCallback(() => {
    if (inactivityTimer.current)  { clearTimeout(inactivityTimer.current);  inactivityTimer.current  = null; }
    if (warningTimer.current)     { clearTimeout(warningTimer.current);      warningTimer.current     = null; }
    if (countdownTimer.current)   { clearInterval(countdownTimer.current);   countdownTimer.current   = null; }
  }, []);

  const signOutAndRedirect = useCallback(async () => {
    clearAllTimers();
    localStorage.removeItem(STORAGE_KEY);
    await supabase.auth.signOut();
    setModal("expired");
  }, [clearAllTimers, supabase]);

  /* Démarre le compte à rebours affiché dans la modale d'avertissement */
  const startGraceCountdown = useCallback(() => {
    setCountdown(Math.round(GRACE_MS / 1000));
    countdownTimer.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          signOutAndRedirect();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, [signOutAndRedirect]);

  /* Affiche la modale d'avertissement puis lance le grace timer */
  const showWarning = useCallback(() => {
    setModal("warning");
    startGraceCountdown();
  }, [startGraceCountdown]);

  /* Lance / relance le timer d'inactivité depuis maintenant */
  const resetInactivityTimer = useCallback(() => {
    clearAllTimers();
    setModal("hidden");
    localStorage.setItem(STORAGE_KEY, String(Date.now()));

    inactivityTimer.current = setTimeout(() => {
      showWarning();
    }, INACTIVITY_MS);
  }, [clearAllTimers, showWarning]);

  /* L'utilisateur clique sur "Rester connecté" */
  const handleStayConnected = useCallback(() => {
    clearAllTimers();
    setModal("hidden");
    resetInactivityTimer();
  }, [clearAllTimers, resetInactivityTimer]);

  /* ── Vérifie si la session est déjà expirée (retour sur l'onglet) ── */
  const checkStaleSession = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const elapsed = Date.now() - Number(stored);
    if (elapsed > INACTIVITY_MS + GRACE_MS) {
      signOutAndRedirect();
    } else if (elapsed > INACTIVITY_MS) {
      showWarning();
    }
  }, [signOutAndRedirect, showWarning]);

  /* ── Suivi de l'état d'authentification ── */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: unknown, session: { user?: unknown } | null) => {
        setIsLoggedIn(!!session?.user);
      }
    );
    // Vérification initiale
    supabase.auth.getUser().then((res: { data: { user: unknown } }) => setIsLoggedIn(!!res.data.user));
    return () => subscription.unsubscribe();
  }, [supabase]);

  /* ── Activité & timers (seulement si connecté) ── */
  useEffect(() => {
    if (!isLoggedIn) {
      clearAllTimers();
      setModal("hidden");
      return;
    }

    /* Vérification immédiate au montage / retour d'onglet */
    checkStaleSession();
    resetInactivityTimer();

    /* Événements d'activité utilisateur */
    const EVENTS = ["mousemove", "keydown", "mousedown", "touchstart", "scroll", "click"] as const;
    const onActivity = () => resetInactivityTimer();
    EVENTS.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));

    /* Vérification périodique (utile si la machine a été en veille) */
    const periodicCheck = setInterval(checkStaleSession, CHECK_INTERVAL);

    /* Sauvegarder l'horodatage quand l'onglet est masqué / fermé */
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } else {
        checkStaleSession();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const onBeforeUnload = () => localStorage.setItem(STORAGE_KEY, String(Date.now()));
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      clearAllTimers();
      EVENTS.forEach((ev) => window.removeEventListener(ev, onActivity));
      clearInterval(periodicCheck);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [isLoggedIn, resetInactivityTimer, checkStaleSession, clearAllTimers]);

  /* ── Rendu de la modale ── */
  if (modal === "hidden") return null;

  const isExpired  = modal === "expired";
  const isWarning  = modal === "warning";
  const mins       = Math.floor(countdown / 60);
  const secs       = countdown % 60;
  const countdownLabel = mins > 0
    ? `${mins} min ${secs.toString().padStart(2, "0")} s`
    : `${secs} s`;

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: "rgba(10, 18, 14, 0.55)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }} />

      {/* Modal */}
      <div role="dialog" aria-modal="true" style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}>
        <div style={{
          background: "#fff",
          borderRadius: 20,
          padding: "36px 32px",
          maxWidth: 420,
          width: "100%",
          boxShadow: "0 32px 80px -20px rgba(10, 18, 14, 0.45)",
          display: "flex", flexDirection: "column", gap: 20,
          animation: "sessionModalIn 0.25s ease",
        }}>
          {/* Icône */}
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: isExpired ? "var(--paper-2)" : "#FEF3C7",
            border: `1.5px solid ${isExpired ? "var(--line)" : "#F59E0B44"}`,
            display: "grid", placeItems: "center", fontSize: 24,
          }}>
            {isExpired ? "🔒" : "⏰"}
          </div>

          {/* Titre */}
          <div>
            <h2 style={{ fontFamily: "var(--font-instrument, serif)", fontWeight: 400, fontSize: 26, lineHeight: 1.15, margin: "0 0 8px", color: "var(--ink)" }}>
              {isExpired ? "Session expirée" : "Toujours là ?"}
            </h2>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.65, margin: 0 }}>
              {isExpired
                ? "Pour protéger ton compte, ta session a été fermée automatiquement après une période d'inactivité."
                : "Ta session va expirer par mesure de sécurité. Veux-tu rester connecté ?"}
            </p>
          </div>

          {/* Countdown (warning seulement) */}
          {isWarning && (
            <div style={{
              background: "#FEF3C7", border: "1px solid #F59E0B44", borderRadius: 10,
              padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 13, color: "#92400E", fontWeight: 600 }}>Déconnexion dans</span>
              <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontWeight: 700, fontSize: 15, color: "#B45309" }}>
                {countdownLabel}
              </span>
            </div>
          )}

          {/* Boutons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {isWarning && (
              <button
                onClick={handleStayConnected}
                style={{
                  padding: "13px 20px", borderRadius: 9999,
                  background: "var(--accent)", color: "#F6F2E8",
                  fontWeight: 600, fontSize: 15, border: "none", cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
              >
                Rester connecté
              </button>
            )}
            <button
              onClick={() => { setModal("hidden"); router.push("/auth/signin"); }}
              style={{
                padding: "13px 20px", borderRadius: 9999,
                background: isExpired ? "var(--accent)" : "transparent",
                color: isExpired ? "#F6F2E8" : "var(--muted)",
                fontWeight: isExpired ? 600 : 500,
                fontSize: 15, border: isExpired ? "none" : "1.5px solid var(--line)",
                cursor: "pointer", transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isExpired) { e.currentTarget.style.background = "var(--paper-2)"; e.currentTarget.style.color = "var(--ink)"; }
                else e.currentTarget.style.background = "var(--accent-hover)";
              }}
              onMouseLeave={(e) => {
                if (!isExpired) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted)"; }
                else e.currentTarget.style.background = "var(--accent)";
              }}
            >
              Se reconnecter
            </button>
            {isWarning && (
              <button
                onClick={signOutAndRedirect}
                style={{ padding: "8px", background: "none", border: "none", color: "var(--muted)", fontSize: 13, cursor: "pointer" }}
              >
                Me déconnecter maintenant
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sessionModalIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
