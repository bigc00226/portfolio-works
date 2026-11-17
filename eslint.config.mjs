import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const config = [
  ...nextVitals,
  ...nextTs,
  {
    // public/videos and public/shared are the video pages (plain browser scripts, not part of the Next app);
    // tools/ are Node CommonJS scripts
    ignores: ['.next/**', 'out/**', 'node_modules/**', 'public/**', 'tools/**', 'next-env.d.ts'],
  },
];

export default config;
