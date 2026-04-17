import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box, Heading, Text, VStack, Container, Spinner, Link as ChakraLink, Flex, Center, Button, HStack, Accordion, Textarea,
} from '@chakra-ui/react';
import axios from 'axios';
import { JudgeResultAccordion } from '../components/JudgeResultAccordion';
import { B4 } from "../constants/B4";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Search, Send, Mailbox, ChartColumn, History } from 'lucide-react';
// 一覧に戻るボタン
import { BackLink } from '../components/BackLink';

interface DetailData {
  name: string;
  source_code: string;
  results: Record<string, any>;
  code?: Record<string, string>;
  problem_detail?: string;
  problem_criterion?: string;
  isReviewed?: string;
  reviewer?: string;
}

export const StatusDetail = () => {
  const { problem_id, student_id } = useParams<{ problem_id: string, student_id: string }>();
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewer, setReviewer] = useState("");
  const [reviewStatus, setReviewStatus] = useState("未確認");
  const [comment, setComment] = useState("");

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const submission_id = queryParams.get('submission_id');

  const reviewers = B4;

  const updateSubmissionStatus = async (payload: { b4_name?: string; status_str?: string }) => {
    try {
      await axios.post(`/api/status/update-status`, {
        student_id,
        problem_id,
        ...payload,
      });
      console.log("更新成功");
    } catch (error) {
      console.error("更新失敗:", error);
    }
  };

  const handleSendComment = async () => {
    if (!reviewer || !reviewStatus) {
      alert("先に「担当者」と「確認状況」を設定してください。");
      return;
    }
    if (!comment) {
      alert("コメントを入力してください。");
      return;
    }

    try {
      await axios.post(`/api/gmail`, {
        student_id: student_id,
        problem_id: problem_id,
        b4_name: reviewer,
        content: comment,
        status: reviewStatus
      });
      alert("学生へコメントとメールを送信しました！");
      setComment("");
    } catch (e) {
      alert("エラーが発生しました。");
      console.error(e);
    }
  };

  useEffect(() => {
    let url = `/api/status/${problem_id}/${student_id}`;
    if (submission_id) {
      url += `?submission_id=${submission_id}`;
    }

    axios.get(url)
      .then(res => {
        setDetail(res.data);
        // ★APIから取得した値をプルダウンの初期値としてセット
        setReviewer(res.data.reviewer || "");
        setReviewStatus(res.data.isReviewed || "未確認");
      })
      .catch(err => console.error("データの取得に失敗しました", err)
      )
      .finally(() => setLoading(false));
  }, [problem_id, student_id]);

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #E2E8F0',
    backgroundColor: 'white',
    fontSize: '14px',
    color: '#2D3748',
    outline: 'none',
  };

  if (loading) return <Center h="100vh"><Spinner size="xl" color="blue.500" /></Center>;
  if (!detail) return <Center h="100vh"><Text fontSize="xl" color="gray.500">データが見つかりませんでした。</Text></Center>;

  return (
    <Container maxW="container.lg" py={10}>
      <BackLink to="/status" text="進捗一覧に戻る" />
      <VStack align="stretch" spacing={8}>
        {/* ヘッダーカード */}
        <Box bg="white" p={6} borderRadius="xl" boxShadow="sm" borderLeft="6px solid" borderLeftColor="blue.500">
          <Heading size="xl" mb={2} color="gray.800">
            <Text as="span" color="blue.600">{detail.name}</Text> さんの提出詳細
          </Heading>
          <Text fontSize="lg" color="gray.600" fontWeight="bold">課題: {problem_id}</Text>
          <Button
            as={RouterLink}
            to={`/status/${problem_id}/${student_id}/history`}
            mt={4}
            colorScheme="blue"
            variant="outline"
          >
            <History size={18} style={{ marginRight: '8px' }} />
            この生徒の提出履歴一覧を見る
          </Button>
        </Box>

        {/* B4レビュー関連の操作パネル */}
        <Box bg="white" p={6} borderRadius="xl" boxShadow="sm" borderTop="4px solid" borderTopColor="purple.400">
          <Text
            fontWeight="bold"
            color="gray.700"
            mb={4}
            fontSize="lg"
            display="flex"
            alignItems="center"
            gap={2}
          >
            <Search size={20} />
            コードレビュー設定
          </Text>
          <HStack spacing={8} align="flex-end">
            {/* 担当者設定 */}
            <Box flex={1}>
              <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>担当者</Text>
              <select
                value={reviewer}
                onChange={(e) => {
                  const val = e.target.value;
                  setReviewer(val);
                  updateSubmissionStatus({ b4_name: val });
                }}
                style={selectStyle}
              >
                <option value="">担当者を選択</option>
                {reviewers?.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Box>

            {/* 確認状況設定 */}
            <Box flex={1}>
              <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>確認状況</Text>
              <select
                value={reviewStatus}
                onChange={(e) => {
                  const val = e.target.value;
                  setReviewStatus(val);
                  updateSubmissionStatus({ status_str: val });
                }}
                style={selectStyle}
              >
                <option value="未確認">未確認</option>
                <option value="確認中">確認中</option>
                <option value="要修正">修正が必要</option>
                <option value="OK">確認してOK</option>
              </select>
            </Box>
          </HStack>

          <Box borderTop="1px dashed" borderColor="gray.200" pt={4}>
            <Text fontSize="sm" color="gray.500" mb={2} fontWeight="bold">学生へのフィードバックコメント</Text>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="学生へのフィードバックや修正指示を入力してください。（※あなたの名前や確認状況は自動でメールに記載されます）"
              bg="gray.50"
              color="gray.700"
              mb={3}
              rows={4}
            />
            <Flex justify="center" w="full" mt={4}>
              <VStack spacing={4} w="full" maxW="400px">
                <Button
                  onClick={handleSendComment}
                  w="full"
                  h="auto"
                  py={4}
                  bg="green.600"
                  color="white"
                  _hover={{ bg: "green.700" }}
                  borderRadius="md"
                >
                  <Flex align="center" justify="center" gap={2}>
                    <Send size={20} color="white" />
                    <Text fontWeight="bold">コメントと結果を学生に送信する</Text>
                  </Flex>
                </Button>
                <Button
                  as={RouterLink}
                  to={`/comments/manage/${problem_id}`}
                  w="full"
                  h="auto"
                  py={4}
                  variant="outline"
                  borderColor="blue.500"
                  color="blue.500"
                  _hover={{ bg: "blue.50" }}
                  borderRadius="md"
                >
                  <Flex align="center" justify="center" gap={2}>
                    <Mailbox size={20} />
                    <Text fontWeight="bold">この課題の他のコメント履歴を見る</Text>
                  </Flex>
                </Button>
              </VStack>
            </Flex>
          </Box>
        </Box>

        {/* 問題詳細エリア */}
        {detail.problem_detail && (
          <Box bg="white" p={6} borderRadius="xl" boxShadow="sm" borderTop="4px solid" borderTopColor="gray.300">
            <Text fontWeight="bold" color="gray.700" mb={3} fontSize="lg">問題詳細</Text>
            <Box bg="gray.50" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
              <Text color="gray.800" fontSize="md" whiteSpace="pre-wrap" lineHeight="tall">
                {detail.problem_detail}
              </Text>
            </Box>
          </Box>
        )}
        {/* 採点基準エリア */}
        {detail.problem_criterion && (
          <Box bg="white" p={6} borderRadius="xl" boxShadow="sm" borderTop="4px solid" borderTopColor="gray.300">
            <Text fontWeight="bold" color="gray.700" mb={3} fontSize="lg">採点基準</Text>
            <Box bg="gray.50" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
              <Text color="gray.800" fontSize="md" whiteSpace="pre-wrap" lineHeight="tall">
                {detail.problem_criterion}
              </Text>
            </Box>
          </Box>
        )}

        {/* ソースコードの表示エリア */}
        <Box bg="#1E1E1E" borderRadius="xl" overflow="hidden" boxShadow="xl">
          <Accordion.Root multiple>
            {Object.entries(detail.code || {}).map(([filename, codeContent]) => (
              <Accordion.Item key={filename} value={filename} borderBottom="1px solid #333">
                <Accordion.ItemTrigger _expanded={{ bg: '#2D2D30' }} bg="#323233" px={4} py={3} display="flex" alignItems="center" cursor="pointer">
                  <Flex align="center" flex="1">
                    <Flex gap={2}>
                      <Box w="12px" h="12px" borderRadius="full" bg="#FF5F56" />
                      <Box w="12px" h="12px" borderRadius="full" bg="#FFBD2E" />
                      <Box w="12px" h="12px" borderRadius="full" bg="#27C93F" />
                    </Flex>
                    <Text ml={4} color="gray.300" fontSize="sm" fontFamily="monospace" fontWeight="bold">
                      {filename}
                    </Text>
                  </Flex>
                  <Accordion.ItemIndicator color="gray.400" />
                </Accordion.ItemTrigger>

                <Accordion.ItemContent>
                  <Box p={4} overflowX="auto" bg="#1E1E1E">
                    <SyntaxHighlighter
                      language="c"  //C言語に合わせてハイライト
                      style={vs2015}
                      customStyle={{
                        margin: 0,
                        background: 'transparent', //親boxの背景色を活かす
                        fontSize: '15px',
                        fontFamily: '"Fira Code", "Consolas", monospace',
                        lineHeight: '1.5',
                        textAlign: 'left'
                      }}
                      showLineNumbers={true} //行番号の表示
                    >
                      {codeContent}
                    </SyntaxHighlighter>
                  </Box>
                </Accordion.ItemContent>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </Box>
        {/* ジャッジ結果エリア */}
        <Box bg="white" p={8} borderRadius="xl" shadow="md" borderTop="6px solid" borderTopColor="green.400">
          <Heading
            size="lg"
            mb={6}
            color="gray.800"
            display="flex"
            alignItems="center"
            gap={2}
          >
            <ChartColumn size={28} />
            <span>ジャッジ詳細結果</span>
          </Heading>
          <JudgeResultAccordion results={detail as any} />
        </Box>
      </VStack>
    </Container>
  );
};

export default StatusDetail;
