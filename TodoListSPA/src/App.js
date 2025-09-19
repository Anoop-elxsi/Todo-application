import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

/**
 * Utilities: Local Storage helpers with namespacing and safe JSON parsing
 */
const STORAGE_KEY = 'todos@v1';

// PUBLIC_INTERFACE
export function loadTodos() {
  /** Load todos from Local Storage safely. */
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

// PUBLIC_INTERFACE
export function saveTodos(todos) {
  /** Persist todos to Local Storage. */
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // no-op for quota or private mode
  }
}

/**
 * Types
 * @typedef {{ id: string, title: string, completed: boolean, createdAt: number }} Todo
 */

/**
 * Hook: manage todos with Local Storage persistence
 */
function useTodos() {
  const [todos, setTodos] = useState(() => loadTodos());
  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  // PUBLIC_INTERFACE
  const addTodo = (title) => {
    /** Add a new todo with generated id and timestamp. */
    const trimmed = title.trim();
    if (!trimmed) return;
    setTodos((prev) => [
      ...prev,
      { id: crypto.randomUUID?.() || String(Date.now()), title: trimmed, completed: false, createdAt: Date.now() },
    ]);
  };

  // PUBLIC_INTERFACE
  const deleteTodo = (id) => {
    /** Remove todo by id. */
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  // PUBLIC_INTERFACE
  const toggleTodo = (id) => {
    /** Toggle completion state by id. */
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  // PUBLIC_INTERFACE
  const updateTodo = (id, title) => {
    /** Update title of a todo by id. */
    const trimmed = title.trim();
    if (!trimmed) return;
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, title: trimmed } : t)));
  };

  // PUBLIC_INTERFACE
  const clearCompleted = () => {
    /** Remove all completed todos. */
    setTodos((prev) => prev.filter((t) => !t.completed));
  };

  return { todos, addTodo, deleteTodo, toggleTodo, updateTodo, clearCompleted };
}

/**
 * Component: Header with theme toggle (persisted in localStorage and accessible)
 */
function Header({ theme, onToggleTheme }) {
  return (
    <header className="header">
      <h1 className="app-title">Todos</h1>
      <button
        className="theme-toggle"
        onClick={onToggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
      </button>
    </header>
  );
}

/**
 * Component: Todo Input (add new task)
 */
function TodoInput({ onAdd }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(value);
    setValue('');
    inputRef.current?.focus();
  };

  return (
    <form className="todo-input" onSubmit={handleSubmit} aria-label="Add a new task">
      <label htmlFor="new-todo" className="sr-only">New Task</label>
      <input
        id="new-todo"
        ref={inputRef}
        type="text"
        placeholder="What needs to be done?"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-required="true"
      />
      <button type="submit" className="btn btn-primary" aria-label="Add task">
        Add
      </button>
    </form>
  );
}

/**
 * Component: Filters
 */
const FILTERS = {
  all: { label: 'All', predicate: () => true },
  active: { label: 'Active', predicate: (t) => !t.completed },
  completed: { label: 'Completed', predicate: (t) => t.completed },
};

function Filters({ activeFilter, setActiveFilter, remaining }) {
  return (
    <div className="filters" role="group" aria-label="Filter tasks">
      <div className="filter-buttons">
        {Object.entries(FILTERS).map(([key, cfg]) => (
          <button
            key={key}
            className={`btn btn-filter ${activeFilter === key ? 'active' : ''}`}
            onClick={() => setActiveFilter(key)}
            aria-pressed={activeFilter === key}
          >
            {cfg.label}
          </button>
        ))}
      </div>
      <span className="remaining" aria-live="polite">
        {remaining} {remaining === 1 ? 'item' : 'items'} left
      </span>
    </div>
  );
}

/**
 * Component: TodoItem with inline edit, keyboard accessible
 */
function TodoItem({ todo, onToggle, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const handleKeyDown = (e) => {
    if (editing) {
      if (e.key === 'Enter') {
        onUpdate(todo.id, draft);
        setEditing(false);
      } else if (e.key === 'Escape') {
        setDraft(todo.title);
        setEditing(false);
      }
    }
  };

  return (
    <li className="todo-item" role="listitem" aria-label={todo.title}>
      <div className="todo-main">
        <input
          id={`toggle-${todo.id}`}
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
          aria-label={`Mark "${todo.title}" as ${todo.completed ? 'active' : 'completed'}`}
        />
        {!editing ? (
          <label
            htmlFor={`toggle-${todo.id}`}
            className={`todo-title ${todo.completed ? 'completed' : ''}`}
            onDoubleClick={() => setEditing(true)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setEditing(true);
            }}
            aria-live="polite"
          >
            {todo.title}
          </label>
        ) : (
          <input
            ref={inputRef}
            className="todo-edit"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              onUpdate(todo.id, draft);
              setEditing(false);
            }}
            onKeyDown={handleKeyDown}
            aria-label={`Edit "${todo.title}"`}
          />
        )}
      </div>
      <div className="todo-actions">
        <button
          className="btn btn-ghost"
          onClick={() => setEditing((v) => !v)}
          aria-label={editing ? 'Finish editing' : `Edit "${todo.title}"`}
        >
          ✏️
        </button>
        <button
          className="btn btn-danger"
          onClick={() => onDelete(todo.id)}
          aria-label={`Delete "${todo.title}"`}
        >
          🗑️
        </button>
      </div>
    </li>
  );
}

/**
 * Component: TodoList
 */
function TodoList({ todos, onToggle, onDelete, onUpdate }) {
  if (!todos.length) {
    return (
      <div className="empty" role="status" aria-live="polite">
        No tasks to show
      </div>
    );
  }
  return (
    <ul className="todo-list" role="list" aria-label="Todo list">
      {todos.map((t) => (
        <TodoItem
          key={t.id}
          todo={t}
          onToggle={onToggle}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      ))}
    </ul>
  );
}

/**
 * Root App
 */
// PUBLIC_INTERFACE
function App() {
  /** The main Todo SPA: manages theme, todos, filtering, and layout. */
  const [theme, setTheme] = useState(() => {
    try {
      return window.localStorage.getItem('theme') || 'light';
    } catch {
      return 'light';
    }
  });
  const { todos, addTodo, deleteTodo, toggleTodo, updateTodo, clearCompleted } = useTodos();
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem('theme', theme);
    } catch {
      // no-op
    }
  }, [theme]);

  const filteredTodos = useMemo(
    () => todos.filter(FILTERS[activeFilter].predicate),
    [todos, activeFilter]
  );
  const remaining = useMemo(() => todos.filter((t) => !t.completed).length, [todos]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Try to register service worker for offline support
      // Note: CRA serves SW from public/ when referenced by path.
      navigator.serviceWorker
        .register('/service-worker.js')
        .catch(() => {
          // ignore errors in environments not supporting SW
        });
    }
  }, []);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <div className="App">
      <main className="container" role="main">
        <Header theme={theme} onToggleTheme={toggleTheme} />

        <section aria-labelledby="add-task-section" className="panel">
          <h2 id="add-task-section" className="sr-only">Add a new task</h2>
          <TodoInput onAdd={addTodo} />
        </section>

        <section aria-labelledby="list-section" className="panel">
          <h2 id="list-section" className="sr-only">Tasks</h2>
          <Filters
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            remaining={remaining}
          />
          <TodoList
            todos={filteredTodos}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onUpdate={updateTodo}
          />
        </section>

        <section className="panel footer-actions" aria-label="Bulk actions">
          <button
            className="btn btn-outline"
            onClick={clearCompleted}
            aria-label="Clear completed tasks"
          >
            Clear Completed
          </button>
        </section>
      </main>
    </div>
  );
}

export default App;
