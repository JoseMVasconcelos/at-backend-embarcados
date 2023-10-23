const express = require('express');
const sqlite3 = require('sqlite3');
const validateCPF = require("../utils/validate_cpf.js");
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var db = new sqlite3.Database('../user/dados.db', (err) => {
    if (err) {
        console.log('ERRO: Unable to connect to SQLite!');
        throw err;
    }
    console.log('Connected to SQLite!');
});

db.run(`CREATE TABLE IF NOT EXISTS users 
    (
        name VARCHAR NOT NULL,
        email VARCHAR NOT NULL,
        phone_num VARCHAR NOT NULL,
        cpf VARCHAR PRIMARY KEY NOT NULL UNIQUE
    )`,
    [], (err) => {
        if (err) {
            console.log("Error: Unable to create table user!");
            throw err;
        }
}); 

//POST /users - Cadastra um novo usuário
app.post('/users', (req, res, next) => {

    //Validação de nome (Apenas letras)
    const name = req.body.name;
    if (!/^[A-Za-z\s]*$/.test(name)) {
        return res.status(400).send("Error: Invalid Name!");
    }

    //Formatação e validação do CPF
    let cpf = req.body.cpf;
    cpf = cpf.replace(/[.-]/g, '');
    if (!validateCPF(cpf)) {
        return res.status(400).send("Error: Invalid CPF!");
    }

    //Validação de email
    const email = req.body.email;
    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email)) {
        return res.status(400).send("Error: Invalid Email!")
    }

    //Formatação e validação de telefone ("9" + oito números)
    let phoneNum = req.body.phone_num;
    phoneNum = phoneNum.replace(/[\s()-]/g, '');
    if (!/^(\(?\d{2}\)?\s?)?9\d{4}-?\d{4}$/.test(phoneNum)) {
        return res.status(400).send("Error: Invalid Phone Number!");
    }

    //Cadastrando o usuário no banco
    db.run('INSERT INTO users (name, email, phone_num, cpf) VALUES(?, ?, ?, ?)',
        [name, email, phoneNum, cpf], (err) => {
        if (err) {
            console.log("Erro: "+err)
            return res.status(500).send('Error when registering user.');
        } else {
            console.log('User successfully registered!');
            return res.status(200).send('User successfully registered!');
        }
    });
});

//GET /users - Obtém todos os usuários
app.get('/users', (req, res, next) => {
    db.all(`SELECT * FROM users`, [], (err, result) => {
        if (err) { 
            console.log("Erro: "+err);
            res.status(500).send('Error retrieving data.');
        } else if (result === null || result.length === 0) {
            console.log("NoContent");
            res.status(204).send("NoContent");
        } else {
            res.status(200).json(result);
        }
    })
})

//GET /users/:cpf - Obtém usuário por CPF
app.get('/users/:cpf', (req, res, next) => {
    let cpf = req.params.cpf;
    cpf = cpf.replace(/[.-]/g, '');

    db.get(`SELECT * FROM users WHERE cpf = ?`,
            cpf, (err, result) => {
        if (err) {
            console.log("ERROR: "+err);
            return res.status(500).send("Unable to obtain user data!");
        } else if (!result || result.lenght === 0) {
            console.log("NoContent");
            return res.status(204).send("NoContent");
        } else {
            res.status(200).json(result);
        }
    });
});

let port = 8092;
app.listen(port, () => {
    console.log("Server started, running on port: " + port);
});


