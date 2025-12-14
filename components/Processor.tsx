import React, { useState, useRef, useEffect } from 'react';
import { User, ScanResult } from '../types';
import { processImage } from '../utils/imageFilters';
import { Button } from './Button';
import { Upload, Sliders, Download, RotateCcw, ArrowRight, Eye, CheckCircle2, User as UserIcon, Mail, Phone } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface ProcessorProps {
  user: User;
  onComplete: (result: ScanResult) => void;
  onCancel: () => void;
}

export const Processor: React.FC<ProcessorProps> = ({ user, onComplete, onCancel }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Processing Parameters
  const [threshold, setThreshold] = useState(30);

  // Subject Details
  const [subjectName, setSubjectName] = useState('');
  const [subjectEmail, setSubjectEmail] = useState('');
  const [subjectMobile, setSubjectMobile] = useState('');
  const [notes, setNotes] = useState('');
  
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      setStep(2);
    }
  };

  const runProcessing = async () => {
    if (!imgRef.current) return;
    setIsProcessing(true);
    
    // Allow UI to update before blocking with heavy calculation
    setTimeout(() => {
      try {
        const resultDataUrl = processImage(imgRef.current!, {
          threshold: threshold, // Invert implicit in logic to make ridges black
          invert: false // We want black ridges on white background
        });
        setProcessedImage(resultDataUrl);
        setStep(3);
      } catch (error) {
        console.error("Processing failed", error);
        alert("Failed to process image.");
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  };

  const handleGeneratePDF = () => {
    if (!processedImage) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // --- PDF HEADER ---
    doc.setFillColor(15, 23, 42); // slate-900 like color
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('Fingerprint Trace Report', margin, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text('Biometric Analysis Output', pageWidth - margin - 45, 25);

    // --- SUBJECT INFO SECTION ---
    let yPos = 60;
    
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Subject Information', margin, yPos);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
    
    yPos += 15;
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    
    // Grid layout for info
    const leftCol = margin;
    const rightCol = pageWidth / 2 + 10;
    
    // Row 1: Name & Email
    doc.text(`Full Name:`, leftCol, yPos);
    doc.setFont("helvetica", "bold");
    doc.text(subjectName || 'N/A', leftCol + 30, yPos);
    doc.setFont("helvetica", "normal");
    
    doc.text(`Email:`, rightCol, yPos);
    doc.setFont("helvetica", "bold");
    doc.text(subjectEmail || 'N/A', rightCol + 30, yPos);
    doc.setFont("helvetica", "normal");

    yPos += 10;

    // Row 2: Mobile
    doc.text(`Mobile No:`, leftCol, yPos);
    doc.setFont("helvetica", "bold");
    doc.text(subjectMobile || 'N/A', leftCol + 30, yPos);
    doc.setFont("helvetica", "normal");

    yPos += 10;

    // Row 3: Notes
    doc.text(`Notes:`, leftCol, yPos);
    const splitNotes = doc.splitTextToSize(notes || 'None', pageWidth - margin - (leftCol + 30));
    doc.text(splitNotes, leftCol + 30, yPos);
    
    yPos += (splitNotes.length * 5) + 15;

    // --- OPERATOR INFO SECTION ---
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Analysis Details', margin, yPos);
    doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);

    yPos += 15;
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);

    doc.text(`Operator: ${user.name}`, leftCol, yPos);
    doc.text(`Processed: ${new Date().toLocaleString()}`, rightCol, yPos);
    yPos += 8;
    doc.text(`Operator Email: ${user.email}`, leftCol, yPos);
    doc.text(`Source File: ${file?.name || 'Unknown'}`, rightCol, yPos);
    yPos += 8;
    doc.text(`Trace Threshold: ${threshold}`, leftCol, yPos);

    yPos += 20;

    // --- IMAGE ---
    // Check space
    const imgProps = doc.getImageProperties(processedImage);
    const imgWidth = pageWidth - (margin * 2);
    const availableHeight = pageHeight - yPos - 20; // 20px padding at bottom
    
    let renderHeight = (imgProps.height * imgWidth) / imgProps.width;
    let renderWidth = imgWidth;
    
    if (renderHeight > availableHeight) {
        renderHeight = availableHeight;
        renderWidth = (imgProps.width * renderHeight) / imgProps.height;
    }

    doc.addImage(processedImage, 'PNG', margin, yPos, renderWidth, renderHeight);

    // --- FOOTER ---
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('FingerTrace Bio - Automated Biometric Extraction System', margin, pageHeight - 10);
    const pageCount = doc.getNumberOfPages();
    doc.text(`Page 1 of ${pageCount}`, pageWidth - margin - 20, pageHeight - 10);

    doc.save(`trace_report_${subjectName ? subjectName.replace(/\s+/g, '_') : 'scan'}_${Date.now()}.pdf`);

    // Save to history
    onComplete({
      id: crypto.randomUUID(),
      originalUrl: preview!,
      processedUrl: processedImage,
      timestamp: Date.now(),
      userId: user.id,
      fileName: file?.name || 'scan.png',
      subjectName,
      subjectEmail,
      subjectMobile,
      notes
    });
  };

  // Re-run processing when settings change if already at step 3
  const updateProcessing = () => {
    if (step === 3 && imgRef.current) {
        const resultDataUrl = processImage(imgRef.current, {
            threshold: threshold,
            invert: false
        });
        setProcessedImage(resultDataUrl);
    }
  };

  useEffect(() => {
    // Debounce the slider update
    const timer = setTimeout(updateProcessing, 100);
    return () => clearTimeout(timer);
  }, [threshold]);


  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      
      {/* Progress Steps */}
      <div className="flex justify-between items-center relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -z-10"></div>
        {[
          { num: 1, label: 'Upload' },
          { num: 2, label: 'Configure' },
          { num: 3, label: 'Result' }
        ].map((s) => (
          <div key={s.num} className="flex flex-col items-center gap-2 bg-slate-950 px-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
              step >= s.num ? 'bg-bio-500 text-white' : 'bg-slate-800 text-slate-500'
            }`}>
              {step > s.num ? <CheckCircle2 size={16} /> : s.num}
            </div>
            <span className={`text-xs ${step >= s.num ? 'text-white' : 'text-slate-500'}`}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
        
        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-xl hover:border-bio-500 transition-colors bg-slate-900/50">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="hidden" 
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              <div className="bg-slate-800 p-4 rounded-full mb-4 group-hover:bg-slate-700 transition-colors">
                <Upload className="h-8 w-8 text-bio-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Upload Hand Image</h3>
              <p className="text-slate-400 mb-6 max-w-xs mx-auto">
                Select a high-resolution PNG or JPG image of a palm or fingerprint.
              </p>
              <Button onClick={() => document.getElementById('file-upload')?.click()}>
                Select File
              </Button>
            </label>
          </div>
        )}

        {/* Step 2 & 3: Preview & Process */}
        {(step === 2 || step === 3) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Controls */}
            <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-bio-500" />
                  Configuration
                </h3>
                
                <div className="space-y-6 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                  
                  {/* Subject Details Form */}
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Subject Details</h4>
                    
                    {/* Full Name */}
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder="Full Name"
                        value={subjectName}
                        onChange={(e) => setSubjectName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-bio-500 outline-none transition-all"
                      />
                    </div>

                    {/* Email */}
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input 
                        type="email" 
                        placeholder="Email Address"
                        value={subjectEmail}
                        onChange={(e) => setSubjectEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-bio-500 outline-none transition-all"
                      />
                    </div>

                    {/* Mobile */}
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input 
                        type="tel" 
                        placeholder="Mobile No"
                        value={subjectMobile}
                        onChange={(e) => setSubjectMobile(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-bio-500 outline-none transition-all"
                      />
                    </div>

                    {/* Notes */}
                     <textarea 
                        placeholder="Additional Notes..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-bio-500 outline-none transition-all h-20 resize-none"
                    />
                  </div>

                  <div className="border-t border-slate-800 pt-4">
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-slate-300">Ridge Sensitivity</label>
                      <span className="text-sm text-bio-500 font-mono">{threshold}</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="100" 
                      value={threshold} 
                      onChange={(e) => setThreshold(Number(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-bio-500"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Lower values detect finer lines but may increase noise.
                    </p>
                  </div>

                </div>
              </div>

              <div className="flex flex-col gap-3">
                {step === 2 ? (
                  <Button onClick={runProcessing} loading={isProcessing} size="lg" className="w-full">
                    Trace Fingerprint
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleGeneratePDF} variant="primary" size="lg" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                    </Button>
                    <Button onClick={() => setStep(2)} variant="secondary" className="w-full">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Adjust Settings
                    </Button>
                  </>
                )}
                <Button onClick={onCancel} variant="outline" className="w-full">
                  Cancel
                </Button>
              </div>
            </div>

            {/* Visualizer */}
            <div className="lg:col-span-2 order-1 lg:order-2 bg-black rounded-xl border border-slate-800 overflow-hidden relative min-h-[400px] flex items-center justify-center">
              {/* Hidden source image for canvas processing */}
              <img 
                ref={imgRef}
                src={preview!} 
                alt="Original" 
                className="hidden"
                onLoad={() => {
                   // Optional: Auto-run processing on first load if desired, but explicit is better for UX
                }} 
              />
              
              {step === 2 && (
                <div className="relative w-full h-full flex items-center justify-center bg-slate-900">
                   <img src={preview!} alt="Preview" className="max-w-full max-h-[500px] object-contain" />
                   <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded text-xs font-mono text-white flex items-center gap-2">
                     <Eye size={12} /> Original
                   </div>
                </div>
              )}

              {step === 3 && processedImage && (
                <div className="relative w-full h-full flex items-center justify-center bg-white">
                  <img src={processedImage} alt="Processed" className="max-w-full max-h-[500px] object-contain mix-blend-multiply" />
                  <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur px-3 py-1 rounded text-xs font-mono text-white flex items-center gap-2">
                     <Eye size={12} /> Traced Output
                   </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};