import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud, File, CheckCircle2, Loader2, ArrowRight, Play, Eye, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { useWorkflowRuntime } from '@/context/WorkflowRuntimeContext';
import { toast } from 'sonner';
import { DEMO_WORKFLOW, DEMO_FILE_NAME } from '@/lib/demo-workflow';
import { isApiLimitReached } from '@/lib/simulation/apiCounter';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export function UploadPage() {
  const [isHovering, setIsHovering] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isVlmMode, setIsVlmMode] = useState(false);
  const { 
    uploadStatus, setUploadStatus, aiModel, setRunStatus,
    setFilePayload, setFileName, setUploadedFiles, setHasRedactedPII,
    setAnalysisLogs, setAnalysisStage, setDiscoveredConnections,
    setHasStartedAnalysis,
  } = useStore();
  const { setWorkflow, resetExecution } = useWorkflowRuntime();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statuses = [
    { key: 'analyzing', text: 'Analyzing file...' },
    { key: 'redacting', text: 'Redacting PII information...' },
    { key: 'extracting', text: 'Extracting workflow steps...' },
    { key: 'identifying', text: 'Identifying dependencies...' },
    { key: 'done', text: 'Workflow ready' }
  ] as const;

  const currentStatusText = statuses.find(s => s.key === uploadStatus)?.text || '';

  useEffect(() => {
    document.title = "Upload SOP | ContextOS";
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    if (e.dataTransfer.files?.length > 0) {
      startMockProcess(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const selectedFiles = Array.from(e.target.files) as File[];
      const hasImage = selectedFiles.some(f => f.type.startsWith('image/') || f.name.match(/\.(png|jpe?g|webp)$/i));
      setIsVlmMode(hasImage);
      startMockProcess(selectedFiles);
    }
  };

  const loadDemoScenario = () => {
    // Reset runtime execution state (security events, logs, steps, system states)
    resetExecution();
    setRunStatus('idle'); // clear any stale 'completed' status from previous runs
    // Inject the pre-built workflow directly — no Gemini API call needed
    setWorkflow(DEMO_WORKFLOW);
    setFileName(DEMO_FILE_NAME);
    setHasRedactedPII(true);
    setAnalysisLogs([]);
    setHasStartedAnalysis(false);
    setAnalysisStage('extracting');
    setDiscoveredConnections([]);
    
    toast.success('Demo loaded — Employee Offboarding workflow initialized', { icon: '✓', style: { background: '#10b981', color: 'white' } });
    navigate('/analysis');
  };

  const [navigationState, setNavigationState] = useState<any>(null);

  const startMockProcess = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    setFiles(selectedFiles);

    if (aiModel === 'gemini-simulated' || isApiLimitReached()) {
      toast.info('Offline simulation mode active. Loading pre-built demonstration workflow.', {
        id: 'simulated-upload',
        duration: 4000
      });
      loadDemoScenario();
      return;
    }

    setUploadStatus('analyzing');
    const primaryFile = selectedFiles[0];
    
    let piiFoundCount = 0;
    try {
      let inputPayload: any = "Employee offboarding workflow";
      
      if (primaryFile.type.startsWith('video/') || primaryFile.name.endsWith('.mp4')) {
        throw new Error("Video parsing requires a backend which is not yet configured in the settings. Please upload a PDF or Text SOP.");
      } else if (primaryFile.type === 'application/pdf' || primaryFile.name.endsWith('.pdf')) {
        // Import pdfjs-dist dynamically
        const pdfjsLib = await import('pdfjs-dist');
        // Set worker src
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
        
        const arrayBuffer = await primaryFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }
        
        const ssnCount = (fullText.match(/\d{3}-\d{2}-\d{4}/g) || []).length;
        const emailCount = (fullText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g) || []).length;
        const phoneCount = (fullText.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g) || []).length;
        piiFoundCount = ssnCount + emailCount + phoneCount;
        
        fullText = fullText.replace(/\d{3}-\d{2}-\d{4}/g, '[REDACTED-SSN]')
                           .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[REDACTED-EMAIL]')
                           .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED-PHONE]');
                           
        inputPayload = fullText || "Employee offboarding workflow";
      } else if (primaryFile.type.startsWith('image/') || primaryFile.name.match(/\.(png|jpe?g|webp)$/i)) {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(primaryFile);
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = error => reject(error);
        });
        
        inputPayload = {
          text: "Please extract the workflow steps and dependencies from the provided image SOP diagram or screenshot.",
          inlineData: {
            data: base64Data,
            mimeType: primaryFile.type || "image/png"
          }
        };
      } else if (primaryFile.type.startsWith('text/') || primaryFile.type === 'application/json' || primaryFile.name.endsWith('.md')) {
        inputPayload = await primaryFile.text();
      }

      setUploadStatus('redacting');
      await new Promise(r => setTimeout(r, 1200));
      toast.success(`${piiFoundCount > 0 ? piiFoundCount : 'PII'} Data instances detected & redacted`, {
        description: 'Removed social security numbers, emails, and phone numbers from the extraction context.',
        icon: '🛡️'
      });

      setUploadStatus('extracting');
      await new Promise(r => setTimeout(r, 1000));

      setUploadStatus('identifying');
      await new Promise(r => setTimeout(r, 1000));

      setUploadStatus('done');
      
      const navState = { inputPayload, fileName: primaryFile.name, fileSize: primaryFile.size, hasRedactedPII: true };
      setNavigationState(navState);
      
      // Reset runtime execution state (security events, logs, steps, system states)
      resetExecution();
      setRunStatus('idle'); // clear any stale 'completed' status from a previous run
      setFilePayload(inputPayload);
      setFileName(primaryFile.name);
      setUploadedFiles(selectedFiles);
      setHasRedactedPII(true);
      setAnalysisLogs([]);
      setHasStartedAnalysis(false);
      setAnalysisStage('extracting');
      setDiscoveredConnections([]);
      
    } catch (e: any) {
      console.error(e);
      toast.error("Workflow Generation Failed", { description: e.message || "Something went wrong. Check console." });
      setUploadStatus('idle');
    }
  };

  return (
    <div className="flex flex-col items-center max-w-3xl mx-auto px-6 py-20 w-full h-full">
      <div className="mb-10 text-center space-y-2">
        <h2 className="text-3xl font-semibold text-white">Upload Workspace</h2>
        <p className="text-muted-foreground text-sm">Drag and drop enterprise SOPs, PDFs, or images. Supports Vision-Language Model parsing for image SOPs.</p>
      </div>

      <AnimatePresence mode="wait">
        {uploadStatus === 'idle' ? (
          <motion.div
            key="dropzone-group"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl flex flex-col gap-6"
          >
            {/* Live Demo Card (Primary Action) */}
            <div className="relative group">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-indigo-500/50 to-purple-500/50 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
              <button
                onClick={loadDemoScenario}
                className="relative w-full flex items-center justify-between gap-4 p-5 rounded-2xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 hover:border-indigo-500/60 transition-all text-left shadow-[0_0_30px_rgba(99,102,241,0.2)]"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/30 border border-indigo-500/50 flex items-center justify-center shrink-0 shadow-inner">
                    <Play className="w-5 h-5 text-indigo-100 fill-indigo-200" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-base font-bold text-white">Try Live Demo</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 bg-indigo-500/30 border border-indigo-500/50 px-2 py-0.5 rounded">No api key needed</span>
                    </div>
                    <p className="text-sm text-indigo-300/80">Employee Offboarding SOP — 8 nodes extracted instantly.</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-indigo-400 shrink-0" />
              </button>
            </div>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink-0 mx-4 text-xs font-medium text-slate-500 uppercase tracking-widest">or upload custom document</span>
                <div className="flex-grow border-t border-white/5"></div>
            </div>

            {/* Drop Zone (Secondary) */}
            <div
              className={`w-full h-48 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${
                isHovering ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/10 bg-[#0d0d14]/50 hover:bg-[#0d0d14]'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
              onDragLeave={() => setIsHovering(false)}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                className="hidden" 
                multiple
                ref={fileInputRef} 
                onChange={handleFileSelect}
                accept=".pdf,.png,.jpg,.jpeg"
              />
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                <UploadCloud className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-300 font-medium mb-1">Drag and drop custom SOP</p>
              <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 mt-2">
                Select File
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl p-6 rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col gap-6 shadow-2xl"
          >
            {isVlmMode && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 self-start">
                <Eye className="w-3 h-3 text-teal-400" />
                <span className="text-[11px] font-bold text-teal-400 uppercase tracking-widest">VLM Mode Active · Gemini Vision</span>
              </div>
            )}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                <File className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-white truncate">
                  {files.length > 0 ? (files.length === 1 ? files[0].name : `${files[0].name} + ${files.length - 1} more`) : 'employee_offboarding_SOP.pdf'}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {files.length > 0 ? (files.reduce((acc, f) => acc + f.size, 0) / 1024).toFixed(2) : '345'} KB
                </p>
              </div>
              {uploadStatus === 'done' ? (
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              ) : (
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              )}
            </div>

            <div className="h-2 rounded-full bg-black/50 overflow-hidden relative">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500"
                initial={{ width: '0%' }}
                animate={{ 
                  width: uploadStatus === 'analyzing' ? '20%' : 
                         uploadStatus === 'redacting' ? '40%' : 
                         uploadStatus === 'extracting' ? '60%' : 
                         uploadStatus === 'identifying' ? '80%' : '100%' 
                }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {uploadStatus !== 'done' && (
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                )}
                <span className="text-sm text-indigo-300 font-mono tracking-tight">
                  {currentStatusText}
                </span>
              </div>
            </div>

            <AnimatePresence>
              {uploadStatus === 'done' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-4 mt-2 border-t border-white/10 flex justify-end"
                >
                  <Button onClick={() => {
                        setUploadStatus('idle');
                        navigate('/analysis', { state: navigationState });
                   }} className="rounded-full bg-primary hover:bg-primary/90">
                    View Workflow
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
