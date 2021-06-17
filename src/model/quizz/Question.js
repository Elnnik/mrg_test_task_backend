const mongoose = require('mongoose')
const answerSchema = require('./Answer').answerSchema


const questionSchema = mongoose.Schema({
        question: {type: String, min: 6, max: 200, required: true},
        answers: [answerSchema]
    }, {timestamps: true}
)

module.exports = { questionSchema: questionSchema, Question: mongoose.model('Question', questionSchema)}

