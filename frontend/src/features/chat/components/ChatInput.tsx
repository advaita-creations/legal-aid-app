import { useState, useEffect } from 'react';
import { Send, Mic, MicOff, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

import { useVoiceInput } from '../hooks/useVoiceInput';

interface ChatInputProps {
  onSend: (message: string) => void;
  isSending: boolean;
  initialValue?: string;
}

export function ChatInput({ onSend, isSending, initialValue = '' }: ChatInputProps) {
  const [text, setText] = useState(initialValue);
  const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript } =
    useVoiceInput();

  useEffect(() => {
    if (initialValue) setText(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (transcript) {
      setText(transcript);
    }
  }, [transcript]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed);
    setText('');
    resetTranscript();
  }

  function handleVoiceToggle() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 bg-white px-4 py-3">
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask about your documents..."
            rows={1}
            className={cn(
              'w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm',
              'focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400',
              'placeholder:text-gray-400',
              isListening && 'border-red-300 bg-red-50/30',
            )}
          />
          {isListening && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
            </div>
          )}
        </div>

        {/* Voice button */}
        {isSupported && (
          <button
            type="button"
            onClick={handleVoiceToggle}
            className={cn(
              'shrink-0 rounded-xl p-2.5 transition-colors',
              isListening
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
            )}
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
          </button>
        )}

        {/* Send button */}
        <button
          type="submit"
          disabled={!text.trim() || isSending}
          className="shrink-0 rounded-xl bg-blue-600 p-2.5 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isSending ? (
            <Loader2 className="w-4.5 h-4.5 animate-spin" />
          ) : (
            <Send className="w-4.5 h-4.5" />
          )}
        </button>
      </div>
    </form>
  );
}
