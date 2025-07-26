require('ts-node/register');
const assert = require('assert');
const { validatePrivKey } = require('../src/validatePrivKey');

assert.strictEqual(validatePrivKey('a'.repeat(63)), false);
assert.strictEqual(validatePrivKey('g'.repeat(64)), false);
assert.strictEqual(validatePrivKey('f'.repeat(64)), true);

console.log('All tests passed.');
