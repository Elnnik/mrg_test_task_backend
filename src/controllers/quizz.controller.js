const {Quizz, userAnswerToQuizz, User, Token} = require('../model')
const jwt = require('jsonwebtoken')
require('dotenv').config()



async function isUserHasAvailableAttempts(quizzId, userId) {
    const userAttemptsForQuizz = await userAnswerToQuizz.find({
            $and: [{userId: userId}, {quizzId: quizzId}]
        }
    )
    // console.log(userAttemptsForQuizz.length)
    return (userAttemptsForQuizz.length < 3)
}

async function getQuizz(req, res) {

    const quizzId = req.params.id
    // console.log('res.locals: ', res.locals.newAccessToken)

    try {
        console.log('res.locals: ', res.locals.newAccessToken)

        const quizz = await Quizz.findById(quizzId)
        const quizzObjectNoCorrectAnswers = quizz.toObject()

        quizzObjectNoCorrectAnswers.questions.forEach(questionObj => {
            delete questionObj.createdAt
            delete questionObj.updatedAt
            questionObj.answers.forEach(answer => {delete answer.isCorrect; delete answer.createdAt; delete answer.updatedAt})
            }
        )

        const userRequestRefreshToken = req.cookies['refreshToken'];
        const refreshTokenObject = await Token.findOne({token: userRequestRefreshToken});
        const userId = refreshTokenObject.user


        const attemptsCheck = await isUserHasAvailableAttempts(quizzId, userId)
        if ( attemptsCheck ) {
            try {
                const initUserAnswerToQuizz = await userAnswerToQuizz.create({
                    userId: userId,
                    quizzId: quizzId,
                    questions: []
                })
                // console.log(initUserAnswerToQuizz)
                const initUserAnswerToQuizzToken = await initUserAnswerToQuizz.createInitUserAnswerToQuizzToken()
                // console.log(initUserAnswerToQuizzToken)

                if (res.locals.newAccessToken) {
                    return res
                        .cookie('accessToken', res.locals.newAccessToken, {httpOnly: true, sameSite: "strict"})
                        .cookie('initUserAnswerToQuizzToken', initUserAnswerToQuizzToken, {httpOnly: true, sameSite: "strict"})
                        .status(200)
                        .json(quizzObjectNoCorrectAnswers)
                } else {
                    return res
                        .cookie('initUserAnswerToQuizzToken', initUserAnswerToQuizzToken, {httpOnly: true, sameSite: "strict"})
                        .status(200)
                        .json(quizzObjectNoCorrectAnswers)
                }
            } catch (error) {
                return res.status(400).json({"error": "Ошибка при создании болванки 2"})
            }
        }

        return res.status(200).json(quizzObjectNoCorrectAnswers)
    } catch (error) {
        return res.status(400).json({'message': 'Quizz not found', 'details': error})
    }
}

async function createQuizz({body: {name, description, questions}}, res) {
    try {
        const quizz = await Quizz.create({name, description, questions})
        return res.status(200).json({'Created quizz': quizz})
    } catch (error) {
        return res.status(400).json({'message': 'Ошибка при создании теста', 'details': error})
    }
}

async function getQuizzResult (req, res) {
    try {
        const initUserAnswerToQuizzIdCookieToken = req.cookies['initUserAnswerToQuizzToken']
        try {
            const decodedInitUserAnswerToQuizzIdCookieToken = jwt.verify(initUserAnswerToQuizzIdCookieToken,
                process.env.ACCESS_TOKEN_PUBLIC_KEY, {algorithm: 'RS256'})
            const userAnswerToQuizzDocument = await userAnswerToQuizz.findById(decodedInitUserAnswerToQuizzIdCookieToken.initUserAnswerToQuizzId)
            console.log(userAnswerToQuizzDocument)
            const quizzResultData = {
                result: userAnswerToQuizzDocument.result,
                mark: userAnswerToQuizzDocument.mark
            }
            return res.status(200).json(quizzResultData)
        } catch (error) {
            return res.status(400).json({'TokenVerificationError': error})
        }
    } catch (error) {
        return res.status(400).json({'Error 2': error})
    }
}

async function sendQuizzAnswers(req, res) {
    async function returnQuestionCorrectAnswers(userQuestionsWithAnswersList, quizzQuestionsList) {
        let correctAnswersCounter = 0;

        for (const userQuestionWithAnswers of userQuestionsWithAnswersList) {
            // console.log(userQuestionWithAnswers)
            const questionId = userQuestionWithAnswers._id;
            const quizzQuestion = quizzQuestionsList.find(question => (question._id.toString() === questionId));
            // console.log(quizzQuestion.answers);

            const quizzQuestionAnswersList = quizzQuestion.answers;
            const correctAnswersIdsList = quizzQuestionAnswersList.reduce((outputList, answerObject) => (
                answerObject.isCorrect && outputList.push(answerObject._id.toString()), outputList), []);

            // console.log('Correct answers: ', correctAnswersIdsList, typeof correctAnswersIdsList);

            const userAnswers = userQuestionWithAnswers.answers;
            const userAnswersIds = userAnswers.reduce((outputList, answerObject) => (
                outputList.push(answerObject._id), outputList), []);
            // console.log('User answers: ', userAnswersIds);

            userAnswersIds.sort();
            correctAnswersIdsList.sort();

            if (correctAnswersIdsList.length === userAnswersIds.length && correctAnswersIdsList.every(function (u, i) {
                return u === userAnswersIds[i];
            })) correctAnswersCounter++ ;
            // console.log('\n', 'Correct answers counter is: ', correctAnswersCounter)
        }
        return correctAnswersCounter;
    }

    async function resultToMarkConvert(result) {
        if (result >= 0.95) return 5
        if (result >= 0.85 && result < 0.95) return 4
        if (result >= 0.75 && result < 0.85) return 3
        if (result < 0.75) return 2
    }

    try {

        console.log('DEBUG')
        const quizzId = req.params.id;
        const quizz = await Quizz.findOne({_id: quizzId});
        const quizzQuestionsList = quizz.questions;

        const userRequestRefreshToken = req.cookies['refreshToken'];
        const refreshTokenObject = await Token.findOne({token: userRequestRefreshToken});
        const userId = refreshTokenObject.user

        const attemptsCheck = await isUserHasAvailableAttempts(quizzId, userId)
        if ( !attemptsCheck ) {
            return res.status(400).json({'AttemptsError': 'Превышено количество попыток'})
        }

        const initUserAnswerToQuizzIdCookieToken = req.cookies['initUserAnswerToQuizzToken']
        try {
            const decodedInitUserAnswerToQuizzIdCookieToken = jwt.verify(initUserAnswerToQuizzIdCookieToken,
                process.env.ACCESS_TOKEN_PUBLIC_KEY, {algorithm: 'RS256'})
            console.log(decodedInitUserAnswerToQuizzIdCookieToken)

            const userAnswersToQuestionsList = req.body.questions;

            const correctAnswersCount = await returnQuestionCorrectAnswers(userAnswersToQuestionsList, quizzQuestionsList);
            console.log(correctAnswersCount)
            console.log(decodedInitUserAnswerToQuizzIdCookieToken)
            const result = correctAnswersCount / quizzQuestionsList.length;
            const mark = await resultToMarkConvert(result)

            await userAnswerToQuizz.findByIdAndUpdate(decodedInitUserAnswerToQuizzIdCookieToken.initUserAnswerToQuizzId, {
                questions: userAnswersToQuestionsList,
                result: result,
                mark: mark,
                isInit: false
            }, function (error, userAnswer) {
                if (error) return res.status(400).json({'userAnswerToQuizzUpdateError': error})
                console.log(userAnswer)
            })
            console.log('AFTER CREATE')
            return res.status(200).json(quizz)
        } catch (error) {
            return res.status(400).json({'error': error})
        }


    } catch (error) {
        return res.status(400).json(error);
    }
}

module.exports = {getQuizz, createQuizz, sendQuizzAnswers, getQuizzResult}