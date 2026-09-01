/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { readFileSync } from 'fs';
import path from 'path';

type Manifest = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  overrides?: Record<string, string | Record<string, string>>;
};

type Lockfile = {
  packages: Record<string, unknown>;
};

const frontendRoot = path.resolve(__dirname, '../..');

// Deck.gl 3D packages that are not imported by Superset and that pull in the
// vulnerable image-size chain through texture-compressor.
const UNUSED_3D_PACKAGES = [
  '@deck.gl/geo-layers',
  '@deck.gl/mesh-layers',
  '@luma.gl/gltf',
];

const VULNERABLE_CHAIN = [
  '@loaders.gl/textures',
  'texture-compressor',
  'image-size',
];

const readJson = <T>(relativePath: string): T =>
  JSON.parse(readFileSync(path.join(frontendRoot, relativePath), 'utf8')) as T;

test.each([['package.json'], ['plugins/preset-chart-deckgl/package.json']])(
  '%s does not declare unused deck.gl 3D packages',
  manifestPath => {
    const manifest = readJson<Manifest>(manifestPath);
    const declared = [
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.devDependencies ?? {}),
      ...Object.keys(manifest.overrides ?? {}),
    ];
    UNUSED_3D_PACKAGES.forEach(name => expect(declared).not.toContain(name));
  },
);

test('lockfile resolves no vulnerable image-size chain', () => {
  const lockfile = readJson<Lockfile>('package-lock.json');
  const installed = new Set(
    Object.keys(lockfile.packages).map(entry =>
      entry.replace(/^.*node_modules\//, ''),
    ),
  );
  const found = [...UNUSED_3D_PACKAGES, ...VULNERABLE_CHAIN].filter(name =>
    installed.has(name),
  );
  expect(found).toEqual([]);
});
