import { useOnboarding } from "@/components/onboarding/OnboardingProvider";
import * as React from "react"
import { useState } from "react"
import { CheckSquare, Calendar, FileText, Target, Hash, BarChart3, Repeat, Clock, Plus, Trash2, AlertCircle, List, Folder, BookOpen, HardDrive, Paperclip, Link as LinkIcon, Video, Layout, Zap, X } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useData } from "@/lib/store"
import { toast } from "sonner"
import { Action, Goal, Note, AppEvent, MetricDefinition, MetricEntry, Routine, Project, JournalEntry, FileAsset, LibraryItem, Habit } from "@/types"
import { Switch } from "@/components/ui/switch"
import { GoalCreationWizard } from "@/components/goals/GoalCreationWizard"
import { MetricCreationWizard } from "@/components/metrics/MetricCreationWizard"
import { RichTextEditor } from "@/components/ui/RichTextEditor"
import { AudioRecorder } from "@/components/features/AudioRecorder"
import { v4 as uuidv4 } from 'uuid';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/common/UpgradeModal';

export function QuickAddModal({
    open,
    onOpenChange,
    defaultTab = 'task',
    defaultAreaId = 'all',
    defaultProjectId,
    initialData
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultTab?: string;
    defaultAreaId?: string;
    defaultProjectId?: string;
    initialData?: {
        title?: string;
        description?: string;
        date?: string;
        time?: string;
        priority?: 'low' | 'medium' | 'high';
        [key: string]: any;
    };
}) {
    // Basic State
    const { nextStep, isActive, currentStep } = useOnboarding();
    const [type, setType] = React.useState<string>(defaultTab);
    const [title, setTitle] = React.useState('');

    // Limits
    const { canCreateTask, canCreateJournalEntry, canCreateNote, canCreateGoal } = useSubscription();
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [areaId, setAreaId] = React.useState<string>(defaultAreaId === 'all' ? '' : defaultAreaId);
    const [projectId, setProjectId] = React.useState<string | undefined>(defaultProjectId);

    // Fix: Use local date to match TasksView logic and user expectation
    const [date, setDate] = React.useState<string>(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });

    // Dynamic Fields State
    const [description, setDescription] = React.useState('');
    const [priority, setPriority] = React.useState<'low' | 'medium' | 'high'>('medium');
    const [horizon, setHorizon] = React.useState<string>('month');

    // Metric Fields
    const [metricValue, setMetricValue] = React.useState('');
    const [metricUnit, setMetricUnit] = React.useState('');

    // New Fields (Nexis)
    const [isFocus, setIsFocus] = React.useState(false);
    const [duration, setDuration] = React.useState<string>('15'); // default 15m
    const [frequency, setFrequency] = React.useState<'daily' | 'weekly' | 'manual'>('daily');
    const [daysOfWeek, setDaysOfWeek] = React.useState<number[]>([]);
    const [startTime, setStartTime] = React.useState<string>('');
    const [subtasks, setSubtasks] = React.useState<{ id: string, title: string, completed: boolean }[]>([]);
    const [newSubtask, setNewSubtask] = React.useState('');
    const [audioData, setAudioData] = React.useState<string | null>(null);
    const [fileToUpload, setFileToUpload] = React.useState<File | null>(null);
    const [reminderType, setReminderType] = React.useState<string>('none');
    const [reminderCustomTime, setReminderCustomTime] = React.useState<string>('');

    // Content Specific State
    const [contentType, setContentType] = React.useState<'note' | 'journal' | 'file' | 'library'>('note');
    const [journalMood, setJournalMood] = React.useState('5');
    const [libType, setLibType] = React.useState<LibraryItem['type']>('book');
    const [libUrl, setLibUrl] = React.useState('');
    const [libAuthor, setLibAuthor] = React.useState('');
    const [fileType, setFileType] = React.useState<FileAsset['type']>('document');

    // Habit Specific
    const [habitMinimum, setHabitMinimum] = React.useState('');
    const [habitTimeOfDay, setHabitTimeOfDay] = React.useState<'morning' | 'afternoon' | 'evening' | 'anytime'>('anytime');
    const [relatedMetricIds, setRelatedMetricIds] = React.useState<string[]>([]);
    const [isProjectScheduled, setIsProjectScheduled] = React.useState(false);

    // Metric Selection for Projects (Moved from bottom to fix Error #300)
    const [selectedMetricIds, setSelectedMetricIds] = React.useState<string[]>([]);

    // Reset metrics when type changes or opens
    React.useEffect(() => {
        if (open) {
            setSelectedMetricIds([]);
        }
    }, [open, type]);

    // Helpers
    const TIME_SLOTS = Array.from({ length: 15 }).map((_, i) => {
        const hour = 8 + i;
        return `${hour.toString().padStart(2, '0')}:00`;
    }); // 08:00 to 22:00

    // Collision Detection
    const getOccupiedSlots = () => {
        if (!date) return [];
        // Filter tasks for same date with start time and duration
        return state.actions
            .filter(a =>
                a.date === date &&
                a.startTime &&
                a.duration &&
                !a.completed &&
                a.status !== 'canceled' &&
                a.status !== 'deferred'
            )
            .map(a => ({ start: a.startTime!, duration: a.duration! }));
    };

    const isSlotAvailable = (slot: string) => {
        if (!slot || type !== 'task') return true;

        const occupied = getOccupiedSlots();
        const slotHour = parseInt(slot.split(':')[0]);
        const slotMin = parseInt(slot.split(':')[1]);
        const slotTimeInMin = slotHour * 60 + slotMin;
        const currentDur = parseInt(duration); // New task duration in min

        // Check if ANY existing task overlaps with the proposed NEW task
        return !occupied.some(occ => {
            const occHour = parseInt(occ.start.split(':')[0]);
            const occMin = parseInt(occ.start.split(':')[1]);
            const occStart = occHour * 60 + occMin;
            const occEnd = occStart + occ.duration; // Exclusive end? usually inclusive for collision

            const myStart = slotTimeInMin;
            const myEnd = slotTimeInMin + currentDur;

            // Collision Formula: (StartA < EndB) && (EndA > StartB)
            // Example: Existing 09:00 - 10:00. New 09:30 - 10:30.
            // 9*60 = 540. End = 600.
            // New Start = 570. New End = 630.
            // 540 < 630 && 600 > 570 => TRUE (Collides)
            return (occStart < myEnd && occEnd > myStart);
        });
    };

    const { state, dispatch } = useData();

    // Helper to advance onboarding
    const checkAndAdvance = (expectedStep: string) => {
        if (isActive && currentStep === expectedStep) {
            setTimeout(() => nextStep(), 150);
        }
    };

    // Listen for external triggers (e.g., Daily Recap Card)
    React.useEffect(() => {
        const handleOpenJournal = () => {
            onOpenChange(true);
            setType('content');
            setContentType('journal');
        };

        window.addEventListener('open-quick-add-journal', handleOpenJournal);
        return () => window.removeEventListener('open-quick-add-journal', handleOpenJournal);
    }, [onOpenChange]);

    // Reset on open or prop change
    React.useEffect(() => {
        if (open) {
            // Keep title/desc empty if opening fresh
            setTitle('');
            setDescription('');

            // Handle Content Sub-types
            if (defaultTab && defaultTab.startsWith('content-')) {
                setType('content');
                setContentType(defaultTab.replace('content-', '') as any);
            } else {
                setType(defaultTab);
                // Default to note if just 'content' is passed, though usually specific type is better
                if (defaultTab === 'content') setContentType('note');
            }

            setAreaId(defaultAreaId === 'all' ? '' : defaultAreaId);
            setProjectId(defaultProjectId);
            const d = new Date();
            setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
            setPriority('medium');
            setMetricValue('');
            setMetricUnit('');
            setIsFocus(false);
            setDuration('15');
            setFrequency('daily');
            setDaysOfWeek([]);
            setStartTime('');
            setSubtasks([]);
            setNewSubtask('');
            setAudioData(null);
            setFileToUpload(null);
            setReminderType('none');
            setReminderCustomTime('');

            // Content Defaults (Only reset if not set by sub-type above, but actually we set it above)
            if (!defaultTab?.startsWith('content-')) {
                setContentType('note');
            }
            setJournalMood('5');
            setLibType('book');
            setLibUrl('');
            setLibAuthor('');
            setFileType('document');
            setHabitMinimum('');
            setHabitTimeOfDay('anytime');
            setRelatedMetricIds([]);
            setIsProjectScheduled(false);

            // Handle Initial Data Pre-fill (From Voice Assistant etc.)
            if (initialData) {
                if (initialData.title) setTitle(initialData.title);
                if (initialData.description) setDescription(initialData.description);
                if (initialData.date) setDate(initialData.date);
                if (initialData.time) setStartTime(initialData.time);
                if (initialData.priority) setPriority(initialData.priority);
                if (initialData.isFocus !== undefined) setIsFocus(initialData.isFocus);
                if (initialData.duration) setDuration(String(initialData.duration));
                if (initialData.areaId) setAreaId(initialData.areaId);
                // Content specific
                if (initialData.content) setDescription(initialData.content);
                if (initialData.tags) {
                    // Logic to handle tags if we add tag support to UI later
                }
            }
        }
    }, [open, defaultTab, defaultAreaId, initialData]);

    // Sync Area with Project
    React.useEffect(() => {
        if (projectId) {
            const proj = state.projects.find(p => p.id === projectId);
            if (proj) {
                setAreaId(proj.areaId || 'all');
            }
        }
    }, [projectId, state.projects]);

    // Render Wizard Mode if Goal is selected
    if (type === 'goal') {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[700px] h-[650px] p-0 gap-0 overflow-hidden border-none shadow-2xl bg-white sm:rounded-xl ring-1 ring-slate-900/5 transition-all duration-200 flex flex-col">
                    <GoalCreationWizard
                        initialTitle={title}
                        initialAreaId={areaId !== 'all' ? areaId : undefined}
                        onComplete={() => {
                            // onComplete action
                            onOpenChange(false);
                        }}
                        onCancel={() => setType('task')} // Go back to task mode on cancel
                    />
                </DialogContent>
            </Dialog>
        );
    }

    if (type === 'metric') {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[700px] h-[650px] p-0 gap-0 overflow-hidden border-none shadow-2xl bg-white sm:rounded-xl ring-1 ring-slate-900/5 transition-all duration-200 flex flex-col">
                    <MetricCreationWizard
                        initialTitle={title}
                        initialAreaId={areaId !== 'all' ? areaId : undefined}
                        onComplete={() => onOpenChange(false)}
                        onCancel={() => setType('task')}
                    />
                </DialogContent>
            </Dialog>
        );
    }

    const validateForm = () => {
        const errors: string[] = [];

        // 1. Task Validation
        if (type === 'task') {
            if (!title.trim()) errors.push("Назва");
            if (!date) errors.push("Дата");
            if (!duration) errors.push("Тривалість");
            if (!areaId) errors.push("Сфера");
        }

        // 2. Habit Validation
        else if (type === 'habit') {
            if (!title.trim()) errors.push("Назва");
            if (!areaId) errors.push("Сфера");
            if (!frequency) errors.push("Частота");
        }

        // 3. Routine Validation
        else if (type === 'routine') {
            if (!title.trim()) errors.push("Назва");
            if (!areaId) errors.push("Сфера");
            if (!frequency) errors.push("Частота");
            if (!duration) errors.push("Тривалість");
        }

        // 4. Event Validation
        else if (type === 'event') {
            if (!title.trim()) errors.push("Назва");
            if (!date) errors.push("Дата");
            if (!startTime) errors.push("Час початку");
            if (!duration) errors.push("Тривалість");
            if (!areaId) errors.push("Сфера");
        }

        // 5. Project Validation
        else if (type === 'project') {
            if (!title.trim()) errors.push("Назва");
            if (!areaId) errors.push("Сфера");
        }

        // 6. Goal Validation
        else if (type === 'goal') {
            // Goal wizard handles its own validation, but if we had inline:
            if (!title.trim()) errors.push("Назва");
            if (!areaId) errors.push("Сфера");
            // Add other goal fields if they were inline
        }

        // 7. Metric Validation
        else if (type === 'metric') {
            // Wizard handles this
        }

        // 8. Content Validation
        else if (type === 'content') {
            if (contentType === 'note') {
                if (!title.trim()) errors.push("Назва");
                if (!date) errors.push("Дата");
                if (!areaId) errors.push("Сфера");
            }
            else if (contentType === 'journal') {
                if (!description.trim()) errors.push("Зміст запису");
                if (!journalMood) errors.push("Настрій");
            }
            else if (contentType === 'file') {
                if (!title.trim()) errors.push("Назва");
                if (!fileToUpload) errors.push("Файл");
                if (!areaId) errors.push("Сфера");
            }
            else if (contentType === 'library') {
                if (!title.trim()) errors.push("Назва");
                if (!libAuthor.trim()) errors.push("Автор");
                if (!libUrl.trim()) errors.push("Посилання");
                if (!libType) errors.push("Тип");
                if (!areaId) errors.push("Сфера");
            }
        }

        return errors;
    };



    const handleSubmit = async () => {
        // Run Validation
        const missingFields = validateForm();
        if (missingFields.length > 0) {
            toast.error("Будь ласка, заповніть обов'язкові поля:", {
                description: missingFields.join(", ")
            });
            return;
        }

        // Limit Checks
        if (type === 'task' && !canCreateTask()) {
            setShowUpgrade(true);
            return;
        }
        if (type === 'content' && contentType === 'journal' && !canCreateJournalEntry()) {
            setShowUpgrade(true);
            return;
        }
        if (type === 'content' && contentType === 'note' && !canCreateNote()) {
            setShowUpgrade(true);
            return;
        }

        // Additional Logic Checks
        if (type === 'task' && startTime) {
            if (!isSlotAvailable(startTime)) {
                toast.error("Час зайнятий", { description: "На цей час вже запланована інша задача." });
                return;
            }
        }

        const newId = uuidv4();
        const selectedArea = areaId === 'all' ? 'general' : areaId;
        const now = new Date().toISOString();

        const common = {
            id: newId,
            userId: state.user.name !== 'User' ? 'current-user' : 'user',
            createdAt: now,
            updatedAt: now,
        }

        try {
            switch (type) {
                case 'task':
                    const newTask: Action = {
                        ...common,
                        title,
                        description,
                        type: 'task',
                        areaId: selectedArea,
                        projectId: projectId || undefined,
                        status: 'pending',
                        completed: false,
                        priority: isFocus ? 'high' : 'medium', // Implicit priority
                        date: date, // Explicitly set date
                        isFocus,
                        duration: parseInt(duration),
                        startTime: startTime || undefined,
                        subtasks: subtasks.length > 0 ? subtasks : undefined,
                        reminderAt: reminderType !== 'none'
                            ? (reminderType === 'custom' ? reminderCustomTime : calculateReminderTime(date, startTime, reminderType))
                            : undefined
                    };
                    dispatch({ type: 'ADD_ACTION', payload: newTask });
                    // Onboarding step advance removed
                    toast.success(isFocus ? "Фокус-завдання створено" : "Завдання створено");
                    break;

                case 'habit':
                    const newHabit: Habit = {
                        id: uuidv4(),
                        userId: 'current',
                        title,
                        areaId: selectedArea,
                        type: 'binary', // Default to binary, assuming 'minimum' is the text description of what to do
                        frequency: frequency as any,
                        daysOfWeek: frequency === 'manual' ? daysOfWeek : undefined,
                        minimum: habitMinimum || undefined,
                        timeOfDay: habitTimeOfDay,
                        relatedMetricIds: relatedMetricIds,
                        status: 'active',
                        createdAt: new Date(),
                        streak: 0
                    };
                    // Detect quantitative if user enters number in Minimum? 
                    // No, keeping it text for now as per "Minimum Viable Habit" usually being descriptive.
                    dispatch({ type: 'ADD_HABIT', payload: newHabit });
                    toast.success("Звичку створено");
                    break;

                case 'routine':
                    const newRoutine: Routine = {
                        id: uuidv4(),
                        userId: 'current',
                        title,
                        areaId: selectedArea,
                        frequency,
                        daysOfWeek: frequency === 'manual' ? daysOfWeek : undefined,
                        createdAt: new Date(),
                    };
                    dispatch({ type: 'ADD_ROUTINE', payload: newRoutine });
                    toast.success("Рутину створено");
                    break;

                case 'project':
                    const newProject: Project = {
                        ...common,
                        title,
                        description: description || undefined,
                        areaId: selectedArea,
                        status: isProjectScheduled ? 'planned' : 'active',
                        goalIds: [],
                        startDate: isProjectScheduled ? date : undefined,
                        deadline: !isProjectScheduled && date ? new Date(date).toISOString() : undefined,
                        metricIds: selectedMetricIds,
                    };
                    dispatch({ type: 'ADD_PROJECT', payload: newProject });
                    toast.success("Проект створено");
                    break;

                case 'content':
                    if (contentType === 'note') {
                        // Upload Audio if exists
                        let finalAudioUrl = undefined;
                        if (audioData) {
                            try {
                                const audioBlob = await fetch(audioData).then(r => r.blob());
                                const formData = new FormData();
                                formData.append('file', audioBlob, 'audio-note.webm'); // Name isn't critical if backend gens one

                                const uploadRes = await fetch('/api/upload', {
                                    method: 'POST',
                                    body: formData
                                });

                                if (uploadRes.ok) {
                                    const uploadData = await uploadRes.json();
                                    if (uploadData.success) {
                                        finalAudioUrl = uploadData.url;
                                    }
                                } else {
                                    console.error("Audio Upload failed");
                                    toast.error("Не вдалося зберегти аудіо");
                                }
                            } catch (err) {
                                console.error("Audio Upload Error", err);
                            }
                        }

                        const newNote: Note = {
                            ...common,
                            title,
                            content: description,
                            relatedAreaIds: [selectedArea],
                            date,
                            tags: [],
                            audioUrl: finalAudioUrl
                        };
                        dispatch({ type: 'ADD_NOTE', payload: newNote });
                        toast.success("Нотатку створено");
                    } else if (contentType === 'journal') {
                        const newEntry: JournalEntry = {
                            ...common,
                            date, // User selected date
                            content: description,
                            mood: parseInt(journalMood),
                            tags: []
                        };
                        dispatch({ type: 'ADD_JOURNAL', payload: newEntry });
                        toast.success("Запис в журнал додано");
                    } else if (contentType === 'file') {
                        let finalUrl = '#'; // Default fallback
                        let finalSize = '0 KB';

                        // Upload if file selected
                        if (fileToUpload) {
                            const formData = new FormData();
                            formData.append('file', fileToUpload);

                            try {
                                const uploadRes = await fetch('/api/upload', {
                                    method: 'POST',
                                    body: formData
                                });

                                if (uploadRes.ok) {
                                    const uploadData = await uploadRes.json();
                                    if (uploadData.success) {
                                        finalUrl = uploadData.url;
                                        finalSize = uploadData.size;
                                    }
                                } else {
                                    console.error("Upload failed");
                                    toast.error("Не вдалося завантажити файл, збережено лише запис.");
                                }
                            } catch (err) {
                                console.error("Upload error", err);
                                toast.error("Помилка завантаження файлу.");
                            }
                        }

                        const newFile: FileAsset = {
                            ...common,
                            title: title || (fileToUpload ? fileToUpload.name : 'Untitled File'), // Use filename if title empty
                            type: fileType,
                            url: finalUrl,
                            size: finalSize,
                            relatedEntityId: selectedArea
                        };
                        dispatch({ type: 'ADD_FILE', payload: newFile });
                        toast.success("Файл додано");
                    } else if (contentType === 'library') {
                        const newItem: LibraryItem = {
                            ...common,
                            title,
                            type: libType,
                            url: libUrl,
                            author: libAuthor,
                            status: 'to_consume'
                        };
                        dispatch({ type: 'ADD_LIBRARY_ITEM', payload: newItem });
                        toast.success("Ресурс додано в бібліотеку");
                    }
                    break;

                case 'event':
                    const newEvent: AppEvent = {
                        ...common,
                        title,
                        description,
                        date,
                        type: 'meeting', // Default
                        areaId: selectedArea,
                        reminderAt: reminderType !== 'none'
                            ? (reminderType === 'custom' ? reminderCustomTime : calculateReminderTime(date, startTime, reminderType))
                            : undefined
                    };
                    dispatch({ type: 'ADD_EVENT', payload: newEvent });
                    toast.success("Подію створено");
                    break;

                default:
                    toast.error("Невідомий тип");
            }
            onOpenChange(false);
        } catch (e) {
            console.error(e);
            toast.error("Помилка створення");
        }
    };

    const ENTITIES = [
        { id: 'task', label: 'Завдання', icon: CheckSquare, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { id: 'habit', label: 'Звичка', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { id: 'routine', label: 'Рутина', icon: Repeat, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { id: 'event', label: 'Подія', icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { id: 'content', label: 'Контент', icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { id: 'project', label: 'Проект', icon: Folder, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { id: 'goal', label: 'Ціль', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { id: 'metric', label: 'Метрика', icon: BarChart3, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    ];

    const CONTENT_TYPES = [
        { id: 'note', label: 'Нотатка', icon: FileText },
        { id: 'journal', label: 'Журнал', icon: Layout },
        { id: 'file', label: 'Файл', icon: Paperclip },
        { id: 'library', label: 'Бібліотека', icon: HardDrive },
    ];

    const currentEntity = ENTITIES.find(e => e.id === type) || ENTITIES[0];
    const CurrentIcon = currentEntity.icon;

    // Helper for main input placeholder
    const getMainInputPlaceholder = () => {
        if (type === 'content') {
            if (contentType === 'journal') return 'Що сьогодні зрозуміли?'; // Journal main input is description actually? Or title hidden?
            // Journal typically doesn't need title, but we have 'description' state acting as main content for journals often. 
            // BUT UI expects a Title Input at top. 
            // For Journal: Title could be "Summary" or hidden. Let's keep Title input but generic.
            return `Назва ${CONTENT_TYPES.find(c => c.id === contentType)?.label.toLowerCase()}...`;
        }
        return `Назва ${currentEntity.label.toLowerCase()}...`;
    }

    const calculateReminderTime = (dateStr: string, timeStr: string, type: string) => {
        if (!timeStr) {
            // If no time specific, assume 9:00 AM for date-based calculation
            timeStr = '09:00';
        }

        try {
            const d = new Date(`${dateStr}T${timeStr}`);

            switch (type) {
                case 'at_start': return d.toISOString();
                case '5_min': d.setMinutes(d.getMinutes() - 5); return d.toISOString();
                case '15_min': d.setMinutes(d.getMinutes() - 15); return d.toISOString();
                case '30_min': d.setMinutes(d.getMinutes() - 30); return d.toISOString();
                case '1_hour': d.setHours(d.getHours() - 1); return d.toISOString();
                case '1_day': d.setDate(d.getDate() - 1); return d.toISOString();
                default: return undefined;
            }
        } catch (e) {
            return undefined;
        }
    };

    const REMINDER_OPTIONS = [
        { value: 'none', label: 'Без нагадування' },
        { value: 'at_start', label: 'В момент початку' },
        { value: '5_min', label: 'За 5 хвилин' },
        { value: '15_min', label: 'За 15 хвилин' },
        { value: '30_min', label: 'За 30 хвилин' },
        { value: '1_hour', label: 'За 1 годину' },
        { value: '1_day', label: 'За 1 день' },
        // { value: 'custom', label: 'Свій час' },
    ];

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="fixed left-[50%] top-[50%] z-[9999] translate-x-[-50%] translate-y-[-50%] w-[95%] sm:max-w-2xl max-h-[90dvh] sm:h-[600px] p-0 gap-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-card rounded-xl sm:rounded-xl ring-1 ring-slate-900/5 dark:ring-border/20 transition-all duration-200 flex flex-col">
                    <DialogTitle className="sr-only">Quick Add Menu</DialogTitle>

                    {/* Explicit Close Button for Mobile */}
                    <button
                        onClick={() => onOpenChange(false)}
                        className="absolute right-2 top-2 z-50 rounded-full p-2 bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 transition-colors sm:hidden"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    {/* Header (Entity Selector) */}
                    <div className="bg-slate-50/80 dark:bg-card/50 border-b border-slate-100 dark:border-border p-2 flex overflow-x-auto gap-1 shrink-0 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                        {ENTITIES.map(ent => (
                            <button
                                key={ent.id}
                                id={`quick-add-tab-${ent.id}`}
                                onClick={() => {
                                    // Onboarding step check removed
                                    setType(ent.id);
                                    if (isActive) {
                                        // Legacy/Obsolete checks removed.
                                        // Step progression is now handled by specific element interactions.
                                    }
                                }}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-primary/20",
                                    type === ent.id ? "bg-white dark:bg-secondary/50 shadow-sm text-foreground ring-1 ring-slate-200 dark:ring-border" : "text-slate-500 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-secondary/50 hover:text-slate-700 dark:hover:text-foreground"
                                )}
                            >
                                <ent.icon className={cn("h-3.5 w-3.5", type === ent.id ? ent.color : "text-slate-400 dark:text-muted-foreground")} />
                                {ent.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Logic Layer: Sub-selector for Content */}
                    {type === 'content' && (
                        <div className="bg-purple-50/50 dark:bg-purple-900/10 border-b border-purple-100/50 dark:border-purple-900/20 p-2 flex justify-center gap-2 shrink-0">
                            {CONTENT_TYPES.map(ct => (
                                <button
                                    key={ct.id}
                                    id={`content-tab-${ct.id}`}
                                    onClick={() => setContentType(ct.id as any)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all",
                                        contentType === ct.id ? "bg-purple-500 text-white shadow-md shadow-purple-200 dark:shadow-none" : "text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                                    )}
                                >
                                    <ct.icon className="h-3 w-3" />
                                    {ct.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Main Content Area - Grid Layout */}
                    <div className="flex-1 overflow-y-auto sm:overflow-hidden flex flex-col sm:grid sm:grid-cols-[1fr_240px] divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-border bg-white dark:bg-card text-foreground overscroll-contain touch-pan-y">

                        {/* Left Column: Core Content */}
                        <div className="flex flex-col h-auto sm:h-full sm:overflow-y-auto p-4 sm:p-5 relative pb-20 sm:pb-5">
                            {/* Title Input - Hide for Journal? No, keep it consistent or use it as summary */}
                            {!(type === 'content' && contentType === 'journal') && (
                                <div className="flex items-start gap-3 mb-4">
                                    <div className={cn("mt-1.5 p-2 rounded-lg shrink-0 transition-colors duration-300", currentEntity.bg, currentEntity.color)}>
                                        <CurrentIcon className="h-5 w-5" />
                                    </div>
                                    <Input
                                        id={type === 'content' ? 'note-title-input' : 'onboarding-task-title'}
                                        value={title}
                                        onChange={(e) => {
                                            setTitle(e.target.value);
                                        }}
                                        onBlur={() => {
                                            if (title.trim().length > 0) {
                                                // Onboarding checks removed
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                // Prevent submission if in onboarding title step
                                                // Onboarding checks removed
                                                handleSubmit();
                                            }
                                        }}
                                        placeholder={getMainInputPlaceholder()}
                                        className="text-lg font-semibold px-0 border-none shadow-none focus-visible:ring-0 placeholder:text-slate-400 dark:placeholder:text-muted-foreground/50 h-auto bg-transparent rounded-none dark:text-foreground"
                                    />
                                </div>
                            )}


                            {/* Dynamic Middle Section */}
                            <div className="space-y-4 flex-1 pb-4">
                                {type === 'metric' ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Значення</label>
                                            <Input type="number" value={metricValue} onChange={(e) => setMetricValue(e.target.value)} placeholder="0" className="bg-slate-50 dark:bg-secondary/20 border-slate-200 dark:border-border dark:text-foreground" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Одиниця</label>
                                            <Input value={metricUnit} onChange={(e) => setMetricUnit(e.target.value)} placeholder="кг, грн..." className="bg-slate-50 dark:bg-secondary/20 border-slate-200 dark:border-border dark:text-foreground" />
                                        </div>
                                    </div>
                                ) : type === 'goal' ? (
                                    <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                                        <p className="text-xs text-emerald-600 font-medium">✨ Configuring in Wizard...</p>
                                    </div>
                                ) : type === 'content' && contentType === 'library' ? (
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Автор <span className="text-red-500">*</span></label>
                                            <Input value={libAuthor} onChange={(e) => setLibAuthor(e.target.value)} placeholder="Автор..." className="bg-slate-50 dark:bg-secondary/20 border-slate-200 dark:border-border dark:text-foreground" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Посилання <span className="text-red-500">*</span></label>
                                            <Input value={libUrl} onChange={(e) => setLibUrl(e.target.value)} placeholder="https://..." className="bg-slate-50 dark:bg-secondary/20 border-slate-200 dark:border-border dark:text-foreground" />
                                        </div>
                                    </div>
                                ) : (type === 'content' && contentType === 'file') ? (
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Оберіть файл <span className="text-red-500">*</span></label>
                                            <div className="flex items-center justify-center w-full">
                                                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 dark:border-border border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-card hover:bg-slate-100 dark:hover:bg-accent/50 transition-colors">
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        <Paperclip className="w-8 h-8 mb-3 text-slate-400" />
                                                        <p className="mb-2 text-sm text-slate-500 dark:text-muted-foreground"><span className="font-semibold">Натисніть</span> щоб завантажити</p>
                                                        <p className="text-xs text-slate-400 dark:text-muted-foreground">PDF, PNG, JPG, DOC (MAX. 10MB)</p>
                                                    </div>
                                                    <input
                                                        id="dropzone-file"
                                                        type="file"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            if (e.target.files && e.target.files[0]) {
                                                                setFileToUpload(e.target.files[0]);
                                                                // Auto-set title if empty
                                                                if (!title) setTitle(e.target.files[0].name);
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                            {fileToUpload && (
                                                <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md text-xs font-medium border border-emerald-100 dark:border-emerald-500/20">
                                                    <CheckSquare className="w-4 h-4" />
                                                    Завантажено: {fileToUpload.name}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Тип файлу</label>
                                            <Select value={fileType} onValueChange={(v: any) => setFileType(v)}>
                                                <SelectTrigger className="h-8 w-full bg-white dark:bg-secondary/20 border-slate-200 dark:border-border shadow-sm text-xs dark:text-foreground">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="document">Документ</SelectItem>
                                                    <SelectItem value="image">Зображення</SelectItem>
                                                    <SelectItem value="other">Інше</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ) : type === 'content' && contentType === 'journal' ? (
                                    (() => {
                                        // Check for existing journal entry for today
                                        const todayStr = new Date().toISOString().split('T')[0];
                                        // Normalize store dates to string for comparison
                                        const journalEntries = state.journal || [];
                                        const hasEntryToday = journalEntries.some((j: any) => {
                                            const jDate = (j.date instanceof Date)
                                                ? j.date.toISOString().split('T')[0]
                                                : (typeof j.date === 'string' ? j.date.split('T')[0] : String(j.date));
                                            return jDate === todayStr;
                                        });

                                        if (hasEntryToday) {
                                            return (
                                                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-8 bg-green-50/50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/20">
                                                    <div className="p-3 bg-green-100 dark:bg-green-800/30 rounded-full">
                                                        <CheckSquare className="w-8 h-8 text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h3 className="text-lg font-bold text-green-800 dark:text-green-300">План виконано!</h3>
                                                        <p className="text-sm text-green-700 dark:text-green-400 max-w-xs mx-auto">
                                                            Ви вже заповнили журнал сьогодні. Повертайтеся завтра для нового запису!
                                                        </p>
                                                    </div>
                                                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="mt-4 border-green-200 text-green-700 hover:bg-green-100">
                                                        Чудово
                                                    </Button>
                                                </div>
                                            );
                                        }

                                        return (
                                            <Textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Що сьогодні зрозуміли?..."
                                                className="min-h-[200px] flex-1 resize-none border-none focus-visible:ring-0 p-0 text-base shadow-none bg-transparent text-slate-600 dark:text-foreground placeholder:text-slate-300 dark:placeholder:text-muted-foreground/30"
                                            />
                                        );
                                    })()
                                ) : (type === 'content' && contentType === 'note') ? (
                                    <div className="flex flex-col gap-4 flex-1 min-h-0">
                                        <div className="flex-1 overflow-visible">
                                            <RichTextEditor
                                                content={description}
                                                onChange={setDescription}
                                                placeholder="Start writing your note..."
                                                className="h-full min-h-[300px]"
                                            />
                                        </div>
                                        <div className="shrink-0">
                                            <AudioRecorder onRecordingComplete={setAudioData} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col h-full gap-4">
                                        <Textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder={
                                                type === 'routine' ? "Опис рутини..." :
                                                    type === 'project' ? "Короткий опис проекту..." :
                                                        "Додаткові деталі..."
                                            }
                                            className="min-h-[100px] flex-1 resize-none border-none focus-visible:ring-0 p-0 text-slate-600 dark:text-foreground placeholder:text-slate-300 dark:placeholder:text-muted-foreground/30 text-sm shadow-none bg-transparent"
                                        />

                                        {/* Project Metrics Selection */}
                                        {type === 'project' && (
                                            <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-border">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Метрики проекту</label>
                                                    <Select onValueChange={(v) => {
                                                        if (!selectedMetricIds.includes(v)) {
                                                            setSelectedMetricIds([...selectedMetricIds, v]);
                                                        }
                                                    }}>
                                                        <SelectTrigger className="h-6 w-auto text-[10px] border-none shadow-none p-0 text-blue-500 hover:text-blue-600">
                                                            <span>+ Додати метрику</span>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {state.metricDefinitions
                                                                .filter(m => (areaId === 'all' || !areaId) ? true : m.areaId === areaId)
                                                                .map(m => (
                                                                    <SelectItem key={m.id} value={m.id} disabled={selectedMetricIds.includes(m.id)}>
                                                                        {m.name}
                                                                    </SelectItem>
                                                                ))
                                                            }
                                                            {state.metricDefinitions.length === 0 && (
                                                                <div className="p-2 text-xs text-muted-foreground text-center">Немає метрик</div>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedMetricIds.map(mid => {
                                                        const m = state.metricDefinitions.find(d => d.id === mid);
                                                        if (!m) return null;
                                                        return (
                                                            <div key={mid} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs border border-indigo-100 dark:border-indigo-500/20">
                                                                <BarChart3 className="w-3 h-3" />
                                                                <span>{m.name}</span>
                                                                <button
                                                                    onClick={() => setSelectedMetricIds(prev => prev.filter(id => id !== mid))}
                                                                    className="ml-1 hover:text-red-500"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                    {selectedMetricIds.length === 0 && (
                                                        <span className="text-xs text-slate-400 italic">Немає обраних метрик</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Subtasks (Inline) */}
                                {type === 'task' && parseInt(duration) >= 360 && (
                                    <div className="space-y-2 pt-2 border-t border-dashed border-slate-100 dark:border-border">
                                        <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                                            <List className="w-3 h-3" /> Етапи
                                        </h4>
                                        <div className="space-y-2">
                                            {subtasks.map(st => (
                                                <div key={st.id} className="flex items-center gap-2 text-sm group">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                                                    <span className="flex-1 text-slate-700 dark:text-foreground truncate">{st.title}</span>
                                                    <button onClick={() => setSubtasks(prev => prev.filter(p => p.id !== st.id))} className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="flex items-center gap-2">
                                                <Plus className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                                <input
                                                    value={newSubtask}
                                                    onChange={(e) => setNewSubtask(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && newSubtask.trim()) {
                                                            e.preventDefault();
                                                            setSubtasks([...subtasks, { id: Date.now().toString(), title: newSubtask, completed: false }]);
                                                            setNewSubtask('');
                                                        }
                                                    }}
                                                    placeholder="Додати етап (Enter)..."
                                                    className="bg-transparent border-none text-sm focus:ring-0 p-0 w-full placeholder:text-orange-300/50 text-slate-700 dark:text-foreground h-6"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Metadata Sidebar */}
                        <div className="bg-slate-50/50 dark:bg-card/50 p-4 space-y-5 h-auto sm:h-full sm:overflow-y-auto">

                            {/* Area (Hide for Journal) */}
                            {!(type === 'content' && contentType === 'journal') && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Сфера <span className="text-red-500">*</span></label>
                                    <Select value={areaId} onValueChange={(v) => { setAreaId(v); checkAndAdvance('create-task-area'); }} disabled={!!projectId}>
                                        <SelectTrigger id="onboarding-task-area" className="h-8 w-full bg-white dark:bg-secondary/20 border-slate-200 dark:border-border shadow-sm text-xs disabled:opacity-50 disabled:cursor-not-allowed dark:text-foreground">
                                            <SelectValue placeholder="Сфера" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {state.areas
                                                .filter(a => type === 'metric' ? (a.id !== 'inbox' && a.id !== 'incoming' && a.title !== 'Вхідні' && a.title !== 'Inbox' && !a.title.includes('Вхідні')) : true)
                                                .map(a => (
                                                    <SelectItem key={a.id} value={a.id}>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${a.color}`} />
                                                            {a.title}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Project (Task Only) */}
                            {type === 'task' && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Проект</label>
                                    <Select value={projectId || "none"} onValueChange={(v) => setProjectId(v === "none" ? undefined : v)}>
                                        <SelectTrigger className="h-8 w-full bg-white dark:bg-secondary/20 border-slate-200 dark:border-border shadow-sm text-xs dark:text-foreground">
                                            <SelectValue placeholder="Без проекту" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none" className="text-muted-foreground">Без проекту</SelectItem>
                                            {state.projects.filter(p => p.status === 'active').map(p => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    <div className="flex items-center gap-2">
                                                        <Folder className="w-3 h-3 text-blue-500" />
                                                        {p.title}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Project Scheduling */}
                            {type === 'project' && (
                                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-border">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                            {isProjectScheduled ? 'Запланований старт' : 'Дедлайн'}
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-slate-400">
                                                {isProjectScheduled ? 'Відкласти' : 'Активний'}
                                            </span>
                                            <Switch checked={isProjectScheduled} onCheckedChange={setIsProjectScheduled} className="scale-75 data-[state=checked]:bg-blue-500" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 animate-in slide-in-from-top-2">
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="h-8 w-full px-2 bg-white dark:bg-secondary/20 border border-slate-200 dark:border-border hover:border-slate-300 dark:hover:border-primary/50 shadow-sm rounded-md text-xs font-medium text-slate-700 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                            {isProjectScheduled
                                                ? "Проект буде мати статус 'Planned' до цієї дати."
                                                : "Дата завершення проекту (необов'язково)."}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Date (Hide for Habit, Routine AND Project) */}
                            {type !== 'habit' && type !== 'routine' && type !== 'project' && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                        {type === 'project' ? 'Дедлайн' : 'Дата'} {['task', 'event', 'content'].includes(type) && contentType !== 'library' && <span className="text-red-500">*</span>}
                                    </label>
                                    <input
                                        id="onboarding-task-date"
                                        type="date"
                                        value={date}
                                        onChange={(e) => { setDate(e.target.value); checkAndAdvance('create-task-date'); }}
                                        className="h-8 w-full px-2 bg-white dark:bg-secondary/20 border border-slate-200 dark:border-border hover:border-slate-300 dark:hover:border-primary/50 shadow-sm rounded-md text-xs font-medium text-slate-700 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/10"
                                    />
                                </div>
                            )}

                            {/* Habit Specific Fields */}
                            {type === 'habit' && (
                                <>
                                    {/* Frequency */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Частота <span className="text-red-500">*</span></label>
                                        <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                                            <SelectTrigger className="h-8 w-full bg-white dark:bg-secondary/20 border-slate-200 dark:border-border shadow-sm text-xs dark:text-foreground">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="daily">Щодня</SelectItem>
                                                <SelectItem value="weekly">Щотижня</SelectItem>
                                                <SelectItem value="manual">Спеціальний графік</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {/* Manual Days Selector (Reuse logic if needed, or simple version) */}
                                        {frequency === 'manual' && (
                                            <div className="flex justify-between gap-1 mt-2">
                                                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((day, idx) => {
                                                    const jsDay = idx === 6 ? 0 : idx + 1;
                                                    const isSelected = daysOfWeek.includes(jsDay);
                                                    return (
                                                        <button
                                                            key={day}
                                                            onClick={() => {
                                                                if (isSelected) setDaysOfWeek(daysOfWeek.filter(d => d !== jsDay));
                                                                else setDaysOfWeek([...daysOfWeek, jsDay]);
                                                            }}
                                                            className={cn(
                                                                "h-6 flex-1 rounded text-[10px] font-bold transition-all border border-transparent",
                                                                isSelected ? "bg-orange-500 text-white" : "bg-slate-100 dark:bg-secondary text-slate-500"
                                                            )}
                                                        >
                                                            {day}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Time of Day */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Час доби</label>
                                        <Select value={habitTimeOfDay} onValueChange={(v: any) => setHabitTimeOfDay(v)}>
                                            <SelectTrigger className="h-8 w-full bg-white dark:bg-secondary/20 border-slate-200 dark:border-border shadow-sm text-xs dark:text-foreground">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="morning">Ранок</SelectItem>
                                                <SelectItem value="afternoon">День</SelectItem>
                                                <SelectItem value="evening">Вечір</SelectItem>
                                                <SelectItem value="anytime">Будь-коли</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Minimum Viable Habit */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Мінімум</label>
                                        <Input
                                            value={habitMinimum}
                                            onChange={(e) => setHabitMinimum(e.target.value)}
                                            placeholder="Напр. 1 сторінка, 5 хв..."
                                            className="h-8 bg-white dark:bg-secondary/20 border-slate-200 dark:border-border text-xs dark:text-foreground"
                                        />
                                    </div>

                                    {/* Linked Metrics (Multi-Select) */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Впливає на метрики</label>

                                        <div className="bg-slate-50 dark:bg-secondary/20 rounded-lg p-2 border border-slate-100 dark:border-border min-h-[40px]">
                                            {areaId === 'all' ? (
                                                <p className="text-[10px] text-muted-foreground text-center py-1">Оберіть сферу вище, щоб побачити доступні метрики.</p>
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    {state.metricDefinitions
                                                        .filter(m => m.areaId === areaId)
                                                        .map(m => {
                                                            const isSelected = relatedMetricIds.includes(m.id);
                                                            return (
                                                                <button
                                                                    key={m.id}
                                                                    onClick={() => {
                                                                        if (isSelected) {
                                                                            setRelatedMetricIds(prev => prev.filter(id => id !== m.id));
                                                                        } else {
                                                                            setRelatedMetricIds(prev => [...prev, m.id]);
                                                                        }
                                                                    }}
                                                                    className={cn(
                                                                        "flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-all border",
                                                                        isSelected
                                                                            ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300"
                                                                            : "bg-white dark:bg-secondary border-slate-200 dark:border-border text-slate-600 dark:text-muted-foreground hover:border-indigo-200 dark:hover:border-indigo-500/30"
                                                                    )}
                                                                >
                                                                    <BarChart3 className={cn("w-3 h-3", isSelected ? "text-indigo-500" : "text-slate-400")} />
                                                                    {m.name}
                                                                </button>
                                                            )
                                                        })}
                                                    {state.metricDefinitions.filter(m => m.areaId === areaId).length === 0 && (
                                                        <p className="text-[10px] text-muted-foreground w-full text-center">В цій сфері немає метрик</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Journal Mood */}
                            {type === 'content' && contentType === 'journal' && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Настрій ({journalMood}/10) <span className="text-red-500">*</span></label>
                                    <Input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={journalMood}
                                        onChange={(e) => setJournalMood(e.target.value)}
                                        className="h-8 p-0"
                                    />
                                </div>
                            )}

                            {/* Library Type */}
                            {type === 'content' && contentType === 'library' && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Тип Ресурсу <span className="text-red-500">*</span></label>
                                    <Select value={libType} onValueChange={(v: any) => setLibType(v)}>
                                        <SelectTrigger className="h-8 w-full bg-white dark:bg-secondary/20 border-slate-200 dark:border-border shadow-sm text-xs dark:text-foreground">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="book">Книга</SelectItem>
                                            <SelectItem value="article">Стаття</SelectItem>
                                            <SelectItem value="course">Курс</SelectItem>
                                            <SelectItem value="video">Відео</SelectItem>
                                            <SelectItem value="link">Посилання</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* File Type */}
                            {type === 'content' && contentType === 'file' && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Тип Файлу</label>
                                    <Select value={fileType} onValueChange={(v: any) => setFileType(v)}>
                                        <SelectTrigger className="h-8 w-full bg-white dark:bg-secondary/20 border-slate-200 dark:border-border shadow-sm text-xs dark:text-foreground">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="document">Документ</SelectItem>
                                            <SelectItem value="image">Зображення</SelectItem>
                                            <SelectItem value="other">Інше</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Time (Task & Event) */}
                            {(type === 'task' || type === 'event') && (
                                <div className="space-y-3">
                                    {/* Reminder Selection */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Нагадування</label>
                                        <Select value={reminderType} onValueChange={setReminderType}>
                                            <SelectTrigger className="h-8 w-full bg-white dark:bg-secondary/20 border-slate-200 dark:border-border shadow-sm text-xs dark:text-foreground">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {REMINDER_OPTIONS.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Time Input */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Час початку {['event'].includes(type) && <span className="text-red-500">*</span>}</label>
                                        <Select value={startTime} onValueChange={setStartTime}>
                                            <SelectTrigger className={cn("h-8 w-full bg-white dark:bg-secondary/20 border-slate-200 dark:border-border shadow-sm text-xs dark:text-foreground", startTime && !isSlotAvailable(startTime) ? "border-red-300 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400" : "")}>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3 h-3 text-slate-400 dark:text-muted-foreground" />
                                                    <SelectValue placeholder="--:--" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[200px]">
                                                {TIME_SLOTS.map(time => {
                                                    const available = isSlotAvailable(time);
                                                    return (
                                                        <SelectItem key={time} value={time} disabled={!available} className={available ? "" : "text-slate-300 decoration-slate-300"}>
                                                            <span className={available ? "" : "line-through"}>{time}</span>
                                                            {!available && <span className="ml-2 text-[10px] text-red-400">(Occupied)</span>}
                                                        </SelectItem>
                                                    )
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            {/* Duration (Task & Routine) */}
                            {(type === 'task' || type === 'routine') && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Тривалість <span className="text-red-500">*</span></label>
                                    <Select value={duration} onValueChange={(v) => { setDuration(v); checkAndAdvance('create-task-duration'); }}>
                                        <SelectTrigger id="onboarding-task-duration" className="h-8 w-full bg-white dark:bg-secondary/20 border-slate-200 dark:border-border shadow-sm text-xs dark:text-foreground">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px]">
                                            <SelectItem value="15">15 хв</SelectItem>
                                            <SelectItem value="30">30 хв</SelectItem>
                                            <SelectItem value="45">45 хв</SelectItem>
                                            <SelectItem value="60">1 год</SelectItem>
                                            <SelectItem value="90">1.5 год</SelectItem>
                                            <SelectItem value="120">2 год</SelectItem>
                                            <SelectItem value="360">6 год</SelectItem>
                                            <SelectItem value="480">8 год (Workday)</SelectItem>
                                            <SelectItem value="1440">1 день</SelectItem>
                                            <SelectItem value="10080">1 тиждень</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Frequency (Routine Only) */}
                            {type === 'routine' && (
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Частота <span className="text-red-500">*</span></label>
                                        <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                                            <SelectTrigger className="h-8 w-full bg-white dark:bg-secondary/20 border-slate-200 dark:border-border shadow-sm text-xs dark:text-foreground">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="daily">Щодня</SelectItem>
                                                <SelectItem value="weekly">Щотижня</SelectItem>
                                                <SelectItem value="manual">Вручну (Дні тижня)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Manual Days Selector */}
                                    {frequency === 'manual' && (
                                        <div className="space-y-1.5 animate-in slide-in-from-top-2 fade-in duration-200">
                                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Обрати дні <span className="text-red-500">*</span></label>
                                            <div className="flex justify-between gap-1">
                                                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((day, idx) => {
                                                    const jsDay = idx === 6 ? 0 : idx + 1;
                                                    const isSelected = daysOfWeek.includes(jsDay);
                                                    return (
                                                        <button
                                                            key={day}
                                                            onClick={() => {
                                                                if (isSelected) {
                                                                    setDaysOfWeek(daysOfWeek.filter(d => d !== jsDay));
                                                                } else {
                                                                    setDaysOfWeek([...daysOfWeek, jsDay]);
                                                                }
                                                            }}
                                                            className={cn(
                                                                "h-8 flex-1 rounded-md text-xs font-medium transition-all border border-transparent",
                                                                isSelected
                                                                    ? "bg-orange-500 text-white shadow-md shadow-orange-200 dark:shadow-none"
                                                                    : "bg-slate-100 dark:bg-secondary/40 text-slate-500 dark:text-muted-foreground hover:bg-slate-200 dark:hover:bg-secondary/60 hover:text-slate-700 dark:hover:text-foreground"
                                                            )}
                                                        >
                                                            {day}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Focus Toggle */}
                            {type === 'task' && (
                                <div className="pt-2">
                                    <div className="flex items-center justify-between p-2 border border-slate-200 dark:border-border bg-white dark:bg-secondary/10 rounded-md shadow-sm">
                                        <span className="text-xs font-semibold text-slate-600 dark:text-foreground">Фокус</span>
                                        <Switch checked={isFocus} onCheckedChange={setIsFocus} className="scale-75 data-[state=checked]:bg-orange-500" />
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Footer - Fixed Bottom */}
                    <div className="px-6 py-4 bg-white dark:bg-card border-t border-slate-100 dark:border-border flex justify-between items-center shrink-0">
                        <div className="text-xs text-slate-400 font-medium">
                            Press <span className="font-bold text-slate-600 dark:text-slate-300">Enter</span> to create
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="hover:text-orange-600">Скасувати</Button>
                            {/* Hide Create button if Journal Completed */}
                            {!(type === 'content' && contentType === 'journal' && (() => {
                                const todayStr = new Date().toISOString().split('T')[0];
                                return (state.journal || []).some((j: any) => {
                                    const jDate = (j.date instanceof Date) ? j.date.toISOString().split('T')[0] : String(j.date).split('T')[0];
                                    return jDate === todayStr;
                                });
                            })()) && (
                                    <Button
                                        id={type === 'content' ? 'note-submit-btn' : 'onboarding-task-create-btn'}
                                        size="sm"
                                        onClick={handleSubmit}
                                        className="bg-orange-600 text-white hover:bg-orange-700 rounded-md shadow-sm px-6 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Створити {type === 'content' ? CONTENT_TYPES.find(c => c.id === contentType)?.label : currentEntity.label}
                                    </Button>
                                )}
                        </div>
                    </div>

                </DialogContent>
            </Dialog>

            <UpgradeModal
                open={showUpgrade}
                onOpenChange={setShowUpgrade}
                title="Ліміт досягнуто"
                description={
                    type === 'task' ? "У Free-версії доступно до 10 активних завдань." :
                        type === 'content' && contentType === 'journal' ? "У Free-версії доступно до 20 записів у журнал." :
                            "Ця функція обмежена у безкоштовній версії."
                }
            />
        </>
    );
}


