import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const workspaces = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'Hilltop Template', slug: 'hilltop-template', status: 'active' },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Luxurious Real Estate', slug: 'luxurious-real-estate', status: 'active' },
  { id: '33333333-3333-4333-8333-333333333333', name: 'Archived Company', slug: 'archived-company', status: 'archived' }
];
const memberships = workspaces.map((workspace, index) => ({
  workspace_id: workspace.id,
  role: 'super_admin',
  status: 'active',
  is_current: index === 0,
  demo_workspaces: workspace
}));
const storage = new Map();
const events = [];
const listeners = new Map();
let profileRefreshes = 0;
let createArgs = null;

storage.set('ithaca.activeWorkspace.' + userId, workspaces[1].id);

class CustomEventMock {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail || {};
  }
}

function membershipQuery() {
  return {
    select() { return this; },
    eq() { return this; },
    then(resolve) { resolve({ data: memberships, error: null }); }
  };
}

const supabase = {
  auth: {
    async getSession() {
      return { data: { session: { user: { id: userId, email: 'admin@example.com' } } }, error: null };
    }
  },
  from(table) {
    assert.equal(table, 'demo_workspace_memberships');
    return membershipQuery();
  },
  async rpc(name, args) {
    if (name === 'switch_demo_workspace') {
      const target = memberships.find((item) => item.workspace_id === args.p_workspace_id && item.demo_workspaces.status === 'active');
      if (!target) return { data: null, error: { message: 'The requested workspace is unavailable.' } };
      memberships.forEach((item) => { item.is_current = item === target; });
      return { data: target.demo_workspaces, error: null };
    }
    if (name === 'create_demo_workspace') {
      createArgs = args;
      if (workspaces.some((item) => item.slug === args.p_slug)) {
        return { data: null, error: { code: '23505', message: 'A workspace with this slug already exists.' } };
      }
      const workspace = {
        id: '44444444-4444-4444-8444-' + String(workspaces.length).padStart(12, '0'),
        name: args.p_name,
        slug: args.p_slug,
        status: 'active'
      };
      workspaces.push(workspace);
      memberships.forEach((item) => { item.is_current = false; });
      memberships.push({ workspace_id: workspace.id, role: 'super_admin', status: 'active', is_current: true, demo_workspaces: workspace });
      return { data: workspace, error: null };
    }
    if (name === 'archive_demo_workspace') {
      const target = memberships.find((item) => item.workspace_id === args.p_workspace_id);
      if (!target) return { data: null, error: { message: 'That workspace is unavailable.' } };
      target.demo_workspaces.status = 'archived';
      target.is_current = false;
      const fallback = memberships.find((item) => item.demo_workspaces.status === 'active');
      if (fallback) fallback.is_current = true;
      return { data: target.demo_workspaces, error: null };
    }
    throw new Error('Unexpected RPC: ' + name);
  }
};

globalThis.document = {
  querySelector() { return null; },
  getElementById() { return null; },
  body: { classList: { add() {}, remove() {} }, appendChild() {} }
};
globalThis.window = {
  hilltopSupabase: supabase,
  hilltopCurrentUser: { id: 'old-workspace-staff', role: 'super_admin', workspace_id: workspaces[0].id },
  async hilltopRefreshStaffProfile() {
    profileRefreshes += 1;
    const current = memberships.find((item) => item.is_current);
    this.hilltopCurrentUser = {
      id: 'staff-for-' + current.workspace_id,
      role: current.role,
      workspace_id: current.workspace_id
    };
    return this.hilltopCurrentUser;
  },
  localStorage: {
    getItem(key) { return storage.get(key) || null; },
    setItem(key, value) { storage.set(key, value); }
  },
  CustomEvent: CustomEventMock,
  dispatchEvent(event) {
    events.push(event.type);
    (listeners.get(event.type) || []).forEach((listener) => listener(event));
  },
  addEventListener(type, listener) {
    if (!listeners.has(type)) listeners.set(type, []);
    listeners.get(type).push(listener);
  },
  setTimeout(callback) { callback(); }
};

const source = fs.readFileSync(new URL('../workspace.js', import.meta.url), 'utf8');
vm.runInThisContext(source, { filename: 'workspace.js' });

const api = window.HilltopWorkspace;
await api.ready();

assert.equal(api.getActive().slug, 'luxurious-real-estate', 'persisted workspace is restored during navigation');
assert.equal(api.getWorkspaces().length, 2, 'archived workspaces are excluded from the normal selector');
assert.equal(storage.get('ithaca.activeWorkspace.' + userId), api.getActive().id, 'selection persists for navigation');
assert.equal(profileRefreshes, 1, 'restoring a different workspace refreshes the workspace staff profile');
assert.equal(window.hilltopCurrentUser.workspace_id, api.getActive().id, 'cached staff context matches the restored workspace');

let staleRows = ['workspace-a-row'];
window.addEventListener('hilltop:workspace-changing', () => { staleRows = []; });
await api.switchTo(workspaces[0].id);
assert.equal(api.getActive().slug, 'hilltop-template', 'workspace switching works');
assert.deepEqual(staleRows, [], 'changing workspace clears stale module data before reload');
assert.ok(events.indexOf('hilltop:workspace-changing') < events.lastIndexOf('hilltop:workspace-changed'));

const associated = api.withWorkspace({ title: 'New property' });
assert.equal(associated.workspace_id, workspaces[0].id, 'new records inherit the active workspace');
const scopedCalls = [];
const query = { eq(column, value) { scopedCalls.push([column, value]); return this; } };
assert.equal(api.scope(query), query);
assert.deepEqual(scopedCalls, [['workspace_id', workspaces[0].id]], 'queries are explicitly workspace scoped');
assert.ok(api.storagePath('property/images/test.jpg').startsWith(workspaces[0].id + '/'));

const created = await api.create({ name: 'Prime Legacy Properties', slug: 'prime-legacy-properties', status: 'archived' });
assert.equal(api.getActive().id, created.id, 'creation automatically switches to the new workspace');
assert.equal(api.getActive().slug, 'prime-legacy-properties', 'workspace creation works');
assert.equal(created.status, 'active', 'workspace creation always produces an active workspace');
assert.deepEqual(createArgs, {
  p_name: 'Prime Legacy Properties',
  p_slug: 'prime-legacy-properties'
}, 'shared frontend API does not expose archived workspace creation');
const eventCountBeforeDuplicate = events.length;
await assert.rejects(
  api.create({ name: 'Duplicate', slug: 'prime-legacy-properties' }),
  /already exists/,
  'duplicate slugs are rejected'
);
assert.equal(events.length, eventCountBeforeDuplicate, 'failed creation does not clear or reload current workspace data');

await api.archive(created.id);
assert.equal(api.getActive().slug, 'hilltop-template', 'archiving the current workspace selects an active fallback');
assert.equal(api.getWorkspaces().some((item) => item.id === created.id), false, 'archived workspaces leave the active selector');

assert.equal(api.slugify('  Rocky Property Network  '), 'rocky-property-network');
assert.equal(api.validateSlug('Rocky Property'), 'Use lowercase letters, numbers, and single hyphens only.');
console.log('Demo workspace browser-state tests passed.');
