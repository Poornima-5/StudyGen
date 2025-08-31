"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Upload, X, Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NoteData } from "@/types";
import { generateNotes } from "@/lib/ai-service";
import { exportNotes } from "@/lib/export-service";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface FileUploadProps {
  onNotesGenerated: (notes: NoteData) => void;
}

export function FileUpload({ onNotesGenerated }: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [noteStyle, setNoteStyle] = useState<
    "bullet" | "detailed" | "condensed"
  >("bullet");
  const [generatedContent, setGeneratedContent] = useState("");
  const [tags, setTags] = useState("");

  // ✅ Fix hydration mismatch: generate IDs & dates only on client
  const [noteMeta, setNoteMeta] = useState<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
  } | null>(null);

  useEffect(() => {
    setNoteMeta({
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "text/plain": [".txt"],
    },
    multiple: true,
  });

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    if (uploadedFiles.length === 0) return;

    setProcessing(true);
    setProgress(0);

    try {
      // Simulate file processing
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Process files and generate notes
      const fileContents = await Promise.all(
        uploadedFiles.map(async (file) => {
          if (file.type === "text/plain") {
            return await file.text();
          }
          // For PDF/DOC files, we'll simulate extraction for now
          return `Content from ${file.name}: This is simulated content for demonstration purposes. In a real implementation, this would contain the actual extracted text from the PDF or Word document.`;
        })
      );

      const combinedContent = fileContents.join("\n\n");
      const notes = await generateNotes(combinedContent, noteStyle);

      setProgress(100);
      setGeneratedContent(notes);

      const noteData: NoteData = {
        id: noteMeta?.id || "temp-id",
        title:
          uploadedFiles.length === 1
            ? uploadedFiles[0].name
            : `Notes from ${uploadedFiles.length} files`,
        content: notes,
        style: noteStyle,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        createdAt: noteMeta?.createdAt || new Date(0),
        updatedAt: noteMeta?.updatedAt || new Date(0),
        sourceType: "file",
        originalFileName:
          uploadedFiles.length === 1 ? uploadedFiles[0].name : undefined,
      };

      onNotesGenerated(noteData);
    } catch (error) {
      console.error("Error processing files:", error);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const handleExport = async (format: "pdf" | "docx" | "txt" | "md") => {
    if (generatedContent) {
      await exportNotes(generatedContent, `generated-notes.${format}`, format);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Upload PDF, DOC, DOCX, or text files to generate study notes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-blue-600 font-medium">
                Drop the files here...
              </p>
            ) : (
              <div>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Drag and drop files here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Supports PDF, DOC, DOCX, and TXT files
                </p>
              </div>
            )}
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium">Uploaded Files:</h4>
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Note Style</label>
              <Select
                value={noteStyle}
                onValueChange={(value: any) => setNoteStyle(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bullet">Quick Bullet Points</SelectItem>
                  <SelectItem value="detailed">Detailed Notes</SelectItem>
                  <SelectItem value="condensed">
                    Ultra-Condensed Summary
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Tags (comma-separated)
              </label>
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
            onClick={processFiles}
            disabled={uploadedFiles.length === 0 || processing}
            className="w-full mt-4"
          >
            {processing ? "Processing..." : "Generate Notes"}
          </Button>

          {processing && (
            <div className="mt-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center text-gray-500 mt-2">
                Processing your files... {progress}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {generatedContent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Notes</CardTitle>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport("pdf")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport("docx")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  DOCX
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport("txt")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  TXT
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport("md")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  MD
                </Button>
              </div>
            </div>
            {tags && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean)
                  .map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <Textarea
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              className="min-h-[300px] font-mono"
              placeholder="Generated notes will appear here..."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
