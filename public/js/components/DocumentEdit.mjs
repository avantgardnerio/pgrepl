export default class DocumentEdit {
    constructor(store) {
        this.store = store;
        this.store.subscribe(() => this.onChange());
        const html = `
        <div>
            <ul></ul>
            <button class="chapterNew">New Chapter</button>
        </div>`;
        this.el = new DOMParser().parseFromString(html, `text/html`).body.firstChild;
        this.ul = this.el.querySelector(`ul`);
        this.btnNewChapter = this.el.querySelector(`button`);
        this.btnNewChapter.onclick = () => this.newDocument();
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