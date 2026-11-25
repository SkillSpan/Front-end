import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import tailwindConfig from '../../tailwind.config.js';

describe('Tailwind production build configuration', () => {
  it('generates utilities for every React view without enabling the global reset', () => {
    const entryCss = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');

    expect(entryCss).toContain('@tailwind utilities');
    expect(tailwindConfig.content).toContain('./src/**/*.{js,jsx,ts,tsx}');
    expect(tailwindConfig.corePlugins?.preflight).toBe(false);
    expect(tailwindConfig.important).toBeUndefined();
  });
});
