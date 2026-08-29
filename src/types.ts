export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export const MEAL_ORDER: readonly MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'] as const

export const MEAL_LABEL: Readonly<Record<MealType, string>> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
}

export type RecordSource = 'manual' | 'random' | 'ai'

export interface FoodRecord {
  id: string
  /** 本地时区日期 YYYY-MM-DD */
  date: string
  mealType: MealType
  name: string
  qty: number
  unit: string
  kcal: number
  note: string
  source: RecordSource
  createdAt: number
}

export type NewFoodRecord = Omit<FoodRecord, 'id' | 'createdAt'>

export interface Dish {
  id: string
  name: string
  kcal: number
  minutes: number
  tags: string[]
  ingredients: string[]
  steps: string[]
  coverColor: string
}

export interface Profile {
  nickname: string
  dailyTargetKcal: number
  vegetarian: boolean
}

export interface Recipe {
  name: string
  kcal: number
  minutes: number
  ingredients: string[]
  steps: string[]
  tags: string[]
}
