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

import { useI18n } from '../i18n/i18nContext'
import { getCommandCatalogEntry } from './commandCatalog'
import { useCreationShapeCommands } from './creationShapes'
import { useFileCommands } from './fileCommands'
import { useSketchCommands } from './sketchCommands'
import type { CommandSpec } from './commandRegistry'

/**
 * Commands exposed outside the toolbar. The descriptors stay owned by the
 * existing hooks (file, sketch, creation); this adapter joins them with the
 * shared catalog so the palette, the generated contract and the MCP package all
 * read the same ids, groups, keywords, shortcuts and effects.
 */

export interface UseAppCommandsArgs {
  onNewProject: () => void
  onImportGeometry?: () => void
  onExportModel: () => void
  onPrintDesign?: () => void
  onRequestText?: () => void
  onZoomToModel: () => void
}

export function useAppCommands({
  onNewProject,
  onImportGeometry,
  onExportModel,
  onPrintDesign,
  onRequestText,
  onZoomToModel,
}: UseAppCommandsArgs): CommandSpec[] {
  const { t } = useI18n()

  const file = useFileCommands({
    onNewProject,
    onImportGeometry: onImportGeometry ?? (() => undefined),
    onExportModel,
    onPrintDesign: onPrintDesign ?? (() => undefined),
  })
  const sketch = useSketchCommands()
  const creation = useCreationShapeCommands({
    onRequestText: onRequestText ?? (() => undefined),
  })

  const commands: CommandSpec[] = []

  for (const descriptor of Object.values(file.commands)) {
    if (descriptor.id === 'importGeometry' && !onImportGeometry) continue
    if (descriptor.id === 'printDesign' && !onPrintDesign) continue
    const entry = getCommandCatalogEntry(`file.${descriptor.id}`)
    commands.push({
      id: entry.id,
      label: descriptor.label,
      group: entry.group,
      keywords: entry.keywords,
      shortcut: entry.shortcut,
      effect: entry.effect,
      enabled: descriptor.enabled,
      active: descriptor.active,
      run: descriptor.onActivate,
    })
  }

  for (const descriptor of Object.values(sketch.transform)) {
    const entry = getCommandCatalogEntry(`sketch.transform.${descriptor.id}`)
    commands.push({
      id: entry.id,
      label: descriptor.label,
      group: entry.group,
      keywords: entry.keywords,
      shortcut: entry.shortcut,
      effect: entry.effect,
      enabled: descriptor.enabled,
      active: descriptor.active,
      run: descriptor.onActivate,
    })
  }

  for (const descriptor of Object.values(sketch.boolean)) {
    const entry = getCommandCatalogEntry(`sketch.boolean.${descriptor.id}`)
    commands.push({
      id: entry.id,
      label: descriptor.label,
      group: entry.group,
      keywords: entry.keywords,
      shortcut: entry.shortcut,
      effect: entry.effect,
      enabled: descriptor.enabled,
      active: descriptor.active,
      run: descriptor.onActivate,
    })
  }

  for (const descriptor of Object.values(sketch.sketchEdit)) {
    const entry = getCommandCatalogEntry(`sketch.edit.${descriptor.id}`)
    commands.push({
      id: entry.id,
      label: descriptor.label,
      group: entry.group,
      keywords: entry.keywords,
      shortcut: entry.shortcut,
      effect: entry.effect,
      enabled: descriptor.enabled,
      active: descriptor.active,
      run: descriptor.onActivate,
    })
  }

  const constraint = getCommandCatalogEntry('sketch.constraint.add')
  commands.push({
    id: constraint.id,
    label: sketch.constraint.label,
    group: constraint.group,
    keywords: constraint.keywords,
    shortcut: constraint.shortcut,
    effect: constraint.effect,
    enabled: sketch.constraint.enabled,
    active: sketch.constraint.active,
    run: sketch.constraint.onActivate,
  })

  const tapeMeasure = getCommandCatalogEntry('sketch.dimension.tapeMeasure')
  commands.push({
    id: tapeMeasure.id,
    label: sketch.dimension.tapeMeasure.label,
    group: tapeMeasure.group,
    keywords: tapeMeasure.keywords,
    shortcut: tapeMeasure.shortcut,
    effect: tapeMeasure.effect,
    enabled: sketch.dimension.tapeMeasure.enabled,
    active: sketch.dimension.tapeMeasure.active,
    run: sketch.dimension.tapeMeasure.onActivate,
  })

  const deleteDimension = getCommandCatalogEntry('sketch.dimension.delete')
  commands.push({
    id: deleteDimension.id,
    label: sketch.dimension.deleteDimension.label,
    group: deleteDimension.group,
    keywords: deleteDimension.keywords,
    shortcut: deleteDimension.shortcut,
    effect: deleteDimension.effect,
    enabled: sketch.dimension.deleteDimension.enabled,
    active: sketch.dimension.deleteDimension.active,
    run: sketch.dimension.deleteDimension.onActivate,
  })

  const showDimensions = getCommandCatalogEntry('sketch.dimension.toggle')
  commands.push({
    id: showDimensions.id,
    label: sketch.dimension.showDimensions.label,
    group: showDimensions.group,
    keywords: showDimensions.keywords,
    shortcut: showDimensions.shortcut,
    effect: showDimensions.effect,
    enabled: sketch.dimension.showDimensions.enabled,
    active: sketch.dimension.showDimensions.active,
    run: sketch.dimension.showDimensions.onActivate,
  })

  for (const descriptor of creation.shapeCommands) {
    if (descriptor.id === 'text' && !onRequestText) continue
    const entry = getCommandCatalogEntry(`create.${descriptor.id}`)
    commands.push({
      id: entry.id,
      label: descriptor.label,
      group: entry.group,
      keywords: entry.keywords,
      shortcut: entry.shortcut,
      effect: entry.effect,
      enabled: descriptor.enabled,
      active: descriptor.active,
      run: descriptor.onActivate,
    })
  }

  const zoomToModel = getCommandCatalogEntry('view.zoomToModel')
  commands.push({
    id: zoomToModel.id,
    label: t('shell.topBar.zoomToModel'),
    group: zoomToModel.group,
    keywords: zoomToModel.keywords,
    shortcut: zoomToModel.shortcut,
    effect: zoomToModel.effect,
    enabled: true,
    run: onZoomToModel,
  })

  return commands
}
