// アプリケーションが最初に実行するファイル

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// DOM要素を取得してReactのルートを作成
// renderメソッドでReactコンポーネントをマウント
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
