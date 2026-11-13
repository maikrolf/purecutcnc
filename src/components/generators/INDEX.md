# components/generators

The generator gallery: the one place that offers a finished parametric recipe
(name tag, ornament) as a single insert action.

- `GeneratorGalleryDialog.tsx` - pick a recipe from `cannedShapes/generators/catalog.ts`,
  fill its fields, and insert it. It validates through the generator's own
  `normalizeParams`, places the result at the stock centre through
  `addCannedShapeFeature`, and owns no geometry: after insertion the feature is
  an ordinary canned shape, so Properties, CAM and SVG export already work.
  The rail button that opens it lives in `components/layout/ToolRail.tsx`, and the
  desktop toolbar's entry is `components/layout/toolbar/GeneratorActions.tsx`.
