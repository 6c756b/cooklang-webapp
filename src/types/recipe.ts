export interface RecipeEntry {
  slug: string
  title: string
  path: string
  category: string | null
  image: string | null
  tags: string[]
}

export interface RecipeIndex {
  generated: string
  recipes: RecipeEntry[]
}
