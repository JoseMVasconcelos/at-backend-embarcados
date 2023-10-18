const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/hello', (req, res) => {
    res.send('Hello World');
})

let port = 8080;
app.listen(port, () => {
    console.log("Servidor iniciado na porta: " + port);
});