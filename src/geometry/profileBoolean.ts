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
 * Boolean difference between profiles, for generators that must cut a shape at
 * generation time (the split-letter monogram: one big letter minus the band the
 * name runs through).
 *
 * The result is a flat list of closed line profiles in nesting order, because
 * that is what a generator returns: the canned model still assigns Add/Subtract
 * by depth, so a hole in the difference becomes a counter exactly like a text
 * glyph's counter.
 *
 * shortcut: profiles are sampled to points, which is exact for the line-only
 * outlines text produces and only an approximation of a curved subject. If a
 * generator ever splits an arc or Bézier outline, raise the sampling or clip
 * the curve instead.
 */

import ClipperLib from 'clipper-lib'
import { DEFAULT_CLIPPER_SCALE } from '../engine/clipperScale'
import { sampleProfilePoints, type Segment, type SketchProfile } from '../types/project'

type ClipperPoint = { X: number; Y: number }

/** The part of a Clipper poly node this module walks. */
interface PolyNode {
  Contour(): ClipperPoint[]
  Childs?(): PolyNode[]
  m_Childs?: PolyNode[]
}

function toClipperPath(profile: SketchProfile): ClipperPoint[] {
  const points = sampleProfilePoints(profile).map((point) => ({
    X: Math.round(point.x * DEFAULT_CLIPPER_SCALE),
    Y: Math.round(point.y * DEFAULT_CLIPPER_SCALE),
  }))
  // A sampled contour repeats its first point at the end; Clipper wants it once.
  const first = points[0]
  const last = points[points.length - 1]
  if (points.length > 1 && first.X === last.X && first.Y === last.Y) {
    points.pop()
  }
  return points
}

function fromContour(contour: ClipperPoint[]): SketchProfile | null {
  if (contour.length < 3) return null
  const points = contour.map((point) => ({
    x: point.X / DEFAULT_CLIPPER_SCALE,
    y: point.Y / DEFAULT_CLIPPER_SCALE,
  }))
  const start = points[0]
  const segments: Segment[] = points.slice(1).map((point) => ({ type: 'line', to: point }))
  segments.push({ type: 'line', to: start })
  return { start, segments, closed: true }
}

function collect(node: PolyNode, out: SketchProfile[]): void {
  const children = typeof node.Childs === 'function' ? node.Childs() : node.m_Childs ?? []
  for (const child of children) {
    const profile = fromContour(child.Contour())
    if (profile) out.push(profile)
    collect(child, out)
  }
}

/**
 * `subject` minus `clip`. A contour that ends up enclosing another (a letter's
 * counter) is returned after its parent, so the caller keeps the nesting.
 */
export function differenceProfiles(
  subject: readonly SketchProfile[],
  clip: readonly SketchProfile[],
): SketchProfile[] {
  const subjectPaths = subject.map(toClipperPath).filter((path) => path.length >= 3)
  if (subjectPaths.length === 0) return []
  const clipPaths = clip.map(toClipperPath).filter((path) => path.length >= 3)
  if (clipPaths.length === 0) return subject.slice()

  const clipper = new ClipperLib.Clipper()
  clipper.AddPaths(subjectPaths, ClipperLib.PolyType.ptSubject, true)
  clipper.AddPaths(clipPaths, ClipperLib.PolyType.ptClip, true)
  const solution = new ClipperLib.PolyTree()
  const succeeded = clipper.Execute(
    ClipperLib.ClipType.ctDifference,
    solution,
    ClipperLib.PolyFillType.pftNonZero,
    ClipperLib.PolyFillType.pftNonZero,
  )
  if (!succeeded) return []

  const outlines: SketchProfile[] = []
  collect(solution, outlines)
  return outlines
}
