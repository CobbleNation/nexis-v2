import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { LifeArea } from '@/types';

interface AttentionBlockProps {
    areas: LifeArea[];
}

export function AttentionBlock({ areas }: AttentionBlockProps) {
    if (areas.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="w-full"
        >
            <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Варто звернути увагу
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {areas.map((area, idx) => (
                    <Link key={area.id} href={`/areas/${area.id}`}>
                        <div className="group bg-white dark:bg-card border border-amber-100 dark:border-amber-900/30 hover:border-amber-300 dark:hover:border-amber-700/50 hover:shadow-md transition-all rounded-2xl p-4 flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${area.color.replace('bg-', 'bg-') || 'bg-slate-400'}`} />
                                <div>
                                    <div className="font-bold text-foreground group-hover:text-primary transition-colors">
                                        {area.title}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        Метрики давно не оновлювались
                                    </div>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                        </div>
                    </Link>
                ))}
            </div>
        </motion.div>
    );
}
