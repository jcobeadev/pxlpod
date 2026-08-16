-- Let operators define their own template categories (e.g. "keychain") rather
-- than only the four built-ins. The app's filter chips key off the known set;
-- custom categories appear under "All".
alter table public.templates drop constraint if exists templates_category_check;
alter table public.templates add constraint templates_category_nonempty check (length(trim(category)) > 0);
