export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            couples: {
                Row: {
                    id: string
                    invite_code: string
                    name: string | null
                    anniversary_date: string | null
                    started_living_date: string | null
                    expense_ratio_me: number
                    expense_ratio_partner: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    invite_code?: string
                    name?: string | null
                    anniversary_date?: string | null
                    started_living_date?: string | null
                    expense_ratio_me?: number
                    expense_ratio_partner?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    invite_code?: string
                    name?: string | null
                    anniversary_date?: string | null
                    started_living_date?: string | null
                    expense_ratio_me?: number
                    expense_ratio_partner?: number
                    created_at?: string
                }
            }
            users: {
                Row: {
                    id: string
                    email: string | null
                    display_name: string | null
                    avatar_url: string | null
                    status_message: string | null
                    couple_id: string | null
                    created_at: string
                }
                Insert: {
                    id: string
                    email?: string | null
                    display_name?: string | null
                    avatar_url?: string | null
                    status_message?: string | null
                    couple_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    display_name?: string | null
                    avatar_url?: string | null
                    status_message?: string | null
                    couple_id?: string | null
                    created_at?: string
                }
            }
            expenses: {
                Row: {
                    id: string
                    couple_id: string
                    paid_by: string
                    amount: number
                    category: string
                    description: string | null
                    date: string
                    is_shared: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    couple_id: string
                    paid_by: string
                    amount: number
                    category: string
                    description?: string | null
                    date?: string
                    is_shared?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    couple_id?: string
                    paid_by?: string
                    amount?: number
                    category?: string
                    description?: string | null
                    date?: string
                    is_shared?: boolean
                    created_at?: string
                }
            }
            chores: {
                Row: {
                    id: string
                    couple_id: string
                    name: string
                    category: string
                    frequency: string
                    assigned_to: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    couple_id: string
                    name: string
                    category: string
                    frequency: string
                    assigned_to?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    couple_id?: string
                    name?: string
                    category?: string
                    frequency?: string
                    assigned_to?: string | null
                    created_at?: string
                }
            }
            chore_completions: {
                Row: {
                    id: string
                    chore_id: string
                    completed_by: string
                    completed_at: string
                }
                Insert: {
                    id?: string
                    chore_id: string
                    completed_by: string
                    completed_at?: string
                }
                Update: {
                    id?: string
                    chore_id?: string
                    completed_by?: string
                    completed_at?: string
                }
            }
            shopping_items: {
                Row: {
                    id: string
                    couple_id: string
                    name: string
                    category: string | null
                    estimated_price: number | null
                    is_purchased: boolean
                    purchased_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    couple_id: string
                    name: string
                    category?: string | null
                    estimated_price?: number | null
                    is_purchased?: boolean
                    purchased_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    couple_id?: string
                    name?: string
                    category?: string | null
                    estimated_price?: number | null
                    is_purchased?: boolean
                    purchased_by?: string | null
                    created_at?: string
                }
            }
            cost_simulations: {
                Row: {
                    id: string
                    couple_id: string
                    rent: number
                    deposit_months: number
                    key_money_months: number
                    agency_fee_rate: number
                    moving_cost: number
                    furniture_budget: number
                    split_ratio: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    couple_id: string
                    rent: number
                    deposit_months?: number
                    key_money_months?: number
                    agency_fee_rate?: number
                    moving_cost?: number
                    furniture_budget?: number
                    split_ratio?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    couple_id?: string
                    rent?: number
                    deposit_months?: number
                    key_money_months?: number
                    agency_fee_rate?: number
                    moving_cost?: number
                    furniture_budget?: number
                    split_ratio?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            calendar_events: {
                Row: {
                    id: string
                    couple_id: string
                    title: string
                    date: string
                    category: string
                    reminder: boolean
                    notes: string | null
                    created_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    couple_id: string
                    title: string
                    date: string
                    category?: string
                    reminder?: boolean
                    notes?: string | null
                    created_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    couple_id?: string
                    title?: string
                    date?: string
                    category?: string
                    reminder?: boolean
                    notes?: string | null
                    created_by?: string | null
                    created_at?: string
                }
            }
            recurring_expenses: {
                Row: {
                    id: string
                    couple_id: string
                    name: string
                    amount: number
                    category: string
                    payment_day: number
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    couple_id: string
                    name: string
                    amount: number
                    category: string
                    payment_day?: number
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    couple_id?: string
                    name?: string
                    amount?: number
                    category?: string
                    payment_day?: number
                    is_active?: boolean
                    created_at?: string
                }
            }
            anniversaries: {
                Row: {
                    id: string
                    couple_id: string
                    title: string
                    date: string
                    emoji: string
                    is_yearly: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    couple_id: string
                    title: string
                    date: string
                    emoji?: string
                    is_yearly?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    couple_id?: string
                    title?: string
                    date?: string
                    emoji?: string
                    is_yearly?: boolean
                    created_at?: string
                }
            }
            savings_goals: {
                Row: {
                    id: string
                    couple_id: string
                    title: string
                    target_amount: number
                    current_amount: number
                    deadline: string | null
                    emoji: string | null
                    color: string | null
                    status: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    couple_id: string
                    title: string
                    target_amount: number
                    current_amount?: number
                    deadline?: string | null
                    emoji?: string | null
                    color?: string | null
                    status?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    couple_id?: string
                    title?: string
                    target_amount?: number
                    current_amount?: number
                    deadline?: string | null
                    emoji?: string | null
                    color?: string | null
                    status?: string
                    created_at?: string
                }
            }
            savings_logs: {
                Row: {
                    id: string
                    goal_id: string
                    user_id: string
                    amount: number
                    note: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    goal_id: string
                    user_id: string
                    amount: number
                    note?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    goal_id?: string
                    user_id?: string
                    amount?: number
                    note?: string | null
                    created_at?: string
                }
            }
            rules: {
                Row: {
                    id: string
                    couple_id: string
                    title: string
                    category: string
                    created_by: string | null
                    last_confirmed_at: string
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    couple_id: string
                    title: string
                    category?: string
                    created_by?: string | null
                    last_confirmed_at?: string
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    couple_id?: string
                    title?: string
                    category?: string
                    created_by?: string | null
                    last_confirmed_at?: string
                    is_active?: boolean
                    created_at?: string
                }
            }
        }
    }
}

