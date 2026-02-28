# README: backend/wait_times/density_field.py

## File Purpose
This file converts dining wait-time histories into estimated people counts and then into a continuous spatial density field.

## Why This File Exists
Dining data arrives as time-indexed queue durations, not headcounts. This model translates queue pressure into occupancy-like estimates so dining activity can be merged with class-derived demand.

## Key Responsibilities
1. Load CSV wait-time tables for each configured dining location.
2. Normalize time labels to map slots.
3. Compute baseline waits using robust statistics (quartile-based fallback).
4. Convert wait minutes → estimated people with location-specific capacity limits and meal-period multipliers.
5. Generate Gaussian-spread density field in people units.

## Interactions With Other Files
- Reads:
  - `backend/wait_times/wt_chick_fil_a.csv`
  - `backend/wait_times/wt_harper.csv`
  - `backend/wait_times/wt_qdoba.csv`
  - `backend/wait_times/wt_slims.csv`
  - `backend/wait_times/wt_starbucks.csv`
- Combined with class model output by `backend/create_combined_heatmap_gif.py`
- Visual semantics match frontend heatmap rendering expectations in `frontend/components/map/heatmap-layer.tsx`

## Important Design Choices
- `peak_power` is effectively locked to `1.0` to preserve people-unit interpretation.
- Site multipliers allow local calibration differences across venues.
- Meal multipliers encode realistic diurnal demand structure (breakfast/lunch/dinner patterns).

## What Is Cool Here
- It converts a noisy, indirect signal (wait time) into a bounded people estimate using interpretable assumptions.
- It avoids overfitting by using simple nonlinear transforms and explicit caps instead of opaque black-box modeling.

## Editing Risks
- Capacity/site multiplier tweaks can overwhelm all other sources if set aggressively.
- Overly broad spread values can make hotspots too diffuse and visually uninformative.
- Weak baseline logic causes unstable behavior in low-data intervals.

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
