---
name: Generated API client DOM iterable types
description: A TypeScript library-setting quirk in the workspace's generated fetch client.
---

The generated API fetch client relies on iterable header methods. Keep iterable DOM typings enabled in the TypeScript library set rather than changing generated client code to work around missing header iteration types.

**Why:** The generated client can produce TypeScript errors such as a missing `Headers.entries` member when DOM types are present without iterable DOM types, even though the fetch behavior works at runtime.

**How to apply:** If shared API client typechecks start failing on `Headers` iteration, inspect the TypeScript `lib` setting first and include `dom.iterable`.
