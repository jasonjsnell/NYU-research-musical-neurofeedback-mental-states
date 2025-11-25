const osc = require("osc");
const WebSocket = require("ws");

// 1) OSC → UDP
const udpPort = new osc.UDPPort({
  localAddress: "127.0.0.1",
  localPort: 5000,
  metadata: true
});
udpPort.open();

// 2) WebSocket → browser
const wss = new WebSocket.Server({ port: 8081 });

udpPort.on("message", (msg) => {
  const json = JSON.stringify(msg);
  wss.clients.forEach((c) =>
    c.readyState === WebSocket.OPEN && c.send(json)
  );
});

console.log("OSC ➜ WS bridge up (UDP 5000 → WS 8081)");
