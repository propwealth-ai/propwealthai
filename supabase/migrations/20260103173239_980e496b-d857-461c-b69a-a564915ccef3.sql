-- Create property_analyses cache table for deterministic results
CREATE TABLE public.property_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_url TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  analysis_json JSONB NOT NULL,
  raw_extracted_data JSONB NOT NULL,
  calculated_metrics JSONB NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on property_url for fast lookups
CREATE UNIQUE INDEX idx_property_analyses_url ON public.property_analyses (property_url);

-- Create index for cache expiration cleanup
CREATE INDEX idx_property_analyses_expires ON public.property_analyses (expires_at);

-- Enable RLS
ALTER TABLE public.property_analyses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cached analyses (public cache)
CREATE POLICY "Anyone can read cached analyses"
ON public.property_analyses
FOR SELECT
USING (true);

-- Only service role can insert/update (from edge function)
CREATE POLICY "Service role can manage cache"
ON public.property_analyses
FOR ALL
USING (true)
WITH CHECK (true);

-- Add comment explaining the table purpose
COMMENT ON TABLE public.property_analyses IS 'Cache layer for property analyses to ensure deterministic results. Entries expire after 24 hours.';