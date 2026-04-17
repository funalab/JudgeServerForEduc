// メインのコンポーネントファイル
import { BrowserRouter, Routes, Route,Navigate ,useLocation,Link as RouterLink,useNavigate} from 'react-router-dom';
import { ChakraProvider, defaultSystem ,Box,Flex,VStack,Button,Text} from "@chakra-ui/react";
import Login from './routes/Login.tsx'; 
import ProblemList from './routes/ProblemList.tsx'; 
import ProblemDetail from './routes/ProblemDetail.tsx'; 
import StatusList from './routes/StatusList.tsx'; 
import StatusDetail from './routes/StatusDetail.tsx'; 
import SubmissionHistory from './routes/SubmissionHistory.tsx'; 
import B4CommentList from './routes/B4CommentList.tsx';
import B4CommentManagement from './routes/B4CommentManagement.tsx';
import { B4SubmissionHistory } from './routes/B4SubmissionHistory'; 
import axios from 'axios';
import { MessageCircleMore, LogOut, Users } from 'lucide-react';
import PublicStatusList from './routes/PublicStatusList.tsx'; // 追加

// これから行うすべての通信に対して、自動で通行証（token）を付与する
axios.interceptors.request.use(
  (config) => {
    // ブラウザの記憶領域（LocalStorage）からトークンを取り出す
    const token = localStorage.getItem('authToken');
    
    // トークンが存在すれば、ヘッダーに「Bearer ...」の形でくっつける
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
let isAuthAlertShown = false;

axios.interceptors.response.use(
  (response) => response, // 成功時はそのまま通す
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        if (!isAuthAlertShown) {
          isAuthAlertShown = true;
          alert("認証が切れました。再度ログインしてください。");
          window.location.href = "/auth/login"; // ログイン画面へ強制送還
        }
      } else if (error.response.status === 403) {
        if (!isAuthAlertShown) {
          isAuthAlertShown = true;
          alert("このページにアクセスする権限がありません。");
          window.location.href = "/auth/login"; // ログイン画面へ強制送還
        }
      }
    }
    return Promise.reject(error);
  }
);

function Sidebar() {
  const location = useLocation();
  const role = localStorage.getItem("userRole");
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    navigate("/auth/login");
  }

  // ログイン画面ではサイドバーを表示しない
  if (location.pathname === "/auth/login" || location.pathname === "/") {
    return null;
  }

  return (
    <Box w="250px" bg="gray.800" color="white" h="100vh" p={5} boxShadow="lg" position="fixed" top={0} left={0} overflowY="auto" zIndex={1000}>
      <Text fontSize="xl" fontWeight="bold" mb={8} color="blue.300">
        Judge System
      </Text>
      <VStack align="stretch" spacing={4}>

        {role !== "B4" && (
          <Button
            as={RouterLink}
            to="/comments"
            colorScheme="blue"
            variant="ghost"
            justifyContent="flex-start"
            color="white"
            fontSize="md"
            px={4}
            _hover={{ bg: "whiteAlpha.200" }}>
            <MessageCircleMore/> B4からのコメント
          </Button>
        )}

        {role !== "B4" && (
          <Button
            as={RouterLink}
            to="/public-status"
            colorScheme="blue"
            variant="ghost"
            justifyContent="flex-start"
            color="white"
            fontSize="md"
            px={4}
            _hover={{ bg: "whiteAlpha.200" }}>
            <Users /> みんなの提出状況
          </Button>
        )}

        <Button 
          onClick={handleLogout} 
          variant="ghost"
          justifyContent="flex-start" 
          color="white"
          _hover={{
            bg: "whiteAlpha.200",
            color: "red.300"
          }}
          w="full"
          bg="transparent"
          fontSize="md"
          px={4}
        >
          <LogOut /> ログアウト
        </Button>
      </VStack>
    </Box>
  );
}

function AppContent() {
  const location = useLocation();
  const showSidebar = !(location.pathname === "/auth/login" || location.pathname === "/");
  return (
    <Flex>
      <Sidebar />

      <Box
        flex="1"
        //w="full"
        minW="0"
        ml={showSidebar ? "250px" : "0"}
        transition="margin 0.2s"
      >
        <Routes>
          <Route path="/" element={<Navigate to="/auth/login" replace />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/problems" element={<ProblemList />} />
          <Route path="/problems/:problem_id" element={<ProblemDetail />} />
          <Route path="/problems/:problem_id/history" element={<SubmissionHistory />} />
          <Route path="/status" element={<StatusList />} />
          <Route path="/status/:problem_id/:student_id" element={<StatusDetail />} />
          <Route path="/public-status" element={<PublicStatusList />} />
          <Route path="/comments" element={<B4CommentList />} />
          <Route path="/comments/manage/:problem_id" element={<B4CommentManagement />} />
          <Route path="/status/:problem_id/:student_id/history" element={<B4SubmissionHistory />} />
        </Routes>
      </Box>
    </Flex>
  );
}

function App() {
  return (
    // ChakraUIの機能を有効化
    <ChakraProvider value={defaultSystem}> 
      {/* ルーティング（画面遷移）の設定 */}
      {/* 画面全体の背景を薄いグレーにする */}
      <Box minH="100vh" bg="gray.50">
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </Box>
    </ChakraProvider>
  );
}

export default App;
