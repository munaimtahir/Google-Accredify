import React, { useState } from 'react';
import { FileUp, Sparkles, Download, Loader2, Clipboard, Check } from 'lucide-react';
import { api } from '../services/api';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set workerSrc for pdf.js. This is required for it to work in a web environment.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.3.136/build/pdf.worker.mjs';

const Converter: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [csvContent, setCsvContent] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError('');
            setCsvContent('');
        }
    };

    const handleConvert = async () => {
        if (!file) {
            setError('Please select a file first.');
            return;
        }
        setIsLoading(true);
        setError('');
        setCsvContent('');

        try {
            let textContent = '';
            const arrayBuffer = await file.arrayBuffer();

            if (file.type === 'application/pdf') {
                const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                const pageTexts = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map((item: any) => item.str).join(' ');
                    pageTexts.push(pageText);
                }
                textContent = pageTexts.join('\n\n');
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const result = await mammoth.extractRawText({ arrayBuffer });
                textContent = result.value;
            } else if (file.type === 'text/plain') {
                textContent = new TextDecoder().decode(arrayBuffer);
            } else {
                throw new Error(`Unsupported file type: ${file.type}. Please upload a PDF, DOCX, or TXT file.`);
            }

            if (!textContent.trim()) {
                 throw new Error('Could not extract any text from the document. It might be empty or an image-only file.');
            }

            const generatedCsv = await api.generateCsvFromDocument(textContent);

            if (!generatedCsv || generatedCsv.trim().split('\n').length <= 1) {
                setError('The AI could not find any checklist items in this document. Please try a different file or format.');
                setCsvContent('');
            } else {
                setCsvContent(generatedCsv);
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownload = () => {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `converted_checklist_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(csvContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-10">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-800">AI-Powered Document Converter</h1>
                <p className="mt-2 text-slate-500">Upload a compliance checklist in PDF, DOCX, or TXT format, and we'll convert it into an AccrediFy-compatible CSV file.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <label className="w-full border-2 border-dashed rounded-xl p-8 text-center transition-all bg-slate-50 hover:border-indigo-400 cursor-pointer flex flex-col items-center justify-center">
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-colors ${file ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                            <FileUp size={32} />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">{file ? file.name : 'Click to upload or drag & drop'}</p>
                        <p className="text-xs text-slate-400 mt-1">PDF, DOCX, TXT supported</p>
                        <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" />
                    </label>

                    <div className="text-center md:text-left">
                        <h3 className="text-lg font-bold text-slate-800">Ready to Convert?</h3>
                        <p className="text-sm text-slate-500 mt-2 mb-4">Our AI will read your document, identify the compliance indicators, and structure them into the correct format for import.</p>
                        <button 
                            onClick={handleConvert}
                            disabled={!file || isLoading}
                            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 size={20} className="animate-spin"/> : <Sparkles size={20} />}
                            {isLoading ? 'Analyzing Document...' : 'Convert with AI'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">{error}</div>
                )}
            </div>

            {csvContent && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800">Generated CSV Output</h3>
                        <div className="flex gap-2">
                             <button onClick={handleCopy} className="text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg flex items-center gap-2">
                                {copied ? <Check size={16} className="text-emerald-500"/> : <Clipboard size={16} />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                            <button onClick={handleDownload} className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg flex items-center gap-2">
                                <Download size={16} /> Download CSV
                            </button>
                        </div>
                    </div>
                    <textarea 
                        value={csvContent} 
                        onChange={(e) => setCsvContent(e.target.value)}
                        className="w-full h-80 bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            )}
        </div>
    );
};

export default Converter;
