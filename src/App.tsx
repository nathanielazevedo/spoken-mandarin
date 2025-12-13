import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import { Layout } from "./components/Layout";
import { CurriculumPage } from "./components/CurriculumPage";
import { LessonPage } from "./components/LessonPage";
import { LandingPage } from "./components/LandingPage";

const LandingRoute = () => {
  const navigate = useNavigate();
  return <LandingPage onGetStarted={() => navigate("/curriculum")} />;
};

const CurriculumRoute = () => {
  const navigate = useNavigate();
  return (
    <CurriculumPage
      onLessonClick={(lessonId) => navigate(`/lesson/${lessonId}`)}
    />
  );
};

const LessonRoute = () => {
  const navigate = useNavigate();
  const { lessonId } = useParams<{ lessonId: string }>();
  return (
    <LessonPage
      lessonId={lessonId ?? null}
      onBack={() => navigate("/curriculum", { replace: true })}
    />
  );
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route
        path="/curriculum"
        element={
          <Layout>
            <CurriculumRoute />
          </Layout>
        }
      />
      <Route
        path="/lesson/:lessonId"
        element={
          <Layout>
            <LessonRoute />
          </Layout>
        }
      />
    </Routes>
  );
}

export default App;
