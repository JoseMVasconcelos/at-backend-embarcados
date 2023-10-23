const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.post('/scooter-controller', (req, res, next) => {
    if (req.body.lock && req.body.serial_number){
        if (req.body.lock == "lock") {
            console.log(`Scooter: ${req.body.serial_number} locked! Rental time ended.`);
            res.status(200).send(`Scooter: ${req.body.serial_number} locked! Rental time ended.`);
        } else if (req.body.lock == "unlock") {
            console.log(`Scooter: ${req.body.serial_number} unlocked! Rental time started.`);
            res.status(200).send(`Scooter: ${req.body.serial_number} unlocked! Rental time started.`)
        } else {
            res.status(400).send("Bad request.");
        }
    }
});

let port = 8094;
app.listen(port, () => {
    console.log("Server running on port: "+port);
})