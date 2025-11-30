import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./components/HomePage";
import { LessonPage } from "./components/LessonPage";

const HomeRoute = () => {
  const navigate = useNavigate();
  return (
    <HomePage onLessonClick={(lessonId) => navigate(`/lesson/${lessonId}`)} />
  );
};

const LessonRoute = () => {
  const navigate = useNavigate();
  const { lessonId } = useParams<{ lessonId: string }>();
  return (
    <LessonPage
      lessonId={lessonId ?? null}
      onBack={() => navigate("/", { replace: true })}
    />
  );
};

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/lesson/:lessonId" element={<LessonRoute />} />
      </Routes>
    </Layout>
  );
}

export default App;
