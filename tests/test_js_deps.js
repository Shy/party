const { test } = require('node:test');
const assert = require('node:assert');

test('Supabase client instantiation (tests @supabase/supabase-js update)', () => {
    const { createClient } = require('@supabase/supabase-js');
    // Ensure the function signature hasn't broken with the version bump
    const supabase = createClient('https://example.supabase.co', 'dummy-key', {
        auth: { persistSession: false }
    });
    
    assert.ok(supabase, 'Supabase client should be instantiated successfully');
    assert.ok(typeof supabase.from === 'function', 'supabase.from should be a callable function');
});

test('Twilio client instantiation (tests twilio major version bump)', () => {
    const twilio = require('twilio');
    // Ensure the factory syntax hasn't broken in v6.0.2
    const client = twilio('ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'dummy_auth_token');
    
    assert.ok(client, 'Twilio client should be instantiated successfully');
    assert.ok(client.messages, 'Twilio client should have messages property');
    assert.ok(typeof client.messages.create === 'function', 'Twilio client should have messages.create method');
});
