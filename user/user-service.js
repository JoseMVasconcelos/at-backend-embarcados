const express = require('express');
const sqlite3 = require('sqlite3');
const validateCPF = require("../utils/validate_cpf.js");
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

db.run(`CREATE TABLE IF NOT EXISTS users 
    (
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone_num TEXT,
        cpf TEXT PRIMARY KEY NOT NULL UNIQUE
    )`,
    [], (err) => {
        if (err) {
            console.log("ERRO: Unable to create table user!");
            throw err;
        }
}); 

//Método HTTP POST /user-register - Cadastra um novo usuário
app.post('/user-register', (req, res, next) => {

    //Validação de nome (Apenas letras)
    var name = req.body.nome;
    if (!/^[A-Za-z\s]*$/.test(name)) {
        return res.status(500).send("Error: Invalid Name!");
    }

    //Formatação e validação do CPF
    var cpf = req.body.cpf;
    cpf = cpf.replace(/[^\d]/g, '');
    if (!validateCPF(cpf)) {
        return res.status(500).send("Error: Invalid CPF!");
    }

    //Validação de email
    var email = req.body.email;
    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email)) {
        return res.status(500).send("Error: Invalid Email!")
    }

    //Formatação e validação de telefone ("9" + oito números)
    var phoneNum = req.body.phone_num;
    phoneNum = phoneNum.replace(/[\s()-]/g, '');
    if (!/^(\(?\d{2}\)?\s?)?9\d{4}-?\d{4}$/.test(phoneNum)) {
        return res.status(500).send("Error: Invalid Phone Number!");
    }

    //Cadastrando o usuário no banco
    db.run('INSERT INTO users (name, email, phone_num, cpf) VALUES(?, ?, ?, ?)',
        [name, req.body.email, phoneNum, cpf], (err) => {
        if (err) {
            console.log("Erro: "+err)
            return res.status(500).send('Error when registering user.');
        } else {
            console.log('User successfully registered!');
            return res.status(200).send('User successfully registered!');
        }
    });
});

//Método HTTP GET /users - Obtém todos os usuários
app.get('/users', (req, res, next) => {
    db.all(`SELECT * FROM users`, [], (err, result) => {
        if (err) { 
            console.log("Erro: "+err);
            res.status(500).send('Error retrieving data.');
        } else if (result == null) {
            console.log("Users not found.");
            res.status(404).send("Users not found.");
        } else {
            res.status(200).json(result);
        }
    })
})

/* app.get('/hello', (req, res) => {
    res.send('Hello World');
}) */

let port = 8092;
app.listen(port, () => {
    console.log("Server started, running on port: " + port);
});


