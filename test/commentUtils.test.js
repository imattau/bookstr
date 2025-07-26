require('ts-node/register');
const assert = require('assert');
const { buildCommentTags } = require('../src/commentUtils');

const rootTags = buildCommentTags('book1');
assert.deepStrictEqual(rootTags, [['e', 'book1', '', 'root']]);

const replyTags = buildCommentTags('book1', 'parent1', 'pubkey1');
assert.deepStrictEqual(replyTags, [
  ['e', 'book1', '', 'root'],
  ['e', 'parent1', '', 'reply'],
  ['p', 'pubkey1'],
]);

console.log('All tests passed.');
