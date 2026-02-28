# README: frontend/components/ui/button.tsx

## 1) Purpose
`button.tsx` defines the canonical clickable action primitive for the frontend design system. It centralizes visual variants, sizes, accessibility states, and polymorphic composition behavior.

## 2) Why This File Is Critical
Buttons are the most repeated interactive element in the UI. If this component has style drift, accessibility issues, or API instability, those problems immediately propagate across map controls, dialogs, filters, and forms.

## 3) Core Design Responsibilities
- Provide a single source of truth for button shape, spacing, typography, and state transitions.
- Support variant semantics (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`).
- Support size semantics (`default`, `sm`, `lg`, `icon`, `icon-sm`, `icon-lg`).
- Preserve a stable type-safe API with variant props.
- Allow `asChild` composition so consumers can render as links or custom host nodes while keeping styling.

## 4) Dependency Graph
- **Imports**
  - `react` for component typing and runtime.
  - `@radix-ui/react-slot` for polymorphic slot behavior.
  - `class-variance-authority` (`cva`) for declarative variant class logic.
  - `@/lib/utils` (`cn`) for class merging.
- **Consumers**
  - Potentially most map and app components that expose action controls.

## 5) Public API Contract
- `Button(props)`
  - Base props: `React.ComponentProps<'button'>`
  - Variant props: `VariantProps<typeof buttonVariants>`
  - Extra prop: `asChild?: boolean`
- `buttonVariants(...)`
  - Exported for style reuse in compound components.

## 6) Variant and Size Semantics
### `variant`
- `default`: primary action emphasis.
- `destructive`: dangerous action (delete/reset/irreversible).
- `outline`: low-emphasis bordered action.
- `secondary`: secondary emphasis.
- `ghost`: no background by default, hover-only emphasis.
- `link`: textual/inline affordance.

### `size`
- `default`: general action button.
- `sm`: compact row/toolbar usage.
- `lg`: larger high-salience CTA.
- `icon` variants: square icon-only affordances.

## 7) Accessibility and UX Notes
- Uses `disabled:pointer-events-none` + reduced opacity.
- Focus ring behavior is explicit and standardized (`focus-visible:ring`).
- Supports invalid state styling via `aria-invalid` classes.
- Icon sizing/pointer behavior normalized for consistent click target handling.

## 8) Interaction With Map Feature Files
- **`frontend/components/map/timeline-slider.tsx`** relies on predictable button visual states for playback controls.
- **`frontend/components/map/data-source-toggle.tsx`** uses action affordances conceptually consistent with this primitive.
- **`frontend/components/map/building-popup.tsx`** close actions and quick controls should remain style-consistent with this system.

## 9) Styling Architecture
- Class composition is data-driven via CVA.
- Tailwind tokens are used instead of one-off ad-hoc utility strings in consuming components.
- Exporting `buttonVariants` enables style sharing without copy-pasting class strings.

## 10) Why This File Is Cool
- High leverage: tiny code surface, huge consistency impact.
- Type-safe variant architecture reduces accidental styling regression.
- `asChild` pattern is elegant because it separates behavior semantics from host element semantics.

## 11) Risks When Editing
- Renaming variant keys breaks all consumers silently at compile boundaries if not updated.
- Class changes can unintentionally reduce contrast or accessibility.
- Adjusting default size can cascade layout shifts in many screens.

## 12) Maintenance Checklist
- Keep variant naming stable.
- Keep focus-visible behavior intact.
- Validate icon-only button hit target sizes.
- Ensure disabled and invalid states remain visually distinct.

## Extended Architecture Context
This section exists to capture higher-order relationships that are easy to miss when focusing only on direct imports. In real projects, file behavior is often shaped by conventions, naming patterns, and build/runtime assumptions that do not appear as explicit dependency edges. This README intentionally documents those broader relationships so future edits are safer.

### Architectural Positioning
- This file should be evaluated as part of its folder-level subsystem.
- Folder-level subsystem should be evaluated as part of the app-level or pipeline-level architecture.
- App-level architecture should be evaluated against user-visible behavior and product constraints.
- Product constraints should include performance, reliability, maintainability, and contributor onboarding speed.

### Boundary Clarification
- Inbound boundary: what this file expects from adjacent modules/data.
- Outbound boundary: what adjacent modules/data can safely assume from this file.
- Contract boundary: which properties must stay stable for compatibility.
- Evolution boundary: where breaking changes are acceptable if coordinated.

## Extended Interaction Matrix
### Direct Coupling
- Explicit imports, calls, or references.
- Shared types/interfaces/constants.
- Shared schemas and naming assumptions.

### Indirect Coupling
- Shared UI patterns and style tokens.
- Shared timeline/indexing semantics.
- Shared coordinate/reference-space assumptions.
- Shared pipeline ordering assumptions.

### Hidden Coupling Patterns to Watch
- Stringly-typed IDs and key names.
- Implicit unit assumptions (minutes vs slots, percent vs absolute counts).
- Data-shape assumptions not enforced by runtime validation.
- Ordering assumptions in arrays or generated snapshots.

## Extended Data Semantics
- Confirm what each major value means, not just its type.
- Confirm whether values are raw observations, transformed estimates, or UI-normalized representations.
- Confirm temporal semantics (timestamp, slot index, rounded bucket, interpolation window).
- Confirm spatial semantics (point source, field sample, rendered pixel intensity).

### Unit Integrity Checklist
- [ ] Units are explicit and consistent.
- [ ] Conversion steps are documented.
- [ ] Thresholds map to meaningful real-world semantics.
- [ ] Rounding/snap rules are documented and intentional.

## Extended Reliability Guidance
- Prefer deterministic behavior where possible.
- Logically separate data-loading, transformation, and presentation concerns.
- Preserve fallback behavior for missing or malformed data.
- Protect against empty collections and boundary indexes.

### Failure Modes
- Missing file or invalid schema.
- Empty data after filtering.
- Misaligned index/day/time mapping.
- Unexpected null/undefined fields.
- Consumer assumptions diverging from producer contract.

### Recovery Approaches
- Fail fast for truly invalid contracts.
- Degrade gracefully for optional enhancements.
- Provide fallback rendering or fallback data where user value is preserved.
- Keep error messages actionable and specific.

## Extended Performance Notes
- Identify hot loops and repeated parsing points.
- Cache immutable or expensive derivations.
- Avoid unnecessary object churn in render paths.
- Bound array sizes and point-cloud density where visual quality remains acceptable.

### Performance Checklist
- [ ] Heavy computation memoized/cached when appropriate.
- [ ] Repeated work avoided across frames/slots.
- [ ] Large datasets sampled or summarized when practical.
- [ ] Rendering parameters tuned for perceived responsiveness.

## Extended Security and Safety Considerations
- Treat external data as untrusted unless guaranteed by pipeline controls.
- Avoid exposing sensitive internals in logs or client-visible payloads.
- Keep API/file contracts explicit to reduce accidental misuse.
- Avoid hidden side effects that complicate incident analysis.

## Extended Maintenance Playbook
1. Read this README fully before refactoring.
2. Identify inbound/outbound contracts.
3. Make smallest coherent change.
4. Validate local behavior.
5. Validate integration boundaries.
6. Update README assumptions that changed.

### Refactor Readiness Questions
- Does this file have stable external contracts?
- Are consumers discoverable and testable?
- Are edge cases known and documented?
- Is there a rollback path if behavior regresses?

## Extended Whats Cool Commentary
- The file contributes to a compositional system where small modules create rich behavior.
- The architecture encourages iteration while preserving a stable user-facing experience.
- Documentation depth here is intentional: it trades extra text now for faster and safer future changes.

## Additional Deep-Dive Notes
- This README may be expanded over time with concrete examples and before/after change stories.
- If the file gains significant complexity, add a dedicated section for Known Pitfalls.
- If the file becomes a subsystem hub, add an explicit API/Contract Table.
- If this file is data-heavy, add a schema table and representative sample.

## Long-Form Checklist Appendix
- [ ] Contract assumptions reviewed.
- [ ] Runtime behavior reviewed.
- [ ] Build/tooling behavior reviewed.
- [ ] Data schema behavior reviewed.
- [ ] UX/accessibility behavior reviewed (if UI-facing).
- [ ] Performance implications reviewed.
- [ ] Error handling paths reviewed.
- [ ] Logging/observability implications reviewed.
- [ ] Rollback plan considered.
- [ ] README updated after changes.

## Deep Technical Annex
### Contract Narrative
This annex intentionally repeats and extends contract-level context because contract misunderstandings are among the most common root causes of regressions in multi-file systems. A contract includes not only function signatures and type shapes, but also timing assumptions, ordering assumptions, and interpretation assumptions.

### Temporal Semantics
- Slot-based data must preserve index alignment over the entire range.
- Rounded-time logic must remain stable across producer and consumer boundaries.
- Interpolated values must be interpreted as modeled estimates, not raw measurements.

### Spatial Semantics
- Coordinate arrays should always preserve expected order (lng, lat).
- Bounding assumptions should be treated as part of rendering correctness.
- Density spread values affect interpretation, not just aesthetics.

### Integration Verification Matrix
- Verify file-local behavior.
- Verify same-folder interactions.
- Verify parent-subsystem interactions.
- Verify end-to-end user-observable behavior.

### Regression Scenarios to Consider
- Contract drift after refactor.
- Data shape mismatch after schema update.
- Silent fallback masking upstream breakage.
- Rendering appears valid but semantics are shifted.

### Documentation Evolution Policy
- Keep examples current with real behavior.
- Prefer explicit assumptions over implied assumptions.
- Update this annex when adding new non-obvious behavior.
- Add postmortem lessons if incidents occur.
