'use client';

import { LifeArea } from '@/types';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';

interface AreaStatusGridProps {
    areas: LifeArea[];
}

export function AreaStatusGrid({ areas }: AreaStatusGridProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {areas.map((area, index) => {
                const Icon = (Icons as any)[area.iconName] || Icons.Activity;

                return (
                    <Link key={area.id} href={`/areas/${area.id}`}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.3,
                                delay: index * 0.05,
                                ease: "easeOut"
                            }}
                            whileHover={{
                                y: -5,
                                transition: { duration: 0.2, ease: "easeOut" }
                            }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative flex flex-col p-6 bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 h-full"
                        >
                            <div className={cn("absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition-colors duration-200",
                                area.status === 'up' ? "bg-emerald-50 text-emerald-600" :
                                    area.status === 'down' ? "bg-rose-50 text-rose-600" :
                                        "bg-amber-50 text-amber-600"
                            )}>
                                {area.status === 'up' && <TrendingUp className="h-3 w-3" />}
                                {area.status === 'down' && <TrendingDown className="h-3 w-3" />}
                                {area.status === 'stable' && <Minus className="h-3 w-3" />}
                            </div>

                            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg shadow-primary/10 transition-transform duration-300 group-hover:scale-110", area.color)}>
                                <Icon className="h-6 w-6" />
                            </div>

                            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors mb-1">
                                {area.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                {area.description}
                            </p>
                        </motion.div>
                    </Link>
                );
            })}
        </div>
    );
}
