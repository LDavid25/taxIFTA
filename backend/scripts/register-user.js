require('dotenv').config();
const { sequelize, User, Company } = require('../src/models');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Configuration
const USER_DATA = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'Test1234!',
  role: 'user', // 'admin' or 'user'
  company: {
    name: 'Test Company',
    contact_email: 'company@example.com',
    phone: '1234567890',
    distribution_emails: ['support@example.com', 'billing@example.com']
  }
};

async function createUserWithCompany() {
  console.log('=== Starting user and company creation ===');
  
  const transaction = await sequelize.transaction();
  
  try {
    // 1. Check if user already exists
    const existingUser = await User.findOne({
      where: { email: USER_DATA.email },
      transaction
    });

    if (existingUser) {
      throw new Error(`User with email ${USER_DATA.email} already exists`);
    }

    // 2. Create company
    console.log('Creating company...');
    const company = await Company.create({
      id: uuidv4(),
      name: USER_DATA.company.name,
      contact_email: USER_DATA.company.contact_email,
      phone: USER_DATA.company.phone,
      distribution_emails: USER_DATA.company.distribution_emails,
      is_active: true
    }, { transaction });

    console.log(`Company created with ID: ${company.id}`);

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(USER_DATA.password, salt);

    // 4. Create user with the company's ID
    console.log('Creating user...');
    const user = await User.create({
      id: uuidv4(),
      name: USER_DATA.name,
      email: USER_DATA.email,
      password: hashedPassword,
      role: USER_DATA.role,
      company_id: company.id, // Using the company's ID
      is_active: true
    }, { transaction });
    
    // 5. Update the company with the user as the main contact
    await company.update({
      contact_email: USER_DATA.email // Optionally set user's email as company contact
    }, { transaction });

    console.log(`User created with ID: ${user.id}`);

    // 5. Commit transaction
    await transaction.commit();
    
    console.log('=== User and company created successfully ===');
    console.log('User ID:', user.id);
    console.log('Company ID:', company.id);
    console.log('Email:', user.email);
    console.log('Password:', USER_DATA.password); // Only for development
    
    return { user, company };
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating user and company:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      console.log('Database connection has been established successfully.');
      
      await createUserWithCompany();
      
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      process.exit(1);
    } finally {
      await sequelize.close();
      process.exit(0);
    }
  })();
}

module.exports = { createUserWithCompany };
