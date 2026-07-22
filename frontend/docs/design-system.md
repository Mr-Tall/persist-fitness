# Persist Fitness design system

Persist Fitness uses a black-first, monochrome interface. Components should use the semantic Tailwind tokens defined in `src/app/globals.css`; raw palette utilities are reserved for exceptional, documented cases.

## Foundations

- **Canvas:** `canvas` is the application background.
- **Surfaces:** `surface` is the default content surface; `surface-elevated` is for selected, floating, or higher-emphasis surfaces. Use `border` and `border-strong` to express hierarchy without color.
- **Typography:** `text-primary` is for headings and essential values, `text-secondary` for supporting copy and labels, and `text-muted` for tertiary metadata.
- **Actions:** `action` with `action-foreground` is the primary monochrome action. `action-secondary` is for secondary and selected controls. `action-hover` is the primary hover treatment.
- **Focus:** use `focus` for keyboard focus rings. Focus is an interaction state, never a success state.

## Semantic color

- **Success:** `success` and `success-soft` communicate completed work, confirmed saves, personal records, and genuinely positive metrics. Do not use success green for branding, navigation, selection, generic actions, focus, or hover.
- **Danger:** `danger` and `danger-soft` communicate destructive actions and errors only.
- **Warning:** `warning` and `warning-soft` communicate warnings, recovery states, and timers. They are not achievement colors.
- **Information:** `info` and `info-soft` communicate neutral informational data and future intelligence-oriented experiences. They should not imply success.

Categorical exercise metadata and ordinary metrics remain monochrome unless the color communicates one of the meanings above.

## Compatibility aliases

The legacy emerald Tailwind palette currently resolves to monochrome values so older branches and external call sites do not regress visually. New code must not use emerald utilities.

`Card` keeps `variant="emerald"` as a temporary compatibility alias for the neutral `variant="elevated"`, preserving its post-migration appearance. `MetricBadge` keeps `emerald`, `amber`, and `red` as temporary aliases for `success`, `warning`, and `danger`. Existing consumers remain compatible, but all new and maintained call sites should use the semantic variant names.

Remove these aliases and the legacy emerald palette only after a repository-wide compatibility check confirms no remaining consumers.
