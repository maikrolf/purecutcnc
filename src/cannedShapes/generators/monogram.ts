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
 * Monogram sign as a canned shape.
 *
 * A rounded plate with the name's first letter cut large above the name, and an
 * optional year below it. Every letter is outline text from `src/text`, and the
 * plate is the one Add outline, so the nesting rule engraves the letters
 * (issue #1112). The plate is sized from the text it holds, so changing the
 * name resizes the sign.
 */

import {
  getProfileBounds,
  type CannedShapeParams,
  type SketchProfile,
} from '../../types/project'
import { transformProfile } from '../../geometry/profile'
import { roundedRectProfile } from '../../store/helpers/cannedRectProfiles'
import { generateTextShapes } from '../../text'
import { defineCannedShape, type CannedShapeOutline } from '../types'
import type { CannedShapeEditorRequest } from './editorRequest'

export const MONOGRAM_CANNED_KIND = 'monogram'

export type MonogramCannedParams = CannedShapeParams & {
  text: string
  /** Cap height of the name, in project units. */
  size: number
  /** Margin between the text and the plate's edge. */
  padding: number
  /** Engraved year under the name; 0 leaves it out. */
  year: number
}

const MAX_TEXT_LENGTH = 64
/** The initial is this many times the name's cap height. */
const INITIAL_SCALE = 3
/** Year line, relative to the name's cap height. */
const YEAR_SCALE = 0.6
/** Gap between stacked lines, relative to the name's cap height. */
const LINE_GAP = 0.5

export function normalizeMonogramCannedParams(raw: CannedShapeParams): MonogramCannedParams | null {
  const text = typeof raw.text === 'string' ? raw.text.trim() : ''
  const size = raw.size
  const padding = raw.padding
  const year = raw.year
  if (text.length === 0 || text.length > MAX_TEXT_LENGTH) return null
  if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0) return null
  if (typeof padding !== 'number' || !Number.isFinite(padding) || padding < 0) return null
  if (typeof year !== 'number' || !Number.isFinite(year) || year < 0) return null
  return { text, size, padding, year: Math.round(year) }
}

interface TextRun {
  shapes: ReturnType<typeof generateTextShapes>
  width: number
  height: number
}

function textRun(text: string, size: number): TextRun | null {
  const shapes = generateTextShapes(
    { text, style: 'outline', fontId: 'helvetiker_bold', size, operation: 'subtract', layout: null },
    { x: 0, y: 0 },
  )
  if (shapes.length === 0) return null
  const boxes = shapes.map((shape) => getProfileBounds(shape.profile))
  return {
    shapes,
    width: Math.max(...boxes.map((box) => box.maxX)) - Math.min(...boxes.map((box) => box.minX)),
    height: Math.max(...boxes.map((box) => box.maxY)) - Math.min(...boxes.map((box) => box.minY)),
  }
}

/** Move a run so its bounding box sits with `top` at `y` and its centre at `x`. */
function placeRun(run: TextRun, x: number, y: number): CannedShapeOutline[] {
  const boxes = run.shapes.map((shape) => getProfileBounds(shape.profile))
  const left = Math.min(...boxes.map((box) => box.minX))
  const top = Math.min(...boxes.map((box) => box.minY))
  const shiftX = x - (left + run.width / 2)
  const shiftY = y - top
  return run.shapes.map((shape, index) => ({
    profile: transformProfile(shape.profile, (point) => ({ x: point.x + shiftX, y: point.y + shiftY })),
    name: `${shape.name ?? 'Text'} ${index + 1}`,
  }))
}

function monogramOutlines(params: MonogramCannedParams): CannedShapeOutline[] {
  const initial = textRun(params.text.slice(0, 1).toUpperCase(), params.size * INITIAL_SCALE)
  const name = textRun(params.text, params.size)
  const year = params.year > 0 ? textRun(String(params.year), params.size * YEAR_SCALE) : null
  if (!initial || !name) return []

  const gap = params.size * LINE_GAP
  const runs = [initial, name, ...(year ? [year] : [])]
  const contentWidth = Math.max(...runs.map((run) => run.width))
  const contentHeight = runs.reduce((total, run) => total + run.height, 0) + gap * (runs.length - 1)

  const plateWidth = contentWidth + params.padding * 2
  const plateHeight = contentHeight + params.padding * 2
  const corner = Math.min(plateWidth, plateHeight) * 0.12

  const outlines: CannedShapeOutline[] = [
    {
      profile: roundedRectProfile(
        { x: -plateWidth / 2, y: -plateHeight / 2 },
        { x: plateWidth / 2, y: plateHeight / 2 },
        corner,
      ),
      name: 'Plate',
    },
  ]

  let top = -contentHeight / 2
  for (const run of runs) {
    outlines.push(...placeRun(run, 0, top))
    top += run.height + gap
  }

  return outlines
}

export const monogramCannedShape = defineCannedShape<MonogramCannedParams>({
  kind: MONOGRAM_CANNED_KIND,
  labelKey: 'canned.monogram.name',
  generate: (params) => {
    try {
      return monogramOutlines(params)
    } catch {
      return []
    }
  },
  normalizeParams: normalizeMonogramCannedParams,
  convertParams: (params, convertLength) => ({
    ...params,
    size: convertLength(params.size),
    padding: convertLength(params.padding),
  }),
  summary: (params) => ({ key: 'canned.monogram.summary', values: { text: params.text } }),
})

export const MONOGRAM_EDITOR_REQUEST: CannedShapeEditorRequest = {
  kind: MONOGRAM_CANNED_KIND,
  labelKey: 'canned.monogram.name',
  fields: [
    { key: 'text', labelKey: 'dialogs.textTool.text', kind: 'text' },
    { key: 'year', labelKey: 'dialogs.generators.field.year', integer: true },
    { key: 'size', labelKey: 'canvas.field.size' },
    { key: 'padding', labelKey: 'dialogs.generators.field.padding' },
  ],
  normalize: (params) => normalizeMonogramCannedParams(params),
}

/** The outlines this sign would draw, for tests and thumbnails. */
export function monogramProfiles(params: CannedShapeParams): readonly SketchProfile[] {
  const normalized = normalizeMonogramCannedParams(params)
  return normalized ? monogramOutlines(normalized).map((outline) => outline.profile) : []
}
