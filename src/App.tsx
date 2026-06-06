import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RecipeList } from './components/RecipeList'
import { RecipeView } from './components/RecipeView'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RecipeList />} />
        <Route path="/recipe/*" element={<RecipeView />} />
      </Routes>
    </BrowserRouter>
  )
}
