const express = require('express');
const path = require('path');
const sql = require('mssql/msnodesqlv8');
const selfsigned = require('selfsigned');
const https = require('https');
const config = require('./Config/dbConfig');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/Icons', express.static(path.join(__dirname, 'Icons')));

// Create SQL connection pool (single instance)
const poolPromise = sql.connect(config)
  .then(pool => {
    console.log('✅ Connected to SQL Server');
    return pool;
  })
  .catch(err => {
    console.error('❌ DB connection failed:', err);
    process.exit(1);
  });

app.set('poolPromise', poolPromise);

// Routes
app.use('/', require('./Routes/home'));
app.use('/tees', require('./Routes/tees'));
app.use('/truckmaster', require('./Routes/truckMaster'));
app.use('/truck-master', require('./Routes/truckMaster'));
app.use('/Fan-Generation', require('./Routes/Fangeneration'));
app.use('/EntryWeight', require('./Routes/EntryWeight'));
app.use('/ExitWeigh', require('./Routes/ExitWeigh'));
app.use('/InvoiceGeneration', require('./Routes/InvoiceGeneration'));
app.use('/WeighingBill', require('./Routes/WeighingBill'));

const liveTruckStatusRoutes = require('./Routes/LiveTruckStatus');
app.use('/', liveTruckStatusRoutes);

const liveStatus = require('./Routes/LiveStatus');
app.use('/live-status', liveStatus);

// Network Host & Port
const HOST = '192.168.1.7';
const PORT = process.env.PORT || 3002;

// Generate self-signed certificate for LAN IP
const attrs = [{ name: 'commonName', value: HOST }];
const pems = selfsigned.generate(attrs, { days: 365 });

const sslOptions = {
  key: pems.private,
  cert: pems.cert
};

// Start HTTPS Server on LAN IP
https.createServer(sslOptions, app).listen(PORT, HOST, () => {
  console.log(`🚀 HTTPS Server running at https://${HOST}:${PORT}`);
});
