"use client";

import React from "react";
import Link from "next/link";
import { type Plan, type PlanWithGuest, planLevel } from "@/lib/plan";

interface PlanGateProps {
  /** Plan minimum requis pour accéder au contenu */
  requiredPlan: Plan;
  /** Nom de la fonctionnalité (ex: "Analyse IA") */
  feature: string;
  /** Plan courant de l'utilisateur */
  currentPlan: PlanWithGuest;
  /** Si true, floute le children (default: true) */
  blurContent?: boolean;
  children: React.ReactNode;
}

/** Retourne true si le plan courant a accès au plan requis */
function hasGateAccess(currentPlan: PlanWithGuest, requiredPlan: Plan): boolean {
  if (currentPlan === "guest") return false;
  return planLevel(currentPlan as Plan) >= planLevel(requiredPlan);
}

export default function PlanGate({
  requiredPlan,
  feature,
  currentPlan,
  blurContent = true,
  children,
}: PlanGateProps) {
  const allowed = hasGateAccess(currentPlan, requiredPlan);

  if (allowed) {
    return <>{children}</>;
  }

  const isGuest = currentPlan === "guest";
  const isInvestisseurNeeded =
    !isGuest &&
    currentPlan === "free" &&
    planLevel(requiredPlan) <= 1;
  const isPremiumNeeded =
    !isGuest &&
    currentPlan === "investisseur" &&
    planLevel(requiredPlan) >= 2;

  return (
    <div style={{ position: "relative" }}>
      {/* Blurred content */}
      {blurContent && (
        <div
          style={{
            filter: "blur(6px)",
            pointerEvents: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
          aria-hidden="true"
        >
          {children}
        </div>
      )}

      {/* Overlay */}
      <div
        style={{
          position: blurContent ? "absolute" : "relative",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: "var(--paper-2)",
            border: "1.5px solid var(--line)",
            borderRadius: 14,
            padding: "24px 28px",
            textAlign: "center",
            maxWidth: 320,
            boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 10 }}>🔒</div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--ink)",
              marginBottom: 8,
            }}
          >
            Fonctionnalité {feature}
          </div>

          {isGuest && (
            <>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  lineHeight: 1.6,
                  marginBottom: 16,
                }}
              >
                Crée un compte gratuit pour accéder à cette fonctionnalité.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Link
                  href="/auth/signup"
                  style={{
                    display: "block",
                    padding: "10px 20px",
                    borderRadius: 9999,
                    background: "var(--accent)",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "opacity 0.15s",
                  }}
                >
                  Crée un compte gratuit
                </Link>
                <Link
                  href="/auth/login"
                  style={{
                    display: "block",
                    padding: "10px 20px",
                    borderRadius: 9999,
                    background: "transparent",
                    color: "var(--ink)",
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: "none",
                    border: "1.5px solid var(--line)",
                    transition: "background 0.15s",
                  }}
                >
                  Me connecter
                </Link>
              </div>
            </>
          )}

          {(isInvestisseurNeeded || (!isGuest && !isPremiumNeeded)) && (
            <>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  lineHeight: 1.6,
                  marginBottom: 16,
                }}
              >
                Cette fonctionnalité est disponible à partir du plan Investisseur.
              </p>
              <Link
                href="/tarifs"
                style={{
                  display: "inline-block",
                  padding: "10px 20px",
                  borderRadius: 9999,
                  background: "var(--accent)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "opacity 0.15s",
                }}
              >
                Passer au plan Investisseur
              </Link>
            </>
          )}

          {isPremiumNeeded && (
            <>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  lineHeight: 1.6,
                  marginBottom: 16,
                }}
              >
                Cette fonctionnalité est disponible à partir du plan Premium.
              </p>
              <Link
                href="/tarifs"
                style={{
                  display: "inline-block",
                  padding: "10px 20px",
                  borderRadius: 9999,
                  background: "var(--accent)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "opacity 0.15s",
                }}
              >
                Passer au plan Premium
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
