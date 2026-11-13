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
 * Round ornament as a canned shape.
 *
 * A disc with the name bent along an arc inside it. The name is outline text
 * from `src/text`, so the same font metrics and arc layout the text tool uses
 * apply here; the canned model then nests the letters as cuts inside the disc
 * (issue #1112's depth rule), which is what an engraved ornament needs.
 *
 * The arc radius is derived from the disc, not stored twice: `radius` is the
 * disc's, and the name sits on a circle at 72% of it. `normalizeParams` refuses
 * a cap height that would push a glyph past the rim, which is what stops a
 * large name being cut off the disc.
 */

import {
  circleProfile,
  type CannedShapeParams,
  type SketchProfile,
} from '../../types/project'
import { generateTextShapes } from '../../text'
import { defineCannedShape, type CannedShapeOutline } from '../types'
import type { CannedShapeEditorRequest } from './editorRequest'

export const ORNAMENT_CANNED_KIND = 'ornament'

export type OrnamentCannedParams = CannedShapeParams & {
  text: string
  /** Cap height of the name, in project units. */
  size: number
  /** Disc radius, in project units. */
  radius: number
}

const MAX_TEXT_LENGTH = 64
const TEXT_ARC_RATIO = 0.72
const TEXT_SWEEP_DEGREES = 200
/**
 * A glyph stands outside the baseline, so the name reaches `arcRadius + cap
 * height` from the centre. 0.22 keeps that inside 0.95 of the rim.
 */
const MAX_SIZE_RATIO = 0.22

export function normalizeOrnamentCannedParams(raw: CannedShapeParams): OrnamentCannedParams | null {
  const text = typeof raw.text === 'string' ? raw.text.trim() : ''
  const size = raw.size
  const radius = raw.radius
  if (text.length === 0 || text.length > MAX_TEXT_LENGTH) return null
  if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0) return null
  if (typeof radius !== 'number' || !Number.isFinite(radius) || radius <= 0) return null
  if (size > radius * MAX_SIZE_RATIO) return null
  return { text, size, radius }
}

function ornamentOutlines(params: OrnamentCannedParams): CannedShapeOutline[] {
  const arcRadius = params.radius * TEXT_ARC_RATIO
  const textShapes = generateTextShapes(
    {
      text: params.text,
      style: 'outline',
      fontId: 'helvetiker_bold',
      size: params.size,
      operation: 'subtract',
      layout: {
        kind: 'arc',
        center: { x: 0, y: 0 },
        radius: arcRadius,
        angleDegrees: 270,
        sweepDegrees: TEXT_SWEEP_DEGREES,
        direction: 'cw',
        anchor: 'center',
        fit: 'natural',
        orientation: 'follow',
      },
    },
    { x: 0, y: 0 },
  )
  if (textShapes.length === 0) return []

  // The layout already centres the run on the anchor angle, so the glyphs land
  // on the disc's own centre. Re-centring on their bounding box would drop the
  // run off the arc and through the middle of the disc.
  return [
    { profile: circleProfile(0, 0, params.radius), name: 'Ornament' },
    ...textShapes.map((shape, index) => ({
      profile: shape.profile,
      name: `Name ${index + 1}`,
    })),
  ]
}

export const ornamentCannedShape = defineCannedShape<OrnamentCannedParams>({
  kind: ORNAMENT_CANNED_KIND,
  labelKey: 'canned.ornament.name',
  generate: (params) => {
    try {
      return ornamentOutlines(params)
    } catch {
      return []
    }
  },
  normalizeParams: normalizeOrnamentCannedParams,
  convertParams: (params, convertLength) => ({
    ...params,
    size: convertLength(params.size),
    radius: convertLength(params.radius),
  }),
  summary: (params) => ({ key: 'canned.ornament.summary', values: { text: params.text } }),
})

export const ORNAMENT_EDITOR_REQUEST: CannedShapeEditorRequest = {
  kind: ORNAMENT_CANNED_KIND,
  labelKey: 'canned.ornament.name',
  fields: [
    { key: 'text', labelKey: 'dialogs.textTool.text', kind: 'text' },
    { key: 'size', labelKey: 'canvas.field.size' },
    { key: 'radius', labelKey: 'canvas.field.radius' },
  ],
  normalize: (params) => normalizeOrnamentCannedParams(params),
}

/** The outlines this ornament would draw, for tests and thumbnails. */
export function ornamentProfiles(params: CannedShapeParams): readonly SketchProfile[] {
  const normalized = normalizeOrnamentCannedParams(params)
  return normalized ? ornamentOutlines(normalized).map((outline) => outline.profile) : []
}
