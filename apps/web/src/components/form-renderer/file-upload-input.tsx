'use client';

import { useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';

export interface UploadedFileValue {
  key: string;
  filename: string;
  contentType: string;
  publicUrl: string;
}

interface FileUploadInputProps {
  formId: string;
  questionId: string;
  uploadType: 'file_upload' | 'photo_upload' | 'video_upload';
  value: UploadedFileValue | null;
  onChange: (val: UploadedFileValue | null) => void;
  accept?: string;
  label: string;
}

export function FileUploadInput({
  formId,
  questionId,
  uploadType,
  value,
  onChange,
  accept,
  label,
}: FileUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File) {
    setError('');
    setUploading(true);
    try {
      const { uploadUrl, key, publicUrl } = await apiFetch<{
        uploadUrl: string;
        key: string;
        publicUrl: string;
      }>('/storage/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          formId,
          questionId,
          filename: file.name,
          contentType: file.type,
          uploadType,
          fileSize: file.size,
        }),
      });

      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!putRes.ok) {
        throw new Error('Upload failed. Please try again.');
      }

      onChange({
        key,
        filename: file.name,
        contentType: file.type,
        publicUrl,
      });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Upload failed. Please try again.',
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        aria-label={label}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {value ? (
        <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
          <span className="text-sm text-slate-700 truncate">{value.filename}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-red-600 hover:text-red-700 font-medium ml-2"
          >
            Remove file
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-slate-300 rounded-lg p-6 text-center text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Click to choose a file or drag and drop here'}
        </button>
      )}

      {error && (
        <p role="alert" className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
