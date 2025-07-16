require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');
const Umzug = require('umzug');

// Load database configuration
const dbConfig = require('../src/config/database');

// Initialize Sequelize with the configuration
const sequelize = new Sequelize(dbConfig);

// Configure Umzug for migrations
const umzug = new Umzug({
  migrations: {
    path: path.join(__dirname, '../src/migrations'),
    params: [
      sequelize.getQueryInterface(),
      Sequelize
    ]
  },
  storage: 'sequelize',
  storageOptions: {
    sequelize: sequelize
  },
  logging: console.log
});

// Run migrations
(async () => {
  try {
    console.log('Running migrations...');
    await umzug.up();
    console.log('Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
})();
