
import { useState } from 'react';
import { useData } from '@/lib/store';
import { AssistantResponse, AssistantAction } from '@/lib/ai/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export function useAssistantAction() {
    const { dispatch } = useData();
    const [isProcessing, setIsProcessing] = useState(false);
    const [action, setAction] = useState<AssistantAction | null>(null);
    const [reply, setReply] = useState<string | null>(null);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);

    const processText = async (text: string) => {
        if (!text.trim()) return;
        setIsProcessing(true);
        setAction(null); // Clear previous confirmed action if any, to allow refinement
        setReply(null);

        // Optimistic update of UI? Maybe not necessary, handled by VoiceOverlay transcript

        try {
            const newHistory = [...messages, { role: 'user' as const, content: text }];

            const response = await fetch('/api/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newHistory }),
            });

            if (!response.ok) throw new Error('Assistant API failed');

            const data: AssistantResponse = await response.json();

            // Update history with assistant response
            const assistantMessage = JSON.stringify(data); // Storing the raw JSON might be confusing for future context, but typically we store the 'reply' or the semantic meaning. 
            // Better: Store the 'reply' content if just chatting, or a summary. 
            // ACTUALLY: The API expects array of {role, content}. Content should be string. 
            // If we send back the JSON output as 'assistant' content, GPT-4o will understand its own output history.
            setMessages([...newHistory, { role: 'assistant', content: assistantMessage }]);

            if (data.action) {
                setAction(data.action);
            }
            if (data.reply) {
                setReply(data.reply);
            }
        } catch (error) {
            console.error(error);
            toast.error("Не вдалося обробити запит. Спробуйте ще раз.");
        } finally {
            setIsProcessing(false);
        }
    };

    const resetConversation = () => {
        setMessages([]);
        setAction(null);
        setReply(null);
    }

    const confirmAction = () => {
        if (!action) return;

        switch (action.type) {
            case 'GOAL':
                dispatch({
                    type: 'ADD_GOAL',
                    payload: {
                        id: uuidv4(),
                        title: action.data.title,
                        description: action.data.description,
                        status: 'active',
                        type: action.data.type,
                        areaId: action.data.areaId || 'general', // Fallback or handle properly
                        deadline: action.data.deadline,
                        progress: 0,
                        createdAt: new Date().toISOString(),
                        targetMetricId: action.data.metric ? uuidv4() : undefined, // Logic for metric creation needed
                        // Handling metric data passing might require a more complex dispatcher or dual-dispatch
                    }
                });

                // If goal has metric, we also need to create the metric definition
                // This logic is simplified; a real app would need transaction-like integrity
                if (action.data.metric) {
                    // We need to implement metric creation here.
                    // For now just notifying.
                    console.log("Metric creation to be implemented:", action.data.metric);
                }

                toast.success("Ціль створено успішно!");
                break;

            case 'TASK':
                dispatch({
                    type: 'ADD_ACTION',
                    payload: {
                        id: uuidv4(),
                        title: action.data.title,
                        completed: false,
                        type: 'task',
                        areaId: action.data.areaId,
                        projectId: action.data.projectId,
                        linkedGoalId: action.data.goalId,
                        date: action.data.date || new Date().toISOString().split('T')[0],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        status: 'pending',
                        userId: 'current'
                    }
                });
                toast.success("Задачу створено успішно!");
                break;

            case 'NOTE':
                dispatch({
                    type: 'ADD_NOTE',
                    payload: {
                        id: uuidv4(),
                        title: "Голосова нотатка", // Logic to extract title or use first line
                        content: action.data.content,
                        tags: action.data.tags || [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        userId: 'current',
                        date: new Date().toISOString().split('T')[0]
                    }
                });
                toast.success("Нотатку збережено!");
                break;

            case 'JOURNAL':
                dispatch({
                    type: 'ADD_JOURNAL',
                    payload: {
                        id: uuidv4(),
                        date: new Date().toISOString().split('T')[0],
                        content: action.data.content,
                        // summary: "Голосовий запис", // Removed as not in type
                        tags: action.data.tags || [],
                        mood: action.data.sentiment === 'positive' ? 5 : action.data.sentiment === 'negative' ? 1 : 3,
                        createdAt: new Date().toISOString(),
                        userId: 'current'
                    }
                });
                toast.success("Запис в журнал додано!");
                break;

            case 'PROJECT':
                dispatch({
                    type: 'ADD_PROJECT',
                    payload: {
                        id: uuidv4(),
                        title: action.data.title,
                        description: action.data.description,
                        status: (action.data.status === 'planning' || action.data.status === 'on_hold') ? 'paused' : 'active',
                        areaId: action.data.areaId || 'general',
                        createdAt: new Date().toISOString()
                        // progress: 0 // Removed as not in Project type
                    }
                });
                toast.success("Проєкт створено!");
                break;
        }

        // Reset state
        setAction(null);
        setReply(null);
    };

    const cancelAction = () => {
        setAction(null);
    };

    return {
        processText,
        confirmAction,
        cancelAction,
        isProcessing,
        action,
        reply,
        resetConversation
    };
}
