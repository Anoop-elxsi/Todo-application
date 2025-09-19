# Todo List SPA (React)

A simple, responsive Todo List SPA built with React. All data persists to Local Storage and works fully offline via a lightweight service worker. The app is accessible (keyboard navigation, ARIA labels, proper focus) and ready for Cypress e2e testing.

## Features
- Add, edit (inline), delete, and toggle complete
- Filter: All / Active / Completed
- Clear completed
- Local Storage persistence (no backend)
- Accessible and responsive
- Offline-first (service worker)
- Cypress setup included

## Scripts
- npm start
- npm run build
- npm test

## Cypress
- npx cypress open
- npx cypress run

## Notes
- Theme preference is saved in localStorage ("theme").
- Todos are saved under localStorage key "todos@v1".
