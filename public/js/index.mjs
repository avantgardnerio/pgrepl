import App from './components/App.mjs';

onload = async () => {
    const left = new App(`left`);
    const rght = new App(`rght`);
    document.body.appendChild(left.el);
    document.body.appendChild(rght.el);
};