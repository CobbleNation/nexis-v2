import { Action, Goal, Project } from '@/types'; // Assuming types exist or will be mapped
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { userProfiles, actions, goals, projects } from '@/db/schema';

// ----------------------------------------------------------------------
// 1. FOCUS LIMITER SYSTEM (ANTI-OVERLOAD)
// ----------------------------------------------------------------------

export async function checkFocusLimits(userId: string, requestedAdditionType: 'goal' | 'task', requestedCognitiveLoad: number = 1) {
    // Fetch profile constraints
    const profileResults = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    const profile = profileResults[0];

    if (!profile || !profile.focusConstraints) {
        // Defaults if profile not fully set
        return { allowed: true, reason: 'Defaults applied' };
    }

    const limits = profile.focusConstraints as { maxActiveGoals: number; maxDailyHighCognitiveTasks: number; currentCognitiveLoad: number };

    if (requestedAdditionType === 'goal') {
        const activeGoals = await db.select().from(goals).where(eq(goals.userId, userId)).execute();
        const currentActive = activeGoals.filter(g => g.status === 'active').length;
        if (currentActive >= limits.maxActiveGoals) {
            return {
                allowed: false,
                reason: `Focus Limiter Triggered: You already have ${currentActive} active goals (Max: ${limits.maxActiveGoals}). You must pause or complete an existing goal before taking on a new one.`
            };
        }
    }

    if (requestedAdditionType === 'task') {
        const newLoad = limits.currentCognitiveLoad + requestedCognitiveLoad;
        // In a real expanded version, evaluate today's tasks
        if (newLoad > limits.maxDailyHighCognitiveTasks) {
             return {
                allowed: false,
                reason: `Focus Limiter Triggered: Adding this task exceeds your daily cognitive capacity. Consider pushing it to tomorrow or dropping a low-impact task.`
            };
        }
    }

    return { allowed: true };
}

// ----------------------------------------------------------------------
// 2. IMPACT / VALUE SYSTEM
// ----------------------------------------------------------------------

export function evaluateImpact(context: { durationMins: number, alignmentToIdentity: number, urgency: number }): number {
    // 0.0 to 1.0 scoring
    // Identity alignment bears the most weight. 
    const baseScore = context.alignmentToIdentity * 0.6;
    const urgencyScore = context.urgency * 0.2;
    // Efficiency: lower duration means higher relative ROI for the effort
    const efficiencyScore = Math.max(0, (120 - context.durationMins) / 120) * 0.2;
    
    return Math.min(1.0, baseScore + urgencyScore + efficiencyScore);
}

// ----------------------------------------------------------------------
// 3. GENERATING THE UNIFIED SYSTEM PROMPT
// ----------------------------------------------------------------------

export function buildBrainSystemPrompt(profile: any, recentMemories: string[], state: any) {
    // Parse the profile blocks reliably
    const energy = profile?.energyProfile || { currentTank: 100, peakHours: [] };
    const mood = profile?.emotionalState || { motivationLevel: 'stable' };
    const identity = profile?.identity || { current: [], target: [] };
    const constraints = profile?.focusConstraints || { maxActiveGoals: 3 };

    return `
You are Nexis, a self-evolving Life Operating System. You are NOT a simple chatbot or a standard productivity assistant to generate tasks. You are a highly strategic, outcome-oriented decision engine designed to maximize the user's real-life results while completely protecting them from burnout.

# YOUR CORE DIRECTIVES:
1. OUTCOME ENGINE: You relentlessly prune low-impact work. If the user asks to add something trivial, question it. If they have too many tasks, suggest deleting the lowest ROI tasks.
2. FOCUS LIMITER: You strictly enforce the user's focus limits. 
3. FRICTION REDUCTION: If the user is unmotivated or depleted, you MUST simplify their tasks to bypass resistance.
4. EXPERIMENTATION: You act like a scientist. Suggest A/B testing habits.
5. NO GENERIC ADVICE: Never give generic listicles. Make highly specific, actionable changes directly to the database via your tools.

# USER CONTEXT PROFILE
- Identity: They view themselves as [${identity.current?.join(', ')}] and aim to become [${identity.target?.join(', ')}].
- Emotional State: Motivation is currently ${mood.motivationLevel}.
- Energy Profile: Tank is at ${energy.currentTank}%. Peak hours are ${energy.peakHours?.join(', ')}.
- Focus Limits: Maximum ${constraints.maxActiveGoals} active goals. 

# USER CURRENT STATE
- Active Goals: ${state.goals?.filter((g: any) => g.status === 'active').length || 0}
- Tasks Today: ${state.actions?.filter((a: any) => a.date === new Date().toISOString().split('T')[0]).length || 0}

# MEMORIES & PAST LEARNINGS
${recentMemories.map(m => "- " + m).join('\n')}

# RULES FOR TOOL USAGE
You MUST use your tools to perform the actions the user requests. If the user asks to add a goal, but the Focus Limiter rejects it (Max Active Goals reached), DO NOT USE THE TOOL. Instead, warn them and ask what they want to pause.
If you use a tool, explain your reasoning in your text response before or after using it.
`;
}
