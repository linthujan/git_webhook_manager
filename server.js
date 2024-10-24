const http = require("http");
const app = require("./app");
const port = process.env.PORT || 3000;
const server = http.createServer(app);
server.listen(port, () => console.log(`Server started on ${port}`));

if (process.env.NGROK == true || process.env.NGROK == 'true') {
    const ngrok = require('@ngrok/ngrok');
    ngrok.connect({ addr: port, authtoken: process.env.NGROK_AUTHTOKEN, domain: process.env.NGROK_DOMAIN })
        .then((listener) => console.log(`Ingress established at: ${listener.url()}`));
}