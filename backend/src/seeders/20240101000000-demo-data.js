'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create test users
    const users = await queryInterface.bulkInsert('users', [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: await bcrypt.hash('password123', 12),
        role: 'admin',
        is_email_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Test User',
        email: 'user@example.com',
        password: await bcrypt.hash('password123', 12),
        role: 'user',
        is_email_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { returning: true });

    const adminUser = users[0];
    const testUser = users[1];

    // Create test vehicles
    const vehicles = await queryInterface.bulkInsert('vehicles', [
      {
        user_id: adminUser.id,
        make: 'Freightliner',
        model: 'Cascadia',
        year: 2022,
        vin: '1FUJGLDR4DSBF1234',
        license_plate: 'ABC123',
        license_state: 'TX',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: testUser.id,
        make: 'Kenworth',
        model: 'T680',
        year: 2021,
        vin: '1XKWD40X1PJ123456',
        license_plate: 'XYZ789',
        license_state: 'CA',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { returning: true });

    const [adminVehicle, testVehicle] = vehicles;

    // Create test trips
    const trips = [];
    const states = ['TX', 'NM', 'AZ', 'CA', 'NV', 'UT', 'CO', 'OK', 'AR', 'LA'];
    
    // Generate 20 sample trips
    for (let i = 0; i < 20; i++) {
      const originIdx = Math.floor(Math.random() * states.length);
      let destIdx;
      do {
        destIdx = Math.floor(Math.random() * states.length);
      } while (destIdx === originIdx);
      
      const tripDate = new Date();
      tripDate.setDate(tripDate.getDate() - Math.floor(Math.random() * 30));
      
      trips.push({
        user_id: i % 2 === 0 ? adminUser.id : testUser.id,
        vehicle_id: i % 2 === 0 ? adminVehicle.id : testVehicle.id,
        trip_date: tripDate,
        origin_state: states[originIdx],
        destination_state: states[destIdx],
        distance_miles: Math.floor(Math.random() * 1000) + 100,
        fuel_consumed_gallons: (Math.random() * 200 + 20).toFixed(2),
        notes: i % 3 === 0 ? 'Test trip note ' + (i + 1) : null,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    await queryInterface.bulkInsert('trips', trips);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('trips', null, {});
    await queryInterface.bulkDelete('vehicles', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};
