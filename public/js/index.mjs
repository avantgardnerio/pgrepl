import App from './components/App.mjs';

onload = async () => {
    const app = new App();
    document.body.appendChild(app.el);
}