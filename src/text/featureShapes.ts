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
 * The feature-level shape readings that straddle text and canned shapes.
 *
 * These live beside `text/index` rather than in it for one load-bearing reason:
 * a canned generator may itself use the text engine (a name tag draws its name
 * with it), so `text/index` must not import the canned-shape registry. The
 * cycle is real — `text/index → cannedShapes → generators → nametag → text` —
 * and it leaves a generator uninitialized at module load. Splitting the
 * canned-aware readings out breaks it without changing what any caller sees.
 *
 * Import these from here, not from `text`.
 */

import {
  getProfileBounds,
  type SketchFeature,
  type SketchProfile,
} from '../types/project'
import {
  isCannedFeature,
  resolveCannedShapeProfiles,
  resolveCannedShapeShapes,
} from '../cannedShapes'
import { isTextFeature, resolveTextFeatureShapes } from './index'

export function getFeatureGeometryProfiles(feature: SketchFeature): SketchProfile[] {
  if (isTextFeature(feature)) {
    return resolveTextFeatureShapes(feature).map((shape) => shape.profile)
  }
  if (isCannedFeature(feature)) {
    const profiles = resolveCannedShapeProfiles(feature)
    // An unregistered kind (a file from a later build) keeps its stored frame
    // visible instead of vanishing; the parameters still round-trip untouched.
    return profiles.length > 0 ? profiles : [feature.sketch.profile]
  }
  return [feature.sketch.profile]
}

/**
 * A feature's generated pieces, each with its resolved operation. Plain
 * features are one shape; Text and canned shapes resolve into several, and
 * their holes carry the inverse of the feature's operation (issue #861/#1112).
 */
export interface FeatureGeometryShape {
  profile: SketchProfile
  operation: SketchFeature['operation']
  name?: string
}

export function resolveFeatureGeometryShapes(feature: SketchFeature): FeatureGeometryShape[] {
  if (isTextFeature(feature)) {
    return resolveTextFeatureShapes(feature).map((shape) => ({
      profile: shape.profile,
      operation: shape.operation,
      name: shape.name,
    }))
  }
  if (isCannedFeature(feature)) {
    return resolveCannedShapeShapes(feature).map((shape) => ({
      profile: shape.profile,
      operation: shape.operation,
      name: shape.name,
    }))
  }
  return [{ profile: feature.sketch.profile, operation: feature.operation }]
}

/**
 * Whether any shape this feature resolves into has `operation`. A plain feature
 * is its own single shape; a text feature resolves into glyph outlines carrying
 * its operation and counters carrying the inverse — so an add text's counters
 * are subtracts an inside route or pocket can target (issue #861). Canned
 * shapes follow the same nesting rule (issue #1112).
 */
export function featureHasShapeWithOperation(feature: SketchFeature, operation: SketchFeature['operation']): boolean {
  if (isTextFeature(feature)) {
    return resolveTextFeatureShapes(feature).some((shape) => shape.operation === operation)
  }
  if (isCannedFeature(feature)) {
    return resolveCannedShapeShapes(feature).some((shape) => shape.operation === operation)
  }
  return feature.operation === operation
}

export function featureHasClosedGeometry(feature: SketchFeature): boolean {
  return getFeatureGeometryProfiles(feature).every((profile) => profile.closed)
}

export function getFeatureGeometryBounds(feature: SketchFeature) {
  const profiles = getFeatureGeometryProfiles(feature)
  if (profiles.length === 0) {
    return getProfileBounds(feature.sketch.profile)
  }
  return profiles
    .map((profile) => getProfileBounds(profile))
    .reduce(
      (acc, next) => ({
        minX: Math.min(acc.minX, next.minX),
        maxX: Math.max(acc.maxX, next.maxX),
        minY: Math.min(acc.minY, next.minY),
        maxY: Math.max(acc.maxY, next.maxY),
      }),
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
    )
}

export function expandFeatureGeometry(feature: SketchFeature, includeSynthetic = true): SketchFeature[] {
  if (isTextFeature(feature)) {
    return resolveTextFeatureShapes(feature).map((shape, index) => ({
      ...feature,
      id: `${feature.id}:text:${index}`,
      name: feature.name,
      kind: 'composite',
      text: null,
      sketch: {
        ...feature.sketch,
        profile: shape.profile,
      },
      operation: shape.operation,
    }))
  }

  if (isCannedFeature(feature)) {
    return resolveCannedShapeShapes(feature).map((shape, index) => ({
      ...feature,
      id: `${feature.id}:canned:${index}`,
      name: feature.name,
      kind: 'composite',
      canned: null,
      sketch: {
        ...feature.sketch,
        profile: shape.profile,
      },
      operation: shape.operation,
    }))
  }

  // Model features (imported STL meshes) are treated as 'add' obstacles for
  // 2.5D toolpath operations. We return a synthetic 'add' feature that uses
  // the model's 2D silhouette profile so pockets and other operations see it
  // as a solid obstacle they must machine around.
  if (includeSynthetic && feature.operation === 'model') {
    const syntheticAdd: SketchFeature = {
      ...feature,
      operation: 'add',
      stl: null,
    }
    return [feature, syntheticAdd]
  }

  return [feature]
}
