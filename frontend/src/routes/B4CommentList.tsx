// frontend/src/routes/B4CommentList.tsx
import React, { useEffect, useState } from 'react';
import { Box, Container, Heading, Text, VStack, Center, Spinner, Badge, Button } from '@chakra-ui/react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// 一覧に戻るボタン
import { BackLink } from '../components/BackLink';
import { ReviewBadge } from '../components/ReviewBadge';

// バックエンドから返ってくるデータの型定義
interface MailHistory {
  student_id: string;
  problem_id: string;
  content: string;
  b4_name: string;
  submit_time: string;
  status: string;
}

export const B4CommentList = () => {
  const [comments, setComments] = useState<MailHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 画面が表示された時に一度だけAPIを叩く
  useEffect(() => {
    const fetchMyComments = async () => {
      try {
        // 追加したバックエンドの GET /api/gmail を呼び出す
        const res = await axios.get(`/api/gmail`);
        setComments(res.data);
      } catch (e) {
        console.error("コメント取得エラー", e);
        alert("コメントデータの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    fetchMyComments();
  }, []);

  // ローディング中の表示
  if (loading) return <Center h="100vh"><Spinner size="xl" color="blue.500" /></Center>;

  return (
    <Container maxW="container.md" py={10}>
      <BackLink text="前の画面に戻る" />
      <Heading size="xl" mb={8} color="gray.800">
        B4からのコメント一覧
      </Heading>

      {/* コメントが1件もない場合の表示 */}
      {comments.length === 0 ? (
        <Text color="gray.500">現在、あなた宛てのコメントはありません。</Text>
      ) : (
        <VStack spacing={4} align="stretch">
          {comments.map((comment, index) => (
            <Box key={index} bg="white" p={5} borderRadius="lg" boxShadow="md" borderLeft="5px solid" borderLeftColor={comment.status === "OK" ? "green.400" : "red.400"}>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Text fontWeight="bold" fontSize="lg" color="blue.600">課題: {comment.problem_id}</Text>
                  <ReviewBadge status={comment.status} variant="solid" />
                </Box>
              <Text color="gray.500" fontSize="sm" mb={3}>
                担当: {comment.b4_name} / 日時: {new Date(comment.submit_time).toLocaleString('ja-JP', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
              <Box bg="gray.50" p={3} borderRadius="md">
                <Text whiteSpace="pre-wrap" color="gray.800">{comment.content}</Text>
              </Box>
            </Box>
          ))}
        </VStack>
      )}
    </Container>
  );
};

export default B4CommentList;
