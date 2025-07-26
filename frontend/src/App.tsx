import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './routes/Home'
import Library from './routes/Library'
import Reader from './routes/Reader'
import NotFound from './routes/NotFound'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Library />} />
        <Route path="/reader/:bookId" element={<Reader />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
