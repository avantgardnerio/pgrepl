import App from './components/App.mjs';
import SocketService from './services/SocketService.mjs';

// const connect = async () => {
//     const url = document.location.toString()
//         .replace('http://', 'ws://') + "echo";
//     const ws = new SocketService(url, WebSocket);
//     ws.onConnect = () => {
//         ws.write({ type: 'PING' });
//     }
//     await ws.connect();
// }
// connect();

onload = async () => {
    const left = new App(`left`);
    const rght = new App(`rght`);
    document.body.appendChild(left.el);
    document.body.appendChild(rght.el);
}