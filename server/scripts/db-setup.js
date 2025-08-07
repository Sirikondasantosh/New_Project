#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * This script helps you set up and manage the JobSeeker Pro database.
 * 
 * Usage:
 *   node scripts/db-setup.js [command]
 * 
 * Commands:
 *   setup     - Initialize database with indexes and sample data
 *   seed      - Add sample data only
 *   clean     - Clean up old data
 *   stats     - Show database statistics
 *   backup    - Create database backup
 *   drop      - Drop entire database (DANGEROUS!)
 *   health    - Check database health
 */

require('dotenv').config();
const DatabaseManager = require('../utils/database');

const db = new DatabaseManager();

async function main() {
  const command = process.argv[2] || 'setup';
  
  console.log('🚀 JobSeeker Pro Database Manager');
  console.log('==================================\n');

  try {
    // Connect to database
    await db.connect();

    switch (command) {
      case 'setup':
        console.log('📋 Full database setup...\n');
        await db.createIndexes();
        await db.seedDatabase();
        await db.getStats();
        break;

      case 'seed':
        console.log('🌱 Seeding database with sample data...\n');
        await db.seedDatabase();
        await db.getStats();
        break;

      case 'clean':
        console.log('🧹 Cleaning up old data...\n');
        await db.cleanup();
        await db.getStats();
        break;

      case 'stats':
        console.log('📊 Database statistics...\n');
        await db.getStats();
        break;

      case 'backup':
        console.log('💾 Creating database backup...\n');
        const backupPath = await db.backup();
        console.log(`\n✅ Backup completed: ${backupPath}`);
        break;

      case 'drop':
        console.log('⚠️  WARNING: This will delete ALL data!\n');
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        rl.question('Type "DELETE ALL DATA" to confirm: ', async (answer) => {
          if (answer === 'DELETE ALL DATA') {
            await db.dropDatabase();
            console.log('🗑️ Database dropped successfully');
          } else {
            console.log('❌ Operation cancelled');
          }
          rl.close();
          await db.disconnect();
          process.exit(0);
        });
        return; // Don't disconnect yet

      case 'health':
        console.log('🏥 Database health check...\n');
        const health = await db.healthCheck();
        console.log('Health Status:', health.status);
        console.log('Connected:', health.connected);
        if (health.database) {
          console.log('Database:', health.database);
          console.log('Host:', health.host);
          console.log('Port:', health.port);
        }
        if (health.error) {
          console.log('Error:', health.error);
        }
        break;

      case 'indexes':
        console.log('📊 Creating database indexes...\n');
        await db.createIndexes();
        break;

      default:
        console.log('❌ Unknown command:', command);
        console.log('\nAvailable commands:');
        console.log('  setup   - Initialize database with indexes and sample data');
        console.log('  seed    - Add sample data only');
        console.log('  clean   - Clean up old data');
        console.log('  stats   - Show database statistics');
        console.log('  backup  - Create database backup');
        console.log('  drop    - Drop entire database (DANGEROUS!)');
        console.log('  health  - Check database health');
        console.log('  indexes - Create database indexes');
        process.exit(1);
    }

    console.log('\n🎉 Operation completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n\n👋 Shutting down...');
  await db.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n👋 Shutting down...');
  await db.disconnect();
  process.exit(0);
});

main().catch(async (error) => {
  console.error('❌ Fatal error:', error);
  await db.disconnect();
  process.exit(1);
});