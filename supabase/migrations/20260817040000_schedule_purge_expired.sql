-- Automate cleanup of expired share links and print passes (and their storage
-- objects) via purge_expired(). Without a schedule the function existed but
-- never ran. Runs daily at 18:15 UTC (02:15 Manila), off-peak.
create extension if not exists pg_cron;

select cron.unschedule('purge-expired-daily')
where exists (select 1 from cron.job where jobname = 'purge-expired-daily');

select cron.schedule('purge-expired-daily', '15 18 * * *', $$ select public.purge_expired(); $$);
