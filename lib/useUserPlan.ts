"use client";
import { useState, useEffect } from "react";
import { type Plan, type PlanWithGuest, PLAN_LIMITS, GUEST_LIMITS } from "./plan";

interface UserPlanResult {
  plan: PlanWithGuest;
  loading: boolean;
  limits: typeof PLAN_LIMITS[Plan] | typeof GUEST_LIMITS;
  isPaid: boolean;
  isGuest: boolean;
}

export function useUserPlan(): UserPlanResult {
  const [plan, setPlan]       = useState<PlanWithGuest>("free");
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    fetch("/api/user/plan")
      .then(r => r.json())
      .then(d => {
        if (d.guest) {
          setPlan("guest");
          setIsGuest(true);
        } else {
          setPlan((d.plan as Plan) ?? "free");
          setIsGuest(false);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const limits = plan === "guest" ? GUEST_LIMITS : PLAN_LIMITS[plan as Plan];

  return {
    plan,
    loading,
    limits,
    isPaid: plan === "investisseur" || plan === "premium" || plan === "admin",
    isGuest,
  };
}
