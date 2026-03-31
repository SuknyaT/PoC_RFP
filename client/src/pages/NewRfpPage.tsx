import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText } from 'lucide-react';
import { useRfpStore } from '../store/rfpStore';

export default function NewRfpPage() {
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const { uploadRfp, parseRfp } = useRfpStore();
  const navigate = useNavigate();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setError('');
    setUploading(true);

    try {
      const rfp = await uploadRfp(acceptedFiles[0]);
      setUploading(false);
      setParsing(true);

      await parseRfp(rfp.id);
      navigate(`/rfps/${rfp.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      setUploading(false);
      setParsing(false);
    }
  }, [uploadRfp, parseRfp, navigate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload New RFP</h2>

      <div className="max-w-2xl mx-auto">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />

          {uploading ? (
            <div>
              <div className="animate-spin h-12 w-12 border-2 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700">Uploading document...</p>
            </div>
          ) : parsing ? (
            <div>
              <div className="animate-spin h-12 w-12 border-2 border-gray-300 border-t-green-600 rounded-full mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700">AI is parsing your RFP document...</p>
              <p className="text-sm text-gray-500 mt-2">Extracting title, scoring criteria, and key details</p>
            </div>
          ) : (
            <>
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700">
                {isDragActive ? 'Drop your RFP document here' : 'Drag & drop your RFP document'}
              </p>
              <p className="text-sm text-gray-500 mt-2">or click to browse. Supports PDF, TXT (max 50MB)</p>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg">{error}</div>
        )}

        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-3">What happens after upload?</h3>
          <ol className="space-y-3">
            {[
              'Document text is extracted from the PDF',
              'AI analyzes the RFP to extract key fields and scoring criteria',
              'You can review and correct the extracted data',
              'Link competitors and generate an optimized proposal',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-gray-600">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
