import { createClient } from '@supabase/supabase-js';
import { pathToFileURL } from 'node:url';

export async function reconcile(client) {
  const result = await client.rpc('reconcile_stale_diagnoses', { p_limit: 100 });
  if (result.error) throw new Error('Database reconciliation failed; check migration and service credentials.');
  const paths = (result.data ?? []).map(row => row.image_path);
  if (!paths.every(path => typeof path === 'string' && /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/image$/i.test(path))) {
    throw new Error('Unexpected storage path; no files were removed.');
  }
  if (!paths.length) return { candidates: 0, removed: 0 };
  const deletion = await client.storage.from('crop-images').remove(paths);
  if (deletion.error) throw new Error('Storage cleanup failed; failed records are retained for retry.');
  return { candidates: paths.length, removed: deletion.data?.length ?? 0 };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Set the Supabase URL and server-only service-role key.');
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    console.log(JSON.stringify(await reconcile(client)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Maintenance failed.');
    process.exitCode = 1;
  }
}
