import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box, Heading, Text, VStack, Button, Input, Center,
  Link, Container, Badge, Spinner
} from '@chakra-ui/react';
import axios from 'axios';
import '../App.css'

interface UserInfo {
  student_id: string;
  password: string;
}

export const LoginScreen = () => {
  const [info, setInfo] = useState<UserInfo>({ student_id: '', password: '' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 入力欄が変更された時の処理
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInfo(prev => ({ ...prev, [name]: value }))
  }

  // ログインボタンが押された時の処理
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!info.student_id || !info.password) {
      alert("ユーザー名とパスワードを入力してください");
      return;
    }
    setLoading(true);

    try {
      // step1. API_1(ログイン)に入力されたIDとパスワードをPOSTし、tokenをreturnしてもらう
      // const loginRes = await axios.post(`${primaryApiUrl}/api/auth/login`, {
      const loginRes = await axios.post(`/api/auth/login`, {
        student_id: info.student_id,
        password: info.password
      })

      // backendのAPI_1から返ってきたtokenを変数に格納
      const token = loginRes.data.accesstoken;

      // JWTのために、ブラウザの記憶領域にtokenを保存しておく
      localStorage.setItem("authToken", token);

      // step2. API_2(権限確認)にもらったtokenをGETで送る
      const verifyRes = await axios.get(`/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // step3. 判定結果による画面遷移
      if (verifyRes.data && verifyRes.data.is_verified) {
        localStorage.setItem("userRole", verifyRes.data.role);
        if (verifyRes.data.role === "B4") {
          navigate(`/status`)
        } else {
          navigate(`/problems`);
        }
      } else {
        alert("認証に失敗しました");
      }

    } catch (e: any) {
      alert("ログインに失敗しました。ユーザー名またはパスワードが間違っています。");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Center minH="100vh" bg="gray.50" py={10}>
      <Container maxW="md">
        <Box bg="white" p={8} borderRadius="2xl" boxShadow="2xl" borderTop="8px solid" borderTopColor="blue.500">
          <VStack align="stretch" spacing={6}>
            <Box textAlign="center" mb={2}>
              <Heading size="xl" mb={2} color="gray.800">Judge System</Heading><Text color="gray.500">アカウント情報を入力してログイン</Text>
            </Box>

            <VStack as="form" onSubmit={handleSubmit} spacing={4} align="start">
              <Box w="full">
                <Text fontWeight="bold" color="gray.700" mb={2}>ユーザー名</Text>
                <Input
                  name="student_id"
                  value={info.student_id}
                  onChange={handleChange}
                  placeholder="ユーザー名を入力"
                  size="lg"
                  bg="gray.50"
                  _focus={{ bg: "white", borderColor: "blue.400", boxShadow: "outline" }}
                  borderRadius="md"
                  color="gray.700"
                />
              </Box>
              <Box w="full">
                <Text fontWeight="bold" color="gray.700" mb={2}>パスワード</Text>
                <Input
                  name="password"
                  type="password"
                  value={info.password}
                  onChange={handleChange}
                  placeholder="パスワードを入力"
                  size="lg"
                  bg="gray.50"
                  _focus={{ bg: "white", borderColor: "blue.400", boxShadow: "outline" }}
                  borderRadius="md"
                  color="gray.700"
                />
              </Box>
              <Button
                type="submit"
                w="full"
                size="lg"
                fontWeight="bold"
                color="gray.700"
                bg="gray.100"
                bgGradient="linear(to-r, blue.400, blue.600)"
                _hover={{ bgGradient: "linear(to-r, blue.500,blue.700", transform: "translateY(-2px)", boxShadow: "lg" }}
                transition="all 0.2s"
                onClick={handleSubmit}
                isLoading={loading}
                borderRadius="md"
              >
                ログイン
              </Button>
            </VStack>

            {result && (
              <Box border="1px solid" borderColor="blue.200" p={5} borderRadius="lg" bg="blue.50">
                <Heading size="sm" mb={2} color="blue.700">判定結果デバッグ用</Heading>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', color: '#2b6cb0' }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </Box>
            )}
          </VStack>
        </Box>
      </Container>
    </Center>
  );
};
export default LoginScreen;
