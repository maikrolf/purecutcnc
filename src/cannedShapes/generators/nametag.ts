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
 * Name tag as a canned shape.
 *
 * The tag is one feature: a rounded tag outline, the name as outline text
 * inside it, and a hanging hole in the top margin. The generator emits the
 * outlines in definition-local space and lets the canned model assign
 * Add/Subtract by nesting depth, so the name and the hole are cuts into the
 * tag exactly as Text's counters are (issue #1112's rule).
 *
 * The name is real text geometry from `src/text`, not a picture: changing the
 * name in Properties re-runs this generator and the tag follows.
 */

import {
  circleProfile,
  getProfileBounds,
  rectProfile,
  type CannedShapeParams,
  type SketchProfile,
} from '../../types/project'
import { transformProfile } from '../../geometry/profile'
import { generateTextShapes } from '../../text'
import { defineCannedShape, type CannedShapeOutline } from '../types'
import type { CannedShapeEditorRequest } from './editorRequest'

export const NAMETAG_CANNED_KIND = 'nametag'

export type NametagCannedParams = CannedShapeParams & {
  /** The engraved name. */
  text: string
  /** Cap height of the name, in project units. */
  size: number
  /** Margin between the name and the tag edge. */
  padding: number
  /** Hanging-hole diameter; 0 draws no hole. */
  hole: number
}

/** The tag is never smaller than this, so a one-letter name still reads as a tag. */
const MAX_TEXT_LENGTH = 64

export function normalizeNametagCannedParams(raw: CannedShapeParams): NametagCannedParams | null {
  const text = typeof raw.text === 'string' ? raw.text.trim() : ''
  const size = raw.size
  const padding = raw.padding
  const hole = raw.hole
  if (text.length === 0 || text.length > MAX_TEXT_LENGTH) return null
  // Lengths are in project units: a floor in millimetres would refuse every
  // inch-sized name (0.47" is 12 mm).
  if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0) return null
  if (typeof padding !== 'number' || !Number.isFinite(padding) || padding < 0) return null
  if (typeof hole !== 'number' || !Number.isFinite(hole) || hole < 0) return null
  return { text, size, padding, hole }
}

function nametagOutlines(params: NametagCannedParams): CannedShapeOutline[] {
  const padding = params.padding
  const textShapes = generateTextShapes(
    { text: params.text, style: 'outline', fontId: 'helvetiker_bold', size: params.size, operation: 'subtract', layout: null },
    { x: 0, y: 0 },
  )
  if (textShapes.length === 0) return []

  const boxes = textShapes.map((shape) => getProfileBounds(shape.profile))
  const minX = Math.min(...boxes.map((box) => box.minX))
  const maxX = Math.max(...boxes.map((box) => box.maxX))
  const minY = Math.min(...boxes.map((box) => box.minY))
  const maxY = Math.max(...boxes.map((box) => box.maxY))

  const left = minX - padding
  const top = minY - padding * 2
  const width = (maxX - minX) + padding * 2
  const height = (maxY - minY) + padding * 3

  const outlines: CannedShapeOutline[] = [
    { profile: rectProfile(left, top, width, height), name: 'Tag' },
    ...textShapes.map((shape, index) => ({ profile: shape.profile, name: `Name ${index + 1}` })),
  ]

  if (params.hole > 0) {
    const radius = params.hole / 2
    // The hole sits in the extra top margin, clear of the name's cap height.
    const holeY = top + padding + radius
    const fits = radius * 2 <= Math.min(width, height) && holeY + radius <= minY
    if (fits) {
      outlines.push({ profile: circleProfile(left + width / 2, holeY, radius), name: 'Hanging hole' })
    }
  }

  // Centre the finished tag on the definition origin, so the instance transform
  // is the only placement.
  const centre = { x: left + width / 2, y: top + height / 2 }
  return outlines.map((outline) => ({
    ...outline,
    profile: transformProfile(outline.profile, (point) => ({ x: point.x - centre.x, y: point.y - centre.y })),
  }))
}

export const nametagCannedShape = defineCannedShape<NametagCannedParams>({
  kind: NAMETAG_CANNED_KIND,
  labelKey: 'canned.nametag.name',
  generate: (params) => {
    try {
      return nametagOutlines(params)
    } catch {
      // A refused parameter set is already rejected by `normalizeParams`; a
      // corrupt file must not turn a redraw into a crash.
      return []
    }
  },
  normalizeParams: normalizeNametagCannedParams,
  convertParams: (params, convertLength) => ({
    ...params,
    size: convertLength(params.size),
    padding: convertLength(params.padding),
    hole: convertLength(params.hole),
  }),
  summary: (params) => ({ key: 'canned.nametag.summary', values: { text: params.text } }),
})

export const NAMETAG_EDITOR_REQUEST: CannedShapeEditorRequest = {
  kind: NAMETAG_CANNED_KIND,
  labelKey: 'canned.nametag.name',
  fields: [
    { key: 'text', labelKey: 'dialogs.textTool.text', kind: 'text' },
    { key: 'size', labelKey: 'canvas.field.size' },
    { key: 'padding', labelKey: 'dialogs.generators.field.padding' },
    { key: 'hole', labelKey: 'canvas.field.diameter' },
  ],
  normalize: (params) => normalizeNametagCannedParams(params),
}

/** The outlines this tag would draw, for tests and thumbnails. */
export function nametagProfiles(params: CannedShapeParams): readonly SketchProfile[] {
  const normalized = normalizeNametagCannedParams(params)
  return normalized ? nametagOutlines(normalized).map((outline) => outline.profile) : []
}
