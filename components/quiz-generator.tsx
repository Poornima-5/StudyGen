'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, RotateCcw, Download } from 'lucide-react';
import { MCQuestion, QuizResult } from '@/types';
import { generateMCQs } from '@/lib/ai-service';
import { useToast } from '@/hooks/use-toast';

export function QuizGenerator() {
  const [inputContent, setInputContent] = useState('');
  const [questions, setQuestions] = useState<MCQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: number }>({});
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [tags, setTags] = useState('');
  const [processing, setProcessing] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const { toast } = useToast();

  // Load questions and results from localStorage
  useEffect(() => {
    const savedQuestions = localStorage.getItem('mcQuestions');
    const savedResults = localStorage.getItem('quizResults');
    
    if (savedQuestions) {
      try {
        setQuestions(JSON.parse(savedQuestions));
      } catch (error) {
        console.error('Error loading questions:', error);
      }
    }
    
    if (savedResults) {
      try {
        setQuizResults(JSON.parse(savedResults));
      } catch (error) {
        console.error('Error loading quiz results:', error);
      }
    }
  }, []);

  // Save questions and results to localStorage
  useEffect(() => {
    localStorage.setItem('mcQuestions', JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem('quizResults', JSON.stringify(quizResults));
  }, [quizResults]);

  const generateQuestions = async () => {
    if (!inputContent.trim()) return;

    setProcessing(true);
    try {
      const newQuestions = await generateMCQs(inputContent, difficulty);
      const questionsWithMetadata = newQuestions.map(question => ({
        ...question,
        id: Date.now().toString() + Math.random().toString(36),
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        createdAt: new Date(),
        difficulty,
      }));
      
      setQuestions(prev => [...questionsWithMetadata, ...prev]);
      setInputContent('');
      setTags('');
      
      toast({
        title: 'Questions Generated!',
        description: `Created ${newQuestions.length} new questions`,
      });
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate questions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const finishQuiz = () => {
    setShowResults(true);
    
    const answers = questions.map(question => ({
      questionId: question.id,
      selectedAnswer: selectedAnswers[question.id] ?? -1,
      correct: selectedAnswers[question.id] === question.correctAnswer,
    }));

    const score = answers.filter(answer => answer.correct).length;
    
    const result: QuizResult = {
      id: Date.now().toString(),
      score,
      totalQuestions: questions.length,
      answers,
      completedAt: new Date(),
    };

    setQuizResults(prev => [result, ...prev]);

    toast({
      title: 'Quiz Complete!',
      description: `You scored ${score}/${questions.length} (${Math.round((score / questions.length) * 100)}%)`,
    });
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Generate Questions */}
      {!quizStarted && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Quiz Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                placeholder="Paste your study content here to generate multiple-choice questions..."
                className="min-h-[120px]"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulty Level</label>
                  <Select value={difficulty} onValueChange={(value: any) => setDifficulty(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tags (comma-separated)</label>
                  <Input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="biology, chapter1, exam"
                  />
                </div>
              </div>
              
              <Button
                onClick={generateQuestions}
                disabled={!inputContent.trim() || processing}
                className="w-full"
              >
                {processing ? 'Generating Questions...' : 'Generate Questions'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start Quiz */}
      {questions.length > 0 && !quizStarted && (
        <Card>
          <CardHeader>
            <CardTitle>Available Questions ({questions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                You have {questions.length} questions ready for a quiz.
              </p>
              <Button onClick={startQuiz} className="w-full">
                Start Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiz Interface */}
      {quizStarted && !showResults && currentQuestion && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Question {currentQuestionIndex + 1} of {questions.length}
              </CardTitle>
              <Badge variant={
                currentQuestion.difficulty === 'easy' ? 'secondary' :
                currentQuestion.difficulty === 'medium' ? 'default' : 'destructive'
              }>
                {currentQuestion.difficulty}
              </Badge>
            </div>
            <Progress value={progress} className="w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-lg font-medium">{currentQuestion.question}</p>
              </div>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedAnswers[currentQuestion.id] === index
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center font-medium">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span>{option}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={prevQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                
                <Button
                  onClick={nextQuestion}
                  disabled={selectedAnswers[currentQuestion.id] === undefined}
                >
                  {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiz Results */}
      {showResults && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Quiz Results</CardTitle>
              <Button size="sm" variant="outline" onClick={resetQuiz}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Take Again
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Score Summary */}
              <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
                <h3 className="text-2xl font-bold mb-2">
                  {Object.values(selectedAnswers).filter((answer, index) => answer === questions[index]?.correctAnswer).length}/{questions.length}
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  {Math.round((Object.values(selectedAnswers).filter((answer, index) => answer === questions[index]?.correctAnswer).length / questions.length) * 100)}% Correct
                </p>
              </div>

              {/* Question Review */}
              <div className="space-y-4">
                {questions.map((question, index) => {
                  const selectedAnswer = selectedAnswers[question.id];
                  const isCorrect = selectedAnswer === question.correctAnswer;
                  
                  return (
                    <div
                      key={question.id}
                      className={`p-4 rounded-lg border-2 ${
                        isCorrect
                          ? 'border-green-200 bg-green-50 dark:bg-green-900/20'
                          : 'border-red-200 bg-red-50 dark:bg-red-900/20'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {isCorrect ? (
                          <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-600 mt-1" />
                        )}
                        
                        <div className="flex-1">
                          <p className="font-medium mb-2">{question.question}</p>
                          
                          <div className="space-y-1 text-sm">
                            <p>
                              <span className="font-medium">Your answer:</span>{' '}
                              {selectedAnswer !== undefined ? question.options[selectedAnswer] : 'No answer selected'}
                            </p>
                            {!isCorrect && (
                              <p>
                                <span className="font-medium">Correct answer:</span>{' '}
                                {question.options[question.correctAnswer]}
                              </p>
                            )}
                            <p className="text-gray-600 dark:text-gray-300 mt-2">
                              <span className="font-medium">Explanation:</span> {question.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Previous Results */}
      {quizResults.length > 0 && !quizStarted && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Quiz Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quizResults.slice(0, 5).map(result => (
                <div key={result.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium">
                      {result.score}/{result.totalQuestions} ({Math.round((result.score / result.totalQuestions) * 100)}%)
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(result.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={result.score / result.totalQuestions >= 0.8 ? 'default' : 
                                  result.score / result.totalQuestions >= 0.6 ? 'secondary' : 'destructive'}>
                    {result.score / result.totalQuestions >= 0.8 ? 'Excellent' :
                     result.score / result.totalQuestions >= 0.6 ? 'Good' : 'Needs Improvement'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}