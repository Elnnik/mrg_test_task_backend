const mongoose = require('mongoose')
const questionSchema = require('./Question').questionSchema


const quizzSchema = new mongoose.Schema({
    name: {type: String, min: 6, max: 200, required: true},
    description: {type: String, min: 6, max: 200, required: true},
    questions: {type: [questionSchema], validate: v => Array.isArray(v) && v.length > 0}
}, {timestamps: true})

module.exports = { quizzSchema: quizzSchema, Quizz: mongoose.model('Quizz', quizzSchema)}
