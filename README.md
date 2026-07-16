# Difference Finder Web

An interactive, privacy-first JSON and YAML comparison tool. It transforms the original command-line learning project into a polished browser product for exploring structured data changes.

## Highlights

- Smart recursive diff with added, removed, changed, and unchanged states
- JSON and YAML parsing with automatic format detection
- Tree and side-by-side views
- Search, changes-only filtering, file import, and report export
- Responsive, accessible interface
- All processing happens locally in the browser
- Unit-tested comparison engine and automated GitHub Pages deployment

## Local development

```bash
npm install
npm run dev
```

Run the quality checks:

```bash
npm test
npm run build
```

## Stack

React, TypeScript, Vite, Vitest, js-yaml, GitHub Actions, and GitHub Pages.

## Live demo

[Open Difference Finder](https://f1nsky.github.io/difference-finder-web/)
