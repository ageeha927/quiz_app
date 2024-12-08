import React, { useState, useEffect } from 'react'
import questionsData from './quiz-questions.json'

function QuestionCreationForm({ onAddQuestion, onCancel }) {
    const [newQuestion, setNewQuestion] = useState({
        question: '',
        choices: ['', '', '', ''],
        correctAnswer: '',
        isBonus: false
    })

    const handleInputChange = (e, index = null) => {
        const { name, value, type, checked } = e.target
        if (name === 'choices' && index !== null) {
            const updatedChoices = [...newQuestion.choices]
            updatedChoices[index] = value
            setNewQuestion(prev => ({
                ...prev,
                choices: updatedChoices
            }))
        } else if (type === 'checkbox') {
            setNewQuestion(prev => ({
                ...prev,
                [name]: checked
            }))
        } else {
            setNewQuestion(prev => ({
                ...prev,
                [name]: value
            }))
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!newQuestion.question.trim()) {
            alert('Please enter a question')
            return
        }
        if (newQuestion.choices.some(choice => !choice.trim())) {
            alert('Please fill in all choices')
            return
        }
        if (!newQuestion.correctAnswer.trim()) {
            alert('Please select a correct answer')
            return
        }
        const questionToAdd = {
            ...newQuestion,
            id: Date.now(),
            choices: newQuestion.choices
        }
        onAddQuestion(questionToAdd)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-200 to-cyan-200 p-4 font-lato">
            <div className="bg-white shadow-xl rounded-xl w-full max-w-2xl p-6">
                <h2 className="text-2xl font-bold text-blue-800 mb-4">Create New Question</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="question" className="block text-gray-700 font-bold mb-2">
                            Question
                        </label>
                        <input
                            type="text"
                            id="question"
                            name="question"
                            value={newQuestion.question}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your question"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <p className="block text-gray-700 font-bold mb-2">Choices</p>
                        {newQuestion.choices.map((choice, index) => (
                            <div key={index} className="mb-2 flex items-center">
                                <input
                                    type="text"
                                    name="choices"
                                    value={choice}
                                    onChange={(e) => handleInputChange(e, index)}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder={`Choice ${index + 1}`}
                                    required
                                />
                                <input
                                    type="radio"
                                    name="correctAnswer"
                                    value={choice}
                                    checked={newQuestion.correctAnswer === choice}
                                    onChange={handleInputChange}
                                    className="ml-2"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="mb-4 flex items-center">
                        <input
                            type="checkbox"
                            id="isBonus"
                            name="isBonus"
                            checked={newQuestion.isBonus}
                            onChange={handleInputChange}
                            className="mr-2"
                        />
                        <label htmlFor="isBonus" className="text-gray-700">
                            Bonus Question
                        </label>
                    </div>

                    <div className="flex space-x-4">
                        <button
                            type="submit"
                            className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Add Question
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="w-full py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function Quiz() {
    const [quizQuestions, setQuizQuestions] = useState([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState(null)
    const [score, setScore] = useState(0)
    const [feedback, setFeedback] = useState('')
    const [isAnswerLocked, setIsAnswerLocked] = useState(false)
    const [quizCompleted, setQuizCompleted] = useState(false)
    const [showQuestionForm, setShowQuestionForm] = useState(false)

    useEffect(() => {
        const combineAndSortQuestions = (initialQuestions, storedQuestions = []) => {
            const combinedQuestions = [...initialQuestions, ...storedQuestions]
            const nonBonusQuestions = combinedQuestions.filter(q => !q.isBonus)
            const bonusQuestions = combinedQuestions.filter(q => q.isBonus)
            return [...nonBonusQuestions, ...bonusQuestions]
        }
        const initialQuestions = questionsData.questions
        const storedQuestions = localStorage.getItem('quizQuestions')

        let parsedStoredQuestions = []
        if (storedQuestions) {
            try {
                parsedStoredQuestions = JSON.parse(storedQuestions).questions
            } catch (error) {
                console.error('Error parsing stored questions:', error)
            }
        }
        setQuizQuestions(combineAndSortQuestions(initialQuestions, parsedStoredQuestions))
    }, [])

    const currentQuestion = quizQuestions[currentQuestionIndex]

    const handleAddQuestion = (newQuestion) => {
        //ensures bonus questions are moved to the end
        const updatedQuestions = [...quizQuestions, newQuestion]
        const nonBonusQuestions = updatedQuestions.filter(q => !q.isBonus)
        const bonusQuestions = updatedQuestions.filter(q => q.isBonus)
        
        const finalQuestionOrder = [...nonBonusQuestions, ...bonusQuestions]

        //updates local storage
        localStorage.setItem('quizQuestions', JSON.stringify({ 
            questions: finalQuestionOrder.filter(q => !questionsData.questions.some(orig => orig.id === q.id))
        }))

        setQuizQuestions(finalQuestionOrder)
        setShowQuestionForm(false)
    }

    const handleAnswerSelect = (answer) => {
        if (isAnswerLocked) return
        setSelectedAnswer(answer)
        setIsAnswerLocked(true)
        if (answer === currentQuestion.correctAnswer) {
            setFeedback('Correct!')
            if (currentQuestion.isBonus) {
                setScore(prevScore => prevScore + 2)
            } else {
                setScore(prevScore => prevScore + 1)
            }
        } else {
            setFeedback(`Incorrect. The correct answer is ${currentQuestion.correctAnswer}.`)
            
            if (currentQuestion.isBonus) {
                setScore(prevScore => Math.max(0, prevScore - 1))
            }
        }
    }

    const handleNextQuestion = () => {
        if (currentQuestionIndex < quizQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
            setSelectedAnswer(null)
            setFeedback('')
            setIsAnswerLocked(false)
        } else {
            setQuizCompleted(true)
        }
    }

    const resetQuiz = () => {
        setCurrentQuestionIndex(0)
        setScore(0)
        setSelectedAnswer(null)
        setFeedback('')
        setIsAnswerLocked(false)
        setQuizCompleted(false)
    }

    //quiz completed
    if (quizCompleted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-200 to-cyan-200 p-4">
                <div className="bg-white shadow-xl rounded-xl w-full max-w-2xl p-8 text-center mb-6">
                    <h2 className="text-4xl font-bold mb-6 text-blue-800">Quiz Completed!</h2>
                    <p className="text-3xl font-bold mb-8">Your Score: {score} / {quizQuestions.length}</p>
                    <div className="flex space-x-4">
                        <button 
                            onClick={resetQuiz} 
                            className="w-full py-4 px-6 bg-blue-500 text-white rounded-lg text-xl hover:bg-blue-600 transition-colors"
                        >
                            Retake Quiz
                        </button>
                        <button 
                            onClick={() => setShowQuestionForm(true)} 
                            className="w-full py-4 px-6 bg-blue-500 text-white rounded-lg text-xl hover:bg-blue-600 transition-colors"
                        >
                            Add Questions
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    //question form
    if (showQuestionForm) {
        return (
            <QuestionCreationForm 
                onAddQuestion={handleAddQuestion} 
                onCancel={() => setShowQuestionForm(false)}
            />
        )
    }

    //prevent rendering if no questions are loaded
    if (!currentQuestion) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-200 to-cyan-200 p-4">
                <p className="text-2xl text-blue-800">Loading questions...</p>
            </div>
        )
    }

    //quiz display
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-200 to-cyan-200 p-4 font-lato">
            <div className="bg-white shadow-xl rounded-xl w-full max-w-2xl p-6 font-lato">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-blue-800">Quiz</h1>
                    <p className="text-xl mt-2">
                        Score: {score} | Question {currentQuestionIndex + 1}/{quizQuestions.length}
                    </p>
                </div>

                <div className="p-4">
                    {currentQuestion.isBonus && (
                        <div className="text-yellow-600 font-bold text-2xl mb-4 text-center">
                            BONUS QUESTION 
                        </div>
                    )}
                    <p className="text-2xl font-semibold mb-6 text-center">
                        {currentQuestion.question}
                    </p>

                    <div className="space-y-4">
                        {currentQuestion.choices.map((choice, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswerSelect(choice)}
                                disabled={isAnswerLocked}
                                className={`
                                    w-full py-4 text-xl rounded-lg transition-colors 
                                    ${isAnswerLocked 
                                        ? (choice === currentQuestion.correctAnswer 
                                            ? 'bg-blue-500 text-white' 
                                            : choice === selectedAnswer 
                                                ? 'bg-red-500 text-white' 
                                                : 'bg-gray-200 text-gray-500')
                                        : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                                    }
                                    disabled:cursor-not-allowed
                                `}
                            >
                                {choice}
                            </button>
                        ))}
                    </div>

                    {feedback && (
                        <div className={`
                            mt-6 p-4 rounded-lg text-center text-xl 
                            ${feedback.includes('Correct') 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-red-100 text-red-800'
                            }
                        `}>
                            {feedback}
                        </div>
                    )}

                    {isAnswerLocked && (
                        <button 
                            onClick={handleNextQuestion} 
                            className="w-full mt-6 py-4 bg-blue-500 text-white rounded-lg text-xl hover:bg-blue-600 transition-colors"
                        >
                            {currentQuestionIndex < quizQuestions.length - 1 
                                ? 'Next Question' 
                                : 'Finish Quiz'}
                        </button>
                    )}
                </div>
            </div>
            <button 
                onClick={() => setShowQuestionForm(true)} 
                className="w-full max-w-2xl mt-4 py-4 px-6 bg-blue-500 text-white rounded-lg text-xl hover:bg-blue-600 transition-colors"
            >
                Add New Questions
            </button>
        </div>
    )
}

export default Quiz