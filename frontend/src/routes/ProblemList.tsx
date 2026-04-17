import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Container,
  SimpleGrid,
  VStack,
  Spinner,
  Center,
  Stack,
  Flex,
  Button
} from '@chakra-ui/react';
import axios from 'axios';
import '../App.css'
import { EasterEgg } from '../components/EasterEgg';
import { ReviewBadge } from '../components/ReviewBadge'
import { StatusBadge } from '../components/StatusBadge'
import { formatDate } from '../utils/dateUtils'
import { getStatusColor, STATUS_COLORS } from '../constants/statusColors'
import { Hourglass, NotebookPen, TriangleAlert, CheckLine } from 'lucide-react';

interface Problem {
  student_id: string;
  problem_id: string;
  title: string;
  status: 'not_submitted' | 'WJ' | 'WA' | 'AC' | 'CE' | 'RE' | 'TLE' | 'ME';
  deadline: string;
  release_date: string;
  isReviewed?: string;
  reviewer?: string;
  details?: Record<string, { status: string }>;
}

const CountdownTimer = ({ deadlineStr }: { deadlineStr: string }) => {
  const calculateTimeLeft = () => {

    const difference = new Date(deadlineStr).getTime() - new Date().getTime();

    if (difference <= 0) {
      return null; // 期限切れの場合は null
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [deadlineStr]);

  if (!timeLeft) {
    return (
      <Text fontSize="sm" color="red.500" fontWeight="bold" textAlign="center" mt={3}>
        期限切れ
      </Text>
    );
  }

  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      fontSize="sm"
      color="red.500"
      fontWeight="bold"
      mt={3}
      bg="red.50"
      py={1}
      borderRadius="md"
      gap={1} // アイコンとテキストの間の隙間
    >
      {/* sizeを指定し、中央に配置 */}
      <Hourglass size={16} />
      <Text as="span">残り: {timeLeft.days}日 {timeLeft.hours}時間 {timeLeft.minutes}分</Text>
    </Flex>
  );
};

// 課題一覧表示
export const ProblemList = () => {
  // const { student_id } = useParams<{ student_id: string }>(); //URLからproblem_idに対応するところをとってこれる
  const [problems, setProblems] = useState<Problem[]>([]);
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  // ACが1つ以上あるか判定する
  const hasAtLeastOneAC = (p: Problem) => {
    if (!p.details) return false;
    const data = typeof p.details === 'string' ? JSON.parse(p.details) : p.details;
    return Object.values(data).some((tc: any) => tc?.status === 'AC');
  };

  useEffect(() => {
    // 課題のデータ取ってくる
    const fetchProblems = async () => {
      try {
        const response = await axios.get(`/api/problems`);
        if (response.data && response.data.length > 0) {
          const fetchedName = response.data[0].name;
          setUserName(fetchedName);
          const TARGET_NAME = "";
          if (fetchedName === TARGET_NAME && !sessionStorage.getItem('easterEggShown')) {
            setShowEasterEgg(true);
            sessionStorage.setItem('easterEggShown', 'true');
          }
        }
        // 取得したデータをソートする
        const sortedData = response.data.sort((a: Problem, b: Problem) => {
          // "C1", "C2" などの文字列から数字部分だけを取り出す
          const numA = parseInt(a.problem_id.replace("C", ""), 10);
          const numB = parseInt(b.problem_id.replace("C", ""), 10);
          return numA - numB; // 昇順に並び替え
        });
        setProblems(sortedData); // ソート済みのデータをセット
      } catch (error) {
        console.error("データ取得失敗", error);
      }
      finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, []);

  // 課題を提出状況によってフィルタリング（仕分け）
  const notSubmitted = problems.filter(p =>
    p.status === 'not_submitted' ||
    p.status === 'WJ' ||
    (p.status !== 'AC' && !hasAtLeastOneAC(p)) // ACが1つもなければ未提出扱いにする
  );
  const waProblems = problems.filter(p =>
    (p.status === 'WA' || p.status === 'CE' || p.status === 'RE' || p.status === 'TLE' || p.status === 'ME') &&
    hasAtLeastOneAC(p) // 1つ以上ACがある場合は再提出欄
  );
  const acProblems = problems.filter(p => p.status === 'AC');

  // 1つのカードを描画する部品
  const ProblemCard = ({ p }: { p: Problem }) => {
    // 日付のフォーマット処理 20260305 -> 2026/03/05
    const formatDate = (dateStr: string) => {
      if (!dateStr) return "";

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const h = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');

      return `${m}/${d}`;
    };

    let acCount = 0;
    let totalCount = 0;
    if (p.details) {
      // 1. 文字列ならパースし、オブジェクトならそのまま使う
      const data = typeof p.details === 'string' ? JSON.parse(p.details) : p.details;

      // 2. 中身をループしてカウント
      Object.values(data).forEach((tc: any) => {
        if (tc?.status) {
          totalCount++;
          if (tc.status === 'AC') acCount++;
        }
      });
    }

    const ratioText = totalCount > 0 ? `(${acCount}/${totalCount})` : "";

    // AC個数判定
    const isAC0 = (p.status !== 'not_submitted' && p.status !== 'WJ' && p.status !== 'AC' && acCount === 0);
    const isRealNotSubmitted = p.status === 'not_submitted';

    // 公開判定
    const now = new Date();
    const releaseDate = new Date(p.release_date);
    const deadlineDate = new Date(p.deadline);
    const isReleased = now >= releaseDate;
    const isOverdue = now > deadlineDate;

    const colors = getStatusColor(p.status);
    let bgColor = colors.bg;
    let borderColor = colors.border;
    let statusBadge = <StatusBadge status="not_submitted" />;

    if (!isReleased) {
      const unreleasedColors = getStatusColor('not_released');
      bgColor = unreleasedColors.bg;
      borderColor = unreleasedColors.border;
      statusBadge = <StatusBadge status="not_released" />;
    } else {
      // ラインの色設定
      if (p.status === "WJ") {
        statusBadge = <StatusBadge status="WJ" />;
      }
      else if (p.status === "AC") {
        bgColor = STATUS_COLORS['AC'].bg;
        borderColor = STATUS_COLORS['AC'].border;

        const badgeLabel = p.isReviewed === 'OK' ? "完了" : "AC";
        statusBadge = (
          <Flex align="center">
            <StatusBadge status="AC" variant="subtle" labelOverride={badgeLabel} />
            <Box ml={3}>
              <ReviewBadge status={p.isReviewed} reviewer={p.reviewer} variant="solid" />
            </Box>
          </Flex>
        );
      }
      // 実質未提出（ACが0個）の判定
      else if (isRealNotSubmitted || isAC0) {
        if (isOverdue) {
          const overdueStyles = getStatusColor('overdue');
          bgColor = overdueStyles.bg;
          borderColor = overdueStyles.border;
          statusBadge = <StatusBadge status="overdue" />;
        } else {
          statusBadge = <StatusBadge status="not_submitted" />;
        }
      }
      // 一部正解（WA/TLE等かつACが1つ以上）の場合
      else {
        borderColor = STATUS_COLORS['WA'].border;
        if (isOverdue) bgColor = STATUS_COLORS['overdue'].bg;
        statusBadge = <StatusBadge status={p.status} ratioText={ratioText} variant="subtle" />;
      }
    }

    const cardStyle = {
      bg: bgColor,
      borderTop: "6px solid",
      borderTopColor: borderColor,
      transition: "all 0.2s ease-in-out"
    };

    return (
      <Box
        p={6}
        borderRadius="xl"
        boxShadow={isReleased ? "md" : "sm"}
        transition="all 0.3s"
        {...cardStyle}
      >
        <Stack direction="row" justify="space-between" align="center" mb={3}>
          <Heading size="lg" color={isReleased ? "gray.700" : "gray.400"}>
            {p.problem_id}
          </Heading>
          {statusBadge}
        </Stack>

        <Text fontSize="md" fontWeight="bold" color={isReleased ? "gray.800" : "gray.400"} mb={4} noOfLines={2} minH="48px">
          {isReleased ? p.title : "（未解禁の課題）"}
        </Text>

        <Flex justify="flex-end" align="center" mb={4}>
          <Text fontSize="xs" color="gray.400" fontWeight="medium" bg="gray.100" px={3} py={1} borderRadius="full">
            {isReleased ? `期限: ${formatDate(p.deadline)}` : `${formatDate(p.release_date)} 公開予定`}
          </Text>
        </Flex>

        <Flex gap={3}>
          <Button
            as={isReleased ? RouterLink : "button"}
            to={isReleased ? `/problems/${p.problem_id}` : undefined}
            size="sm"
            variant="outline"
            colorScheme="blue"
            flex={1}
            isDisabled={!isReleased}
            pointerEvents={isReleased ? "auto" : "none"}
            cursor={isReleased ? "pointer" : "default"}
            _focus={{ boxShadow: isReleased ? "outline" : "none" }}
            _active={{ bg: isReleased ? undefined : "transparent" }}
            opacity={isReleased ? 1 : 0.8}
            color={isReleased ? "blue.600" : "gray.400"}
            borderColor={isReleased ? "blue.200" : "gray.300"}
          >
            課題を提出
          </Button>

          <Button
            as={isReleased ? RouterLink : "button"}
            to={isReleased ? `/problems/${p.problem_id}/history` : undefined}
            size="sm"
            variant="outline"
            colorScheme="gray"
            flex={1}
            isDisabled={!isReleased}
            pointerEvents={isReleased ? "auto" : "none"}
            cursor={isReleased ? "pointer" : "default"}
            _focus={{ boxShadow: isReleased ? "outline" : "none" }}
            _active={{ bg: isReleased ? undefined : "transparent" }}
            opacity={isReleased ? 1 : 0.8}
            color={isReleased ? "blue.600" : "gray.400"}
            borderColor={isReleased ? "blue.200" : "gray.300"}
          >
            提出履歴
          </Button>
        </Flex>
        {isReleased && p.status !== 'AC' && (
          <CountdownTimer deadlineStr={p.deadline} />
        )}
      </Box>
    );
  };

  if (showEasterEgg) {
    return <EasterEgg userName={userName} onComplete={() => setShowEasterEgg(false)} />;
  }
  return (
    <Container maxW="full" py={12} ml="0">
      <Box bg="white" p={8} borderRadius="2xl" boxShadow="sm" mb={10}>
        <VStack align="start" gap={2}>
          <Heading as="h1" size="2xl" color="gray.800" fontWeight="extrabold">課題進捗状況</Heading>
          <Text fontSize="lg" color="gray.500">
            <Text as="span" fontWeight="bold" color="blue.600">{userName}</Text> さんの現在の状況です。
            ファイトオーなのです!
          </Text>
        </VStack>
      </Box>

      {loading ? (
        <Center h="300px">
          <Spinner size="xl" color="blue.500" thickness="4px" />
        </Center>
      ) : (
        <VStack gap={16} align="stretch">

          {/* 未提出：最上段 */}

          <Box>
            <Flex align="center" mb={6}>
              <Box w="5px" h="30px" bg="gray.400" borderRadius="full" mr={4} />

              <Heading
                size="lg"
                color="gray.700"
                display="flex"
                alignItems="center"
                gap={2}
              >
                <NotebookPen size={28} />
                <span>未提出の課題 ({notSubmitted.length})</span>
              </Heading>
            </Flex>
            <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={8}>
              {notSubmitted.map((p) => <ProblemCard key={p.problem_id} p={p} />)}
            </SimpleGrid>
          </Box>
          {/* WA：中段 */}

          <Box>
            <Flex align="center" mb={6}>
              <Box w="5px" h="30px" bg="red.400" borderRadius="full" mr={4} />

              <Heading
                as="h2"
                size="lg"
                color="gray.700"
                display="flex"
                alignItems="center"
                gap={2}
              >
                <TriangleAlert size={28} />
                <span>再提出が必要な課題 ({waProblems.length})</span>
              </Heading>
            </Flex>
            <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={8}>
              {waProblems.map((p) => <ProblemCard key={p.problem_id} p={p} />)}
            </SimpleGrid>
          </Box>
          {/* AC：最下段 */}

          <Box>
            <Flex align="center" mb={6}>
              {/* 左側の緑色の棒 */}
              <Box w="5px" h="30px" bg="green.400" borderRadius="full" mr={4} />

              <Heading
                size="lg"
                color="gray.700"
                display="flex"
                alignItems="center"
                gap={2}
              >
                <CheckLine size={28} />
                <span>完了した課題 ({acProblems.length})</span>
              </Heading>
            </Flex>
            <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={8}>
              {acProblems.map((p) => <ProblemCard key={p.problem_id} p={p} />)}
            </SimpleGrid>
          </Box>
        </VStack>
      )}
    </Container>
  );
};
export default ProblemList;
