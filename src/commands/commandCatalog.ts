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
 * Static metadata for the commands the app exposes outside its toolbars.
 *
 * This module is deliberately pure data: no React, no i18n runtime, no store.
 * `useAppCommands` joins these entries with the existing descriptors by id, and
 * `scripts/generate-command-catalog.mts` serializes the same list for the
 * standalone MCP package. Labels are representative English strings; the app
 * keeps using descriptor labels where they depend on context (dirty state,
 * creation target, active tool).
 */

import type { CommandEffect, CommandGroup } from './commandRegistry'

export interface CommandCatalogEntry {
  /** Stable, namespaced identifier, e.g. `file.undo` or `create.rect`. */
  readonly id: string
  /**
   * Base i18n key for the command label. Parameterized labels (for example
   * `sketch.creation.addShape`) use `{ target }` / `{ shape }` placeholders, so
   * `label` is the representative English rendering for MCP clients.
   */
  readonly labelKey: string
  /** Representative English label, also used by the MCP command catalog. */
  readonly label: string
  readonly group: CommandGroup
  /** Extra search terms that are not part of the visible label. */
  readonly keywords: readonly string[]
  /** Display-only shortcut hint; execution stays with the owning UI. */
  readonly shortcut?: string
  readonly effect: CommandEffect
}

export const COMMAND_CATALOG = [
  // File
  {
    id: 'file.newProject',
    labelKey: 'file.newProject',
    label: 'New project',
    group: 'file',
    keywords: ['newProject', 'new'],
    effect: 'destructive',
  },
  {
    id: 'file.openProject',
    labelKey: 'file.openProject',
    label: 'Open project',
    group: 'file',
    keywords: ['openProject', 'open'],
    effect: 'destructive',
  },
  {
    id: 'file.importGeometry',
    labelKey: 'file.importGeometry',
    label: 'Import geometry',
    group: 'file',
    keywords: ['importGeometry', 'import'],
    effect: 'edit',
  },
  {
    id: 'file.exportModel',
    labelKey: 'file.exportModel',
    label: 'Export model',
    group: 'file',
    keywords: ['exportModel', 'export'],
    effect: 'read',
  },
  {
    id: 'file.printDesign',
    labelKey: 'file.printDesign',
    label: 'Print design',
    group: 'file',
    keywords: ['printDesign', 'print'],
    shortcut: 'Ctrl/Cmd+P',
    effect: 'read',
  },
  {
    id: 'file.saveProject',
    labelKey: 'file.saveProject',
    label: 'Save project',
    group: 'file',
    keywords: ['saveProject', 'save'],
    effect: 'edit',
  },
  {
    id: 'file.undo',
    labelKey: 'file.undo',
    label: 'Undo',
    group: 'file',
    keywords: ['undo', 'undo'],
    shortcut: 'Ctrl/Cmd+Z',
    effect: 'edit',
  },
  {
    id: 'file.redo',
    labelKey: 'file.redo',
    label: 'Redo',
    group: 'file',
    keywords: ['redo', 'redo'],
    shortcut: 'Ctrl/Cmd+Shift+Z',
    effect: 'edit',
  },

  // Sketch transforms
  {
    id: 'sketch.transform.copy',
    labelKey: 'sketch.transform.copy',
    label: 'Copy selected features',
    group: 'sketch',
    keywords: ['copy', 'copy'],
    effect: 'edit',
  },
  {
    id: 'sketch.transform.move',
    labelKey: 'sketch.transform.move',
    label: 'Move selected features',
    group: 'sketch',
    keywords: ['move', 'move'],
    effect: 'edit',
  },
  {
    id: 'sketch.transform.delete',
    labelKey: 'sketch.transform.delete',
    label: 'Delete selected features',
    group: 'sketch',
    keywords: ['delete', 'trash'],
    effect: 'destructive',
  },
  {
    id: 'sketch.transform.resize',
    labelKey: 'sketch.transform.resize',
    label: 'Resize selected features',
    group: 'sketch',
    keywords: ['resize', 'resize'],
    effect: 'edit',
  },
  {
    id: 'sketch.transform.rotate',
    labelKey: 'sketch.transform.rotate',
    label: 'Rotate selected features',
    group: 'sketch',
    keywords: ['rotate', 'rotate'],
    effect: 'edit',
  },
  {
    id: 'sketch.transform.mirror',
    labelKey: 'sketch.transform.mirror',
    label: 'Mirror selected features',
    group: 'sketch',
    keywords: ['mirror', 'mirror'],
    effect: 'edit',
  },

  // Sketch booleans
  {
    id: 'sketch.boolean.join',
    labelKey: 'sketch.boolean.join',
    label: 'Join closed features',
    group: 'sketch',
    keywords: ['join', 'merge'],
    effect: 'edit',
  },
  {
    id: 'sketch.boolean.cut',
    labelKey: 'sketch.boolean.cut',
    label: 'Cut features',
    group: 'sketch',
    keywords: ['cut', 'cut'],
    effect: 'edit',
  },
  {
    id: 'sketch.boolean.offset',
    labelKey: 'sketch.boolean.offset',
    label: 'Create offset feature',
    group: 'sketch',
    keywords: ['offset', 'offset'],
    effect: 'edit',
  },

  // Sketch-edit tools
  {
    id: 'sketch.edit.add_point',
    labelKey: 'sketch.edit.addPoint',
    label: 'Add point',
    group: 'sketch',
    keywords: ['add_point', 'point-add'],
    effect: 'edit',
  },
  {
    id: 'sketch.edit.delete_point',
    labelKey: 'sketch.edit.deletePoint',
    label: 'Delete point',
    group: 'sketch',
    keywords: ['delete_point', 'point-delete'],
    effect: 'edit',
  },
  {
    id: 'sketch.edit.delete_segment',
    labelKey: 'sketch.edit.deleteSegment',
    label: 'Delete segment',
    group: 'sketch',
    keywords: ['delete_segment', 'segment-delete'],
    effect: 'edit',
  },
  {
    id: 'sketch.edit.disconnect',
    labelKey: 'sketch.edit.disconnect',
    label: 'Disconnect point',
    group: 'sketch',
    keywords: ['disconnect', 'disconnect'],
    effect: 'edit',
  },
  {
    id: 'sketch.edit.fillet',
    labelKey: 'sketch.edit.fillet',
    label: 'Round corner / fillet',
    group: 'sketch',
    keywords: ['fillet', 'fillet'],
    effect: 'edit',
  },
  {
    id: 'sketch.edit.chamfer',
    labelKey: 'sketch.edit.chamfer',
    label: 'Chamfer corner',
    group: 'sketch',
    keywords: ['chamfer', 'chamfer'],
    effect: 'edit',
  },
  {
    id: 'sketch.edit.trim',
    labelKey: 'sketch.edit.trim',
    label: 'Trim to cutting edge',
    group: 'sketch',
    keywords: ['trim', 'trim'],
    effect: 'edit',
  },
  {
    id: 'sketch.edit.extend',
    labelKey: 'sketch.edit.extend',
    label: 'Extend to target',
    group: 'sketch',
    keywords: ['extend', 'extend'],
    effect: 'edit',
  },

  // Constraints and dimensions
  {
    id: 'sketch.constraint.add',
    labelKey: 'sketch.constraint.add',
    label: 'Add constraint',
    group: 'sketch',
    keywords: ['constraint', 'dimension', 'lock'],
    effect: 'edit',
  },
  {
    id: 'sketch.dimension.tapeMeasure',
    labelKey: 'shell.measure.tapeMeasure',
    label: 'Tape measure',
    group: 'sketch',
    keywords: ['measure', 'distance', 'tape'],
    effect: 'read',
  },
  {
    id: 'sketch.dimension.delete',
    labelKey: 'shell.measure.deleteDimension',
    label: 'Delete dimension',
    group: 'sketch',
    keywords: ['measure', 'remove', 'annotation'],
    effect: 'destructive',
  },
  {
    id: 'sketch.dimension.toggle',
    labelKey: 'shell.measure.showHideDimensions',
    label: 'Show/hide dimensions',
    group: 'sketch',
    keywords: ['measure', 'show', 'hide', 'annotations'],
    effect: 'edit',
  },

  // Creation shapes
  {
    id: 'create.rect',
    labelKey: 'sketch.creation.addShape',
    label: 'Add rectangle',
    group: 'create',
    keywords: ['rect', 'rect', 'rectangle'],
    effect: 'edit',
  },
  {
    id: 'create.circle',
    labelKey: 'sketch.creation.addShape',
    label: 'Add circle',
    group: 'create',
    keywords: ['circle', 'circle', 'circle'],
    effect: 'edit',
  },
  {
    id: 'create.ellipse',
    labelKey: 'sketch.creation.addShape',
    label: 'Add ellipse',
    group: 'create',
    keywords: ['ellipse', 'ellipse', 'ellipse'],
    effect: 'edit',
  },
  {
    id: 'create.polygon',
    labelKey: 'sketch.creation.addShape',
    label: 'Add polygon',
    group: 'create',
    keywords: ['polygon', 'polygon', 'polygon'],
    effect: 'edit',
  },
  {
    id: 'create.spline',
    labelKey: 'sketch.creation.addShape',
    label: 'Add spline',
    group: 'create',
    keywords: ['spline', 'spline', 'spline'],
    effect: 'edit',
  },
  {
    id: 'create.composite',
    labelKey: 'sketch.creation.addShape',
    label: 'Add composite shape',
    group: 'create',
    keywords: ['composite', 'composite', 'composite'],
    effect: 'edit',
  },
  {
    id: 'create.text',
    labelKey: 'sketch.creation.addShape',
    label: 'Add text',
    group: 'create',
    keywords: ['text', 'text', 'text'],
    effect: 'edit',
  },
  {
    id: 'create.slot',
    labelKey: 'sketch.creation.addShape',
    label: 'Add slot',
    group: 'create',
    keywords: ['slot', 'slot', 'slot'],
    effect: 'edit',
  },
  {
    id: 'create.ngon',
    labelKey: 'sketch.creation.addShape',
    label: 'Add regular polygon',
    group: 'create',
    keywords: ['ngon', 'ngon', 'regular polygon'],
    effect: 'edit',
  },
  {
    id: 'create.gear',
    labelKey: 'sketch.creation.addShape',
    label: 'Add gear',
    group: 'create',
    keywords: ['gear', 'gear', 'gear'],
    effect: 'edit',
  },
  {
    id: 'create.roundrect',
    labelKey: 'sketch.creation.addShape',
    label: 'Add rounded rectangle',
    group: 'create',
    keywords: ['roundrect', 'roundrect', 'rounded rectangle'],
    effect: 'edit',
  },
  {
    id: 'create.chamferrect',
    labelKey: 'sketch.creation.addShape',
    label: 'Add chamfered rectangle',
    group: 'create',
    keywords: ['chamferrect', 'chamferrect', 'chamfered rectangle'],
    effect: 'edit',
  },

  // View
  {
    id: 'view.zoomToModel',
    labelKey: 'shell.topBar.zoomToModel',
    label: 'Zoom to model',
    group: 'view',
    keywords: ['zoom', 'fit', 'frame', 'model'],
    effect: 'read',
  },
] as const satisfies readonly CommandCatalogEntry[]

export type CommandId = typeof COMMAND_CATALOG[number]['id']

const COMMAND_CATALOG_BY_ID = new Map<string, CommandCatalogEntry>(
  COMMAND_CATALOG.map((entry) => [entry.id, entry]),
)

/**
 * Return the catalog entry for a command id. A missing id means the UI grew a
 * command without updating the shared contract, so fail loudly instead of
 * silently dropping metadata.
 */
export function getCommandCatalogEntry(id: string): CommandCatalogEntry {
  const entry = COMMAND_CATALOG_BY_ID.get(id)
  if (!entry) {
    throw new Error(`Command missing from catalog: ${id}`)
  }
  return entry
}
