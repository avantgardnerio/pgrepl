export default class PeopleList {
    constructor(store) {
        this.store = store;
        this.store.subscribe(() => this.onChange);
        const html = `
            <ul>
                <li>test</li>
            </ul>
        `;
        this.el = new DOMParser().parseFromString(html, `text/html`).body.firstChild;
        this.onChange();
    }

    onChange() {
        const state = this.store.getState();
        const html = state.people.reduce((acc, p) => `${acc}<li>${p.givenName} ${p.familyName}</li>`, ``);
        this.el.innerHTML = html;
    }

    get element() {
        return this.el;
    }
}