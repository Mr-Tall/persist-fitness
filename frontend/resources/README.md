# Native asset placeholders

The generated iOS asset catalog currently contains Capacitor placeholders. At the dedicated branding milestone, place source files in an `assets/` directory and use the reviewed official Capacitor asset-generation workflow. Do not ship the placeholders to App Store review.

- App icon source: square PNG, at least 1024×1024, no transparency for App Store delivery.
- Splash source: centered neutral Persist placeholder on `#050505`, with light/dark variants if needed.

Changing these assets must not rename the application or bundle identifier before the rename milestone.
