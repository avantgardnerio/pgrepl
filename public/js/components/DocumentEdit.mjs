export default class DocumentEdit {
    constructor(store) {
        this.store = store;
        this.store.subscribe(() => this.onChange());
        const html = `
        <svg style="width: 100%; height: 100%" viewbox="0 0 1 1" preserveAspectRatio="xMidyMid meet">
            <line x1="0.1" y1="0.1" x2="0.9" y2="0.9" stroke-width="2" stroke="black" vector-effect="non-scaling-stroke"/>
        </svg>`;
        this.el = new DOMParser().parseFromString(html, `text/html`).body.firstChild;
        this.ul = this.el.querySelector(`ul`);
        this.onChange();
    }

    newDocument() {
        console.log('click');
    }

    onChange() {
    }

    get element() {
        return this.el;
    }
}