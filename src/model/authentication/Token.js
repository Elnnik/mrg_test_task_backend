const mongoose = require('mongoose')


const tokenSchema = new mongoose.Schema({
    token: {type: String, default: ""},
    user: {type: mongoose.Schema.Types.ObjectId, ref: "User"}
}, {timestamps: true});

module.exports =  mongoose.model('Token', tokenSchema)
