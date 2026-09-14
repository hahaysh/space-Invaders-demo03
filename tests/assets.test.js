import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const directory = new URL('../src/assets/ships/', import.meta.url);
const assets = [
  ['playerShip1_blue.png', 2698, '648ec1635979fb867d08bfd0c56f011d6559dd953a13c73109c6186a3069f7ee', 99, 75],
  ['LICENSE-Kenney.txt', 498, 'c8cf4591af39c24e65560fbfcc271de9d97b135e0316f963485b9e770455b6db'],
];

test('only stage assets exist and match pinned original bytes and dimensions', () => {
  assert.deepEqual(readdirSync(directory).sort(), assets.map(([name]) => name).sort());
  for (const [name, size, hash, width, height] of assets) {
    const data = readFileSync(new URL(name, directory));
    assert.equal(data.length, size, name);
    assert.equal(createHash('sha256').update(data).digest('hex'), hash, name);
    if (width) {
      assert.equal(data.readUInt32BE(16), width);
      assert.equal(data.readUInt32BE(20), height);
    }
  }
});
