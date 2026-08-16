import * as SQLite from "expo-sqlite";
import { Directory, File, Paths } from "expo-file-system";

/**
 * The on-device strip library.
 *
 * A finished session is copied out of the cache (where the compositor writes
 * its preview, and where the OS may evict it) into the document directory,
 * which survives, and recorded in SQLite. This is what backs My Photos and
 * Home's "recent strips" — it is the app's own memory, entirely separate from
 * the camera roll that "Save to device" writes to.
 *
 * No photo ever leaves the device here: both the file copy and the row are
 * local.
 */

export interface StripRecord {
  id: string;
  templateId: string | null;
  templateName: string;
  uri: string;
  outputKind: string;
  filterId: string;
  createdAt: number;
}

const DB_NAME = "poplab.db";
const DIR = "strips";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function db(): Promise<SQLite.SQLiteDatabase> {
  dbPromise ??= (async () => {
    const database = await SQLite.openDatabaseAsync(DB_NAME);
    await database.execAsync(
      `CREATE TABLE IF NOT EXISTS strips (
         id TEXT PRIMARY KEY NOT NULL,
         template_id TEXT,
         template_name TEXT NOT NULL,
         uri TEXT NOT NULL,
         output_kind TEXT NOT NULL DEFAULT 'photo',
         filter_id TEXT NOT NULL DEFAULT 'original',
         created_at INTEGER NOT NULL
       );`,
    );
    return database;
  })();
  return dbPromise;
}

function stripsDir(): Directory {
  const dir = new Directory(Paths.document, DIR);
  try {
    if (!dir.exists) dir.create({ intermediates: true });
  } catch {
    // Concurrent create or already-exists — safe to ignore.
  }
  return dir;
}

interface Row {
  id: string;
  template_id: string | null;
  template_name: string;
  uri: string;
  output_kind: string;
  filter_id: string;
  created_at: number;
}

const toRecord = (r: Row): StripRecord => ({
  id: r.id,
  templateId: r.template_id,
  templateName: r.template_name,
  uri: r.uri,
  outputKind: r.output_kind,
  filterId: r.filter_id,
  createdAt: r.created_at,
});

export async function listStrips(): Promise<StripRecord[]> {
  const rows = await (await db()).getAllAsync<Row>("SELECT * FROM strips ORDER BY created_at DESC");
  return rows.map(toRecord);
}

/**
 * Copies a composed strip into permanent storage and records it. `sourceUri`
 * is the cache file the compositor produced; the copy means the record stays
 * valid after the cache is cleared.
 */
export async function commitStrip(
  sourceUri: string,
  meta: { templateId: string | null; templateName: string; outputKind: string; filterId: string },
): Promise<StripRecord> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const dest = new File(stripsDir(), `${id}.jpg`);

  const buffer = await new File(sourceUri).arrayBuffer();
  // create() throws FileAlreadyExists if the path is taken; the id is unique, but
  // guard anyway so a retry can never dead-end the save.
  if (dest.exists) dest.delete();
  dest.create();
  dest.write(new Uint8Array(buffer));

  const record: StripRecord = {
    id,
    templateId: meta.templateId,
    templateName: meta.templateName,
    uri: dest.uri,
    outputKind: meta.outputKind,
    filterId: meta.filterId,
    createdAt: Date.now(),
  };

  await (await db()).runAsync(
    "INSERT INTO strips (id, template_id, template_name, uri, output_kind, filter_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [record.id, record.templateId, record.templateName, record.uri, record.outputKind, record.filterId, record.createdAt],
  );

  return record;
}

export async function deleteStrip(id: string): Promise<void> {
  const rows = await (await db()).getAllAsync<Row>("SELECT uri FROM strips WHERE id = ?", [id]);
  const uri = rows[0]?.uri;
  if (uri) {
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch {
      // File already gone — the row removal below is what matters.
    }
  }
  await (await db()).runAsync("DELETE FROM strips WHERE id = ?", [id]);
}
