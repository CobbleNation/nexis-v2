'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, StopCircle, Play, Pause, Trash2, AudioWaveform } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // Assuming standard utils

interface AudioRecorderProps {
    onRecordingComplete: (audioData: string | null) => void; // Returns base64 string or null
    existingAudio?: string; // If editing
}

export function AudioRecorder({ onRecordingComplete, existingAudio }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(existingAudio || null);
    const [isPlaying, setIsPlaying] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initial load handler for existing audio
    useEffect(() => {
        if (existingAudio) {
            setAudioUrl(existingAudio);
        }
    }, [existingAudio]);

    // Timer Logic
    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRecording]);

    // Playback Ended Listener
    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            const handleEnded = () => setIsPlaying(false);
            audio.addEventListener('ended', handleEnded);
            return () => audio.removeEventListener('ended', handleEnded);
        }
    }, [audioUrl]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);

                // Convert to Base64 for storage (Mock Backend requirement)
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    const base64data = reader.result as string;
                    onRecordingComplete(base64data);
                };

                // Stop tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);
            setAudioUrl(null);
            onRecordingComplete(null);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please allow permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const togglePlayback = () => {
        if (!audioRef.current || !audioUrl) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const deleteRecording = () => {
        setAudioBlob(null);
        setAudioUrl(null);
        onRecordingComplete(null);
        setRecordingTime(0);
        setIsPlaying(false);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-secondary/10 border border-slate-200 dark:border-border rounded-xl p-3 shadow-inner dark:shadow-none">
            {/* Audio Element (Hidden) */}
            {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" />}

            {!isRecording && !audioUrl && (
                <Button
                    onClick={startRecording}
                    variant="outline"
                    className="gap-2 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-300 dark:hover:border-rose-800"
                >
                    <Mic className="h-4 w-4" />
                    Record Voice Memo
                </Button>
            )}

            {isRecording && (
                <div className="flex items-center gap-4 w-full">
                    <div className="relative flex h-8 w-8 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <Mic className="relative inline-flex rounded-full h-5 w-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <span className="font-mono text-rose-600 dark:text-rose-400 font-semibold w-12">{formatTime(recordingTime)}</span>
                    <div className="flex-1 h-8 bg-slate-200 dark:bg-secondary/30 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-rose-500/10 animate-pulse" />
                        {/* Fake waveform viz */}
                        <div className="absolute inset-0 flex items-center justify-center gap-[2px]">
                            {[...Array(20)].map((_, i) => (
                                <div key={i} className="w-1 bg-rose-400 rounded-full animate-bounce" style={{ height: `${Math.random() * 80 + 20}%`, animationDelay: `${i * 0.05}s` }} />
                            ))}
                        </div>
                    </div>
                    <Button onClick={stopRecording} size="sm" variant="destructive" className="rounded-full h-8 w-8 p-0">
                        <StopCircle className="h-5 w-5" />
                    </Button>
                </div>
            )}

            {!isRecording && audioUrl && (
                <div className="flex items-center gap-3 w-full animate-in fade-in slide-in-from-left-2">
                    <Button
                        onClick={togglePlayback}
                        size="sm"
                        className={cn("rounded-full h-8 w-8 p-0 transition-all", isPlaying ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700")}
                    >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                    </Button>

                    <div className="flex-1 flex flex-col justify-center">
                        <span className="text-xs font-semibold text-slate-700 dark:text-foreground">Voice Memo</span>
                        <span className="text-[10px] text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Audio Recording</span>
                    </div>

                    <Button onClick={deleteRecording} size="sm" variant="ghost" className="text-slate-400 dark:text-muted-foreground hover:text-red-500 dark:hover:text-red-400 h-8 w-8 p-0">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
