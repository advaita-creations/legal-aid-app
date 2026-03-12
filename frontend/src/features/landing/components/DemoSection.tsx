import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ScanLine, FileCheck, ArrowRight } from 'lucide-react';

const steps = [
  {
    id: 1,
    icon: Upload,
    label: 'Upload',
    title: 'Drop Your Document',
    description: 'Upload any legal document — scanned PDFs, handwritten notes, damaged stamps. We handle it all.',
    color: 'cyan',
  },
  {
    id: 2,
    icon: ScanLine,
    label: 'Process',
    title: 'AI Analyzes Everything',
    description: 'Our AI reads every word, validates clauses, cross-references data, and structures the content in seconds.',
    color: 'purple',
  },
  {
    id: 3,
    icon: FileCheck,
    label: 'Results',
    title: 'Get Validated Output',
    description: 'Receive a validated HTML document, structured JSON data, and a comprehensive validation report — instantly.',
    color: 'green',
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  cyan: {
    bg: 'bg-cyan-400/10',
    text: 'text-cyan-400',
    border: 'border-cyan-400/30',
    glow: 'shadow-[0_0_40px_rgba(0,255,255,0.15)]',
  },
  purple: {
    bg: 'bg-purple-400/10',
    text: 'text-purple-400',
    border: 'border-purple-400/30',
    glow: 'shadow-[0_0_40px_rgba(168,85,247,0.15)]',
  },
  green: {
    bg: 'bg-green-400/10',
    text: 'text-green-400',
    border: 'border-green-400/30',
    glow: 'shadow-[0_0_40px_rgba(74,222,128,0.15)]',
  },
};

export function DemoSection() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const step = steps[activeStep];

  return (
    <section id="demo" className="relative bg-[#070B1E] py-28">
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/8 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="mb-4 inline-block rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-medium text-cyan-300">
            How It Works
          </span>
          <h2 className="mb-4 text-4xl font-black text-white md:text-5xl">
            Three Steps to{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
              Legal Clarity
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            From chaotic paperwork to structured, validated data — in under 60 seconds.
          </p>
        </motion.div>

        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left — Step Selector */}
          <div className="space-y-4">
            {steps.map((s, index) => {
              const c = colorMap[s.color];
              const isActive = index === activeStep;
              return (
                <motion.button
                  key={s.id}
                  onClick={() => setActiveStep(index)}
                  className={`group flex w-full items-start gap-5 rounded-2xl border p-6 text-left transition-all duration-300 ${
                    isActive
                      ? `${c.border} ${c.bg} ${c.glow}`
                      : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
                  }`}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      isActive ? c.bg : 'bg-white/5'
                    }`}
                  >
                    <s.icon
                      size={22}
                      className={isActive ? c.text : 'text-gray-500'}
                    />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={`text-xs font-medium ${
                          isActive ? c.text : 'text-gray-500'
                        }`}
                      >
                        Step {s.id}
                      </span>
                      {isActive && (
                        <motion.div
                          className={`h-1.5 w-1.5 rounded-full ${c.text === 'text-cyan-400' ? 'bg-cyan-400' : c.text === 'text-purple-400' ? 'bg-purple-400' : 'bg-green-400'}`}
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        />
                      )}
                    </div>
                    <h3
                      className={`text-lg font-bold ${
                        isActive ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      {s.title}
                    </h3>
                    {isActive && (
                      <motion.p
                        className="mt-1 text-sm text-gray-400"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                      >
                        {s.description}
                      </motion.p>
                    )}
                  </div>
                </motion.button>
              );
            })}

            {/* Progress bar */}
            <div className="mt-6 h-1 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-purple-400 to-green-400"
                key={activeStep}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 4, ease: 'linear' }}
              />
            </div>
          </div>

          {/* Right — Visual */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className={`absolute -inset-4 rounded-3xl bg-gradient-to-r ${
              step.color === 'cyan' ? 'from-cyan-500/10 to-blue-500/10'
                : step.color === 'purple' ? 'from-purple-500/10 to-pink-500/10'
                : 'from-green-500/10 to-emerald-500/10'
            } blur-2xl transition-all duration-700`} />

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f1235]/80 backdrop-blur-xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="p-8"
                >
                  {activeStep === 0 && <UploadVisual />}
                  {activeStep === 1 && <ProcessingVisual />}
                  {activeStep === 2 && <ResultsVisual />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function UploadVisual() {
  return (
    <div className="space-y-4">
      <div className="flex h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed border-cyan-400/30 bg-cyan-400/5">
        <Upload size={40} className="mb-3 text-cyan-400" />
        <p className="text-sm font-medium text-cyan-300">
          Drop your legal documents here
        </p>
        <p className="text-xs text-gray-500">PDF, JPG, PNG — up to 20MB</p>
      </div>
      <div className="space-y-2">
        {['Kalpataru_NOC.pdf', 'Agreement_Draft_v3.pdf'].map((name) => (
          <div
            key={name}
            className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-4 py-3"
          >
            <span className="text-sm text-gray-300">{name}</span>
            <span className="text-xs text-cyan-400">Ready</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProcessingVisual() {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <motion.div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-purple-400/30 bg-purple-400/10"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
        >
          <ScanLine size={28} className="text-purple-400" />
        </motion.div>
        <p className="text-sm font-medium text-purple-300">
          AI is analyzing your document...
        </p>
      </div>

      {[
        { label: 'OCR Extraction', progress: 100 },
        { label: 'Content Validation', progress: 85 },
        { label: 'Structure Analysis', progress: 60 },
      ].map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-gray-400">{item.label}</span>
            <span className="text-xs text-purple-400">{item.progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-purple-400 to-pink-400"
              initial={{ width: '0%' }}
              animate={{ width: `${item.progress}%` }}
              transition={{ duration: 1.5, delay: 0.3 }}
            />
          </div>
        </div>
      ))}

      <div className="mt-4 space-y-1 rounded-lg border border-purple-400/10 bg-purple-400/5 p-3">
        {[
          '✓ Extracted 247 text blocks',
          '✓ Identified 12 key clauses',
          '○ Cross-referencing data...',
        ].map((line) => (
          <p key={line} className="text-xs text-gray-400">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function ResultsVisual() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-lg border border-green-400/20 bg-green-400/5 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-400/20">
          <FileCheck size={20} className="text-green-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Processing Complete</p>
          <p className="text-xs text-green-400">3 output files generated</p>
        </div>
      </div>

      {[
        {
          name: 'Validated Document',
          ext: '.html',
          size: '2.7 KB',
          color: 'text-cyan-400',
          icon: '📄',
        },
        {
          name: 'Structured Data',
          ext: '.json',
          size: '2.0 KB',
          color: 'text-purple-400',
          icon: '📊',
        },
        {
          name: 'Validation Report',
          ext: '.txt',
          size: '2.6 KB',
          color: 'text-green-400',
          icon: '✅',
        },
      ].map((file) => (
        <div
          key={file.name}
          className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-4"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">{file.icon}</span>
            <div>
              <p className="text-sm font-medium text-white">{file.name}</p>
              <p className="text-xs text-gray-500">{file.ext} • {file.size}</p>
            </div>
          </div>
          <button className="flex items-center gap-1 text-xs font-medium text-cyan-400 transition-colors hover:text-cyan-300">
            View <ArrowRight size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
