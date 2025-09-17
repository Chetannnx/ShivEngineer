const express = require('express');
const path = require('path');
const sql = require('mssql/msnodesqlv8');
const config = require('./Config/dbConfig');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ Serve static files
app.use(express.static(path.join(__dirname, 'public')));


// ✅ Connection pool once (shared everywhere)
const poolPromise = sql.connect(config).then(pool => {
  console.log('✅ Connected to SQL Server');
  return pool;
}).catch(err => {
  console.error('❌ DB connection failed', err);
  process.exit(1);
});

// ✅ Make pool available globally
app.set('poolPromise', poolPromise);

// ✅ Use Routers
app.use('/', require('./Routes/home'));
app.use('/tees', require('./Routes/tees'));
app.use('/', require('./Routes/tees')); // ✅ mounts routes globally
app.use('/truckmaster', require('./Routes/truckMaster'));
const truckMasterRoutes = require('./Routes/truckMaster');
app.use('/truck-master', require('./Routes/truckMaster'));

app.use('/truck-master', truckMasterRoutes); // ✅ must match your URL



const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
