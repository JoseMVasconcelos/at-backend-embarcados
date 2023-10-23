const httpProxy = require('express-http-proxy');
const express = require('express');
const app = express();
var logger = require('morgan');

app.use(logger('dev'));

function selectProxyHost(req) {
    if (req.path.startsWith('/scooter-controller'))
        return 'http://localhost:8094'
    else if (req.path.startsWith('/scooters'))
        return 'http://localhost:8090/';
    else if (req.path.startsWith('/payments'))
        return 'http://localhost:8091/';
    else if (req.path.startsWith('/users'))
        return 'http://localhost:8092';
    else if (req.path.startsWith('/rental'))
        return 'http://localhost:8093';
    else return null;
}

app.use((req, res, next) => {
    var proxyHost = selectProxyHost(req);
    if (proxyHost == null)
        res.status(404).send('Not found');
    else
        httpProxy(proxyHost)(req, res, next);
});

app.listen(8000, () => {
    console.log('API Gateway iniciado!');
});