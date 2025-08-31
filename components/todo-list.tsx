'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus } from 'lucide-react';
import { TodoItem } from '@/types';
import { cn } from '@/lib/utils';

interface TodoListProps {
  compact?: boolean;
}

export function TodoList({ compact = false }: TodoListProps) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState('');

  // Load todos from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('todos');
    if (saved) {
      try {
        setTodos(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading todos:', error);
      }
    }
  }, []);

  // Save todos to localStorage
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (!newTodo.trim()) return;

    const todo: TodoItem = {
      id: Date.now().toString(),
      text: newTodo.trim(),
      completed: false,
      createdAt: new Date(),
    };

    setTodos(prev => [todo, ...prev]);
    setNewTodo('');
  };

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  const completedCount = todos.filter(todo => todo.completed).length;

  return (
    <Card className={cn(compact && "h-fit")}>
      <CardHeader className={cn(compact && "pb-3")}>
        <CardTitle className={cn("flex items-center justify-between", compact && "text-lg")}>
          <span>{compact ? 'Quick Tasks' : 'Study To-Do List'}</span>
          {!compact && (
            <span className="text-sm font-normal text-gray-500">
              {completedCount}/{todos.length} completed
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(compact && "pt-0")}>
        <div className="space-y-4">
          {/* Add new todo */}
          <div className="flex space-x-2">
            <Input
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={compact ? "Add task..." : "Add a new study task..."}
              className={cn(compact && "text-sm")}
            />
            <Button size={compact ? "sm" : "default"} onClick={addTodo}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Todo list */}
          <div className={cn("space-y-2", compact && "max-h-64 overflow-y-auto")}>
            {todos.map(todo => (
              <div
                key={todo.id}
                className={cn(
                  "flex items-center space-x-3 p-2 rounded-lg transition-colors",
                  todo.completed 
                    ? "bg-green-50 dark:bg-green-900/20" 
                    : "bg-gray-50 dark:bg-gray-800",
                  compact && "p-2"
                )}
              >
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={() => toggleTodo(todo.id)}
                />
                <span
                  className={cn(
                    "flex-1 text-left",
                    todo.completed && "line-through text-gray-500 dark:text-gray-400",
                    compact && "text-sm"
                  )}
                >
                  {todo.text}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteTodo(todo.id)}
                  className={cn(compact && "h-6 w-6 p-1")}
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            ))}
          </div>

          {todos.length === 0 && (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              <p className={cn(compact && "text-sm")}>
                {compact ? 'No tasks yet' : 'No study tasks yet. Add one above!'}
              </p>
            </div>
          )}

          {!compact && completedCount > 0 && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTodos(prev => prev.filter(todo => !todo.completed))}
                className="w-full"
              >
                Clear Completed ({completedCount})
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}