const assert = require('node:assert');

if (typeof globalThis.WebSocket === 'undefined') {
    globalThis.WebSocket = require('ws');
}

console.log('Testing Supabase client instantiation...');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://example.supabase.co', 'dummy-key', {
    auth: { persistSession: false }
});
assert.ok(supabase, 'Supabase client should be instantiated successfully');
assert.ok(typeof supabase.from === 'function', 'supabase.from should be a callable function');
console.log('Supabase client test passed.\n');

console.log('Testing Twilio client instantiation...');
const twilio = require('twilio');
const client = twilio('ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'dummy_auth_token');
assert.ok(client, 'Twilio client should be instantiated successfully');
assert.ok(client.messages, 'Twilio client should have messages property');
assert.ok(typeof client.messages.create === 'function', 'Twilio client should have messages.create method');
console.log('Twilio client test passed.\n');

console.log('All tests passed.');
process.exit(0);
