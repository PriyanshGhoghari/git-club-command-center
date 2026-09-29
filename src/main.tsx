import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router"
import { MotionConfig } from "motion/react"
import App from "./App"
import { AppProvider } from "./state/app-context"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user"><BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter></MotionConfig>
  </React.StrictMode>,
)
