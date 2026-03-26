export type DietType = 'vegetarian' | 'vegan' | 'pescatarian' | 'none';
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type FoodPreference = 'high_protein' | 'low_carb' | 'balanced';

export interface Meal {
  id: string;
  name: string;
  mealSlot: MealSlot[];
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  diets: DietType[];
  /** Ingredients that might trigger avoid/allergy filters */
  contains: string[];
  foodPreferences: FoodPreference[];
  description: string;
}

export const MEALS: Meal[] = [
  // BREAKFAST
  { id: 'oatmeal-banana', name: 'Oatmeal with Banana & Honey', mealSlot: ['breakfast'], calories: 350, proteinG: 10, carbsG: 60, fatG: 7, diets: ['vegetarian', 'vegan', 'none'], contains: ['gluten'], foodPreferences: ['balanced'], description: 'Warm oats topped with sliced banana and a drizzle of honey' },
  { id: 'egg-toast', name: 'Scrambled Eggs on Whole Wheat Toast', mealSlot: ['breakfast'], calories: 380, proteinG: 22, carbsG: 35, fatG: 16, diets: ['vegetarian', 'none'], contains: ['gluten', 'dairy'], foodPreferences: ['high_protein', 'balanced'], description: 'Protein-packed scrambled eggs on toasted whole wheat bread' },
  { id: 'greek-yogurt-granola', name: 'Greek Yogurt with Granola & Berries', mealSlot: ['breakfast', 'snack'], calories: 320, proteinG: 20, carbsG: 40, fatG: 8, diets: ['vegetarian', 'none'], contains: ['dairy', 'gluten'], foodPreferences: ['high_protein', 'balanced'], description: 'Creamy Greek yogurt with crunchy granola and mixed berries' },
  { id: 'smoothie-bowl', name: 'Protein Smoothie Bowl', mealSlot: ['breakfast'], calories: 400, proteinG: 25, carbsG: 50, fatG: 10, diets: ['vegetarian', 'vegan', 'none'], contains: [], foodPreferences: ['high_protein', 'balanced'], description: 'Blended fruits and protein topped with nuts, seeds, and granola' },
  { id: 'avocado-toast', name: 'Avocado Toast with Poached Egg', mealSlot: ['breakfast'], calories: 420, proteinG: 18, carbsG: 35, fatG: 22, diets: ['vegetarian', 'none'], contains: ['gluten'], foodPreferences: ['balanced', 'high_protein'], description: 'Smashed avocado on sourdough with a perfectly poached egg' },
  { id: 'idli-sambar', name: 'Idli with Sambar & Chutney', mealSlot: ['breakfast'], calories: 280, proteinG: 8, carbsG: 52, fatG: 4, diets: ['vegetarian', 'vegan', 'none'], contains: [], foodPreferences: ['balanced', 'low_carb'], description: 'Steamed rice cakes served with lentil soup and coconut chutney' },
  { id: 'poha', name: 'Poha (Flattened Rice)', mealSlot: ['breakfast'], calories: 260, proteinG: 6, carbsG: 45, fatG: 7, diets: ['vegetarian', 'vegan', 'none'], contains: [], foodPreferences: ['balanced'], description: 'Flattened rice tempered with mustard seeds, peanuts, and turmeric' },
  { id: 'upma', name: 'Vegetable Upma', mealSlot: ['breakfast'], calories: 290, proteinG: 8, carbsG: 48, fatG: 8, diets: ['vegetarian', 'vegan', 'none'], contains: ['gluten'], foodPreferences: ['balanced'], description: 'Semolina porridge with vegetables and tempering' },
  { id: 'protein-pancakes', name: 'Protein Pancakes', mealSlot: ['breakfast'], calories: 420, proteinG: 30, carbsG: 45, fatG: 12, diets: ['vegetarian', 'none'], contains: ['gluten', 'dairy'], foodPreferences: ['high_protein'], description: 'Fluffy pancakes made with protein powder and oat flour' },
  { id: 'dosa-chutney', name: 'Masala Dosa with Chutney', mealSlot: ['breakfast'], calories: 350, proteinG: 9, carbsG: 55, fatG: 10, diets: ['vegetarian', 'vegan', 'none'], contains: [], foodPreferences: ['balanced'], description: 'Crispy rice crepe with spiced potato filling' },

  // LUNCH
  { id: 'grilled-chicken-salad', name: 'Grilled Chicken Salad', mealSlot: ['lunch'], calories: 450, proteinG: 40, carbsG: 20, fatG: 22, diets: ['none', 'pescatarian'], contains: [], foodPreferences: ['high_protein', 'low_carb'], description: 'Mixed greens with grilled chicken, cherry tomatoes, and olive oil dressing' },
  { id: 'paneer-rice-bowl', name: 'Paneer Rice Bowl', mealSlot: ['lunch'], calories: 520, proteinG: 24, carbsG: 60, fatG: 20, diets: ['vegetarian', 'none'], contains: ['dairy'], foodPreferences: ['high_protein', 'balanced'], description: 'Cubed paneer with brown rice, vegetables, and mint yogurt' },
  { id: 'dal-rice', name: 'Dal with Brown Rice', mealSlot: ['lunch', 'dinner'], calories: 420, proteinG: 18, carbsG: 65, fatG: 8, diets: ['vegetarian', 'vegan', 'none'], contains: [], foodPreferences: ['balanced', 'high_protein'], description: 'Yellow lentil curry served with steamed brown rice' },
  { id: 'chicken-wrap', name: 'Grilled Chicken Wrap', mealSlot: ['lunch'], calories: 480, proteinG: 35, carbsG: 40, fatG: 18, diets: ['none'], contains: ['gluten'], foodPreferences: ['high_protein', 'balanced'], description: 'Whole wheat tortilla with grilled chicken, veggies, and hummus' },
  { id: 'chickpea-salad', name: 'Chickpea & Quinoa Salad', mealSlot: ['lunch'], calories: 400, proteinG: 18, carbsG: 50, fatG: 14, diets: ['vegetarian', 'vegan', 'none'], contains: [], foodPreferences: ['high_protein', 'balanced'], description: 'Protein-rich salad with chickpeas, quinoa, cucumber, and tahini' },
  { id: 'salmon-bowl', name: 'Salmon Poke Bowl', mealSlot: ['lunch'], calories: 520, proteinG: 35, carbsG: 55, fatG: 18, diets: ['pescatarian', 'none'], contains: [], foodPreferences: ['high_protein', 'balanced'], description: 'Sushi rice with fresh salmon, avocado, edamame, and soy dressing' },
  { id: 'rajma-rice', name: 'Rajma Chawal (Kidney Bean Curry with Rice)', mealSlot: ['lunch', 'dinner'], calories: 450, proteinG: 16, carbsG: 70, fatG: 10, diets: ['vegetarian', 'vegan', 'none'], contains: [], foodPreferences: ['balanced'], description: 'Spiced kidney bean curry served with steamed rice' },
  { id: 'veg-biryani', name: 'Vegetable Biryani', mealSlot: ['lunch', 'dinner'], calories: 480, proteinG: 12, carbsG: 72, fatG: 14, diets: ['vegetarian', 'vegan', 'none'], contains: [], foodPreferences: ['balanced'], description: 'Fragrant basmati rice layered with spiced vegetables' },
  { id: 'turkey-sandwich', name: 'Turkey & Avocado Sandwich', mealSlot: ['lunch'], calories: 460, proteinG: 30, carbsG: 40, fatG: 20, diets: ['none'], contains: ['gluten'], foodPreferences: ['high_protein', 'balanced'], description: 'Whole grain bread with turkey, avocado, lettuce, and mustard' },
  { id: 'tofu-stir-fry', name: 'Tofu Vegetable Stir Fry', mealSlot: ['lunch', 'dinner'], calories: 380, proteinG: 22, carbsG: 35, fatG: 16, diets: ['vegetarian', 'vegan', 'none'], contains: [], foodPreferences: ['high_protein', 'low_carb'], description: 'Crispy tofu with mixed vegetables in a light soy-ginger sauce' },

  // DINNER
  { id: 'grilled-fish-veggies', name: 'Grilled Fish with Roasted Vegetables', mealSlot: ['dinner'], calories: 420, proteinG: 38, carbsG: 25, fatG: 18, diets: ['pescatarian', 'none'], contains: [], foodPreferences: ['high_protein', 'low_carb'], description: 'Herb-seasoned grilled fish with colorful roasted vegetables' },
  { id: 'chicken-breast-sweet-potato', name: 'Chicken Breast with Sweet Potato', mealSlot: ['dinner'], calories: 480, proteinG: 42, carbsG: 45, fatG: 10, diets: ['none'], contains: [], foodPreferences: ['high_protein', 'balanced'], description: 'Lean grilled chicken breast with baked sweet potato and steamed broccoli' },
  { id: 'palak-paneer-roti', name: 'Palak Paneer with Roti', mealSlot: ['dinner'], calories: 450, proteinG: 20, carbsG: 45, fatG: 20, diets: ['vegetarian', 'none'], contains: ['dairy', 'gluten'], foodPreferences: ['balanced', 'high_protein'], description: 'Creamy spinach curry with cottage cheese and whole wheat flatbread' },
  { id: 'lentil-soup', name: 'Lentil Soup with Bread', mealSlot: ['dinner'], calories: 350, proteinG: 18, carbsG: 50, fatG: 8, diets: ['vegetarian', 'vegan', 'none'], contains: ['gluten'], foodPreferences: ['balanced', 'high_protein'], description: 'Hearty lentil soup with whole grain bread' },
  { id: 'shrimp-pasta', name: 'Shrimp Pasta in Garlic Sauce', mealSlot: ['dinner'], calories: 520, proteinG: 32, carbsG: 55, fatG: 18, diets: ['pescatarian', 'none'], contains: ['gluten'], foodPreferences: ['high_protein', 'balanced'], description: 'Whole wheat pasta with garlic shrimp and olive oil' },
  { id: 'veggie-bowl', name: 'Mediterranean Veggie Bowl', mealSlot: ['dinner', 'lunch'], calories: 380, proteinG: 14, carbsG: 50, fatG: 14, diets: ['vegetarian', 'vegan', 'none'], contains: [], foodPreferences: ['balanced', 'low_carb'], description: 'Falafel, hummus, tabbouleh, and roasted vegetables over quinoa' },
  { id: 'chole-roti', name: 'Chole with Roti', mealSlot: ['dinner', 'lunch'], calories: 420, proteinG: 16, carbsG: 58, fatG: 12, diets: ['vegetarian', 'vegan', 'none'], contains: ['gluten'], foodPreferences: ['balanced'], description: 'Spiced chickpea curry with whole wheat flatbread' },
  { id: 'egg-fried-rice', name: 'Egg Fried Rice with Vegetables', mealSlot: ['dinner', 'lunch'], calories: 440, proteinG: 18, carbsG: 60, fatG: 14, diets: ['vegetarian', 'none'], contains: [], foodPreferences: ['balanced'], description: 'Wok-fried rice with scrambled eggs and mixed vegetables' },
  { id: 'grilled-tofu-bowl', name: 'Grilled Tofu Buddha Bowl', mealSlot: ['dinner', 'lunch'], calories: 400, proteinG: 24, carbsG: 45, fatG: 16, diets: ['vegetarian', 'vegan', 'none'], contains: [], foodPreferences: ['high_protein', 'balanced'], description: 'Marinated tofu with sweet potato, kale, and tahini dressing' },
  { id: 'steak-salad', name: 'Steak Salad', mealSlot: ['dinner'], calories: 500, proteinG: 40, carbsG: 15, fatG: 30, diets: ['none'], contains: [], foodPreferences: ['high_protein', 'low_carb'], description: 'Sliced grilled steak over mixed greens with balsamic vinaigrette' },

  // SNACKS
  { id: 'protein-bar', name: 'Protein Bar', mealSlot: ['snack'], calories: 220, proteinG: 20, carbsG: 25, fatG: 8, diets: ['vegetarian', 'none'], contains: ['dairy', 'gluten'], foodPreferences: ['high_protein'], description: 'Convenient protein-packed snack bar' },
  { id: 'nuts-mix', name: 'Mixed Nuts & Seeds', mealSlot: ['snack'], calories: 200, proteinG: 7, carbsG: 8, fatG: 18, diets: ['vegetarian', 'vegan', 'none'], contains: [], foodPreferences: ['low_carb', 'balanced'], description: 'Almonds, walnuts, pumpkin seeds, and sunflower seeds' },
  { id: 'fruit-bowl', name: 'Fresh Fruit Bowl', mealSlot: ['snack'], calories: 150, proteinG: 2, carbsG: 35, fatG: 1, diets: ['vegetarian', 'vegan', 'none', 'pescatarian'], contains: [], foodPreferences: ['balanced'], description: 'Seasonal fresh fruits — apple, banana, berries, and orange' },
  { id: 'hummus-veggies', name: 'Hummus with Veggie Sticks', mealSlot: ['snack'], calories: 180, proteinG: 8, carbsG: 20, fatG: 8, diets: ['vegetarian', 'vegan', 'none'], contains: [], foodPreferences: ['balanced', 'low_carb'], description: 'Creamy hummus with carrot, cucumber, and celery sticks' },
  { id: 'peanut-butter-banana', name: 'Peanut Butter Banana', mealSlot: ['snack'], calories: 250, proteinG: 10, carbsG: 30, fatG: 12, diets: ['vegetarian', 'vegan', 'none'], contains: [], foodPreferences: ['balanced', 'high_protein'], description: 'Banana slices with natural peanut butter' },
  { id: 'boiled-eggs', name: 'Boiled Eggs (2)', mealSlot: ['snack'], calories: 140, proteinG: 12, carbsG: 1, fatG: 10, diets: ['vegetarian', 'none'], contains: [], foodPreferences: ['high_protein', 'low_carb'], description: 'Two hard-boiled eggs — simple, portable protein' },
  { id: 'sprouts-chaat', name: 'Sprouts Chaat', mealSlot: ['snack'], calories: 160, proteinG: 10, carbsG: 22, fatG: 4, diets: ['vegetarian', 'vegan', 'none'], contains: [], foodPreferences: ['high_protein', 'balanced'], description: 'Mixed sprouts with lemon, onion, and chaat masala' },
  { id: 'makhana', name: 'Roasted Makhana (Fox Nuts)', mealSlot: ['snack'], calories: 120, proteinG: 5, carbsG: 18, fatG: 3, diets: ['vegetarian', 'vegan', 'none'], contains: [], foodPreferences: ['low_carb', 'balanced'], description: 'Light and crunchy roasted fox nuts with a pinch of salt' },
];

export function getMealById(id: string): Meal | undefined {
  return MEALS.find((m) => m.id === id);
}
