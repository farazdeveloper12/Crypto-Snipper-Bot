// backend/scripts/database-seeder.js
const mongoose = require('mongoose');
const User = require('../src/models/user');
const Token = require('../src/models/token');
const faker = require('faker');

class DatabaseSeeder {
  async connectDB() {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  }

  async seedUsers(count = 10) {
    const users = [];
    for (let i = 0; i < count; i++) {
      users.push({
        email: faker.internet.email(),
        password: faker.internet.password(),
        profile: {
          firstName: faker.name.firstName(),
          lastName: faker.name.lastName()
        },
        trading: {
          defaultStrategy: faker.random.arrayElement([
            'liquidity_snipe', 
            'mempool_snipe', 
            'trend_following'
          ]),
          riskTolerance: faker.random.number({ min: 10, max: 90 })
        }
      });
    }

    await User.insertMany(users);
    console.log(`Seeded ${count} users`);
  }

  async seedTokens(count = 20) {
    const tokens = [];
    for (let i = 0; i < count; i++) {
      tokens.push({
        name: faker.finance.currencyName(),
        symbol: faker.finance.currencyCode(),
        address: faker.finance.ethereumAddress(),
        blockchain: faker.random.arrayElement([
          'ethereum', 'solana', 'binance'
        ]),
        marketData: {
          price: {
            usd: parseFloat(faker.finance.amount())
          }
        }
      });
    }

    await Token.insertMany(tokens);
    console.log(`Seeded ${count} tokens`);
  }

  async runSeeder() {
    try {
      await this.connectDB();
      await this.seedUsers();
      await this.seedTokens();
      console.log('Database seeding completed');
      process.exit(0);
    } catch (error) {
      console.error('Seeding failed', error);
      process.exit(1);
    }
  }
}

const seeder = new DatabaseSeeder();
seeder.runSeeder();