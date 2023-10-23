const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const axios = require('axios').default;
const sqlite3 = require('sqlite3');

var db = new sqlite3.Database('../rental/dados.db', (err) => {
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
    if (!req.body.credit_card_number || isNaN(req.body.credit_card_number) || req.body.credit_card_number.length !== 16) {
        return res.status(400).send("Invalid Credit Card Number");
    }
    let cpf = req.body.cpf;
    cpf = cpf.replace(/[.-]/g, '');
    if (!cpf) {
        return res.status(400).send("Invalid CPF!");
    } 
    axios.get(`http://localhost:8000/users/${cpf}`).then((response) => {
        if (!response.data) {
            return res.status(400).send("User not found.");
        }
        const serialNum = req.body.serial_number;
        axios.get(`http://localhost:8000/scooters/${serialNum}`).then((response) => {
            if (!response.data) {
                return res.status(400).send("Scooter not found.");
            } else if (response.data.status !== 0) {
                return res.status(400).send("Scooter unavailable.");
            }
            db.run(`INSERT INTO rentals (rental_start, rental_end, user_cpf, scooter_serial, active)
                VALUES(datetime('now', 'localtime'), datetime('now', 'localtime', '+${req.body.rental_minutes} minutes'), ?, ?, TRUE)`,
                [cpf, serialNum], (err) => {
                if (err) {
                    console.log("Error: "+err);
                    res.status(500).send("Error when registering rental.");
                } else {
                    db.get(`SELECT max(id) as id FROM rentals WHERE scooter_serial = ?`, serialNum, (err, result) => {
                        if (err) {
                            return res.status(500).send("Error when retrieving rental id");
                        }
                        axios.post(`http://localhost:8000/payments`, {
                            rental_id: result.id,
                            card_number: req.body.credit_card_number,
                            amount: req.body.rental_minutes
                        }).catch(err => {
                            return res.status(500).send("Error when registering payment.");
                        });
                        axios.patch(`http://localhost:8000/scooters/${serialNum}/status`, {new_status: 1}).then(() => {
                            console.log("Rental successfully registered!");
                            res.status(201).send("Rental successfully registered!");
                            }).catch(err => {
                                return res.status(500).send("Error when updating scooter status.");
                        });
                    })
                }
            });
        });
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

setInterval(() => {
    db.all(`SELECT id, scooter_serial FROM rentals WHERE datetime('now', 'localtime') > rental_end AND active = 1`, (err, result) => {
        if (err) {
            console.log("Failed to verify end of rental: "+err);
        } else {
            if (result && result.length > 0) {
                for (const rental of result) {
                    db.run(`UPDATE rentals SET active = 0 WHERE id = ?`, rental.id);
                    axios.patch(`http://localhost:8000/scooters/${rental.scooter_serial}/status`, {new_status: 0}).then(() => {
                        console.log("Rental time ended! Scooter status updated!");
                    }).catch(err => {
                        console.log(err);
                    });
                    axios.patch(`http://localhost:8000/payments/${rental.id}`).then(() => {
                        console.log("Rental time ended! Payment status updated!");
                    }).catch(err => {
                        console.log(err);
                    })
                }
            }
        }
    });
}, 60000)