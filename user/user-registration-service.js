const express = require('express');
const sqlite3 = require('sqlite3')
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var db = new sqlite3.Database('./dados.db', (err) => {
    if (err) {
        console.log('ERRO: Unable to connect to SQLite!');
        throw err;
    }
    console.log('Connected to SQLite!');
});

db.run('CREATE TABLE IF NOT EXISTS registry (name TEXT NOT NULL, email TEXT NOT NULL, phone_num TEXT, cpf TEXT PRIMARY KEY NOT NULL)',
    [], (err) => {
        if (err) {
            console.log("ERRO: Unable to create table registry (user)!");
            throw err;
        }
}); 

app.post('/user-register', (req, res, next) => {
    db.run('INSERT INTO registry (name, email, phone_num, cpf) VALUES(?, ?, ?, ?)'),
    [req.body.name, req.body.email, req]
})

/* app.get('/hello', (req, res) => {
    res.send('Hello World');
}) */

let port = 8080;
app.listen(port, () => {
    console.log("Server started, running on port: " + port);
});
