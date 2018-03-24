export default class DocumentEdit {
    constructor(store) {
        this.store = store;
        this.store.subscribe(() => this.onChange());
        this.src = undefined;
        this.dst = undefined;

        const html = `
        <svg style="width: 100%; height: 100%" viewbox="0 0 1 1" 
                preserveAspectRatio="xMidyMid meet">
            <line x1="0.1" y1="0.1" 
                x2="0.9" y2="0.9" 
                stroke-width="2" stroke="black" 
                vector-effect="non-scaling-stroke"/>
        </svg>`;
        this.el = new DOMParser().parseFromString(html, `text/html`).body.firstChild;

        this.el.onmousedown = (e) => this.onMouseDown(e);
        this.el.onmousemove = (e) => this.onMouseMove(e);
        this.el.onmouseup = (e) => this.onMouseUp(e);

        this.onChange();
    }

    newDocument() {
        console.log('click');
    }

    onMouseDown(e) {
        this.src = [e.offsetX / this.el.clientWidth, e.offsetY / this.el.clientHeight];
        this.dst = [e.offsetX / this.el.clientWidth, e.offsetY / this.el.clientHeight];
        this.currentEl = document.createElementNS("http://www.w3.org/2000/svg", 'line');
        this.currentEl.setAttribute("x1", this.src[0]);
        this.currentEl.setAttribute("y1", this.src[1]);
        this.currentEl.setAttribute("x2", this.dst[0]);
        this.currentEl.setAttribute("y2", this.dst[1]);
        this.currentEl.setAttribute("vector-effect", "non-scaling-stroke");
        this.currentEl.setAttribute("stroke", "black");
        this.currentEl.setAttribute("stroke-width", "2");
        this.el.appendChild(this.currentEl);
    }

    onMouseMove(e) {
        if(!this.currentEl) return;
        this.dst = [e.offsetX / this.el.clientWidth, e.offsetY / this.el.clientHeight];
        this.currentEl.setAttribute(`x2`, this.dst[0]);
        this.currentEl.setAttribute(`y2`, this.dst[1]);
    }

    onMouseUp(e) {
        this.currentEl = undefined;
        this.currentEl.removeChild(this.currentEl);
    }

    onChange() {
    }

    get element() {
        return this.el;
    }
}