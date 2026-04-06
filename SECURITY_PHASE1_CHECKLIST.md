# Phase 1 Security Checklist

This checklist is for the Supabase dashboard review needed to close public write access without breaking the public website.

## Goal

- Keep public `SELECT` only where the website needs it.
- Block public `INSERT`, `UPDATE`, `DELETE`, and storage uploads.
- Remove fake client-side admin protection as a security boundary.

## Tables To Review

- `productos`
- `distribuidores`
- `calculadora_cultivos`
- `slides`

## Storage To Review

- Bucket: `fermagri-assets`

## What Public Pages Need

- `Index.html`: read `productos`, read `slides`
- `productos.html` and `producto.html`: read `productos`
- `calculadora.html`: read `calculadora_cultivos`
- `distribuidores.html`: read `distribuidores`
- `chatbot.js`: read `productos`, read `distribuidores`

## Dashboard Checks

1. Open Supabase dashboard.
2. Go to `Authentication` and confirm whether any real admin users exist.
3. Go to `Table Editor` and confirm the four tables above exist.
4. Go to `Authentication` or `SQL Editor` and confirm RLS is enabled on each table.
5. Go to each table's policies and list every `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policy.
6. Remove or disable any public policy that allows writes for `anon`.
7. Keep only the public `SELECT` policies that the website actually needs.
8. Go to `Storage`, open bucket `fermagri-assets`, and inspect bucket policies.
9. Remove any upload, update, move, or delete permission granted to `anon`.
10. Confirm whether public read is required for image URLs already used by products and slides.

## Red Flags

- Policies using `USING (true)` or `WITH CHECK (true)` for write operations.
- Policies allowing `FOR ALL` to `anon`.
- Storage upload policies open to everyone.
- No real Supabase Auth users for admin access.

## Safe End State For Phase 1

- Public visitors can only read:
  - `productos`
  - `distribuidores`
  - `calculadora_cultivos`
  - `slides`
- Public visitors cannot write to any table.
- Public visitors cannot upload files to `fermagri-assets`.
- Internal admin and maintenance pages are not indexed.

## Likely Breakage To Watch For

- `admin.html` will stop working for edits once public writes are closed.
- Slide editing will stop if uploads to `fermagri-assets` still depend on anonymous access.
- `Cargar_Micronutrientes.html` will stop working if public writes are closed.

That breakage is expected. It means public write access has actually been removed.
