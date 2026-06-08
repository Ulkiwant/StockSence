-- ═══════════════════════════════════════════════════════════════
-- FINAZEN — Activation RLS sur toutes les tables critiques
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── TABLE: watchlists ──────────────────────────────────────────
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

-- Un utilisateur ne voit que ses propres actions suivies
CREATE POLICY IF NOT EXISTS "watchlists_own_read"
  ON public.watchlists FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "watchlists_own_insert"
  ON public.watchlists FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "watchlists_own_delete"
  ON public.watchlists FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "watchlists_own_update"
  ON public.watchlists FOR UPDATE
  USING (user_id = auth.uid());

-- ── TABLE: holdings (portfolio) ────────────────────────────────
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "holdings_own_read"
  ON public.holdings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "holdings_own_insert"
  ON public.holdings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "holdings_own_delete"
  ON public.holdings FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "holdings_own_update"
  ON public.holdings FOR UPDATE
  USING (user_id = auth.uid());

-- ── TABLE: alerts ──────────────────────────────────────────────
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "alerts_own_read"
  ON public.alerts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "alerts_own_insert"
  ON public.alerts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "alerts_own_delete"
  ON public.alerts FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "alerts_own_update"
  ON public.alerts FOR UPDATE
  USING (user_id = auth.uid());

-- ── TABLE: alert_logs ──────────────────────────────────────────
ALTER TABLE public.alert_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "alert_logs_own_read"
  ON public.alert_logs FOR SELECT
  USING (user_id = auth.uid());

-- Seul le service role peut écrire dans alert_logs (cron jobs)
-- Pas de policy INSERT/UPDATE pour les utilisateurs normaux

-- ── TABLE: user_plans (déjà fait, confirmé) ────────────────────
-- ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY; ✅ déjà fait

-- ── VÉRIFICATION FINALE ────────────────────────────────────────
-- Pour vérifier que tout est bien configuré :
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('watchlists','holdings','alerts','alert_logs','user_plans');
