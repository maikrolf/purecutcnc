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
 * Profile-difference tests.
 *
 * The load-bearing property: cutting a closed shape with a band leaves the two
 * pieces, and a hole the cut creates comes back as its own profile so the
 * nesting rule still reads it as a counter.
 *
 * Run with: npx tsx src/geometry/profileBoolean.test.ts
 */

import { circleProfile, getProfileBounds, rectProfile } from '../types/project'
import { differenceProfiles } from './profileBoolean'

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

test('splits a square into two pieces with a horizontal band', () => {
  const result = differenceProfiles([rectProfile(0, 0, 100, 100)], [rectProfile(-10, 40, 120, 20)])
  assert(result.length === 2, `expected two pieces, got ${result.length}`)
  const heights = result.map((profile) => {
    const box = getProfileBounds(profile)
    return box.maxY - box.minY
  })
  assert(heights.every((height) => Math.abs(height - 40) < 1e-6), 'each piece is the height above or below the band')
})

test('splits a circle at the band', () => {
  const result = differenceProfiles([circleProfile(0, 0, 50)], [rectProfile(-60, -10, 120, 20)])
  assert(result.length === 2, `expected two pieces, got ${result.length}`)
  for (const profile of result) {
    const box = getProfileBounds(profile)
    assert(box.minY >= 10 - 1e-6 || box.maxY <= -10 + 1e-6, 'no piece crosses the band')
  }
})

test('returns the subject untouched when the band misses it', () => {
  const result = differenceProfiles([rectProfile(0, 0, 10, 10)], [rectProfile(100, 100, 10, 10)])
  assert(result.length === 1, 'one unchanged piece')
  const box = getProfileBounds(result[0])
  assert(Math.abs(box.maxX - 10) < 1e-6 && Math.abs(box.maxY - 10) < 1e-6, 'the piece keeps its size')
})

test('returns a hole as its own profile', () => {
  const result = differenceProfiles([rectProfile(0, 0, 100, 100)], [rectProfile(30, 30, 40, 40)])
  assert(result.length === 2, `expected the outline plus its hole, got ${result.length}`)
  const areas = result
    .map((profile) => {
      const box = getProfileBounds(profile)
      return (box.maxX - box.minX) * (box.maxY - box.minY)
    })
    .sort((a, b) => a - b)
  assert(Math.abs(areas[0] - 1600) < 1e-6, 'the hole comes back as a 40x40 contour')
})

test('keeps a contour empty of points out of the result', () => {
  assert(differenceProfiles([], [rectProfile(0, 0, 10, 10)]).length === 0, 'no subject, no result')
})

if (failCount > 0) {
  console.error(`\n${failCount} test(s) failed, ${passCount} passed`)
  process.exit(1)
}
console.log(`\n${passCount} profile-boolean test(s) passed`)
