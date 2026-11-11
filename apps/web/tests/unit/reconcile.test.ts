import { describe, expect, it, vi } from 'vitest';
// Operational script is JavaScript so it can run directly on the supported Node runtime.
import { reconcile } from '../../scripts/reconcile.mjs';

const path = '10000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000001/image';
function client(data: unknown, error: unknown = null) {
  const remove = vi.fn().mockResolvedValue({ data: [{ name: path }], error });
  return { rpc: vi.fn().mockResolvedValue({ data, error: null }), storage: { from: vi.fn().mockReturnValue({ remove }) }, remove };
}
describe('maintenance storage reconciliation', () => {
  it('uses private storage deletion after the transactional RPC', async () => {
    const db = client([{ image_path: path }]);
    expect(await reconcile(db)).toEqual({ candidates: 1, removed: 1 });
    expect(db.storage.from).toHaveBeenCalledWith('crop-images');
    expect(db.remove).toHaveBeenCalledWith([path]);
  });
  it('does not delete when no candidates remain', async () => {
    const db = client([]);
    expect(await reconcile(db)).toEqual({ candidates: 0, removed: 0 });
    expect(db.remove).not.toHaveBeenCalled();
  });
  it('fails safely on database errors and unexpected paths', async () => {
    const db = client([{ image_path: '../other-file' }]);
    await expect(reconcile(db)).rejects.toThrow('Unexpected storage path');
    expect(db.remove).not.toHaveBeenCalled();
    db.rpc.mockResolvedValue({ data: null, error: {} });
    await expect(reconcile(db)).rejects.toThrow('Database reconciliation failed');
    expect(db.remove).not.toHaveBeenCalled();
  });
  it('reports deletion failures without swallowing them', async () => {
    await expect(reconcile(client([{ image_path: path }], {}))).rejects.toThrow('retained for retry');
  });
});
