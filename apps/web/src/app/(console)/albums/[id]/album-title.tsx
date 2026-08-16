"use client";

import { useState, useTransition } from "react";
import { renameAlbum } from "../actions";

/** Inline-editable album title. Click to edit, blur or Enter to save. */
export function AlbumTitle({ id, initial }: { id: string; initial: string }) {
  const [title, setTitle] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [, start] = useTransition();

  const commit = () => {
    setEditing(false);
    if (title.trim() && title !== initial) start(() => void renameAlbum(id, title));
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setTitle(initial);
            setEditing(false);
          }
        }}
        className="font-display text-4xl uppercase border-b-2 border-[#14140f] bg-transparent outline-none"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Click to rename"
      className="font-display text-4xl uppercase text-left hover:opacity-70"
    >
      {title}
    </button>
  );
}
