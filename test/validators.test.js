require('ts-node/register');
const assert = require('assert');
const { isValidUrl, isValidNip05 } = require('../src/validators');

assert.strictEqual(isValidUrl('https://example.com'), true);
assert.strictEqual(isValidUrl('http://example.com/path'), true);
assert.strictEqual(isValidUrl('ftp://example.com'), false);
assert.strictEqual(isValidUrl('not a url'), false);

assert.strictEqual(isValidNip05('alice@example.com'), true);
assert.strictEqual(isValidNip05('bob@example'), false);
assert.strictEqual(isValidNip05('bad@domain@tld'), false);
assert.strictEqual(isValidNip05('@example.com'), false);

console.log('All tests passed.');
