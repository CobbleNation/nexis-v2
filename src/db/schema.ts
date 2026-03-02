import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Helper for boolean
const boolean = (col: string) => integer(col, { mode: 'boolean' });
// Helper for timestamp
const checkTimestamp = (col: string) => integer(col, { mode: 'timestamp' });

// --- Auth Tables ---
export const users = sqliteTable('users', {
    id: text('id').primaryKey(), // UUID string
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    timezone: text('timezone').default('UTC'),
    locale: text('locale').default('en-US'),
    emailVerified: checkTimestamp('email_verified'),
    avatar: text('avatar'),
    subscriptionTier: text('subscription_tier').default('free'), // free, pro
    onboardingCompleted: boolean('onboarding_completed').default(false),
    role: text('role', { enum: ['user', 'support', 'manager', 'admin'] }).default('user').notNull(),
    resetToken: text('reset_token'),
    resetTokenExpiry: checkTimestamp('reset_token_expiry'),
    createdAt: checkTimestamp('created_at').notNull().$defaultFn(() => new Date()), // defaultNow() equivalent handled in app or via hook if needed, or stick to Date.now()
    updatedAt: checkTimestamp('updated_at').notNull().$defaultFn(() => new Date()),

    // Card Data
    cardLast4: text('card_last4'),
    cardExp: text('card_exp'), // MM/YY
    cardToken: text('card_token'), // Wallet ID or Token
});

export const sessions = sqliteTable('sessions', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    refreshTokenHash: text('refresh_token_hash').notNull(),
    userAgent: text('user_agent'),
    ipAddress: text('ip_address'),
    expiresAt: checkTimestamp('expires_at').notNull(),
    createdAt: checkTimestamp('created_at').notNull().$defaultFn(() => new Date()),
    lastUsedAt: checkTimestamp('last_used_at').notNull().$defaultFn(() => new Date()),
});

export const payments = sqliteTable('payments', {
    id: text('id').primaryKey(), // UUID
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    amount: integer('amount').notNull(), // in cents
    currency: text('currency').default('UAH').notNull(),
    status: text('status').default('pending').notNull(), // pending, success, failure
    invoiceId: text('invoice_id'), // Monobank Invoice ID
    metadata: text('metadata', { mode: 'json' }).$type<any>(),
    createdAt: checkTimestamp('created_at').notNull().$defaultFn(() => new Date()),
    updatedAt: checkTimestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

// --- App Data Tables ---
export const lifeAreas = sqliteTable('life_areas', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    title: text('title').notNull(),
    color: text('color').notNull(),
    icon: text('icon'),
    order: integer('order').default(0),
});

export const goals = sqliteTable('goals', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    areaId: text('area_id'), // Optional link to area
    title: text('title').notNull(),
    description: text('description'),
    status: text('status').default('active').notNull(), // active, completed, paused
    priority: text('priority').default('medium'), // low, medium, high
    progress: integer('progress').default(0).notNull(),
    startDate: checkTimestamp('start_date'),
    deadline: checkTimestamp('deadline'),
    endDate: checkTimestamp('end_date'), // Actual completion date
    type: text('type').default('strategic').notNull(), // vision, strategic, tactical
    targetMetricId: text('target_metric_id').references(() => metricDefinitions.id, { onDelete: 'set null' }),
    metricTargetValue: real('metric_target_value'),
    metricStartValue: real('metric_start_value'),
    metricCurrentValue: real('metric_current_value'),
    metricDirection: text('metric_direction'),
    additionalMetricIds: text('additional_metric_ids', { mode: 'json' }).$type<string[]>(),
    horizon: text('horizon'),
    expectedImpact: text('expected_impact'),

    // Sub-goals are for Tactical milestones or just checklist
    subGoals: text('sub_goals', { mode: 'json' }).$type<{ id: string; title: string; completed: boolean }[]>(),

    isSystemDefault: boolean('is_system_default').default(false),

    createdAt: checkTimestamp('created_at').notNull().$defaultFn(() => new Date()),
    updatedAt: checkTimestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

export const projects = sqliteTable('projects', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    areaId: text('area_id'),

    // incremental migration: removed goalId and progress

    // New Structure
    title: text('title').notNull(),
    description: text('description'),
    status: text('status').default('active').notNull(), // active, completed, paused
    startDate: checkTimestamp('start_date'),
    deadline: checkTimestamp('deadline'),
    metricIds: text('metric_ids', { mode: 'json' }).$type<string[]>(),

    // M:N Relation
    goalIds: text('goal_ids', { mode: 'json' }).$type<string[]>(),

    isSystemDefault: boolean('is_system_default').default(false),

    createdAt: checkTimestamp('created_at').notNull().$defaultFn(() => new Date()),
    updatedAt: checkTimestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

export const actions = sqliteTable('actions', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    title: text('title').notNull(),
    type: text('type').notNull(), // 'task' | 'habit'
    status: text('status').default('pending').notNull(),
    priority: text('priority').default('medium'), // low, medium, high
    completed: boolean('completed').default(false).notNull(),
    areaId: text('area_id'),
    projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
    linkedGoalId: text('linked_goal_id').references(() => goals.id, { onDelete: 'set null' }),
    dueDate: checkTimestamp('due_date'),
    scheduledTime: text('scheduled_time'), // "14:00" - Legacy? Keeping for safety.

    // --- New Fields for Persistence ---
    date: text('date'), // "YYYY-MM-DD"
    startTime: text('start_time'), // "10:00"
    duration: integer('duration'), // minutes
    isFocus: boolean('is_focus').default(false),
    subtasks: text('subtasks', { mode: 'json' }).$type<{ id: string; title: string; completed: boolean }[]>(),
    fromRoutineId: text('from_routine_id'),
    energyLevel: text('energy_level'),
    impact: text('impact'),
    reminderAt: text('reminder_at'),
    reminderSent: boolean('reminder_sent').default(false),

    // Habit specific
    frequency: text('frequency'), // daily, weekly, custom
    streak: integer('streak').default(0),
    lastCompletedAt: checkTimestamp('last_completed_at'),

    isSystemDefault: boolean('is_system_default').default(false),

    createdAt: checkTimestamp('created_at').notNull().$defaultFn(() => new Date()),
    updatedAt: checkTimestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

export const metricDefinitions = sqliteTable('metric_definitions', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    areaId: text('area_id').notNull(),
    name: text('name').notNull(), // e.g., "Weight"
    type: text('type').default('number'), // number, scale, boolean
    unit: text('unit'), // kg, hours, etc.
    description: text('description'),
    frequency: text('frequency').default('weekly'), // recommended update frequency
    createdAt: checkTimestamp('created_at').notNull().$defaultFn(() => new Date()),
});

export const metricEntries = sqliteTable('metric_entries', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    metricId: text('metric_id').references(() => metricDefinitions.id, { onDelete: 'cascade' }).notNull(),
    value: real('value').notNull(),
    date: checkTimestamp('date').notNull(),
    note: text('note'),
    createdAt: checkTimestamp('created_at').notNull().$defaultFn(() => new Date()),
});

export const calendarEvents = sqliteTable('calendar_events', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    areaId: text('area_id'),
    title: text('title').notNull(),
    start: checkTimestamp('start').notNull(),
    end: checkTimestamp('end').notNull(),
    allDay: boolean('all_day').default(false),
    createdAt: checkTimestamp('created_at').notNull().$defaultFn(() => new Date()),
    updatedAt: checkTimestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

// ... existing notes table ...
export const notes = sqliteTable('notes', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    title: text('title').notNull(),
    content: text('content'),
    type: text('type').default('note'), // note, journal
    areaId: text('area_id'),
    relatedAreaIds: text('related_area_ids', { mode: 'json' }).$type<string[]>(),
    date: checkTimestamp('date').default(new Date()), // For journal entries
    tags: text('tags', { mode: 'json' }).$type<string[]>(),
    audioUrl: text('audio_url'), // Link to uploaded audio file

    isSystemDefault: boolean('is_system_default').default(false),

    createdAt: checkTimestamp('created_at').notNull().$defaultFn(() => new Date()),
    updatedAt: checkTimestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

// --- New Tables for Focus Level ---

export const focuses = sqliteTable('focuses', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    title: text('title').notNull(),
    areaId: text('area_id'),
    period: text('period').notNull(), // 'day' | 'week'
    date: checkTimestamp('date').notNull(),
    reason: text('reason'),
    expectedEffect: text('expected_effect'),
    createdAt: checkTimestamp('created_at').notNull().$defaultFn(() => new Date()),
});

export const checkIns = sqliteTable('check_ins', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    areaId: text('area_id'),
    date: checkTimestamp('date').notNull(),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    impactDescription: text('impact_description'),
    createdAt: checkTimestamp('created_at').notNull().$defaultFn(() => new Date()),
});

export const insights = sqliteTable('insights', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    type: text('type').notNull(), // observation, error, etc.
    date: checkTimestamp('date').notNull(),
    createdAt: checkTimestamp('created_at').notNull().$defaultFn(() => new Date()),
});

export const periods = sqliteTable('periods', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    title: text('title').notNull(),
    type: text('type').notNull(), // week, month
    startDate: checkTimestamp('start_date').notNull(),
    endDate: checkTimestamp('end_date').notNull(),
    mainFocus: text('main_focus'),
    expectedResult: text('expected_result'),
    createdAt: checkTimestamp('created_at').notNull().$defaultFn(() => new Date()),
});

export const experiments = sqliteTable('experiments', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    title: text('title').notNull(),
    areaId: text('area_id'),
    hypothesis: text('hypothesis').notNull(),
    startDate: checkTimestamp('start_date').notNull(),
    endDate: checkTimestamp('end_date'),
    criteria: text('criteria').notNull(),
    result: text('result'),
    status: text('status').default('planned').notNull(),
    createdAt: checkTimestamp('created_at').notNull().$defaultFn(() => new Date()),
});

export const routines = sqliteTable('routines', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    title: text('title').notNull(),
    areaId: text('area_id'),
    frequency: text('frequency').default('daily').notNull(), // daily, weekly
    daysOfWeek: text('days_of_week', { mode: 'json' }).$type<number[]>(), // 0-6
    time: text('time'), // HH:mm (Target start time)
    duration: integer('duration').default(30), // minutes

    lastGeneratedDate: text('last_generated_date'), // YYYY-MM-DD

    isSystemDefault: boolean('is_system_default').default(false),

    createdAt: checkTimestamp('created_at').notNull().$defaultFn(() => new Date()),
    updatedAt: checkTimestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

// --- New Tables for Content (Files, Library, Journal) ---

export const journalEntries = sqliteTable('journal_entries', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    content: text('content'),
    mood: integer('mood'),
    date: checkTimestamp('date').default(new Date()),
    tags: text('tags', { mode: 'json' }).$type<string[]>(),
    createdAt: checkTimestamp('created_at').notNull().$defaultFn(() => new Date()),
    updatedAt: checkTimestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

export const fileAssets = sqliteTable('file_assets', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    title: text('title').notNull(),
    url: text('url').notNull(),
    type: text('type').notNull(), // image, document, etc.
    size: integer('size'),
    createdAt: checkTimestamp('created_at').notNull().$defaultFn(() => new Date()),
    updatedAt: checkTimestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

export const libraryItems = sqliteTable('library_items', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    title: text('title').notNull(),
    author: text('author'),
    url: text('url'),
    status: text('status').default('to_consume'), // to_consume, consuming, consumed
    rating: integer('rating'),
    type: text('type').default('book'), // book, video, article

    isSystemDefault: boolean('is_system_default').default(false),

    createdAt: checkTimestamp('created_at').notNull().$defaultFn(() => new Date()),
    updatedAt: checkTimestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

export const habits = sqliteTable('habits', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    title: text('title').notNull(),
    areaId: text('area_id'),
    frequency: text('frequency').default('daily'), // daily, weekly
    targetDays: text('target_days', { mode: 'json' }).$type<number[]>(), // 0-6
    timeOfDay: text('time_of_day').default('anytime'),
    streak: integer('streak').default(0),
    status: text('status').default('active'), // active, paused, archived
    // relation
    relatedMetricIds: text('related_metric_ids', { mode: 'json' }).$type<string[]>(),

    isSystemDefault: boolean('is_system_default').default(false),

    createdAt: checkTimestamp('created_at').notNull().$defaultFn(() => new Date()),
    updatedAt: checkTimestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

export const habitLogs = sqliteTable('habit_logs', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    habitId: text('habit_id').references(() => habits.id, { onDelete: 'cascade' }).notNull(),
    date: text('date').notNull(), // YYYY-MM-DD
    completed: boolean('completed').default(true).notNull(),
    createdAt: checkTimestamp('created_at').notNull().$defaultFn(() => new Date()),
});

export const adminAuditLogs = sqliteTable('admin_audit_logs', {
    id: text('id').primaryKey(), // UUID
    adminId: text('admin_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    action: text('action').notNull(), // e.g., 'USER_ROLE_UPDATE', 'SYSTEM_DEFAULT_UPDATE'
    entityType: text('entity_type').notNull(), // 'user', 'goal', etc.
    entityId: text('entity_id').notNull(),
    details: text('details', { mode: 'json' }).$type<any>(), // details of change
    createdAt: checkTimestamp('created_at').notNull().$defaultFn(() => new Date()),
});


// --- Analytics Tables ---

export const analyticsEvents = sqliteTable('analytics_events', {
    id: text('id').primaryKey(), // UUID
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    sessionId: text('session_id'),
    eventName: text('event_name').notNull(),
    entityType: text('entity_type'), // e.g., 'task', 'project', 'goal'
    entityId: text('entity_id'),
    plan: text('plan'), // 'free', 'pro'
    source: text('source'), // 'web', 'mobile', 'admin'
    metadata: text('metadata', { mode: 'json' }).$type<any>(),
    createdAt: checkTimestamp('created_at').notNull().$defaultFn(() => new Date()),
});

export const analyticsDailyAgg = sqliteTable('analytics_daily_agg', {
    date: text('date').notNull(), // YYYY-MM-DD
    eventName: text('event_name').notNull(),
    plan: text('plan').notNull(),
    count: integer('count').notNull(),
    uniqueUsers: integer('unique_users').notNull(),
    createdAt: checkTimestamp('created_at').notNull().$defaultFn(() => new Date()),
    updatedAt: checkTimestamp('updated_at').notNull().$defaultFn(() => new Date()),
}, (table) => ({
    // Composite unique index for upsert
    pk: uniqueIndex('analytics_daily_agg_pk').on(table.date, table.eventName, table.plan),
}));
