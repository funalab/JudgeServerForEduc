import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box, Heading, Text, VStack, Button, Input,
  Container, Badge, Spinner, Flex,
  HStack, CloseButton
} from '@chakra-ui/react';
import axios from 'axios';
import '../App.css';
import { JudgeResultAccordion } from '../components/JudgeResultAccordion';
import { BackLink } from '../components/BackLink';
import { LoadingTrivia } from '../components/LoadingTrivia';
import { ReviewBadge } from '../components/ReviewBadge'
import { Timer, HardDrive, Upload, ChartColumn } from 'lucide-react';

//待機用の関数
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
//Javaのinterfaceと同じで、絶対この型通りに実装してね！というもので、これに従わないとエラー起きる。
interface SampleCase {
  name: string;
  input: string;
  output: string;
  args: string | null;
}

interface Problem {
  problem_id: string;
  title: string;
  expected_output: string;
  problem_detail: string;
  sample_cases?: SampleCase[];
  time_limit?: number;   // 秒 (Float)
  memory_limit?: number; // MB (Integer)
}

export const ProblemDetail = () => {
  const { problem_id } = useParams<{ problem_id: string }>();

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const submission_id = queryParams.get('submission_id');

  const [problem, setProblem] = useState<Problem | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // APIのURLを構築（submission_idがあれば末尾に付ける）
    let url = `/api/problems/${problem_id}`;
    if (submission_id) {
      url += `?submission_id=${submission_id}`;
    }

    axios.get(url)
      .then(res => {
        setProblem(res.data);
        if (res.data.status && res.data.status !== "not_submitted") {
          setResult({
            status: res.data.status,
            details: res.data.details,
            isReviewed: res.data.isReviewed,
            reviewer: res.data.reviewer
          });
        }
      })
      .catch(err =>
        console.error("データの取得に失敗しました", err)
      );
  }, [problem_id, submission_id]);

  const handleSubmit = async () => {
    if (files.length === 0) {
      alert("ファイルを選択してください");
      return;
    }
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('problem_id', problem_id || "");

    try {
      // ポーリング処理を行う
      const uploadRes = await axios.post(`/api/submission/${problem_id}`, formData);

      let isJudging = true;
      let retryCount = 0;
      const maxRetries = 600;

      while (isJudging && retryCount < maxRetries) {
        const res = await axios.get(`/api/submission/${problem_id}/results`);
        setResult(res.data);

        if (res.data.status === "WJ") {
          await sleep(3000);
          retryCount++;
        } else {
          isJudging = false;
        }

        if (retryCount >= maxRetries) {
          alert("ジャッジ処理に時間がかかっています。後ほど画面を更新して確認してください。");
        }

      }
    } catch (e) {
      alert("送信に失敗しました");
    }
    finally {
      setLoading(false);
    }

  };

  // ファイルを選択した時の処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {

      const selected = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selected]);

      e.target.value = '';
    }
  };

  // 特定のファイルをリストから削除する処理
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };
  // 全てのファイルを削除する処理
  const removeAllFiles = () => {
    setFiles([]);
  };

  if (!problem) return <Spinner />;

  // 全テストケースACかつB4レビューがOKならそれ以上提出できないようにするための変数
  const isCompleted = result?.status === "AC" && result?.isReviewed === "OK";

  return (
    <Container maxW="container.lg" py={10}>
      <BackLink to="/problems" text="課題一覧に戻る" />
      <VStack align="stretch" spacing={8}>
        {/* 問題詳細カード */}
        <Box bg="white" p={8} borderRadius="2xl" boxShadow="md" borderTop="6px solid" borderTopColor="gray.600">
          <Flex align="baseline" mb={4}>
            <Heading size="2xl" color="gray.800" mr={4}>{problem.problem_id}</Heading>
            <Heading size="lg" color="gray.600" fontWeight="medium">{problem.title}</Heading>
          </Flex>
          {/* --- 制限値バッジ --- */}
          <HStack spacing={4} mb={5}>
            <Badge colorScheme="orange" variant="subtle" px={3} py={1} borderRadius="md" display="flex" alignItems="center" gap={1.5}>
              <Timer size={14} />
              <Text fontSize="xs" fontWeight="bold">実行制限: {problem.time_limit ?? "--"}s</Text>
            </Badge>
            <Badge colorScheme="purple" variant="subtle" px={3} py={1} borderRadius="md" display="flex" alignItems="center" gap={1.5}>
              <HardDrive size={14} />
              <Text fontSize="xs" fontWeight="bold">メモリ制限: {problem.memory_limit ?? "--"}MB</Text>
            </Badge>
          </HStack>
          <Box borderBottom="1px solid" borderColor="gray.200" my={5} />
          <Box>
            <Text fontWeight="bold" color="gray.700" mb={2} fontSize="lg">問題詳細</Text>
            <Box bg="gray.50" p={6} borderRadius="lg" border="1px solid" borderColor="gray.100">
              <Text color="gray.800" fontSize="md" whiteSpace="pre-wrap" lineHeight="tall">
                {problem.problem_detail}
              </Text>
            </Box>
          </Box>
          {problem.sample_cases && problem.sample_cases.length > 0 && (
            <Box mt={8}>
              <Text fontWeight="bold" color="gray.700" mb={4} fontSize="lg">入出力例</Text>
              <Flex direction="column" gap={6}>
                {problem.sample_cases.map((sample, index) => (
                  <Box key={index} border="1px solid" borderColor="gray.200" borderRadius="xl" overflow="hidden">
                    <Box bg="gray.100" px={4} py={2} borderBottom="1px solid" borderColor="gray.200">
                      <Text fontWeight="bold" color="gray.700">{sample.name}</Text>
                    </Box>
                    <Flex direction={{ base: "column", md: "row" }} bg="white">

                      {sample.args && sample.args.trim() !== '' && (
                        <Box 
                          flex={1}
                          p={4}
                          borderRightWidth={{ md: "1px" }}
                          borderBottomWidth={{ base: "1px", md: "0" }}
                          borderColor="gray.200"
                        >
                          <Text fontSize="sm" color="gray.500" mb={2} fontWeight="bold">コマンドライン引数 (args)</Text>
                          <Box bg="#1E1E1E" p={4} borderRadius="md" minH="80px">
                            {sample.args && sample.args.trim() !== "" && (
                              <Text color="yellow.300" fontSize="sm" fontFamily="monospace" mb={2}>
                                $ ./a.out {sample.args}
                              </Text>
                            )}
                          </Box>
                        </Box>
                      )}
                      {/* 入力エリア */}
                      <Box flex={1} p={4} borderRight={{ md: "1px solid #E2E8F0" }} borderBottom={{ base: "1px solid #E2E8F0", md: "none" }}>
                        <Text fontSize="sm" color="gray.500" mb={2} fontWeight="bold">入力 (stdin)</Text>
                        <Box bg="#1E1E1E" p={4} borderRadius="md" minH="80px">
                          <Text color="#D4D4D4" fontSize="sm" fontFamily="monospace" whiteSpace="pre-wrap">
                            {sample.input === "dummy.txt" ? "(入力なし)" : sample.input}
                          </Text>
                        </Box>
                      </Box>

                      {/* 出力エリア */}
                      <Box flex={1} p={4}>
                        <Text fontSize="sm" color="gray.500" mb={2} fontWeight="bold">期待される出力 (stdout)</Text>
                        <Box bg="#1E1E1E" p={4} borderRadius="md" minH="80px">
                          <Text color="#D4D4D4" fontSize="sm" fontFamily="monospace" whiteSpace="pre-wrap">
                            {sample.output}
                          </Text>
                        </Box>
                      </Box>
                    </Flex>
                  </Box>
                ))}
              </Flex>
            </Box>
          )}
        </Box>

        {/* 提出フォームカード */}
        <Box bg="white" p={8} borderRadius="2xl" boxShadow="md" border="1px solid" borderColor="gray.200">
          <Heading
            size="md"
            mb={6}
            color="gray.800"
            borderBottom="2px solid"
            borderColor="blue.500"
            display="flex"
            alignItems="center"
            gap={2}
            pb={2}
            w="fit-content"
          >
            <Upload size={20} />
            <span>ソースコード提出</span>
          </Heading>
          <VStack spacing={6} align="stretch">
            <Box
              border="2px dashed"
              borderColor="gray.300"
              borderRadius="xl"
              p={10}
              textAlign="center"
              bg="gray.50"
              _hover={{ bg: "gray.100", borderColor: "blue.400" }}
              transition="all 0.2s"
            >
              <Text fontWeight="bold" color="gray.600" mb={4} fontSize="lg">
                アップロードするファイルを選択してください
              </Text>
              <Input
                type="file"
                multiple
                p={2}
                color="gray.700"
                variant="unstyled"
                sx={{
                  '::file-selector-button': {
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 'md',
                    backgroundColor: '#E2E8F0',
                    color: '#2D3748',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'all 0.2s',
                  },
                  '::file-selector-button:hover': {
                    backgroundColor: '#CBD5E0',
                  }
                }}
                onChange={(e) => {
                  if (e.target.files) {
                    const newFiles = Array.from(e.target.files);
                    setFiles((prev) => [...prev, ...newFiles]);
                    e.target.value = '';
                  }
                }}
              />
            </Box>

            {/* 選択されたファイルのリスト表示エリア */}
            {files.length > 0 && (
              <VStack align="stretch" spacing={2} p={4} bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.100">
                <Flex justify="space-between" align="center" mb={1}>
                  <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>
                    選択中のファイル ({files.length}件)
                  </Text>
                  <Button
                    size="xs"
                    colorScheme="red"
                    color="gray.700"
                    bg="gray.200"
                    onClick={removeAllFiles}
                    _hover={{ bg: "red.50" }}
                  >
                    全て削除
                  </Button>
                </Flex>
                {files.map((file, index) => (
                  <Flex
                    key={`${file.name}-${index}`}
                    bg="white"
                    p={3}
                    borderRadius="md"
                    boxShadow="sm"
                    justify="space-between"
                    align="center"
                  >
                    <HStack>
                      <Text fontSize="sm" color="gray.700" fontWeight="medium">{file.name}</Text>
                      <Text fontSize="xs" color="gray.400">({(file.size / 1024).toFixed(1)} KB)</Text>
                    </HStack>
                    <CloseButton
                      size="sm"
                      color="gray.800"
                      bg="gray.200"
                      _hover={{}}
                      onClick={() => setFiles(files.filter((_, i) => i !== index))}
                    />
                  </Flex>
                ))}
              </VStack>
            )}
            <Button
              size="lg"
              bg={isCompleted ? "gray.300 !important" : "gray.100 !important"}
              color={isCompleted ? "gray.500" : "gray.800"}
              _hover={!isCompleted ? {
                transform: 'translateY(-2px)',
                boxShadow: 'lg'
              } : {
                transform: 'none',
                boxShadow: 'none'
              }}
              _active={{ bg: isCompleted ? "gray.300" : undefined }}
              onClick={handleSubmit}
              isLoading={loading}
              isDisabled={isCompleted}
              borderRadius="full"
              py={7}
              fontSize="lg"
              fontWeight="bold"
              cursor={isCompleted ? "default" : "pointer"}
              pointerEvents={isCompleted ? "none" : "auto"}
            >
              {isCompleted ? "課題完了（提出締切済み）" : "提出してジャッジを実行！"}
            </Button>
          </VStack>
        </Box>

        {(loading || (result && result?.status === "WJ")) && (
          <Box animation="fadeIn 0.5s" position="sticky" top="20px" zIndex="100">
            <LoadingTrivia />
          </Box>
        )}
        {/* 判定結果カード */}
        {result && (
          <Box bg="white" p={8} borderRadius="2xl" boxShadow="xl" borderTop="6px solid" borderTopColor="green.400" animation="fadeIn 0.5s">
            <Heading
              size="lg"
              mb={6}
              color="gray.800"
              display="flex"
              alignItems="center"
              gap={2}
            >
              <ChartColumn size={28} color="#4A5568" />
              <span>判定結果</span>
            </Heading>
            <Flex justify="space-between" align="center" mb={6}>
              {/* ACの場合のみレビュー状況を表示 */}
              {result.status === "AC" && (
                <Box>
                  <ReviewBadge status={result.isReviewed} reviewer={result.reviewer} variant="solid" />
                </Box>
              )}
            </Flex>
            <JudgeResultAccordion results={result} problemId={problem.problem_id} />
          </Box>
        )}

      </VStack>
      <BackLink text="課題一覧に戻る" to="/problems" mt={8} mb={6} />
    </Container>
  );
};

export default ProblemDetail;
