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
 * Monogram-sign generator tests.
 *
 * The load-bearing properties: every letter is nested inside the plate, so the
 * nesting rule engraves it; the plate is sized from the text it holds; and the
 * year is left out when it is 0.
 *
 * Run with: npx tsx src/cannedShapes/generators/monogram.test.ts
 */

import { getProfileBounds, sampleProfilePoints } from '../../types/project'
import {
  MONOGRAM_CANNED_KIND,
  monogramCannedShape,
  monogramProfiles,
  normalizeMonogramCannedParams,
} from './monogram'
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

const params = { text: 'Family', size: 10, padding: 8, year: 2026 }

test('normalizes a usable sign', () => {
  const normalized = normalizeMonogramCannedParams(params)
  assert(normalized, 'a complete parameter set is accepted')
  assert(normalized.year === 2026, 'the year is kept')
})

test('refuses a blank name', () => {
  assert(normalizeMonogramCannedParams({ ...params, text: '' }) === null, 'empty text is refused')
})

test('refuses a year below zero', () => {
  assert(normalizeMonogramCannedParams({ ...params, year: -1 }) === null, 'a negative year is refused')
})

test('keeps every letter inside the plate', () => {
  const profiles = monogramProfiles(params)
  assert(profiles.length > 1, 'a plate plus the letters')
  const plate = getProfileBounds(profiles[0])
  for (const profile of profiles.slice(1)) {
    for (const point of sampleProfilePoints(profile)) {
      assert(point.x > plate.minX && point.x < plate.maxX, 'letters stay inside the plate width')
      assert(point.y > plate.minY && point.y < plate.maxY, 'letters stay inside the plate height')
    }
  }
})

test('engraves the letters into the plate', () => {
  const shapes = resolveCannedShapeShapes({ operation: 'add', canned: { kind: MONOGRAM_CANNED_KIND, params } })
  assert(shapes[0].depth === 0 && shapes[0].operation === 'add', 'the plate is the material')
  assert(shapes.slice(1).some((shape) => shape.operation === 'subtract'), 'the letters are cuts')
})

test('splits the big letter where the name crosses it', () => {
  const shapes = resolveCannedShapeShapes({ operation: 'add', canned: { kind: MONOGRAM_CANNED_KIND, params } })
  const halves = shapes.filter((shape) => shape.name?.startsWith('Letter'))
  assert(halves.length === 2, `expected two letter halves, got ${halves.length}`)
  for (const half of halves) {
    assert(half.operation === 'subtract', 'each half is a cut')
  }
})

test('leaves the year out when it is 0', () => {
  const withYear = monogramProfiles(params).length
  const withoutYear = monogramProfiles({ ...params, year: 0 }).length
  assert(withoutYear < withYear, 'no year outlines are drawn')
})

test('grows the plate with a longer name', () => {
  const small = getProfileBounds(monogramProfiles(params)[0])
  const large = getProfileBounds(monogramProfiles({ ...params, text: 'Alexandra' })[0])
  assert(large.maxX - large.minX > small.maxX - small.minX, 'a longer name widens the plate')
})

test('regenerates the same outlines from stored parameters', () => {
  assert(
    JSON.stringify(monogramProfiles(params)) === JSON.stringify(monogramProfiles(params)),
    'generation is deterministic',
  )
})

test('the registered generator names the same kind', () => {
  assert(monogramCannedShape.kind === MONOGRAM_CANNED_KIND, 'registry key matches')
})

if (failCount > 0) {
  console.error(`\n${failCount} test(s) failed, ${passCount} passed`)
  process.exit(1)
}
console.log(`\n${passCount} monogram test(s) passed`)
