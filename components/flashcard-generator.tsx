'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw, ChevronLeft, ChevronRight, Download, Shuffle } from 'lucide-react';
import { Flashcard } from '@/types';
import { generateFlashcards } from '@/lib/ai-service';
import { exportFlashcards } from '@/lib/export-service';
import { useToast }  from '@/hooks/use-toast';

export function FlashcardGenerator() {
  const [inputContent, setInputContent] = useState('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [tags, setTags] = useState('');
  const [processing, setProcessing] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const { toast } = useToast();

  // Load flashcards from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('flashcards');
    if (saved) {
      try {
        setFlashcards(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading flashcards:', error);
      }
    }
  }, []);

  // Save flashcards to localStorage
  useEffect(() => {
    localStorage.setItem('flashcards', JSON.stringify(flashcards));
  }, [flashcards]);

  const generateCards = async () => {
    if (!inputContent.trim()) return;

    setProcessing(true);
    try {
      const newCards = await generateFlashcards(inputContent, difficulty);
      const cardsWithMetadata = newCards.map(card => ({
        ...card,
        id: Date.now().toString() + Math.random().toString(36),
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        createdAt: new Date(),
        difficulty,
      }));
      
      setFlashcards(prev => [...cardsWithMetadata, ...prev]);
      setInputContent('');
      setTags('');
      
      toast({
        title: 'Flashcards Generated!',
        description: `Created ${newCards.length} new flashcards`,
      });
    } catch (error) {
      console.error('Error generating flashcards:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate flashcards. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    setIsFlipped(false);
  };

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    setIsFlipped(false);
  };

  const shuffleCards = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleExport = async () => {
    if (flashcards.length > 0) {
      await exportFlashcards(flashcards, 'flashcards.json');
    }
  };

  const currentCard = flashcards[currentIndex];

  return (
    <div className="space-y-6">
      {/* Generate Flashcards */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Flashcards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder="Paste your study content here to generate flashcards..."
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
              onClick={generateCards}
              disabled={!inputContent.trim() || processing}
              className="w-full"
            >
              {processing ? 'Generating Flashcards...' : 'Generate Flashcards'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Flashcard Viewer */}
      {flashcards.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Flashcards ({currentIndex + 1} of {flashcards.length})
              </CardTitle>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={shuffleCards}>
                  <Shuffle className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {currentCard && (
              <div className="space-y-4">
                {/* Card */}
                <div 
                  className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-8 min-h-[200px] cursor-pointer transition-all duration-300 hover:shadow-lg"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant={
                      currentCard.difficulty === 'easy' ? 'secondary' :
                      currentCard.difficulty === 'medium' ? 'default' : 'destructive'
                    }>
                      {currentCard.difficulty}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFlipped(!isFlipped);
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      {isFlipped ? currentCard.back : currentCard.front}
                    </p>
                    <p className="text-sm text-gray-500 mt-4">
                      Click to {isFlipped ? 'show question' : 'reveal answer'}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                {currentCard.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {currentCard.tags.map(tag => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={prevCard}
                    disabled={flashcards.length <= 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant={studyMode ? 'default' : 'outline'}
                      onClick={() => setStudyMode(!studyMode)}
                    >
                      Study Mode
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={nextCard}
                    disabled={flashcards.length <= 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Flashcard List */}
      {flashcards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Flashcards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {flashcards.map((card, index) => (
                <div
                  key={card.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    index === currentIndex
                      ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => {
                    setCurrentIndex(index);
                    setIsFlipped(false);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-sm">{card.front}</p>
                    <Badge
                      variant={
                        card.difficulty === 'easy' ? 'secondary' :
                        card.difficulty === 'medium' ? 'default' : 'destructive'
                      }
                      className="text-xs"
                    >
                      {card.difficulty}
                    </Badge>
                  </div>
                  {card.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {card.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}