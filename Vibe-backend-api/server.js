require('dotenv').config();

// Importing required modules
const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());

// Routing

// configuring port and mongo uri
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// database connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB!'))
    .catch(err => {
        console.error('DB connection failed:', err);
        process.exit(1);
    });

app.listen(PORT, () => console.log(`Server on port ${PORT}`));