'use client';

import { useCallback, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { SaleRecord } from '@/types';
import { parseCSVFile } from '@/utils/csvParser';

interface FileUploadProps {
  onDataLoaded: (data: SaleRecord[]) => void;
}

export function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Prosím nahrajte soubor ve formátu CSV.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await parseCSVFile(file);
      setFileName(file.name);
      onDataLoaded(data);
    } catch (err) {
      setError('Chyba při zpracování souboru. Zkontrolujte formát dat.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [onDataLoaded]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const clearFile = () => {
    setFileName(null);
    onDataLoaded([]);
    setError(null);
  };

  return (
    <div className="w-full">
      {fileName ? (
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <FileText className="w-5 h-5" />
            <span className="font-medium">{fileName}</span>
          </div>
          <button onClick={clearFile} className="text-green-500 hover:text-green-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50/50'
          }`}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-green-500' : 'text-gray-400'}`} />
          <p className="text-gray-600 font-medium">Přetáhněte CSV soubor sem</p>
          <p className="text-gray-400 text-sm mt-1">nebo klikněte pro výběr souboru</p>
          {isLoading && (
            <div className="mt-3 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            </div>
          )}
        </div>
      )}
      {error && (
        <p className="mt-2 text-red-500 text-sm text-center">{error}</p>
      )}
    </div>
  );
}
