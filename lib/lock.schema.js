const mongoose = require('mongoose');

/**
 * Schema for locks stored in database
 *
 * @param {integer} expires Lock expiry time (in seconds)
 */
module.exports = (expires) => (
    new mongoose.Schema({
        createdAt: {
            default: Date.now,
            expires,
            required: true,
            type: Date
        },
        tag: {
            index: true,
            required: true,
            type: String,
            unique: true
        }
    })
);
