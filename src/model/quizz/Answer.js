const mongoose = require('mongoose')


const answerSchema = new mongoose.Schema({
    answer: {type: String, min: 2, max: 200, required: true},
    isCorrect: {type: Boolean, required: true}
}, {timestamps: true})

module.exports = { answerSchema: answerSchema, Answer: mongoose.model('Answer', answerSchema)}
