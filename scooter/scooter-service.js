// Inicia o Express.js
const express = require('express');
const app = express();

// Body Parser - usado para processar dados da requisição HTTP
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Inicia o Servidor HTTP na porta 8090
let port = 8090;
app.listen(port, () => {
 console.log('Server running on port: ' + port);
});

// Iniciando sqlite3
const sqlite3 = require('sqlite3');

// Acessa o arquivo com o banco de dados
var db = new sqlite3.Database('./dados.db', (err) => {
    if (err) {
        console.log('ERROR: Unable to access the database.');
        throw err;
    }
    console.log('Database Connected');
});

// Cria a tabela pontos, caso ela não exista
db.run(`CREATE TABLE IF NOT EXISTS scooter 
    (
        serial_number VARCHAR PRIMARY KEY NOT NULL UNIQUE,
        status SMALLINT NOT NULL,
        longitude REAL NOT NULL,
        latitude REAL NOT NULL
    )`, 
    [], (err) => {
       if (err) {
          console.log('ERRO: Could not create table.');
          throw err;
       }
});

const ScooterStatus = require('../constants/enums/scooterStatus');

// Método HTTP POST /Scooter - Cadastra um novo patinete
app.post('/scooters', (req, res, next) => {
    db.run(`INSERT INTO scooter (serial_number, status, longitude, latitude) VALUES(?,?,?,?)`, 
         [req.body.serial_number, req.body.status, req.body.longitude, req.body.latitude], (err) => {
        if (err) {
            console.log("Error: " + err);
            res.status(500).send('"Error when registering scooter.');
        } else {
            console.log('Scooter successfully registered!');
            res.status(200).send('Scooter successfully registered!');
        }
    });
});

// Método HTTP GET /Scooter - Obtém todos os patinetes pelo status.
app.get('/scooters/available', (req, res, next) => {
    db.all( `SELECT * FROM scooter WHERE status = ?`, 
            ScooterStatus.AVAILABLE, (err, result) => {
        if (err) { 
            console.log("Erro: "+err);
            res.status(500).send('Error retrieving data.');
        } else if (result == null) {
            console.log("Scooters not found.");
            res.status(404).send("Scooters not found.");
        } else {
            res.status(200).json(result);
        }
    });
});