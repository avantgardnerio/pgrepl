import App from './components/App.mjs';

onload = async () => {
    const left = new App();
    const rght = new App();
    document.body.appendChild(left.el);
    document.body.appendChild(rght.el);
}