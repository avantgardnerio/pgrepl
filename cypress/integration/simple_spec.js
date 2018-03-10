describe('My First Test', function () {
    it('finds the content "type"', function () {
        cy.visit('public/index.html')

        cy.contains('Hello world!')
    })
})