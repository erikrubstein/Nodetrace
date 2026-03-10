# PhotoMap

PhotoMap is a web app for organizing hierarchical inspection photos across multiple projects. Each project starts with a root folder and can contain nested folders and photos, with optional notes and tags on every node.

## What it does

- Stores multiple projects in one app.
- Uses a root folder for each project.
- Lets you add folders and upload photos beneath any folder.
- Shows the structure as both a tree and a large connected map.
- Supports notes, tags, node moves, and subtree deletion.
- Persists hierarchy data in SQLite and saves image files locally.

## Stack

- React + Vite frontend
- Express backend API
- SQLite via `better-sqlite3`
- Local file storage under `data/uploads`

## Run in development

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies API/file requests to the backend on `http://localhost:3001`.

## Run as a built app

```bash
npm run build
npm start
```

The Express server will serve both the API and the built frontend.

## Data storage

- Database: `data/photomap.db`
- Uploaded images: `data/uploads/<project-id>/...`

The `data/` directory is ignored by git so project content stays local unless you back it up separately.
