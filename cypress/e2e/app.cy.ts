describe('App3 E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should load the application', () => {
    cy.contains('Data Analytics').should('be.visible');
  });

  it('should navigate to dashboard', () => {
    cy.get('nav').contains('Dashboard').click();
    cy.url().should('include', '/dashboard');
    cy.contains('Dashboard').should('be.visible');
  });

  it('should navigate to upload page', () => {
    cy.get('nav').contains('Upload').click();
    cy.url().should('include', '/upload');
    cy.contains('Upload').should('be.visible');
  });

  it('should navigate to topics page', () => {
    cy.get('nav').contains('Topics').click();
    cy.url().should('include', '/topics');
    cy.contains('Topics').should('be.visible');
  });

  it('should navigate to report page', () => {
    cy.get('nav').contains('Report').click();
    cy.url().should('include', '/report');
    cy.contains('Report').should('be.visible');
  });

  it('should show navigation menu', () => {
    cy.get('nav').should('be.visible');
    cy.get('nav').within(() => {
      cy.get('a').should('have.length.greaterThan', 0);
    });
  });
});
