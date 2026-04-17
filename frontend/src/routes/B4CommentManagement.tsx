// frontend/src/routes/B4CommentManagement.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box, Heading, Text, VStack, Container, Spinner, Center, Button, HStack, Badge
} from '@chakra-ui/react';
import axios from 'axios';
// 一覧に戻るボタン
import { BackLink } from '../components/BackLink';
import { ReviewBadge } from '../components/ReviewBadge';

interface MailHistory {
  student_id: string;
  name: string;
  problem_id: string;
  content: string;
  b4_name: string;
  submit_time: string;
  status: string;
}

export const B4CommentManagement = () => {
  const { problem_id } = useParams<{ problem_id: string }>();
  const [history, setHistory] = useState<MailHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`/api/gmail/${problem_id}`);
        setHistory(res.data);
      } catch (e) {
        console.error("履歴取得エラー", e);
        alert("履歴の取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    if (problem_id) {
      fetchHistory();
    }
  }, [problem_id]);

  if (loading) return <Center h="100vh"><Spinner size="xl" color="blue.500" /></Center>;

  return (
    <Container maxW="container.lg" py={10}>
      <BackLink text="前の画面に戻る" />
      <Heading size="xl" mb={2} color="gray.800">
        課題 {problem_id} のコメント履歴一覧
      </Heading>
      <Text color="gray.600" mb={8}>
        他のB4が学生に対してどのようなフィードバックを送ったかを確認できます。
      </Text>

      <Box bg="white" p={6} borderRadius="xl" boxShadow="md">
        {history.length === 0 ? (
          <Text color="gray.500">この課題に関するコメント履歴はまだありません。</Text>
        ) : (
            <VStack spacing={4} align="stretch">
              {history.map((record, index) => (
                <Box key={index} p={4} bg="gray.50" borderRadius="md" borderLeft="4px solid" borderLeftColor={record.status === "OK" ? "green.400" : record.status === "要修正" ? "red.400" : "orange.400"}>
                  <HStack justify="space-between" mb={2}>
                    <Text fontWeight="bold" color="blue.700">宛先: {record.name}さん</Text>
                    <HStack>
                      <ReviewBadge status={record.status} variant="solid" />
                      <Text fontSize="sm" color="gray.500">担当: {record.b4_name}</Text>
                      <Text fontSize="xs" color="gray.400">{new Date(record.submit_time).toLocaleString('ja-JP')}</Text>
                    </HStack>
                  </HStack>
                  <Text whiteSpace="pre-wrap" color="gray.800" fontSize="sm">{record.content}</Text>
                </Box>
              ))}
            </VStack>
          )}
      </Box>
    </Container>
  );
};

export default B4CommentManagement;
