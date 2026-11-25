# euc-kr-korean-decoder

Decodes EUC-KR encoded Korean text bytes into JavaScript strings using the KS X 1001 code point mapping.

```js
import { decodeEucKr } from 'euc-kr-korean-decoder';

// '가' in EUC-KR bytes.
const bytes = new Uint8Array([0xb0, 0xa1]);
console.log(decodeEucKr(bytes)); // '가'
```

## Why this exists

Node's built-in `TextDecoder` does not support EUC-KR in all runtimes, and pulling in a large
encoding library for one legacy format is a poor trade. This package implements the mapping
directly from the KS X 1001 standard, with no dependencies. The trade-off is strictness: the
decoder throws on malformed input instead of silently substituting U+FFFD, so callers must
decide how to handle corruption. The `EucKrError` exposes the byte `offset` to make that
decision possible.

## API

- `decodeEucKr(bytes: Uint8Array): string` — decodes a complete byte array.
- `decodeEucKrChar(bytes: Uint8Array, offset?: number): { codePoint, bytes, offset }` — decodes one character.
- `new EucKrDecoder()` — stateful decoder with `write(chunk)` and `flush()` for streaming input.
- `EucKrError` — thrown for invalid lead bytes, invalid trail bytes, truncated sequences, and unassigned code points.

## Edge cases

The KS X 1001 table has holes. For example, `0xA2 0xA1` is not assigned to any character, and
the decoder throws rather than guessing. If you are reading a stream, a multi-byte sequence can
be split across chunks; use `EucKrDecoder` so a dangling lead byte is buffered until the next
chunk arrives. Forgetting to call `flush()` at the end will hide a truncated final character.

## Performance

The window keeps a bounded buffer, so `push` is constant time and memory does not
grow with the length of the stream. `peak` and `trough` are linear in the window
size, which is the trade that keeps `push` cheap.

