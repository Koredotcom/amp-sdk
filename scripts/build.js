#!/usr/bin/env node

/**
 * Build script for AMP SDK monorepo
 * Usage: node scripts/build.js [core|otel-exporter|all]
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.join(ROOT, 'packages');

const PACKAGES = {
  'core': {
    dir: path.join(PACKAGES_DIR, 'core'),
    preBuild: () => {
      // Sync assets before building core
      execSync('cp README.md packages/core/README.md && cp -r examples packages/core/', { cwd: ROOT, stdio: 'inherit' });
    },
  },
  'otel-exporter': {
    dir: path.join(PACKAGES_DIR, 'otel-exporter'),
  },
};

function buildPackage(name) {
  const pkg = PACKAGES[name];
  if (!pkg) {
    console.error(`Unknown package: ${name}`);
    process.exit(1);
  }

  if (!fs.existsSync(pkg.dir)) {
    console.error(`Package directory not found: ${pkg.dir}`);
    process.exit(1);
  }

  console.log(`\n=== Building ${name} ===`);

  if (pkg.preBuild) pkg.preBuild();

  execSync('npx tsup src/index.ts --format cjs,esm --dts', {
    cwd: pkg.dir,
    stdio: 'inherit',
  });

  console.log(`=== ${name} built successfully ===\n`);
}

const target = process.argv[2] || 'core';

if (target === 'all') {
  for (const name of Object.keys(PACKAGES)) {
    buildPackage(name);
  }
} else {
  buildPackage(target);
}
