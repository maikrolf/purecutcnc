/**
 * Copyright 2026 Franja (Frank) Povazanj
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Heart-tag generator tests.
 *
 * The load-bearing properties: the name sits inside the heart, the hole is a
 * cut clear of the name, and a refused parameter set is refused rather than
 * drawn differently.
 *
 * Run with: npx tsx src/cannedShapes/generators/heartTag.test.ts
 */

import { getProfileBounds, sampleProfilePoints } from '../../types/project'
import {
  HEART_TAG_CANNED_KIND,
  heartTagCannedShape,
  heartTagProfiles,
  normalizeHeartTagCannedParams,
} from './heartTag'
import { resolveCannedShapeShapes } from '../index'

let passCount = 0
let failCount = 0

function test(name: string, fn: () => void): void {
  try {
    fn()
    console.log(`✓ ${name}`)
    passCount += 1
  } catch (error) {
    console.error(`✗ ${name}`)
    console.error(`  ${(error as Error).message}`)
    failCount += 1
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const params = { text: 'Emma', size: 12, padding: 6, hole: 5 }

test('normalizes a usable heart tag', () => {
  const normalized = normalizeHeartTagCannedParams(params)
  assert(normalized, 'a complete parameter set is accepted')
  assert(normalized.text === 'Emma', 'text is kept')
})

test('refuses an empty name', () => {
  assert(normalizeHeartTagCannedParams({ ...params, text: '  ' }) === null, 'blank text is refused')
})

test('refuses a non-positive size', () => {
  assert(normalizeHeartTagCannedParams({ ...params, size: 0 }) === null, 'size 0 is refused')
})

test('refuses a negative hole', () => {
  assert(normalizeHeartTagCannedParams({ ...params, hole: -1 }) === null, 'a negative hole is refused')
})

test('draws the heart around the name', () => {
  const profiles = heartTagProfiles(params)
  assert(profiles.length > 1, 'a heart plus at least one letter outline')
  const heart = getProfileBounds(profiles[0])
  for (const profile of profiles.slice(1)) {
    for (const point of sampleProfilePoints(profile)) {
      assert(point.x >= heart.minX - 1e-6 && point.x <= heart.maxX + 1e-6, 'every point stays inside the heart width')
      assert(point.y >= heart.minY - 1e-6 && point.y <= heart.maxY + 1e-6, 'every point stays inside the heart height')
    }
  }
})

test('nests the name and the hole as cuts', () => {
  const shapes = resolveCannedShapeShapes({ operation: 'add', canned: { kind: HEART_TAG_CANNED_KIND, params } })
  assert(shapes[0].depth === 0 && shapes[0].operation === 'add', 'the heart is the material')
  const cuts = shapes.filter((shape) => shape.operation === 'subtract')
  assert(cuts.length > 1, 'the name and the hanging hole are cuts')
})

test('regenerates the same outlines from stored parameters', () => {
  assert(
    JSON.stringify(heartTagProfiles(params)) === JSON.stringify(heartTagProfiles(params)),
    'generation is deterministic',
  )
})

test('the registered generator names the same kind', () => {
  assert(heartTagCannedShape.kind === HEART_TAG_CANNED_KIND, 'registry key matches')
})

if (failCount > 0) {
  console.error(`\n${failCount} test(s) failed, ${passCount} passed`)
  process.exit(1)
}
console.log(`\n${passCount} heart-tag test(s) passed`)
