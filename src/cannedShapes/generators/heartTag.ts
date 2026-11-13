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
 * Heart name tag as a canned shape.
 *
 * Same recipe as the name tag, with a heart instead of a rounded tag: a
 * silhouette sized from the name, the name as outline text across it, and an
 * optional hanging hole under the centre dip. The heart is one profile built
 * from cubic Béziers in a unit box, so the size is a scale and nothing about
 * the curve is stored twice.
 *
 * The name is a cut because it is nested inside the heart; the hole is a cut
 * for the same reason (issue #1112's depth rule).
 */

import {
  circleProfile,
  getProfileBounds,
  type CannedShapeParams,
  type Point,
  type SketchProfile,
} from '../../types/project'
import { transformProfile } from '../../geometry/profile'
import { generateTextShapes } from '../../text'
import { defineCannedShape, type CannedShapeOutline } from '../types'
import type { CannedShapeEditorRequest } from './editorRequest'

export const HEART_TAG_CANNED_KIND = 'hearttag'

export type HeartTagCannedParams = CannedShapeParams & {
  text: string
  /** Cap height of the name, in project units. */
  size: number
  /** Margin between the name and the heart's edge. */
  padding: number
  /** Hanging-hole diameter; 0 draws no hole. */
  hole: number
}

const MAX_TEXT_LENGTH = 64
/** Height over width of the heart. */
const HEART_ASPECT = 0.95
/** The name's cap band sits this far down the heart, as a fraction of height. */
const NAME_BAND = 0.46
/** Usable width at the name band: the heart is narrower there than at the lobes. */
const BAND_WIDTH_RATIO = 0.84
const HOLE_BAND = 0.24

export function normalizeHeartTagCannedParams(raw: CannedShapeParams): HeartTagCannedParams | null {
  const text = typeof raw.text === 'string' ? raw.text.trim() : ''
  const size = raw.size
  const padding = raw.padding
  const hole = raw.hole
  if (text.length === 0 || text.length > MAX_TEXT_LENGTH) return null
  if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0) return null
  if (typeof padding !== 'number' || !Number.isFinite(padding) || padding < 0) return null
  if (typeof hole !== 'number' || !Number.isFinite(hole) || hole < 0) return null
  return { text, size, padding, hole }
}

/** The heart in a unit box, centred on the origin: tip at the bottom, Y down. */
function heartProfile(width: number, height: number): SketchProfile {
  const x = (value: number): number => value * width - width / 2
  const y = (value: number): number => value * height - height / 2
  const at = (cx: number, cy: number): Point => ({ x: x(cx), y: y(cy) })
  const tip = at(0.5, 0.92)
  return {
    start: tip,
    segments: [
      { type: 'bezier', control1: at(0.2, 0.7), control2: at(0, 0.45), to: at(0, 0.28) },
      { type: 'bezier', control1: at(0, 0.1), control2: at(0.14, 0), to: at(0.28, 0) },
      { type: 'bezier', control1: at(0.38, 0), control2: at(0.46, 0.06), to: at(0.5, 0.14) },
      { type: 'bezier', control1: at(0.54, 0.06), control2: at(0.62, 0), to: at(0.72, 0) },
      { type: 'bezier', control1: at(0.86, 0), control2: at(1, 0.1), to: at(1, 0.28) },
      { type: 'bezier', control1: at(1, 0.45), control2: at(0.8, 0.7), to: tip },
    ],
    closed: true,
  }
}

function heartTagOutlines(params: HeartTagCannedParams): CannedShapeOutline[] {
  const textShapes = generateTextShapes(
    { text: params.text, style: 'outline', fontId: 'helvetiker_bold', size: params.size, operation: 'subtract', layout: null },
    { x: 0, y: 0 },
  )
  if (textShapes.length === 0) return []

  const boxes = textShapes.map((shape) => getProfileBounds(shape.profile))
  const nameW = Math.max(...boxes.map((box) => box.maxX)) - Math.min(...boxes.map((box) => box.minX))
  const nameH = Math.max(...boxes.map((box) => box.maxY)) - Math.min(...boxes.map((box) => box.minY))

  // The heart is wider than the name so the name's band clears the edge.
  const width = (nameW + params.padding * 2) / BAND_WIDTH_RATIO
  const height = width * HEART_ASPECT
  const top = -height / 2

  // Centre the name's own box on the band, so a run with a descender still sits
  // where the band is.
  const nameCentre = {
    x: (Math.min(...boxes.map((box) => box.minX)) + Math.max(...boxes.map((box) => box.maxX))) / 2,
    y: (Math.min(...boxes.map((box) => box.minY)) + Math.max(...boxes.map((box) => box.maxY))) / 2,
  }
  const band = { x: 0, y: top + height * NAME_BAND }

  const outlines: CannedShapeOutline[] = [
    { profile: heartProfile(width, height), name: 'Heart' },
    ...textShapes.map((shape, index) => ({
      profile: transformProfile(shape.profile, (point) => ({
        x: point.x - nameCentre.x + band.x,
        y: point.y - nameCentre.y + band.y,
      })),
      name: `Name ${index + 1}`,
    })),
  ]

  if (params.hole > 0) {
    const radius = params.hole / 2
    const holeY = top + height * HOLE_BAND
    const nameTop = band.y - nameH / 2
    // The hole has to sit clear of both the dip and the name, or it would cut
    // through one of them.
    if (holeY + radius < nameTop && radius < height * 0.06) {
      outlines.push({ profile: circleProfile(band.x, holeY, radius), name: 'Hanging hole' })
    }
  }

  return outlines
}

export const heartTagCannedShape = defineCannedShape<HeartTagCannedParams>({
  kind: HEART_TAG_CANNED_KIND,
  labelKey: 'canned.heart.name',
  generate: (params) => {
    try {
      return heartTagOutlines(params)
    } catch {
      return []
    }
  },
  normalizeParams: normalizeHeartTagCannedParams,
  convertParams: (params, convertLength) => ({
    ...params,
    size: convertLength(params.size),
    padding: convertLength(params.padding),
    hole: convertLength(params.hole),
  }),
  summary: (params) => ({ key: 'canned.heart.summary', values: { text: params.text } }),
})

export const HEART_TAG_EDITOR_REQUEST: CannedShapeEditorRequest = {
  kind: HEART_TAG_CANNED_KIND,
  labelKey: 'canned.heart.name',
  fields: [
    { key: 'text', labelKey: 'dialogs.textTool.text', kind: 'text' },
    { key: 'size', labelKey: 'canvas.field.size' },
    { key: 'padding', labelKey: 'dialogs.generators.field.padding' },
    { key: 'hole', labelKey: 'canvas.field.diameter' },
  ],
  normalize: (params) => normalizeHeartTagCannedParams(params),
}

/** The outlines this tag would draw, for tests and thumbnails. */
export function heartTagProfiles(params: CannedShapeParams): readonly SketchProfile[] {
  const normalized = normalizeHeartTagCannedParams(params)
  return normalized ? heartTagOutlines(normalized).map((outline) => outline.profile) : []
}
