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
 * A gallery generator's outlines reach CAM unchanged.
 *
 * The monogram is the hard case: its big letter is split by a real area
 * difference (`geometry/profileBoolean`), so the plate holds one subtract
 * contour above the name and another below it, plus the name and the year. This
 * asserts what the user's next click does — pocket the plate and route inside
 * its letters — without the geometry breaking anywhere on the way.
 *
 * Run with: npx tsx src/engine/toolpaths/cannedGeneratorCut.test.ts
 */

import type { Operation, Project, SketchFeature, Tool } from '../../types/project'
import { defaultTool, getProfileBounds, newProject } from '../../types/project'
import { projectWithFeatures } from '../../test/projectFixtures'
import { resolveCannedShapeShapes } from '../../cannedShapes'
import { MONOGRAM_CANNED_KIND } from '../../cannedShapes/generators/monogram'
import { generateEdgeRouteToolpath } from './edge'
import { generatePocketToolpath } from './pocket'
import type { ToolpathResult } from './types'

let passed = 0
let failed = 0

function check(name: string, condition: boolean, detail: string): void {
  if (condition) { passed += 1; console.log(`   ✓ ${name}`); return }
  failed += 1
  console.log(`   ✗ ${name}: ${detail}`)
}

function tool(): Tool {
  return { ...defaultTool('mm', 1), id: 't1', name: '2mm endmill', diameter: 2, defaultStepdown: 2, defaultStepover: 0.4 }
}

/** What "Expand to features" produces: one row per outline, operation from depth. */
function monogramRows(text: string): SketchFeature[] {
  return resolveCannedShapeShapes({
    operation: 'add',
    canned: { kind: MONOGRAM_CANNED_KIND, params: { text, year: 2026, size: 10, padding: 8 } },
  }).map((shape, index) => ({
    id: `row-${index}`,
    name: shape.name ?? `Row ${index}`,
    kind: 'composite',
    sketch: {
      profile: shape.profile,
      origin: { x: 0, y: 0 },
      orientationAngle: 0,
      dimensions: [],
      constraints: [],
    },
    operation: shape.operation,
    folderId: null,
    z_top: 20,
    z_bottom: 16,
    visible: true,
    locked: false,
  }))
}

function operation(kind: Operation['kind'], featureIds: string[]): Operation {
  return {
    id: 'op1', name: 'op', kind, pass: 'rough', enabled: true, showToolpath: true,
    debugToolpath: false,
    target: { source: 'features', featureIds },
    toolRef: 't1',
    stepdown: 2, stepover: 0.4, feed: 800, plungeFeed: 300, rpm: 18000,
    pocketPattern: 'offset', pocketAngle: 0, roundOutsideCorners: false,
    stockToLeaveRadial: 0, stockToLeaveAxial: 0, finishWalls: false, finishFloor: false,
    carveDepth: 0, maxCarveDepth: 0, cutDirection: 'conventional', machiningOrder: 'level_first',
  } as Operation
}

function projectWith(rows: SketchFeature[], op: Operation): Project {
  const project = projectWithFeatures({ ...newProject('generator-cut', 'mm'), tools: [tool()] }, rows)
  return { ...project, operations: [op] }
}

function cutPoints(result: ToolpathResult): { x: number, y: number }[] {
  return result.moves.filter((move) => move.kind === 'cut').flatMap((move) => [move.from, move.to])
}

function inside(points: { x: number, y: number }[], box: { minX: number, maxX: number, minY: number, maxY: number }): boolean {
  return points.every((point) => point.x > box.minX && point.x < box.maxX && point.y > box.minY && point.y < box.maxY)
}

console.log('\nThe split monogram reaches CAM')

for (const text of ['Bob', 'Family']) {
  const rows = monogramRows(text)
  const plate = rows[0]
  const plateBox = getProfileBounds(plate.sketch.profile)
  const letters = rows.filter((row) => row.name.startsWith('Letter'))
  const cuts = rows.filter((row) => row.operation === 'subtract')

  check(`"${text}": the plate is one Add row`, plate.operation === 'add' && plate.name === 'Plate', plate.name)
  check(
    `"${text}": the letter arrives as at least two subtract pieces`,
    letters.filter((row) => row.operation === 'subtract').length >= 2,
    `${letters.filter((row) => row.operation === 'subtract').length} subtract letter rows`,
  )

  // The operation targets the letters, as it does after Expand to features: the
  // plate is one row and each piece inside it is a row of its own.
  const pocketOp = operation('pocket', cuts.map((row) => row.id))
  const pocket = generatePocketToolpath(projectWith(rows, pocketOp), pocketOp)
  const pocketCuts = cutPoints(pocket)
  check(`"${text}": pocket cuts inside the plate`, pocketCuts.length > 0 && inside(pocketCuts, plateBox),
    `${pocketCuts.length} cut points, warnings ${JSON.stringify(pocket.warnings)}`)

  const routeOp = operation('edge_route_inside', cuts.map((row) => row.id))
  const route = generateEdgeRouteToolpath(projectWith(rows, routeOp), routeOp)
  const routeCuts = cutPoints(route)
  check(`"${text}": inside route cuts inside the plate`, routeCuts.length > 0 && inside(routeCuts, plateBox),
    `${routeCuts.length} cut points, warnings ${JSON.stringify(route.warnings)}`)
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed, ${passed} passed`)
  process.exit(1)
}
console.log(`\n${passed} CAM hand-off check(s) passed`)
