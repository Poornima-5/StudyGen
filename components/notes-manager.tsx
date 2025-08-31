'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Search, Edit, Trash2, Download, Copy, Calendar, Tag } from 'lucide-react';
import { NoteData } from '@/types';
import { exportNotes } from '@/lib/export-service';
import { useToast } from '@/hooks/use-toast';

interface NotesManagerProps {
  notes: NoteData[];
  setNotes: (notes: NoteData[]) => void;
}

export function NotesManager({ notes, setNotes }: NotesManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const [filterStyle, setFilterStyle] = useState('all');
  const [editingNote, setEditingNote] = useState<NoteData | null>(null);
  const [savedNotes, setSavedNotes] = useState<NoteData[]>([]);
  const { toast } = useToast();

  // Load saved notes from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('studyNotes');
    if (saved) {
      try {
        const parsedNotes = JSON.parse(saved);
        setSavedNotes(parsedNotes);
      } catch (error) {
        console.error('Error loading saved notes:', error);
      }
    }
  }, []);

  // Combine generated notes with saved notes
  const allNotes = [...notes, ...savedNotes];

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    const notesToSave = allNotes.filter(note => !notes.includes(note));
    localStorage.setItem('studyNotes', JSON.stringify(notesToSave));
  }, [savedNotes, notes, allNotes]);

  // Get all unique tags
  const allTags = Array.from(new Set(allNotes.flatMap(note => note.tags)));

  // Filter notes based on search and filters
  const filteredNotes = allNotes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = filterTag === 'all' || note.tags.includes(filterTag);
    const matchesStyle = filterStyle === 'all' || note.style === filterStyle;
    
    return matchesSearch && matchesTag && matchesStyle;
  });

  const deleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    setSavedNotes(prev => prev.filter(note => note.id !== noteId));
    toast({
      title: 'Note deleted',
      description: 'The note has been permanently deleted.',
    });
  };

  const saveNote = (noteData: NoteData) => {
    const updatedNote = {
      ...noteData,
      updatedAt: new Date(),
    };

    if (notes.some(note => note.id === noteData.id)) {
      setNotes(prev => prev.map(note => note.id === noteData.id ? updatedNote : note));
    } else {
      setSavedNotes(prev => prev.map(note => note.id === noteData.id ? updatedNote : note));
    }
    
    setEditingNote(null);
    toast({
      title: 'Note saved',
      description: 'Your changes have been saved successfully.',
    });
  };

  const handleExport = async (note: NoteData, format: 'pdf' | 'docx' | 'txt' | 'md') => {
    await exportNotes(note.content, `${note.title.slice(0, 30)}.${format}`, format);
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
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>My Study Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterTag} onValueChange={setFilterTag}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {allTags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterStyle} onValueChange={setFilterStyle}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Styles</SelectItem>
                <SelectItem value="bullet">Bullet Points</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
                <SelectItem value="condensed">Condensed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredNotes.map(note => (
          <Card key={note.id} className="h-fit">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{note.title}</CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                    <Badge variant={
                      note.style === 'bullet' ? 'default' :
                      note.style === 'detailed' ? 'secondary' : 'outline'
                    }>
                      {note.style}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(note.content)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingNote(note)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Note</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this note? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteNote(note.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg max-h-32 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">
                    {note.content.slice(0, 200)}
                    {note.content.length > 200 ? '...' : ''}
                  </pre>
                </div>
              </div>
              
              <div className="flex space-x-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => handleExport(note, 'pdf')}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExport(note, 'docx')}>
                  <Download className="h-4 w-4 mr-2" />
                  DOCX
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExport(note, 'txt')}>
                  <Download className="h-4 w-4 mr-2" />
                  TXT
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExport(note, 'md')}>
                  <Download className="h-4 w-4 mr-2" />
                  MD
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || filterTag !== 'all' || filterStyle !== 'all' 
                ? 'No notes match your search criteria.'
                : 'No notes yet. Generate some notes from the Upload or Text Input tabs!'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Note Dialog */}
      {editingNote && (
        <EditNoteDialog
          note={editingNote}
          onSave={saveNote}
          onCancel={() => setEditingNote(null)}
        />
      )}
    </div>
  );
}

function EditNoteDialog({
  note,
  onSave,
  onCancel,
}: {
  note: NoteData;
  onSave: (note: NoteData) => void;
  onCancel: () => void;
}) {
  const [editedNote, setEditedNote] = useState({ ...note });
  const [tagsString, setTagsString] = useState(note.tags.join(', '));

  const handleSave = () => {
    const updatedNote = {
      ...editedNote,
      tags: tagsString.split(',').map(tag => tag.trim()).filter(Boolean),
    };
    onSave(updatedNote);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Note</h2>
          <Button variant="ghost" onClick={onCancel}>
            ×
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input
              value={editedNote.title}
              onChange={(e) => setEditedNote({ ...editedNote, title: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <Textarea
              value={editedNote.content}
              onChange={(e) => setEditedNote({ ...editedNote, content: e.target.value })}
              className="min-h-[300px] font-mono"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Style</label>
              <Select
                value={editedNote.style}
                onValueChange={(value: any) => setEditedNote({ ...editedNote, style: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bullet">Bullet Points</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="condensed">Condensed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Tags</label>
              <Input
                value={tagsString}
                onChange={(e) => setTagsString(e.target.value)}
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}