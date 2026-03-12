'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Mail, Send, Inbox, Archive, Trash2, Star, StarOff,
    Plus, RefreshCw, ChevronLeft, Search, Settings2,
    X, Loader2, MailOpen, Reply, Forward
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EmailAccount {
    id: string;
    address: string;
    displayName: string;
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    imapHost?: string;
    imapPort?: number;
    isActive: boolean;
}

interface Email {
    id: string;
    accountId: string;
    folder: string;
    fromAddress: string;
    fromName: string | null;
    toAddress: string;
    toName: string | null;
    subject: string;
    bodyHtml: string | null;
    bodyText: string | null;
    isRead: boolean;
    isStarred: boolean;
    inReplyTo: string | null;
    messageId: string | null;
    receivedAt: string | null;
    sentAt: string | null;
    createdAt: string;
}

type Folder = 'inbox' | 'sent' | 'archive' | 'trash';

const FOLDERS: { key: Folder; label: string; icon: any }[] = [
    { key: 'inbox', label: 'Вхідні', icon: Inbox },
    { key: 'sent', label: 'Надіслані', icon: Send },
    { key: 'archive', label: 'Архів', icon: Archive },
    { key: 'trash', label: 'Кошик', icon: Trash2 },
];

export function AdminMailClient() {
    const [accounts, setAccounts] = useState<EmailAccount[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const [emails, setEmails] = useState<Email[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [activeFolder, setActiveFolder] = useState<Folder>('inbox');
    const [loading, setLoading] = useState(true);
    const [loadingEmails, setLoadingEmails] = useState(false);
    const [showCompose, setShowCompose] = useState(false);
    const [showAccountSettings, setShowAccountSettings] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Compose form state
    const [composeTo, setComposeTo] = useState('');
    const [composeSubject, setComposeSubject] = useState('');
    const [composeBody, setComposeBody] = useState('');
    const [sending, setSending] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Email | null>(null);

    // Account form state
    const [newAccount, setNewAccount] = useState({
        address: '', displayName: '', smtpHost: '', smtpPort: 465,
        smtpSecure: true, imapHost: '', imapPort: 993, username: '', password: ''
    });
    const [savingAccount, setSavingAccount] = useState(false);

    // Fetch accounts
    const fetchAccounts = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/mail/accounts');
            if (res.ok) {
                const data = await res.json();
                setAccounts(data.accounts || []);
                if (data.accounts.length > 0 && !selectedAccountId) {
                    setSelectedAccountId(data.accounts[0].id);
                }
            }
        } catch (e) {
            console.error('Failed to fetch accounts', e);
        } finally {
            setLoading(false);
        }
    }, [selectedAccountId]);

    // Fetch emails for selected account + folder
    const fetchEmails = useCallback(async () => {
        if (!selectedAccountId) return;
        setLoadingEmails(true);
        try {
            const params = new URLSearchParams({ accountId: selectedAccountId, folder: activeFolder });
            const res = await fetch(`/api/admin/mail?${params}`);
            if (res.ok) {
                const data = await res.json();
                setEmails(data.emails || []);
            }
        } catch (e) {
            console.error('Failed to fetch emails', e);
        } finally {
            setLoadingEmails(false);
        }
    }, [selectedAccountId, activeFolder]);

    useEffect(() => { fetchAccounts(); }, [fetchAccounts]);
    useEffect(() => { fetchEmails(); }, [fetchEmails]);

    // Send email
    const handleSend = async () => {
        if (!selectedAccountId || !composeTo || !composeSubject) {
            toast.error('Заповніть всі обов\'язкові поля');
            return;
        }
        setSending(true);
        try {
            const res = await fetch('/api/admin/mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountId: selectedAccountId,
                    to: composeTo,
                    subject: composeSubject,
                    bodyHtml: `<div style="font-family: sans-serif; white-space: pre-wrap;">${composeBody}</div>`,
                    bodyText: composeBody,
                    inReplyTo: replyingTo?.messageId || undefined,
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Send failed');
            }
            toast.success('Лист надіслано!');
            setShowCompose(false);
            setComposeTo('');
            setComposeSubject('');
            setComposeBody('');
            setReplyingTo(null);
            fetchEmails();
        } catch (e: any) {
            toast.error(e.message || 'Помилка при надсиланні');
        } finally {
            setSending(false);
        }
    };

    // Mark email read/unread
    const toggleRead = async (email: Email) => {
        try {
            await fetch(`/api/admin/mail/${email.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isRead: !email.isRead }),
            });
            setEmails(prev => prev.map(e => e.id === email.id ? { ...e, isRead: !e.isRead } : e));
            if (selectedEmail?.id === email.id) {
                setSelectedEmail({ ...selectedEmail, isRead: !selectedEmail.isRead });
            }
        } catch { }
    };

    // Star/unstar
    const toggleStar = async (email: Email) => {
        try {
            await fetch(`/api/admin/mail/${email.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isStarred: !email.isStarred }),
            });
            setEmails(prev => prev.map(e => e.id === email.id ? { ...e, isStarred: !e.isStarred } : e));
        } catch { }
    };

    // Archive / delete
    const moveEmail = async (emailId: string, folder: string) => {
        try {
            await fetch(`/api/admin/mail/${emailId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folder }),
            });
            setEmails(prev => prev.filter(e => e.id !== emailId));
            if (selectedEmail?.id === emailId) setSelectedEmail(null);
            toast.success(folder === 'archive' ? 'Архівовано' : folder === 'trash' ? 'Видалено' : 'Переміщено');
        } catch { }
    };

    // Reply to email
    const handleReply = (email: Email) => {
        setReplyingTo(email);
        setComposeTo(email.fromAddress);
        setComposeSubject(`Re: ${email.subject.replace(/^Re:\s*/i, '')}`);
        setComposeBody('');
        setShowCompose(true);
    };

    // Forward email
    const handleForward = (email: Email) => {
        setReplyingTo(null);
        setComposeTo('');
        setComposeSubject(`Fwd: ${email.subject.replace(/^Fwd:\s*/i, '')}`);
        setComposeBody(`\n\n---------- Forwarded message ----------\nFrom: ${email.fromName || email.fromAddress}\nSubject: ${email.subject}\n\n${email.bodyText || ''}`);
        setShowCompose(true);
    };

    // Open email and mark as read
    const openEmail = async (email: Email) => {
        setSelectedEmail(email);
        if (!email.isRead) {
            try {
                await fetch(`/api/admin/mail/${email.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isRead: true }),
                });
                setEmails(prev => prev.map(e => e.id === email.id ? { ...e, isRead: true } : e));
            } catch { }
        }
    };

    // Save new email account
    const handleSaveAccount = async () => {
        setSavingAccount(true);
        try {
            const res = await fetch('/api/admin/mail/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAccount),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error);
            }
            toast.success('Акаунт додано!');
            setNewAccount({ address: '', displayName: '', smtpHost: '', smtpPort: 465, smtpSecure: true, imapHost: '', imapPort: 993, username: '', password: '' });
            setShowAccountSettings(false);
            fetchAccounts();
        } catch (e: any) {
            toast.error(e.message || 'Failed to save account');
        } finally {
            setSavingAccount(false);
        }
    };

    // Delete account
    const handleDeleteAccount = async (id: string) => {
        if (!confirm('Видалити цей поштовий акаунт? Всі листи будуть втрачені.')) return;
        try {
            await fetch(`/api/admin/mail/accounts?id=${id}`, { method: 'DELETE' });
            toast.success('Акаунт видалено');
            fetchAccounts();
            if (selectedAccountId === id) {
                setSelectedAccountId(null);
                setEmails([]);
            }
        } catch { }
    };

    const filteredEmails = searchQuery
        ? emails.filter(e =>
            e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.fromAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.toAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (e.fromName || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
        : emails;

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        if (isToday) return d.toLocaleTimeString('uk', { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString('uk', { day: 'numeric', month: 'short' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Mail className="w-6 h-6 text-orange-500" /> Пошта
                    </h1>
                    {accounts.length > 0 && (
                        <select
                            value={selectedAccountId || ''}
                            onChange={e => { setSelectedAccountId(e.target.value); setSelectedEmail(null); }}
                            className="bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-1.5 text-slate-200 focus:ring-orange-500 focus:border-orange-500"
                        >
                            {accounts.map(a => (
                                <option key={a.id} value={a.id}>{a.address}</option>
                            ))}
                        </select>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-white"
                        onClick={() => fetchEmails()}
                    >
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-white"
                        onClick={() => setShowAccountSettings(true)}
                    >
                        <Settings2 className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-500 text-white gap-1"
                        onClick={() => { setReplyingTo(null); setComposeTo(''); setComposeSubject(''); setComposeBody(''); setShowCompose(true); }}
                    >
                        <Plus className="w-4 h-4" /> Написати
                    </Button>
                </div>
            </div>

            {accounts.length === 0 ? (
                /* Empty state — no accounts */
                <Card className="bg-slate-900 border-slate-800 flex-1 flex items-center justify-center">
                    <CardContent className="text-center space-y-4 py-20">
                        <Mail className="w-16 h-16 text-slate-600 mx-auto" />
                        <h2 className="text-xl font-bold text-slate-300">Немає поштових акаунтів</h2>
                        <p className="text-slate-500 max-w-md mx-auto">
                            Додайте поштовий акаунт (наприклад, support@zynorvia.com) щоб почати надсилати та отримувати листи.
                        </p>
                        <Button
                            onClick={() => setShowAccountSettings(true)}
                            className="bg-orange-600 hover:bg-orange-500 text-white gap-1"
                        >
                            <Plus className="w-4 h-4" /> Додати акаунт
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                /* Main mail layout */
                <div className="flex-1 flex gap-0 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 min-h-0">
                    {/* Folder sidebar */}
                    <div className="w-44 shrink-0 border-r border-slate-800 bg-slate-900/80 py-2">
                        {FOLDERS.map(f => {
                            const Icon = f.icon;
                            const count = f.key === 'inbox' ? emails.filter(e => !e.isRead && activeFolder === 'inbox').length : 0;
                            return (
                                <button
                                    key={f.key}
                                    onClick={() => { setActiveFolder(f.key); setSelectedEmail(null); }}
                                    className={cn(
                                        "w-full flex items-center gap-2.5 px-4 py-2 text-sm font-medium transition-colors",
                                        activeFolder === f.key
                                            ? "bg-slate-800 text-white"
                                            : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                    )}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{f.label}</span>
                                    {count > 0 && (
                                        <span className="ml-auto text-[10px] font-bold bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Email list */}
                    <div className={cn(
                        "border-r border-slate-800 flex flex-col min-h-0",
                        selectedEmail ? "w-80 shrink-0 hidden md:flex" : "flex-1"
                    )}>
                        {/* Search */}
                        <div className="p-2 border-b border-slate-800">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Пошук..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-800 border-0 text-sm text-slate-200 placeholder:text-slate-500 rounded-lg pl-8 pr-3 py-1.5 focus:ring-1 focus:ring-orange-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Email list items */}
                        <div className="flex-1 overflow-y-auto">
                            {loadingEmails ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                                </div>
                            ) : filteredEmails.length === 0 ? (
                                <div className="text-center py-20 text-slate-500 text-sm">
                                    Немає листів
                                </div>
                            ) : (
                                filteredEmails.map(email => (
                                    <button
                                        key={email.id}
                                        onClick={() => openEmail(email)}
                                        className={cn(
                                            "w-full text-left px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors",
                                            selectedEmail?.id === email.id && "bg-slate-800",
                                            !email.isRead && "bg-slate-800/30"
                                        )}
                                    >
                                        <div className="flex items-start gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleStar(email); }}
                                                className="mt-0.5 shrink-0"
                                            >
                                                {email.isStarred
                                                    ? <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                                    : <Star className="w-3.5 h-3.5 text-slate-600 hover:text-slate-400" />
                                                }
                                            </button>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={cn(
                                                        "text-sm truncate",
                                                        !email.isRead ? "font-bold text-white" : "text-slate-300"
                                                    )}>
                                                        {activeFolder === 'sent'
                                                            ? (email.toName || email.toAddress)
                                                            : (email.fromName || email.fromAddress)
                                                        }
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 shrink-0">
                                                        {formatDate(email.sentAt || email.receivedAt || email.createdAt)}
                                                    </span>
                                                </div>
                                                <p className={cn(
                                                    "text-xs truncate mt-0.5",
                                                    !email.isRead ? "text-slate-200" : "text-slate-400"
                                                )}>
                                                    {email.subject}
                                                </p>
                                                {email.bodyText && (
                                                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                                        {email.bodyText.slice(0, 80)}
                                                    </p>
                                                )}
                                            </div>
                                            {!email.isRead && (
                                                <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Email detail panel */}
                    {selectedEmail ? (
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            {/* Detail header */}
                            <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-slate-400 hover:text-white md:hidden"
                                    onClick={() => setSelectedEmail(null)}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <div className="flex items-center gap-1 ml-auto">
                                    <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => handleReply(selectedEmail)} title="Відповісти">
                                        <Reply className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => handleForward(selectedEmail)} title="Переслати">
                                        <Forward className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => toggleRead(selectedEmail)} title={selectedEmail.isRead ? 'Позначити непрочитаним' : 'Позначити прочитаним'}>
                                        <MailOpen className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => moveEmail(selectedEmail.id, 'archive')} title="Архівувати">
                                        <Archive className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => moveEmail(selectedEmail.id, 'trash')} title="Видалити">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Detail body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                <h2 className="text-xl font-bold text-white">{selectedEmail.subject}</h2>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                        {(selectedEmail.fromName || selectedEmail.fromAddress).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-200">
                                            {selectedEmail.fromName || selectedEmail.fromAddress}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            до {selectedEmail.toAddress} • {formatDate(selectedEmail.sentAt || selectedEmail.receivedAt || selectedEmail.createdAt)}
                                        </p>
                                    </div>
                                </div>
                                <div className="border-t border-slate-800 pt-4">
                                    {selectedEmail.bodyHtml ? (
                                        <div
                                            className="prose prose-sm prose-invert max-w-none text-slate-300"
                                            dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
                                        />
                                    ) : (
                                        <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">
                                            {selectedEmail.bodyText || '(Порожній лист)'}
                                        </pre>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        !selectedEmail && filteredEmails.length > 0 && (
                            <div className="hidden md:flex flex-1 items-center justify-center text-slate-500">
                                <div className="text-center space-y-2">
                                    <Mail className="w-12 h-12 mx-auto text-slate-600" />
                                    <p className="text-sm">Оберіть лист для перегляду</p>
                                </div>
                            </div>
                        )
                    )}
                </div>
            )}

            {/* ==================== COMPOSE MODAL ==================== */}
            {showCompose && (
                <div className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between p-4 border-b border-slate-800">
                            <h3 className="text-lg font-bold text-white">
                                {replyingTo ? 'Відповідь' : 'Новий лист'}
                            </h3>
                            <button onClick={() => setShowCompose(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                            <div>
                                <label className="text-xs font-medium text-slate-400 mb-1 block">Кому</label>
                                <input
                                    type="email"
                                    value={composeTo}
                                    onChange={e => setComposeTo(e.target.value)}
                                    placeholder="email@example.com"
                                    className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-400 mb-1 block">Тема</label>
                                <input
                                    type="text"
                                    value={composeSubject}
                                    onChange={e => setComposeSubject(e.target.value)}
                                    placeholder="Тема листа"
                                    className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-400 mb-1 block">Повідомлення</label>
                                <textarea
                                    value={composeBody}
                                    onChange={e => setComposeBody(e.target.value)}
                                    placeholder="Напишіть ваше повідомлення..."
                                    rows={10}
                                    className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-orange-500 outline-none resize-none"
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-800 flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setShowCompose(false)} className="text-slate-400">
                                Скасувати
                            </Button>
                            <Button
                                onClick={handleSend}
                                disabled={sending || !composeTo || !composeSubject}
                                className="bg-orange-600 hover:bg-orange-500 text-white gap-1"
                            >
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Надіслати
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== ACCOUNT SETTINGS MODAL ==================== */}
            {showAccountSettings && (
                <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[85vh]">
                        <div className="flex items-center justify-between p-4 border-b border-slate-800">
                            <h3 className="text-lg font-bold text-white">Поштові акаунти</h3>
                            <button onClick={() => setShowAccountSettings(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                            {/* Existing accounts */}
                            {accounts.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Наявні акаунти</h4>
                                    {accounts.map(a => (
                                        <div key={a.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                                            <div>
                                                <p className="text-sm font-medium text-slate-200">{a.address}</p>
                                                <p className="text-xs text-slate-500">{a.displayName} • {a.smtpHost}</p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                                                onClick={() => handleDeleteAccount(a.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add new account form */}
                            <div className="space-y-3 border-t border-slate-800 pt-4">
                                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Додати новий акаунт</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Email адреса</label>
                                        <input
                                            value={newAccount.address}
                                            onChange={e => setNewAccount({ ...newAccount, address: e.target.value })}
                                            placeholder="support@zynorvia.com"
                                            className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Ім'я</label>
                                        <input
                                            value={newAccount.displayName}
                                            onChange={e => setNewAccount({ ...newAccount, displayName: e.target.value })}
                                            placeholder="Zynorvia Support"
                                            className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">SMTP хост</label>
                                        <input
                                            value={newAccount.smtpHost}
                                            onChange={e => setNewAccount({ ...newAccount, smtpHost: e.target.value })}
                                            placeholder="localhost або mail.zynorvia.com"
                                            className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">SMTP порт</label>
                                        <input
                                            type="number"
                                            value={newAccount.smtpPort}
                                            onChange={e => setNewAccount({ ...newAccount, smtpPort: Number(e.target.value) })}
                                            className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Логін</label>
                                        <input
                                            value={newAccount.username}
                                            onChange={e => setNewAccount({ ...newAccount, username: e.target.value })}
                                            placeholder="support@zynorvia.com"
                                            className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Пароль</label>
                                        <input
                                            type="password"
                                            value={newAccount.password}
                                            onChange={e => setNewAccount({ ...newAccount, password: e.target.value })}
                                            placeholder="••••••••"
                                            className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">IMAP хост (опціонально)</label>
                                        <input
                                            value={newAccount.imapHost}
                                            onChange={e => setNewAccount({ ...newAccount, imapHost: e.target.value })}
                                            placeholder="imap.zynorvia.com"
                                            className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">IMAP порт</label>
                                        <input
                                            type="number"
                                            value={newAccount.imapPort}
                                            onChange={e => setNewAccount({ ...newAccount, imapPort: Number(e.target.value) })}
                                            className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-orange-500"
                                        />
                                    </div>
                                </div>
                                <Button
                                    onClick={handleSaveAccount}
                                    disabled={savingAccount || !newAccount.address || !newAccount.smtpHost || !newAccount.username || !newAccount.password}
                                    className="w-full bg-orange-600 hover:bg-orange-500 text-white gap-1"
                                >
                                    {savingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Додати акаунт
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
