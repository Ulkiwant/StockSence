-- Table des plans utilisateurs (gérée manuellement par l'admin)
CREATE TABLE IF NOT EXISTS public.user_plans (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT        UNIQUE NOT NULL,
  plan        TEXT        NOT NULL DEFAULT 'free', -- 'free' | 'investisseur' | 'premium' | 'admin'
  note        TEXT,                               -- note interne (ex: "ami", "bêta testeur")
  granted_at  TIMESTAMPTZ DEFAULT now(),
  expires_at  TIMESTAMPTZ,                        -- NULL = permanent
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Sécurité : chaque utilisateur ne voit que son propre plan
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_plan" ON public.user_plans
  FOR SELECT USING (email = auth.email());

-- L'admin (service role) peut tout faire — utilisé par les API routes
-- Aucune policy supplémentaire nécessaire côté service role
