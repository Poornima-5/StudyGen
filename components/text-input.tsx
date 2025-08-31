'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Copy, Download } from 'lucide-react';
import { NoteData } from '@/types';
import { generateNotes } from '@/lib/ai-service';
import { exportNotes } from '@/lib/export-service';
import { useToast } from '@/hooks/use-toast';

interface TextInputProps {
  onNotesGenerated: (notes: NoteData) => void;
}

export function TextInput({ onNotesGenerated }: TextInputProps) {
  const [inputText, setInputText] = useState('');
  const [noteStyle, setNoteStyle] = useState<'bullet' | 'detailed' | 'condensed'>('bullet');
  const [generatedContent, setGeneratedContent] = useState('');
  const [tags, setTags] = useState('');
  const [processing, setProcessing] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const { toast } = useToast();

  // Real-time preview with debounce
  useEffect(() => {
    if (inputText.length < 50) {
      setPreviewContent('');
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const preview = await generateNotes(inputText.slice(0, 200) + '...', 'bullet');
        setPreviewContent(preview);
      } catch (error) {
        console.error('Error generating preview:', error);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [inputText]);

  const generateFullNotes = async () => {
    if (!inputText.trim()) return;

    setProcessing(true);
    try {
      const notes = await generateNotes(inputText, noteStyle);
      setGeneratedContent(notes);

      const noteData: NoteData = {
        id: Date.now().toString(),
        title: inputText.slice(0, 50) + (inputText.length > 50 ? '...' : ''),
        content: notes,
        style: noteStyle,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        createdAt: new Date(),
        updatedAt: new Date(),
        sourceType: 'text',
      };

      onNotesGenerated(noteData);
    } catch (error) {
      console.error('Error generating notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate notes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'docx' | 'txt' | 'md') => {
    if (generatedContent) {
      await exportNotes(generatedContent, `text-notes.${format}`, format);
    }
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: 'Copied!',
        description: 'Content copied to clipboard',
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Text Input</CardTitle>
          <CardDescription>
            Paste or type your text content to generate study notes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your text content here (notes, articles, textbook chapters, etc.)"
              className="min-h-[200px]"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Note Style</label>
                <Select value={noteStyle} onValueChange={(value: any) => setNoteStyle(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bullet">Quick Bullet Points</SelectItem>
                    <SelectItem value="detailed">Detailed Notes</SelectItem>
                    <SelectItem value="condensed">Ultra-Condensed Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="biology, chapter1, exam"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                />
              </div>
            </div>

            <Button
              onClick={generateFullNotes}
              disabled={!inputText.trim() || processing}
              className="w-full"
            >
              {processing ? 'Generating Notes...' : 'Generate Notes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {previewContent && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-blue-600 dark:text-blue-400">Live Preview</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(previewContent)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              Preview based on the first 200 characters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">{previewContent}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {generatedContent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Notes</CardTitle>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(generatedContent)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExport('pdf')}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExport('docx')}>
                  <Download className="h-4 w-4 mr-2" />
                  DOCX
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExport('txt')}>
                  <Download className="h-4 w-4 mr-2" />
                  TXT
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExport('md')}>
                  <Download className="h-4 w-4 mr-2" />
                  MD
                </Button>
              </div>
            </div>
            {tags && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <Textarea
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              className="min-h-[300px] font-mono"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}