"use client";

import { useActionState } from "react";
import { saveEvent, type SaveEventState } from "./actions";

export interface EventFormValues {
  id?: string;
  title?: string;
  description?: string;
  starts_at?: string;
  ends_at?: string;
  venue_name?: string | null;
  city?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  is_published?: boolean;
  printing_enabled?: boolean;
  print_price_cents?: number;
}

/** Converts an ISO string to the `datetime-local` input format in local time. */
function toLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

/** W-17 Event editor. Errors surface inline via useActionState. */
export function EventForm({ values }: { values: EventFormValues }) {
  const [state, formAction, pending] = useActionState<SaveEventState, FormData>(saveEvent, {});

  // On a failed submit React 19 resets the form to its defaultValues, so those
  // defaults must reflect what the operator just typed (echoed back in state),
  // falling back to the row being edited on first render.
  const back = state.values;
  return (
    <form key={state.nonce ?? "init"} action={formAction} className="max-w-2xl flex flex-col gap-5">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <Field label="Title">
        <input name="title" required defaultValue={back ? back.title : values.title} className={inputCls} placeholder="Downtown Night Market" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Starts">
          <input type="datetime-local" name="starts_at" required defaultValue={back ? back.starts_at : toLocalInput(values.starts_at)} className={inputCls} />
        </Field>
        <Field label="Ends">
          <input type="datetime-local" name="ends_at" required defaultValue={back ? back.ends_at : toLocalInput(values.ends_at)} className={inputCls} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Venue">
          <input name="venue_name" defaultValue={back ? back.venue_name : (values.venue_name ?? "")} className={inputCls} placeholder="Downtown Night Market" />
        </Field>
        <Field label="City">
          <input name="city" defaultValue={back ? back.city : (values.city ?? "")} className={inputCls} placeholder="Manila" />
        </Field>
      </div>

      <div className="border border-[#d8d4ca] p-4 flex flex-col gap-3 bg-[#faf9f5]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#7a736a]">Location pin</span>
          <p className="text-[12px] text-[#7a736a] mt-0.5">
            Guests get a “Directions” button that opens Google Maps. Coordinates give the exact pin;
            otherwise the address is searched. In Google Maps, right-click the spot → the first line is
            “lat, lng” you can copy.
          </p>
        </div>
        <Field label="Address">
          <input name="address" defaultValue={back ? back.address : (values.address ?? "")} className={inputCls} placeholder="SM Megamall, Mandaluyong City" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Latitude (optional)">
            <input name="lat" inputMode="decimal" defaultValue={back ? back.lat : (values.lat != null ? String(values.lat) : "")} className={inputCls} placeholder="14.5859" />
          </Field>
          <Field label="Longitude (optional)">
            <input name="lng" inputMode="decimal" defaultValue={back ? back.lng : (values.lng != null ? String(values.lng) : "")} className={inputCls} placeholder="121.0567" />
          </Field>
        </div>
      </div>

      <Field label="Description">
        <textarea name="description" defaultValue={back ? back.description : values.description} rows={3} className={inputCls} />
      </Field>

      <div className="border border-[#d8d4ca] p-4 flex flex-col gap-3 bg-[#faf9f5]">
        <Check name="is_published" label="Published" hint="Show this event in the app's Find Us list" defaultChecked={back ? back.is_published : values.is_published} />
        <Check name="printing_enabled" label="Printing available" hint="Let guests claim a print at this pop-up" defaultChecked={back ? back.printing_enabled : values.printing_enabled} />
        <Field label="Print price (₱)">
          <input
            type="number"
            name="print_price"
            min={0}
            step={5}
            defaultValue={back ? back.print_price : ((values.print_price_cents ?? 0) / 100).toString()}
            className={`${inputCls} w-32`}
          />
        </Field>
      </div>

      {state.error ? (
        <p className="text-[14px] text-[#a33418] font-semibold border border-[#a33418] bg-[#f7e6e0] px-4 py-3">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="bg-[#14140f] text-white font-bold uppercase tracking-wide px-6 py-3 disabled:opacity-50"
        >
          {pending ? "Saving…" : values.id ? "Save changes" : "Create event"}
        </button>
      </div>
    </form>
  );
}

const inputCls = "border border-[#14140f] px-3 py-2.5 text-[15px] outline-none focus:bg-[#faf9f5] bg-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-widest text-[#7a736a]">{label}</span>
      {children}
    </label>
  );
}

function Check({ name, label, hint, defaultChecked }: { name: string; label: string; hint: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 w-4 h-4 accent-[#14140f]" />
      <span>
        <span className="font-semibold text-[14px]">{label}</span>
        <span className="block text-[12px] text-[#7a736a]">{hint}</span>
      </span>
    </label>
  );
}
