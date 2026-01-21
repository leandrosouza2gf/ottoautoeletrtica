-- Create access tokens table for secure OS lookup
CREATE TABLE public.os_access_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ordem_servico_id UUID NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '90 days'),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Add index for fast token lookup
CREATE INDEX idx_os_access_tokens_token ON public.os_access_tokens(token);
CREATE INDEX idx_os_access_tokens_ordem_servico_id ON public.os_access_tokens(ordem_servico_id);

-- Enable RLS
ALTER TABLE public.os_access_tokens ENABLE ROW LEVEL SECURITY;

-- Only allow service role access (edge functions will use service role)
CREATE POLICY "Service role only access"
ON public.os_access_tokens
FOR ALL
USING (false)
WITH CHECK (false);

-- Add token column to ordens_servico for easy access
ALTER TABLE public.ordens_servico 
ADD COLUMN IF NOT EXISTS access_token UUID UNIQUE DEFAULT gen_random_uuid();

-- Create index for token lookup
CREATE INDEX IF NOT EXISTS idx_ordens_servico_access_token ON public.ordens_servico(access_token);

-- Create access log table for security monitoring
CREATE TABLE public.os_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_os INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on access logs
ALTER TABLE public.os_access_logs ENABLE ROW LEVEL SECURITY;

-- Only allow service role access
CREATE POLICY "Service role only access"
ON public.os_access_logs
FOR ALL
USING (false)
WITH CHECK (false);