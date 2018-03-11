import { getUsers } from '../actions/actions.mjs';
import reducer from '../reducers/reducer.mjs';
import PeopleList from './PeopleList.mjs';

export default class App {
    constructor(id) {
        const middleware = Redux.applyMiddleware(ReduxThunk.default);
        this.store = Redux.createStore(reducer, middleware);
        const html = `<div id=${id}></div>`;
        this.el = new DOMParser().parseFromString(html, `text/html`).body.firstChild;

        this.peopleList = new PeopleList(this.store);
        this.el.appendChild(this.peopleList.el);
        this.load();
    }

    async load() {
        this.store.dispatch(getUsers());
    }

    get element() {
        return this.el;
    }
}