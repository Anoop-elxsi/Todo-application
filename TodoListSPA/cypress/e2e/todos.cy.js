describe('Todo List SPA', () => {
  beforeEach(() => {
    cy.visit('/');
    // reset storage for deterministic tests
    cy.window().then((win) => {
      win.localStorage.clear();
    });
    cy.reload();
  });

  it('adds a todo', () => {
    cy.findByLabelText(/add a new task/i);
    cy.get('input#new-todo').type('Buy milk{enter}');
    cy.contains('li .todo-title', 'Buy milk').should('exist');
  });

  it('toggles complete', () => {
    cy.get('#new-todo').type('Task A{enter}');
    cy.contains('Task A').should('exist');
    cy.contains('Task A').parents('li').find('input[type="checkbox"]').check().should('be.checked');
  });

  it('edits a todo inline', () => {
    cy.get('#new-todo').type('Task B{enter}');
    cy.contains('Task B').dblclick();
    cy.focused().should('have.class', 'todo-edit').clear().type('Task B edited{enter}');
    cy.contains('Task B edited').should('exist');
  });

  it('filters active and completed', () => {
    cy.get('#new-todo').type('A{enter}');
    cy.get('#new-todo').type('B{enter}');
    cy.contains('A').parents('li').find('input[type="checkbox"]').check();

    cy.contains('button', /^Active$/).click();
    cy.contains('A').should('not.exist');
    cy.contains('B').should('exist');

    cy.contains('button', /^Completed$/).click();
    cy.contains('A').should('exist');
    cy.contains('B').should('not.exist');

    cy.contains('button', /^All$/).click();
    cy.contains('A').should('exist');
    cy.contains('B').should('exist');
  });

  it('clears completed', () => {
    cy.get('#new-todo').type('C{enter}');
    cy.get('#new-todo').type('D{enter}');
    cy.contains('C').parents('li').find('input[type="checkbox"]').check();
    cy.contains('button', /clear completed/i).click();
    cy.contains('C').should('not.exist');
    cy.contains('D').should('exist');
  });

  it('persists in Local Storage', () => {
    cy.get('#new-todo').type('Persist me{enter}');
    cy.reload();
    cy.contains('Persist me').should('exist');
  });
});
