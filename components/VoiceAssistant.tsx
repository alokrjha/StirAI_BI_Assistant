
import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, FunctionDeclaration, Type } from '@google/genai';

interface VoiceAssistantProps {
  onCommand: (cmd: { type: string; payload: any }) => void;
  onTranscriptionUpdate: (text: string) => void;
  onStateChange: (isLive: boolean) => void;
}

const switchDashboardTool: FunctionDeclaration = {
  name: 'switch_dashboard',
  parameters: {
    type: Type.OBJECT,
    description: 'Switch the current dashboard view to a different domain.',
    properties: {
      dashboard_id: {
        type: Type.STRING,
        description: 'The name or ID of the dashboard to show (e.g., sales, inventory, marketing).',
      },
    },
    required: ['dashboard_id'],
  },
};

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ 
  onCommand, 
  onTranscriptionUpdate,
  onStateChange 
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const currentTranscriptionRef = useRef('');

  const stopSession = useCallback(() => {
    // Stop audio
    if (audioContextRef.current) audioContextRef.current.close();
    if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    
    setIsActive(false);
    onStateChange(false);
    onTranscriptionUpdate('');
    currentTranscriptionRef.current = '';
  }, [onStateChange, onTranscriptionUpdate]);

  const startSession = async () => {
    try {
      setErrorMessage(null);
      setIsConnecting(true);

      // Check for media devices support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser does not support audio recording.");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputAudioContext;
      outputAudioContextRef.current = outputAudioContext;

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err: any) {
        if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          throw new Error("Microphone not found. Please ensure a microphone is connected and accessible.");
        } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          throw new Error("Microphone access denied. Please allow microphone permissions in your browser settings.");
        } else {
          throw new Error(`Microphone error: ${err.message}`);
        }
      }

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
            setIsConnecting(false);
            setIsActive(true);
            onStateChange(true);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcriptions
            if (message.serverContent?.outputTranscription) {
              currentTranscriptionRef.current += message.serverContent.outputTranscription.text;
              onTranscriptionUpdate(currentTranscriptionRef.current);
            } else if (message.serverContent?.inputTranscription) {
              currentTranscriptionRef.current += message.serverContent.inputTranscription.text;
              onTranscriptionUpdate(currentTranscriptionRef.current);
            }

            if (message.serverContent?.turnComplete) {
              currentTranscriptionRef.current = '';
              setTimeout(() => onTranscriptionUpdate(''), 3000);
            }

            // Handle Tool Calls
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'switch_dashboard') {
                  onCommand({ type: 'switch_dashboard', payload: fc.args.dashboard_id });
                }
                sessionPromise.then(s => s.sendToolResponse({
                  functionResponses: { id: fc.id, name: fc.name, response: { result: "ok" } }
                }));
              }
            }

            // Handle Audio
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              const buffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
              const source = outputAudioContext.createBufferSource();
              source.buffer = buffer;
              source.connect(outputAudioContext.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Gemini Live Error:', e);
            setErrorMessage("Connection to Gemini failed. Please try again.");
            stopSession();
          },
          onclose: () => stopSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: [switchDashboardTool] }],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: "You are a BI Reporting Assistant. You help users navigate dashboards in Apache Superset. If a user asks to see sales, inventory, or marketing data, call the switch_dashboard function. Be helpful, concise, and professional."
        }
      });
      sessionPromiseRef.current = sessionPromise;

    } catch (err: any) {
      console.error("Failed to start session:", err);
      setErrorMessage(err.message || "Failed to start voice assistant.");
      setIsConnecting(false);
    }
  };

  function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  function encode(bytes: Uint8Array) {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function decode(base64: string) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  }

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  }

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center justify-center pointer-events-none space-y-4">
      {errorMessage && (
        <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm font-medium animate-bounce-in pointer-events-auto flex items-center space-x-2 shadow-lg">
          <i className="fas fa-exclamation-circle"></i>
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-2 text-red-400 hover:text-red-600">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      <div className="flex flex-col items-center space-y-4 pointer-events-auto">
        <div className="relative">
          {isActive && <div className="pulse-ring"></div>}
          <button
            onClick={isActive ? stopSession : startSession}
            disabled={isConnecting}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl relative z-10 ${
              isActive 
                ? 'bg-red-500 hover:bg-red-600' 
                : isConnecting 
                  ? 'bg-gray-400 cursor-wait' 
                  : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isConnecting ? (
              <i className="fas fa-spinner fa-spin text-white text-3xl"></i>
            ) : isActive ? (
              <i className="fas fa-stop text-white text-3xl"></i>
            ) : (
              <i className="fas fa-microphone text-white text-3xl"></i>
            )}
          </button>
        </div>
        <div className="bg-white px-4 py-2 rounded-full shadow-lg border border-slate-100 flex items-center space-x-2 text-sm font-bold text-slate-700 transition-opacity duration-300">
           {isActive ? (
             <>
               <span className="flex space-x-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce delay-100"></span>
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce delay-200"></span>
               </span>
               <span>Gemini Listening...</span>
             </>
           ) : isConnecting ? (
             <span>Connecting...</span>
           ) : (
             <span>Tap to Start Voice Assistant</span>
           )}
        </div>
      </div>
    </div>
  );
};
