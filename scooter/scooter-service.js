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

// Método HTTP POST /scooters - Cadastra um novo patinete.
app.post('/scooters', (req, res, next) => {
    db.run(`INSERT INTO scooter (serial_number, status, longitude, latitude) VALUES(?,?,?,?)`, 
         [req.body.serial_number, req.body.status, req.body.longitude, req.body.latitude], (err) => {
        if (err) {
            console.log("Error: " + err);
            res.status(500).send('"Error when registering scooter.');
        } else {
            console.log('Scooter successfully registered!');
            res.status(201).send('Scooter successfully registered!');
        }
    });
});

// Método HTTP GET /scooters/available?latitude=""&longitude=""
// Obtém todos os patinetes com o status de habilitado proximos a uma localidade.
app.get('/scooters/available', (req, res, next) => {
    const latitude = req.query.latitude;
    const longitude = req.query.longitude;

    if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Latitude e longitude são obrigatórias.' });
    }

    const maxDistanceInKm = 0.5;

    const sql = `
        SELECT * FROM scooter
        WHERE status = 0
          AND ? >= latitude - ? AND ? <= latitude + ?
          AND ? >= longitude - ? AND ? <= longitude + ?;
    `;

    const params = [
        parseFloat(latitude),
        maxDistanceInKm / 111.32, // 1 grau de latitude é aproximadamente 111.32 km
        parseFloat(latitude),
        maxDistanceInKm / 111.32,
        parseFloat(longitude),
        maxDistanceInKm / (111.32 * Math.cos(parseFloat(latitude) * (Math.PI / 180))),
        parseFloat(longitude),
        maxDistanceInKm / (111.32 * Math.cos(parseFloat(latitude) * (Math.PI / 180))),
    ];

    db.all(sql, params, (err, result) => {
        if (err) {
            console.log("Erro: "+ err);
            res.status(500).send('Error retrieving data.');
        } else if (result === null || result.length === 0)  {
            console.log("No Content.");
            return res.status(204).send("No Content");
        } else {
            res.status(200).send(result);
        }
    });
});

// Método HTTP GET /scooters - Obtém todos os patinetes.
app.get('/scooters', (req, res, next) => {
    db.all( `SELECT * FROM scooter`, (err, result) => {
        if (err) { 
            console.log("Erro: "+ err);
            res.status(500).send('Error retrieving data.');
        } else if (result === null || result.length === 0)  {
            console.log("No Content.");
            return res.status(204).send("No Content");
        } else {
            res.status(200).json(result);
        }
    });
});

// Método HTTP PATCH /scooters/:serialNumber/localization
// Atualiza os dados de localização para um patinete.
app.patch('/scooters/:serialNumber/localization', (req, res, next) => {
    const serialNumber = req.params.serialNumber;
    const { latitude, longitude } = req.body;

    if (latitude === undefined && longitude === undefined)
    {
        res.status(400).send("Latitude and longitude are required.")
    }

    const sql = `UPDATE scooter SET latitude = ?, longitude = ? WHERE serial_number = ?`;
    db.run(sql, [latitude, longitude, serialNumber], function (err) {
        if (err) {
            console.log("Erro: "+ err);
            return res.status(500).send("Error updating scooter")
        }
        console.log("Localization Updated!");
        res.status(200).send("Localization updated!")
    })
})