-- Stage 2: enable authenticated admin access for the Fermagri CMS.
-- Public reads stay separate. Writes are granted only to authenticated users.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'productos'
    ) THEN
        DROP POLICY IF EXISTS "Admins authenticated full access productos" ON public.productos;
        CREATE POLICY "Admins authenticated full access productos"
        ON public.productos
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'distribuidores'
    ) THEN
        DROP POLICY IF EXISTS "Admins authenticated full access distribuidores" ON public.distribuidores;
        CREATE POLICY "Admins authenticated full access distribuidores"
        ON public.distribuidores
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'calculadora_cultivos'
    ) THEN
        DROP POLICY IF EXISTS "Admins authenticated full access calculadora_cultivos" ON public.calculadora_cultivos;
        CREATE POLICY "Admins authenticated full access calculadora_cultivos"
        ON public.calculadora_cultivos
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'slides'
    ) THEN
        DROP POLICY IF EXISTS "Permitir gestión total de slides" ON public.slides;
        DROP POLICY IF EXISTS "Admins authenticated full access slides" ON public.slides;
        CREATE POLICY "Admins authenticated full access slides"
        ON public.slides
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);

        REVOKE ALL ON TABLE public.slides FROM PUBLIC, anon, authenticated;
        GRANT SELECT ON TABLE public.slides TO anon, authenticated;
        GRANT INSERT, UPDATE, DELETE ON TABLE public.slides TO authenticated;
        REVOKE ALL ON SEQUENCE public.slides_id_seq FROM PUBLIC, anon, authenticated;
        GRANT USAGE, SELECT ON SEQUENCE public.slides_id_seq TO authenticated;
    END IF;
END $$;

DROP POLICY IF EXISTS "Authenticated uploads fermagri-assets" ON storage.objects;
CREATE POLICY "Authenticated uploads fermagri-assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'fermagri-assets');

DROP POLICY IF EXISTS "Authenticated updates fermagri-assets" ON storage.objects;
CREATE POLICY "Authenticated updates fermagri-assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'fermagri-assets')
WITH CHECK (bucket_id = 'fermagri-assets');

DROP POLICY IF EXISTS "Authenticated deletes fermagri-assets" ON storage.objects;
CREATE POLICY "Authenticated deletes fermagri-assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'fermagri-assets');
