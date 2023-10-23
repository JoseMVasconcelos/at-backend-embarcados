const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const sqlite3 = require('sqlite3');

var db = new sqlite3.Database('../payment/dados.db', (err) => {
    if (err) {
        console.log('ERROR: Unable to access the database.');
        throw err;
    }
    console.log('Database Connected');
});

db.run(`CREATE TABLE IF NOT EXISTS payments
    (
        id INTEGER PRIMARY KEY,
        rental_id INTEGER NOT NULL,
        card_number VARCHAR NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        billing_date TEXT,
        payment_status INTEGER NOT NULL DEFAULT 0
    )`, 
    [], (err) => {
       if (err) {
          console.log('ERRO: Could not create table.');
          throw err;
       }
});

// POST /payments - Realiza um pagamento.
app.post('/payments', (req, res, next) => {
    const {rental_id, card_number, amount} = req.body;

    if (!card_number || !amount || !rental_id) {
        return res.status(400).send("Card number and amout are required");
    }

    const sql = `INSERT INTO payments (rental_id, card_number, amount) VALUES (?,?,?)`
    db.run(sql, [rental_id, card_number, amount], function(err) {
        if (err) {
            console.log("Error: " + err);
            res.status(500).send('Error when making payment.');
        } else {
            console.log("Payment made successfully")
            return res.status(200).send("Payment made successfully.");
        }
    });
});

//Tempo de alguel acabou, atualizou o status do pagamento
app.patch('/payments/:rental_id', (req, res, next) => {
    const rental_id = req.params.rental_id;
    console.log(rental_id)
    if (!rental_id) {
        return res.status(400).send("Rental id invalid");
    }
    const sql = `UPDATE payments SET payment_status = 1 WHERE rental_id = ?`
    db.run(sql, rental_id, function(err) {
        if (err) {
            console.log("Error: " + err);
            res.status(500).send('Error when updating payment.');
        } else {
            console.log("Payment made successfully")
            return res.status(200).send("Payment updated successfully.");
        }
    });
});

// GET /payments - Obtém todos os pagamentos.
app.get('/payments', (req, res, next) => {
    db.all( `SELECT * FROM payments`, (err, result) => {
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



let port = 8091;
app.listen(port, () => {
 console.log('Server running on port: ' + port);
});