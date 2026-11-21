import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decodeEucKr,
  decodeEucKrChar,
  EucKrDecoder,
  EucKrError,
} from '../src/index.js';

test('decodes ASCII bytes unchanged', () => {
  const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
  assert.equal(decodeEucKr(bytes), 'Hello');
});

test('decodes a Hangul syllable from EUC-KR', () => {
  // '가' is 0xB0 0xA1 in EUC-KR.
  const bytes = new Uint8Array([0xb0, 0xa1]);
  assert.equal(decodeEucKr(bytes), '\uac00');
});

test('decodes mixed ASCII and Hangul', () => {
  const bytes = new Uint8Array([0x41, 0xb0, 0xa1, 0x42]);
  assert.equal(decodeEucKr(bytes), 'A\uac00B');
});

test('decodes a full-width digit', () => {
  // '０' is 0xA3 0xB0 in EUC-KR.
  const bytes = new Uint8Array([0xa3, 0xb0]);
  assert.equal(decodeEucKr(bytes), '\uff10');
});

test('decodeEucKrChar returns code point and byte count', () => {
  const bytes = new Uint8Array([0xb0, 0xa1]);
  const result = decodeEucKrChar(bytes, 0);
  assert.equal(result.codePoint, 0xac00);
  assert.equal(result.bytes, 2);
  assert.equal(result.offset, 0);
});

test('decodeEucKrChar handles ASCII', () => {
  const bytes = new Uint8Array([0x41]);
  const result = decodeEucKrChar(bytes, 0);
  assert.equal(result.codePoint, 0x41);
  assert.equal(result.bytes, 1);
});

test('throws on invalid lead byte', () => {
  const bytes = new Uint8Array([0x80]);
  assert.throws(() => decodeEucKr(bytes), EucKrError);
});

test('throws on invalid trail byte', () => {
  const bytes = new Uint8Array([0xb0, 0x20]);
  assert.throws(() => decodeEucKr(bytes), EucKrError);
});

test('throws on truncated sequence', () => {
  const bytes = new Uint8Array([0xb0]);
  assert.throws(() => decodeEucKr(bytes), EucKrError);
});

test('throws on unassigned code point', () => {
  // 0xA2 0xA1 is unassigned in KS X 1001.
  const bytes = new Uint8Array([0xa2, 0xa1]);
  assert.throws(() => decodeEucKr(bytes), EucKrError);
});

test('EucKrError carries the byte offset', () => {
  const bytes = new Uint8Array([0x41, 0xb0]);
  try {
    decodeEucKr(bytes);
    assert.fail('expected error');
  } catch (err) {
    assert.ok(err instanceof EucKrError);
    assert.equal(err.offset, 1);
  }
});

test('EucKrDecoder handles a sequence split across chunks', () => {
  const decoder = new EucKrDecoder();
  const first = decoder.write(new Uint8Array([0xb0]));
  assert.equal(first, '');
  const second = decoder.write(new Uint8Array([0xa1]));
  assert.equal(second, '\uac00');
  decoder.flush();
});

test('EucKrDecoder flush throws on dangling lead byte', () => {
  const decoder = new EucKrDecoder();
  decoder.write(new Uint8Array([0xb0]));
  assert.throws(() => decoder.flush(), EucKrError);
});

test('decodeEucKr rejects non-Uint8Array input', () => {
  assert.throws(() => decodeEucKr([0x41]), TypeError);
});
