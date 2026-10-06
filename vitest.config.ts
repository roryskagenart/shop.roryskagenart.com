import { defineConfig } from 'vitest/config';
import fs from 'fs';
import path from 'path';

// Windows only: `process.cwd()` can carry a LOWERCASE drive letter (`c:\...`) depending on how
// the shell was entered. Vitest then derives its root from that string, and the resulting
// module paths differ in case from the ones the runner uses — which silently disables
// `vi.mock` hoisting (4 files, 23 tests) and, under `npm test`, makes every suite fail to load.
// `realpathSync.native()` canonicalises the drive letter. A no-op on Linux/macOS. See T44.
const ROOT = fs.realpathSync.native(__dirname);

export default defineConfig({
  root: ROOT,
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(ROOT, './'),
      // tsconfig sets `baseUrl: "."`, so application code imports `lib/...` as a bare
      // specifier. Without this alias any module under lib/ fails to load in tests.
      lib: path.resolve(ROOT, './lib'),
    },
  },
});
