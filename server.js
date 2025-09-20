const express = require('express');
const path = require('path');
const sql = require('mssql/msnodesqlv8');
const selfsigned = require('selfsigned'); // ✅ generate self-signed cert on the fly
const https = require('https');
const config = require('./Config/dbConfig');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Connection pool once (shared everywhere)
const poolPromise = sql.connect(config)
  .then(pool => {
    console.log('✅ Connected to SQL Server');
    return pool;
  })
  .catch(err => {
    console.error('❌ DB connection failed', err);
    process.exit(1);
  });

app.set('poolPromise', poolPromise);

// ✅ Use Routers (cleaned duplicates)
app.use('/', require('./Routes/home'));
app.use('/tees', require('./Routes/tees'));
app.use('/truckmaster', require('./Routes/truckMaster'));
app.use('/truck-master', require('./Routes/truckMaster'));
app.use('/Fan-Generation', require('./Routes/Fangeneration'));

// ✅ Generate self-signed certificate dynamically
const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, { days: 365 });

const sslOptions = {
  key: pems.private,
  cert: pems.cert
};

// ✅ Start HTTPS server
const PORT = process.env.PORT || 3002;
https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`🚀 HTTPS Server running at https://localhost:${PORT}`);
});
