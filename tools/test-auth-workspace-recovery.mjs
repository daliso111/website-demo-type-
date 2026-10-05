import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const archivedId = '11111111-1111-4111-8111-111111111111';
const fallbackId = '22222222-2222-4222-8222-222222222222';
let currentWorkspaceId = archivedId;
let switchedTo = null;

const memberships = [
  {
    workspace_id: archivedId,
    auth_user_id: userId,
    role: 'super_admin',
    status: 'active',
    is_current: true,
    created_at: '2026-01-01T00:00:00Z',
    demo_workspaces: { id: archivedId, name: 'Archived Company', slug: 'archived-company', status: 'archived' }
  },
  {
    workspace_id: fallbackId,
    auth_user_id: userId,
    role: 'super_admin',
    status: 'active',
    is_current: false,
    created_at: '2026-02-01T00:00:00Z',
    demo_workspaces: { id: fallbackId, name: 'Hilltop Template', slug: 'hilltop-template', status: 'active' }
  }
];

function membershipQuery() {
  const filters = [];
  return {
    select() { return this; },
    eq(column, value) { filters.push([column, value]); return this; },
    order() { return this; },
    limit() { return this; },
    async maybeSingle() {
      let rows = memberships.slice();
      for (const [column, value] of filters) {
        if (column === 'demo_workspaces.status') {
          rows = rows.filter((row) => row.demo_workspaces.status === value);
        } else {
          rows = rows.filter((row) => row[column] === value);
        }
      }
      return { data: rows[0] || null, error: null };
    }
  };
}

function staffQuery() {
  return {
    select() { return this; },
    eq() { return this; },
    async maybeSingle() { return { data: null, error: null }; }
  };
}

const supabase = {
  auth: {
    async getSession() {
      return {
        data: { session: { user: { id: userId, email: 'admin@example.com', user_metadata: { full_name: 'Demo Admin' } } } },
        error: null
      };
    },
    async signOut() {
      throw new Error('A recoverable archived workspace must not sign the user out.');
    }
  },
  from(table) {
    if (table === 'demo_workspace_memberships') return membershipQuery();
    if (table === 'staff_users') return staffQuery();
    throw new Error('Unexpected table: ' + table);
  },
  async rpc(name, args) {
    assert.equal(name, 'switch_demo_workspace');
    switchedTo = args.p_workspace_id;
    currentWorkspaceId = switchedTo;
    memberships.forEach((membership) => { membership.is_current = membership.workspace_id === switchedTo; });
    return { data: memberships.find((membership) => membership.workspace_id === switchedTo).demo_workspaces, error: null };
  }
};

const sessionStorageValues = new Map();
globalThis.document = {
  querySelectorAll() { return []; }
};
globalThis.sessionStorage = {
  setItem(key, value) { sessionStorageValues.set(key, value); },
  removeItem(key) { sessionStorageValues.delete(key); }
};
globalThis.window = {
  hilltopSupabase: supabase,
  location: { pathname: '/admin-dashboard.html', href: '/admin-dashboard.html' },
  setTimeout(callback) { callback(); }
};

const source = fs.readFileSync(new URL('../auth-guard.js', import.meta.url), 'utf8');
vm.runInThisContext(source, { filename: 'auth-guard.js' });
await window.hilltopAuthReady;

assert.equal(switchedTo, fallbackId, 'auth guard recovers from an archived current workspace');
assert.equal(currentWorkspaceId, fallbackId);
assert.equal(window.location.href, '/admin-dashboard.html', 'recovery does not redirect to login');
assert.equal(window.hilltopCurrentUser.workspace_id, fallbackId);
assert.equal(window.hilltopCurrentUser.workspace_slug, 'hilltop-template');
assert.equal(window.hilltopCurrentUser.role, 'super_admin');
assert.ok(sessionStorageValues.has('hilltopCurrentUser'), 'recovered profile is persisted for dashboard navigation');

console.log('Archived-current workspace auth recovery test passed.');
