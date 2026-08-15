-- Poplab 0009 — stop mirroring every window by default.
--
-- The seeded specs carry `"mirror": true` on every slot, from a schema default
-- that was simply wrong. Rendering the real templates against real frames made
-- it obvious: the whole strip came out flipped, and any text in shot read
-- backwards.
--
-- Mirroring is a property of the CAPTURE, not the template. A front-camera
-- frame needs flipping because the preview the guest posed against was
-- mirrored while the saved frame is not; a rear-camera or uploaded photo must
-- not be touched. That now travels on the photo as `flipHorizontal` and is
-- XORed with the slot's flag at render time, so the slot flag can go back to
-- meaning what it should: a deliberate artistic flip of one window.
--
-- None of these templates wants that, so clear it everywhere.

update public.templates
   set spec = jsonb_set(
         spec,
         '{slots}',
         (
           select jsonb_agg(jsonb_set(slot, '{mirror}', 'false'::jsonb) order by idx)
             from jsonb_array_elements(spec -> 'slots') with ordinality as t(slot, idx)
         )
       )
 where spec -> 'slots' @> '[{"mirror": true}]'::jsonb;
