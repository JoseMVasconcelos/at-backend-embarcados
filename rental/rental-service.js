const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const axios = require('axios').default;
const sqlite3 = require('sqlite3');

var db = new sqlite3.Database('./dados.db', (err) => {
    if (err) {
        console.log('ERROR: Unable to access the database.');
        throw err;
    }
    console.log('Connected to SQLite!');
});

db.run(`CREATE TABLE IF NOT EXISTS rentals 
    (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rental_start VARCHAR NOT NULL,
        rental_end VARCHAR NOT NULL,
        user_cpf VARCHAR NOT NULL,
        scooter_serial VARCHAR NOT NULL,
        active BOOL
    )`,
    [], (err) => {
        if (err) {
            console.log("Error: Unable to create table rentals!");
            throw err;
        }
});

app.post('/rentals', (req, res, next) => {
    let cpf = req.body.cpf;
    cpf = cpf.replace(/[^\d]/g, '');
    if (!cpf) {
        return res.status(400).send("Invalid CPF!");
    } 
    axios.get(`http://localhost:8000/users/${cpf}`).then(() => {
        const serialNum = req.body.serial_number;
        axios.get(`http://localhost:8000/scooters/${serialNum}`).then(() => {
            db.run(`INSERT INTO rentals (rental_start, rental_end, user_cpf, scooter_serial, active)
                VALUES(datetime('now', 'localtime'), datetime('now', 'localtime', '+${req.body.rental_minutes} minutes'), ?, ?, TRUE)`,
                [cpf, serialNum], (err) => {
                    if (err) {
                        console.log("Error: "+err);
                        res.status(500).send("Error when registering rental.");
                    } else {
                        console.log("Rental successfully registered!");
                        res.status(201).send("Rental successfully registered!");
                    }
                })
        })
        .catch(err => {
            return res.status(204).send("Scooter not found");
        })
    })
    .catch(err => {
        return res.status(204).send("User not found");
    });
});

app.get('/rentals', (req, res, next) => {
    db.all(`SELECT * FROM rentals`, [], (err, result) => {
        if (err) { 
            console.log("Erro: "+err);
            res.status(500).send('Error retrieving data.');
        } else if (result === null || result.length === 0) {
            console.log("NoContent.");
            res.status(204).send("NoContent.");
        } else {
            res.status(200).json(result);
        }
    });
});

let port = 8093;
app.listen(port, () => {
 console.log('Server running on port: ' + port);
});

