'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/header';
import { FileUpload } from '@/components/file-upload';
import { TextInput } from '@/components/text-input';
import { NotesManager } from '@/components/notes-manager';
import { FlashcardGenerator } from '@/components/flashcard-generator';
import { QuizGenerator } from '@/components/quiz-generator';
import { TodoList } from '@/components/todo-list';
import { OllamaStatus } from '@/components/ollama-status';
import { NoteData } from '@/types';
import { Toaster } from '@/components/ui/toaster';

export default function Home() {
  const [generatedNotes, setGeneratedNotes] = useState<NoteData[]>([]);
  const [activeTab, setActiveTab] = useState('upload');

  const handleNotesGenerated = (notes: NoteData) => {
    setGeneratedNotes(prev => [notes, ...prev]);
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Study Notes Generator
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Transform your study materials into organized notes, flashcards, and quizzes using your local Ollama model.
              </p>
            </div>

            <OllamaStatus />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-6 mb-8">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="text">Text Input</TabsTrigger>
                <TabsTrigger value="notes">My Notes</TabsTrigger>
                <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
                <TabsTrigger value="quiz">Quiz</TabsTrigger>
                <TabsTrigger value="todo">To-Do</TabsTrigger>
              </TabsList>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  <TabsContent value="upload" className="mt-0">
                    <FileUpload onNotesGenerated={handleNotesGenerated} />
                  </TabsContent>

                  <TabsContent value="text" className="mt-0">
                    <TextInput onNotesGenerated={handleNotesGenerated} />
                  </TabsContent>

                  <TabsContent value="notes" className="mt-0">
                    <NotesManager notes={generatedNotes} setNotes={setGeneratedNotes} />
                  </TabsContent>

                  <TabsContent value="flashcards" className="mt-0">
                    <FlashcardGenerator />
                  </TabsContent>

                  <TabsContent value="quiz" className="mt-0">
                    <QuizGenerator />
                  </TabsContent>

                  <TabsContent value="todo" className="mt-0">
                    <TodoList />
                  </TabsContent>
                </div>

                <div className="lg:col-span-1">
                  <div className="sticky top-4">
                    <TodoList compact />
                  </div>
                </div>
              </div>
            </Tabs>
          </div>
        </main>
      </div>
      <Toaster />
    </ThemeProvider>
  );
}