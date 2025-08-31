'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, RefreshCw, Server } from 'lucide-react';
import { checkOllamaConnection, getAvailableModels } from '@/lib/ai-service';

export function OllamaStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('llama2');
  const [checking, setChecking] = useState(false);

  const checkConnection = async () => {
    setChecking(true);
    try {
      const connected = await checkOllamaConnection();
      setIsConnected(connected);
      
      if (connected) {
        const models = await getAvailableModels();
        setAvailableModels(models);
        
        // Set default model if available
        if (models.length > 0 && !models.includes(selectedModel)) {
          setSelectedModel(models[0]);
        }
      }
    } catch (error) {
      setIsConnected(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  // Save selected model to localStorage
  useEffect(() => {
    localStorage.setItem('selectedOllamaModel', selectedModel);
  }, [selectedModel]);

  // Load selected model from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('selectedOllamaModel');
    if (saved) {
      setSelectedModel(saved);
    }
  }, []);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Server className="h-5 w-5" />
          <span>Ollama Connection</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isConnected === null ? (
                <Badge variant="secondary">Checking...</Badge>
              ) : isConnected ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <Badge variant="default" className="bg-green-600">Connected</Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <Badge variant="destructive">Disconnected</Badge>
                </>
              )}
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={checkConnection}
              disabled={checking}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
              Check
            </Button>
          </div>

          {!isConnected && isConnected !== null && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Ollama Not Connected
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Make sure Ollama is installed and running on localhost:11434
                  </p>
                  <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                    <p>To start Ollama:</p>
                    <code className="bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded">
                      ollama serve
                    </code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isConnected && availableModels.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Model</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map(model => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}