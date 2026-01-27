import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type ExpenseRow = Database['public']['Tables']['expenses']['Row'];
type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];
type ChoreRow = Database['public']['Tables']['chores']['Row'];
type ChoreInsert = Database['public']['Tables']['chores']['Insert'];
type ChoreCompletionInsert = Database['public']['Tables']['chore_completions']['Insert'];
type ShoppingItemRow = Database['public']['Tables']['shopping_items']['Row'];
type ShoppingItemInsert = Database['public']['Tables']['shopping_items']['Insert'];
type SavingsGoalRow = Database['public']['Tables']['savings_goals']['Row'];
type SavingsLogInsert = { goal_id: string; user_id: string; amount: number; note?: string | null };
type CalendarEventRow = Database['public']['Tables']['calendar_events']['Row'];
type CalendarEventInsert = Database['public']['Tables']['calendar_events']['Insert'];
type AnniversaryRow = Database['public']['Tables']['anniversaries']['Row'];
type AnniversaryInsert = Database['public']['Tables']['anniversaries']['Insert'];
type CoupleRow = Database['public']['Tables']['couples']['Row'];

function getMonthRange( year: number, month: number ) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

function getWeekRange( date: Date ) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d);
  mon.setDate(diff);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    start: mon.toISOString().slice(0, 10),
    end: sun.toISOString().slice(0, 10),
  };
}

// ----- Couple -----
export function useCouple( coupleId: string | null ) {
  return useQuery({
    queryKey: ['couple', coupleId],
    queryFn: async () => {
      if (!coupleId) return null;
      const { data, error } = await supabase
        .from('couples')
        .select('*')
        .eq('id', coupleId)
        .single();
      if (error) throw error;
      return data as CoupleRow;
    },
    enabled: !!coupleId,
  });
}

// ----- Expenses -----
export function useExpenses( coupleId: string | null, year?: number, month?: number ) {
  const y = year ?? new Date().getFullYear();
  const m = month ?? new Date().getMonth() + 1;
  const { start, end } = getMonthRange(y, m);

  return useQuery({
    queryKey: ['expenses', coupleId, start, end],
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('couple_id', coupleId)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ExpenseRow[];
    },
    enabled: !!coupleId,
  });
}

export function useRecentExpenses( coupleId: string | null, limit = 5 ) {
  return useQuery({
    queryKey: ['expenses', 'recent', coupleId, limit],
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('couple_id', coupleId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as ExpenseRow[];
    },
    enabled: !!coupleId,
  });
}

export function useAddExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ( row: ExpenseInsert ) => {
      const { data, error } = await supabase.from('expenses').insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

// ----- Chores -----
export function useChores( coupleId: string | null ) {
  return useQuery({
    queryKey: ['chores', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('chores')
        .select('*')
        .eq('couple_id', coupleId)
        .order('category');
      if (error) throw error;
      return (data ?? []) as ChoreRow[];
    },
    enabled: !!coupleId,
  });
}

export function useChoreCompletionsThisWeek( coupleId: string | null ) {
  const { start, end } = getWeekRange(new Date());
  return useQuery({
    queryKey: ['chore_completions', coupleId, start, end],
    queryFn: async () => {
      if (!coupleId) return [];
      const { data: chores } = await supabase
        .from('chores')
        .select('id')
        .eq('couple_id', coupleId);
      const ids = (chores ?? []).map((c) => c.id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from('chore_completions')
        .select('*')
        .in('chore_id', ids)
        .gte('completed_at', start + 'T00:00:00')
        .lte('completed_at', end + 'T23:59:59');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!coupleId,
  });
}

export function useAddChoreCompletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ( row: ChoreCompletionInsert ) => {
      const { data, error } = await supabase.from('chore_completions').insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chore_completions'] });
    },
  });
}

export function useAddChore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ( row: ChoreInsert ) => {
      const { data, error } = await supabase.from('chores').insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chores'] });
    },
  });
}

// ----- Shopping -----
export function useShoppingItems( coupleId: string | null ) {
  return useQuery({
    queryKey: ['shopping_items', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ShoppingItemRow[];
    },
    enabled: !!coupleId,
  });
}

export function useShoppingMutations() {
  const qc = useQueryClient();
  const add = useMutation({
    mutationFn: async ( row: ShoppingItemInsert ) => {
      const { data, error } = await supabase.from('shopping_items').insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping_items'] }),
  });
  const update = useMutation({
    mutationFn: async ( { id, ...patch }: { id: string } & Partial<ShoppingItemRow> ) => {
      const { data, error } = await supabase.from('shopping_items').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping_items'] }),
  });
  const remove = useMutation({
    mutationFn: async ( id: string ) => {
      const { error } = await supabase.from('shopping_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping_items'] }),
  });
  return { add, update, remove };
}

// ----- Savings -----
export function useSavingsGoals( coupleId: string | null ) {
  return useQuery({
    queryKey: ['savings_goals', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SavingsGoalRow[];
    },
    enabled: !!coupleId,
  });
}

export function useSavingsGoal( goalId: string | null ) {
  return useQuery({
    queryKey: ['savings_goal', goalId],
    queryFn: async () => {
      if (!goalId) return null;
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('id', goalId)
        .single();
      if (error) throw error;
      return data as SavingsGoalRow;
    },
    enabled: !!goalId,
  });
}

export function useSavingsLogs( goalId: string | null ) {
  return useQuery({
    queryKey: ['savings_logs', goalId],
    queryFn: async () => {
      if (!goalId) return [];
      const { data, error } = await supabase
        .from('savings_logs')
        .select('*')
        .eq('goal_id', goalId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!goalId,
  });
}

export function useSavingsMutations() {
  const qc = useQueryClient();
  const addGoal = useMutation({
    mutationFn: async ( row: { couple_id: string; title: string; target_amount: number; deadline?: string | null; emoji?: string | null; color?: string | null } ) => {
      const { data, error } = await supabase.from('savings_goals').insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['savings_goals'] });
    },
  });
  const addLog = useMutation({
    mutationFn: async ( row: SavingsLogInsert ) => {
      const { data, error } = await supabase.from('savings_logs').insert(row).select().single();
      if (error) throw error;
      const { data: goal } = await supabase.from('savings_goals').select('current_amount').eq('id', row.goal_id).single();
      const prev = (goal as { current_amount: number } | null)?.current_amount ?? 0;
      await supabase.from('savings_goals').update({ current_amount: prev + row.amount }).eq('id', row.goal_id);
      return data;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['savings_goals'] });
      qc.invalidateQueries({ queryKey: ['savings_logs', v.goal_id] });
    },
  });
  const updateGoal = useMutation({
    mutationFn: async ( { id, ...patch }: { id: string } & Partial<SavingsGoalRow> ) => {
      const { data, error } = await supabase.from('savings_goals').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['savings_goals'] }),
  });
  return { addGoal, addLog, updateGoal };
}

// ----- Calendar -----
export function useCalendarEvents( coupleId: string | null, startDate: string, endDate: string ) {
  return useQuery({
    queryKey: ['calendar_events', coupleId, startDate, endDate],
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('couple_id', coupleId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date');
      if (error) throw error;
      return (data ?? []) as CalendarEventRow[];
    },
    enabled: !!coupleId && !!startDate && !!endDate,
  });
}

export function useAddCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ( row: CalendarEventInsert ) => {
      const { data, error } = await supabase.from('calendar_events').insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar_events'] }),
  });
}

// ----- Anniversaries -----
export function useAnniversaries( coupleId: string | null ) {
  return useQuery({
    queryKey: ['anniversaries', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('anniversaries')
        .select('*')
        .eq('couple_id', coupleId)
        .order('date');
      if (error) throw error;
      return (data ?? []) as AnniversaryRow[];
    },
    enabled: !!coupleId,
  });
}

export function useAnniversaryMutations() {
  const qc = useQueryClient();
  const add = useMutation({
    mutationFn: async ( row: AnniversaryInsert ) => {
      const { data, error } = await supabase.from('anniversaries').insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['anniversaries'] }),
  });
  const update = useMutation({
    mutationFn: async ( { id, ...patch }: { id: string } & Partial<AnniversaryRow> ) => {
      const { data, error } = await supabase.from('anniversaries').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['anniversaries'] }),
  });
  const remove = useMutation({
    mutationFn: async ( id: string ) => {
      const { error } = await supabase.from('anniversaries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['anniversaries'] }),
  });
  return { add, update, remove };
}

// ----- Recurring expenses -----
type RecurringExpenseInsert = Database['public']['Tables']['recurring_expenses']['Insert'];
type RecurringExpenseUpdate = Database['public']['Tables']['recurring_expenses']['Update'];

export function useRecurringExpenses( coupleId: string | null ) {
  return useQuery({
    queryKey: ['recurring_expenses', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('couple_id', coupleId)
        .order('payment_day');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!coupleId,
  });
}

export function useAddRecurringExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: RecurringExpenseInsert) => {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['recurring_expenses', variables.couple_id] });
    },
  });
}

export function useUpdateRecurringExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      coupleId,
      updates,
    }: {
      id: string;
      coupleId: string;
      updates: RecurringExpenseUpdate;
    }) => {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { coupleId }) => {
      qc.invalidateQueries({ queryKey: ['recurring_expenses', coupleId] });
    },
  });
}

// ----- Rules -----
type RuleInsert = Database['public']['Tables']['rules']['Insert'];
type RuleUpdate = Database['public']['Tables']['rules']['Update'];

export function useRules( coupleId: string | null ) {
  return useQuery({
    queryKey: ['rules', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('rules')
        .select('*')
        .eq('couple_id', coupleId)
        .order('last_confirmed_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!coupleId,
  });
}

export function useAddRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: RuleInsert) => {
      const { data, error } = await supabase.from('rules').insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['rules', variables.couple_id] });
    },
  });
}

export function useUpdateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, coupleId, updates }: { id: string; coupleId: string; updates: RuleUpdate }) => {
      const { data, error } = await supabase
        .from('rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { coupleId }) => {
      qc.invalidateQueries({ queryKey: ['rules', coupleId] });
    },
  });
}

export function useConfirmRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, coupleId }: { id: string; coupleId: string }) => {
      const { data, error } = await supabase
        .from('rules')
        .update({ last_confirmed_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { coupleId }) => {
      qc.invalidateQueries({ queryKey: ['rules', coupleId] });
    },
  });
}
