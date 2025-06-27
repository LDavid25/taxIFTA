const { sequelize, Sequelize } = require('../config/sequelize');
const path = require('path');
const fs = require('fs');

const db = {};

// Load all model files
const modelFiles = fs.readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && 
           (file !== 'index.js') && 
           (file.slice(-9) === '.model.js');
  });

// First pass: load all models
modelFiles.forEach(file => {
  const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
});

// Second pass: set up associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

console.log('Models loaded successfully:', Object.keys(db));

module.exports = db;
