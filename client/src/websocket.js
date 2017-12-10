import uuidv4 from 'uuid/v4';

/*
Inspired by https://medium.freecodecamp.org/an-introduction-to-the-redux-first-routing-model-98926ebf53cb
 */
if (!window.WebSocket && window.MozWebSocket) {
    window.WebSocket = window.MozWebSocket;
}
if (!window.WebSocket) {
    alert("WebSocket not supported by this browser");
}

export default class WsTool {
    constructor(store) {
        this.store = store;
        this.id = uuidv4();
    }

    connect() {
        const location = document.location.toString()
                .replace('http://', 'ws://')
                .replace(":3000", ":8080")
            + "echo";
        console.info("Document URI: " + document.location);
        console.info("WS URI: " + location);
        this._scount = 0;
        try {
            this._ws = new WebSocket(location);
            this._ws.onopen = this._onopen;
            this._ws.onmessage = this._onmessage;
            this._ws.onclose = this._onclose;
        } catch (exception) {
            console.error("Connect Error: " + exception);
        }
    }

    close() {
        this._ws.close(1000);
    }

    write(msg) {
        const json = JSON.stringify(msg);
        console.log(json);
        this._send(json);
    };

    _onopen = () => {
        console.info("Websocket Connected");
        this.write({type: 'HELLO', payload: this.id})
    };

    _send = (message) => {
        this._ws.send(message);
    };

    _onmessage = (ev) => {
        const msg = JSON.parse(ev.data);
        this.store.dispatch(msg);
    };

    _onclose = (closeEvent) => {
        this._ws = null;
        console.info("Websocket Closed");

        let codeMap = {};
        codeMap[1000] = "(NORMAL)";
        codeMap[1001] = "(ENDPOINT_GOING_AWAY)";
        codeMap[1002] = "(PROTOCOL_ERROR)";
        codeMap[1003] = "(UNSUPPORTED_DATA)";
        codeMap[1004] = "(UNUSED/RESERVED)";
        codeMap[1005] = "(INTERNAL/NO_CODE_PRESENT)";
        codeMap[1006] = "(INTERNAL/ABNORMAL_CLOSE)";
        codeMap[1007] = "(BAD_DATA)";
        codeMap[1008] = "(POLICY_VIOLATION)";
        codeMap[1009] = "(MESSAGE_TOO_BIG)";
        codeMap[1010] = "(HANDSHAKE/EXT_FAILURE)";
        codeMap[1011] = "(SERVER/UNEXPECTED_CONDITION)";
        codeMap[1015] = "(INTERNAL/TLS_ERROR)";
        const codeStr = codeMap[closeEvent.code];
        console.info("  .code = " + closeEvent.code + "  " + codeStr);
        console.info("  .reason = " + closeEvent.reason);
    }
}
