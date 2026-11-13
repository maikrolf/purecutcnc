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
 * The generator gallery: pick a recipe, fill its fields, add it to the sketch.
 *
 * A generator is a canned shape, so this dialog does the same thing the
 * one-shot creation commands do — it validates the parameters through the
 * generator's own `normalizeParams` and hands the frame to
 * `addCannedShapeFeature`. Everything after insertion (editing, CAM, export) is
 * the ordinary feature path; the dialog owns no geometry.
 *
 * Insertion is at the stock centre, not at a click: the feature is a finished
 * design the user then moves, which keeps creation out of the canvas
 * placement machine.
 */

import { useState } from 'react'
import { useProjectStore } from '../../store/projectStore'
import { addCannedShapeFeature } from '../../store/helpers/cannedShapeCreation'
import { translateMatrix } from '../../store/helpers/instanceTransforms'
import { cannedShapeFrame } from '../../cannedShapes'
import { GENERATOR_CATALOG } from '../../cannedShapes/generators/catalog'
import { editorInitialValues, editorNormalizedParams } from '../../cannedShapes/generators/editorForm'
import { getStockBounds, type CannedShapeParams } from '../../types/project'
import { useI18n } from '../../i18n/i18nContext'
import type { MessageKey } from '../../i18n/locales/en'

interface GeneratorGalleryDialogProps {
  onClose: () => void
}

/** Opening values, converted to the project's unit. */
function openingValues(kind: string, units: 'mm' | 'inch'): Record<string, string> {
  const entry = GENERATOR_CATALOG.find((candidate) => candidate.kind === kind)
  if (!entry) return {}
  const scale = units === 'inch' ? 1 / 25.4 : 1
  const scaled: CannedShapeParams = {}
  for (const [key, value] of Object.entries(entry.defaults)) {
    scaled[key] = typeof value === 'number' ? Math.round(value * scale * 1000) / 1000 : value
  }
  return editorInitialValues(entry.request, scaled)
}

export function GeneratorGalleryDialog({ onClose }: GeneratorGalleryDialogProps) {
  const { t } = useI18n()
  const units = useProjectStore((state) => state.project.meta.units)
  const [kind, setKind] = useState(GENERATOR_CATALOG[0].kind)
  const [values, setValues] = useState<Record<string, string>>(() => openingValues(GENERATOR_CATALOG[0].kind, units))
  const entry = GENERATOR_CATALOG.find((candidate) => candidate.kind === kind) ?? GENERATOR_CATALOG[0]
  const params = editorNormalizedParams(entry.request, values)

  function selectKind(nextKind: string): void {
    setKind(nextKind)
    setValues(openingValues(nextKind, units))
  }

  function add(): void {
    if (!params) return
    const state = useProjectStore.getState()
    const frame = cannedShapeFrame({ kind, params })
    if (!frame) return
    const stock = getStockBounds(state.project.stock)
    const centre = { x: (stock.minX + stock.maxX) / 2, y: (stock.minY + stock.maxY) / 2 }
    const baseName = t(entry.request.labelKey as MessageKey)
    const taken = new Set(state.project.features.map((feature) => feature.name))
    let name = baseName
    for (let index = 2; taken.has(name); index += 1) name = `${baseName} ${index}`
    addCannedShapeFeature(state, name, { kind, params }, frame, translateMatrix(centre.x, centre.y), 0)
    onClose()
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog dialog--import dialog--no-clip"
        role="dialog"
        aria-modal="true"
        aria-label={t('dialogs.generators.title')}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <h2 className="dialog-title">{t('dialogs.generators.title')}</h2>
          <button className="dialog-close" onClick={onClose} aria-label={t('dialogs.common.close')} type="button">
            ×
          </button>
        </div>

        <div className="dialog-body dialog-body--import">
          <div className="dialog-section">
            <div className="dialog-section-group">
              <label className="dialog-section-title">{t('dialogs.generators.choose')}</label>
              <div className="dialog-generator-list">
                {GENERATOR_CATALOG.map((candidate) => (
                  <button
                    key={candidate.kind}
                    type="button"
                    className={`feat-btn${candidate.kind === kind ? ' feat-btn--active' : ''}`}
                    aria-pressed={candidate.kind === kind}
                    onClick={() => selectKind(candidate.kind)}
                  >
                    {t(candidate.request.labelKey as MessageKey)}
                  </button>
                ))}
              </div>
            </div>

            {entry.request.fields.map((field) => (
              <div className="dialog-section-group" key={field.key}>
                <label className="dialog-section-title" htmlFor={`generator-field-${field.key}`}>
                  {t(field.labelKey)}
                </label>
                <div className="properties-field">
                  <input
                    id={`generator-field-${field.key}`}
                    className="properties-input"
                    type="text"
                    inputMode={field.kind === 'text' ? undefined : field.integer ? 'numeric' : 'decimal'}
                    value={values[field.key] ?? ''}
                    onChange={(event) => {
                      const next = event.currentTarget.value
                      setValues((current) => ({ ...current, [field.key]: next }))
                    }}
                  />
                </div>
              </div>
            ))}

            {params === null ? (
              <div className="cam-field-message" role="alert">
                {t('dialogs.generators.invalid')}
              </div>
            ) : null}
          </div>
        </div>

        <div className="dialog-footer">
          <button className="feat-btn" type="button" onClick={onClose}>
            {t('dialogs.common.cancel')}
          </button>
          <button className="feat-btn" type="button" onClick={add} disabled={params === null}>
            {t('dialogs.generators.add')}
          </button>
        </div>
      </div>
    </div>
  )
}
