import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

export function InfoBadge({ text }: { text: string }) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors ml-1.5 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-slate-900 border-slate-800 text-slate-100 text-xs p-3 leading-relaxed">
                    <p>{text}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
