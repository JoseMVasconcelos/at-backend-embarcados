const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const sqlite3 = require('sqlite3');

var db = new sqlite3.Database('../scooter/dados.db', (err) => {
    if (err) {
        console.log('ERROR: Unable to access the database.');
        throw err;
    }
    console.log('Database Connected');
});

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

// POST /scooters - Cadastra um novo patinete.
app.post('/scooters', (req, res, next) => {
    const status = parseInt(req.body.status);
    const validStatus = Object.values(ScooterStatus);
    console.log(status);

    if (!validStatus.includes(status))
    {
        console.log("Status doesn't exists");
        return res.status(400).send("Status doesn't exists");
    }

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

// GET /scooters/available?latitude=""&longitude=""
// Obtém todos os patinetes com o status de habilitado proximos a uma localidade.
app.get('/scooters/available', (req, res, next) => {
    const latitude = req.query.latitude;
    const longitude = req.query.longitude;

    if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Latitude e longitude são obrigatórias.' });
    }

    const maxDistanceInKm = 5;

    const sql = `
        SELECT * FROM scooter
        WHERE status = ?
          AND ? >= latitude - ? AND ? <= latitude + ?
          AND ? >= longitude - ? AND ? <= longitude + ?;
    `;

    const params = [
        ScooterStatus.AVAILABLE,
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

// GET /scooters - Obtém todos os patinetes.
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

// GET /scooters/:serial_number - Obtém um patinete pelo número serial.
app.get('/scooters/:serial_number', (req, res, next) => {
    db.get(`SELECT * FROM scooter WHERE serial_number = ?`,
            req.params.serial_number, (err, result) => {
        if (err) { 
            console.log("Erro: "+ err);
            res.status(500).send('Error retrieving data.');
        } else if (!result || result.length === 0)  {
            console.log("No Content.");
            return res.status(204).send("No Content");
        } else {
            res.status(200).json(result);
        }
    });
});

// PATCH /scooters/:serialNumber/localization
// Atualiza os dados de localização para um patinete.
app.patch('/scooters/:serial_number/localization', (req, res, next) => {
    const serialNumber = req.params.serial_number;
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined)
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

// PATCH /scooters/:serialNumber/status
// Atualiza o status de um patinete.
app.patch('/scooters/:serial_number/status', (req, res, next) => {
    const serialNumber = req.params.serial_number;
    const newStatus = parseInt(req.body.new_status);

    const validStatus = Object.values(ScooterStatus);

    if (!validStatus.includes(newStatus))
    {
        console.log("Status doesn't exists");
        return res.status(400).send("Status doesn't exists");
    }

    const sql = `UPDATE scooter SET status = ? WHERE serial_number = ?`;
    db.run(sql, [newStatus, serialNumber], function (err) {
        if (err)
        {
            console.log("Erro: "+ err);
            return res.status(500).send("Error updating scooter status")
        }
        console.log("Status Updated!");
        res.status(200).send("Status Updated!");
    });
})

let port = 8090;
app.listen(port, () => {
 console.log('Server running on port: ' + port);
});