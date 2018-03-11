import reducer from '../reducers/reducer.mjs';
import PeopleList from './PeopleList.mjs';

export default class App {
    constructor(id) {
        this.store = Redux.createStore(reducer);
        const html = `<div id=${id}></div>`;
        this.el = new DOMParser().parseFromString(html, `text/html`).body.firstChild;

        this.peopleList = new PeopleList(this.store);
        this.el.appendChild(this.peopleList.el);
    }

    get element() {
        return this.el;
    }
}