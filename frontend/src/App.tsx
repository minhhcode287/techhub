import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import AiChatWidget from "./components/AiChatWidget";
import TechHighlightCompareModal from "./components/TechHighlightCompareModal";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
          <AiChatWidget />
          <TechHighlightCompareModal />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
