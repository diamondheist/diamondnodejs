require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const firebaseAdmin = require('firebase-admin');
const axios = require('axios');

// Initialize Express
const app = express();
app.use(express.json());

// Initialize Firebase with environment variables
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Fix for newline characters in privateKey
  }),
  storageBucket: 'diamondapp-f0ff9.appspot.com',
});

const db = firebaseAdmin.firestore();
const bucket = firebaseAdmin.storage().bucket();

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Generate Inline Keyboard
const generateStartKeyboard = () => ({
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: 'Open Diamondapp',
          web_app: { url: 'https://diamondheist.netlify.app/' },
        },
      ],
    ],
  },
});

// Handle "/start" Command
bot.onText(/\/start/, async (msg) => {
  const userId = msg.from.id.toString();
  const userRef = db.collection('users').doc(userId);

  let welcomeMessage = `Hi, ${msg.from.first_name}!\nWelcome to DiamondHeist!`;

  const userDoc = await userRef.get();
  if (!userDoc.exists) {
    const userData = {
      firstName: msg.from.first_name,
      lastName: msg.from.last_name || '',
      username: msg.from.username || '',
      languageCode: msg.from.language_code || 'unknown',
      balance: 0,
      referrals: {},
      isPremium: false,
    };

    await userRef.set(userData);
    welcomeMessage += `\n\nYou have been registered successfully!`;
  } else {
    welcomeMessage += `\n\nWelcome back!`;
  }

  bot.sendMessage(userId, welcomeMessage, generateStartKeyboard());
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Bot is running', telegramBot: 'initialized', firebase: 'connected' });
});

// Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
