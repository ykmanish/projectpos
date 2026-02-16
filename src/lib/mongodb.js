// lib/mongodb.js

import { MongoClient } from 'mongodb';

// Set custom DNS servers (Google and Cloudflare)
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const uri = process.env.MONGODB_URI;
const options = {
  family: 4, // Force IPv4 to avoid IPv6 DNS issues
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds if server not selected
  connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 2, // Maintain at least 2 socket connections
};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
  // In development, use a global variable so HMR doesn't create multiple connections
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect()
      .then(client => {
        console.log('✅ MongoDB connected successfully in development');
        return client;
      })
      .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        throw err;
      });
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, it's best not to use a global variable
  client = new MongoClient(uri, options);
  clientPromise = client.connect()
    .then(client => {
      console.log('✅ MongoDB connected successfully in production');
      return client;
    })
    .catch(err => {
      console.error('❌ MongoDB connection error:', err);
      throw err;
    });
}

export default clientPromise;