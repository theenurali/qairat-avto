import { Link, Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { CheatSheetPage } from './pages/CheatSheetPage';
import { CxDetail, CxList } from './pages/CounterexamplePage';
import { Dashboard } from './pages/Dashboard';
import { LearningPath, ModulePage } from './pages/LearningPath';
import { LessonPage } from './pages/LessonPage';
import { MockHome } from './pages/mock/MockHome';
import { MockResultPage } from './pages/mock/MockResult';
import { MockRunner } from './pages/mock/MockRunner';
import { OpenQuestionsPage } from './pages/OpenQuestionsPage';
import { TheoryTestPage } from './pages/TheoryTestPage';
import { TracingDetail, TracingList } from './pages/TracingPage';

function NotFound() {
  return (
    <div className="py-20 text-center">
      <div className="text-5xl">🧭</div>
      <h1 className="mt-4 text-2xl font-bold text-white">Страница не найдена</h1>
      <Link to="/" className="mt-4 inline-block text-indigo-300 hover:text-indigo-200">
        На Dashboard
      </Link>
    </div>
  );
}

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/path" element={<LearningPath />} />
        <Route path="/module/:id" element={<ModulePage />} />
        <Route path="/lesson/:id" element={<LessonPage />} />
        <Route path="/tracing" element={<TracingList />} />
        <Route path="/tracing/:id" element={<TracingDetail />} />
        <Route path="/counterexamples" element={<CxList />} />
        <Route path="/counterexamples/:id" element={<CxDetail />} />
        <Route path="/theory" element={<TheoryTestPage />} />
        <Route path="/open" element={<OpenQuestionsPage />} />
        <Route path="/cheatsheet" element={<CheatSheetPage />} />
        <Route path="/mock" element={<MockHome />} />
        <Route path="/mock/result/:idx" element={<MockResultPage />} />
        <Route path="/mock/:id" element={<MockRunner />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
