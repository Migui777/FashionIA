import { Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { ChatPage } from "./pages/ChatPage";
import { RunwayPage } from "./pages/RunwayPage";
import { DressDetailPage } from "./pages/DressDetailPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/chat" element={<ChatPage />} />
      {/* Cámara real y detalle de vestido: existentes, aún sin enlazar desde el Home simulado. */}
      <Route path="/runway" element={<RunwayPage />} />
      <Route path="/dresses/:id" element={<DressDetailPage />} />
    </Routes>
  );
}
