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
 * The generator gallery's content: which canned shapes are offered as
 * generators, in which order, and the parameters they open with.
 *
 * Kept beside the generators rather than in the dialog so a new recipe is one
 * entry here plus its own module — the dialog does not learn about it.
 */

import type { CannedShapeParams } from '../../types/project'
import type { CannedShapeEditorRequest } from './editorRequest'
import { NAMETAG_CANNED_KIND, NAMETAG_EDITOR_REQUEST } from './nametag'
import { ORNAMENT_CANNED_KIND, ORNAMENT_EDITOR_REQUEST } from './ornament'
import { HEART_TAG_CANNED_KIND, HEART_TAG_EDITOR_REQUEST } from './heartTag'
import { MONOGRAM_CANNED_KIND, MONOGRAM_EDITOR_REQUEST } from './monogram'

export interface GeneratorCatalogEntry {
  kind: string
  request: CannedShapeEditorRequest
  /** Opening values, in millimetres for the length fields. */
  defaults: CannedShapeParams
}

export const GENERATOR_CATALOG: readonly GeneratorCatalogEntry[] = [
  {
    kind: NAMETAG_CANNED_KIND,
    request: NAMETAG_EDITOR_REQUEST,
    defaults: { text: 'NAME', size: 12, padding: 5, hole: 4 },
  },
  {
    kind: ORNAMENT_CANNED_KIND,
    request: ORNAMENT_EDITOR_REQUEST,
    defaults: { text: 'NAME', size: 6, radius: 30 },
  },
  {
    kind: HEART_TAG_CANNED_KIND,
    request: HEART_TAG_EDITOR_REQUEST,
    defaults: { text: 'NAME', size: 12, padding: 6, hole: 5 },
  },
  {
    kind: MONOGRAM_CANNED_KIND,
    request: MONOGRAM_EDITOR_REQUEST,
    defaults: { text: 'Family', year: 2026, size: 10, padding: 8 },
  },
]
