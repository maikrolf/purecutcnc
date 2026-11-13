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
 * The desktop toolbar's way into the generator gallery.
 *
 * The gallery is not a drawing tool, so it sits beside the creation block
 * rather than inside the shape drawer. The tablet rail has its own entry in
 * `components/layout/ToolRail.tsx`; both mount the same dialog.
 */

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../../Icon'
import { useI18n } from '../../../i18n/i18nContext'
import { GeneratorGalleryDialog } from '../../generators/GeneratorGalleryDialog'
import { ToolbarAction } from './primitives'

export function GeneratorActions({ tooltipSide }: { tooltipSide?: 'bottom' | 'right' }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const label = t('appShell.toolRail.generators')

  return (
    <>
      <ToolbarAction label={label} tooltipSide={tooltipSide}>
        <button
          type="button"
          className="toolbar-icon-btn"
          aria-label={label}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          <Icon id="composite" />
        </button>
      </ToolbarAction>
      {open && typeof document !== 'undefined'
        ? createPortal(<GeneratorGalleryDialog onClose={() => setOpen(false)} />, document.body)
        : null}
    </>
  )
}
