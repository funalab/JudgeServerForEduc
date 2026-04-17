import React, { useEffect, useState } from 'react';
import {
  Box, Heading, Text, Container, VStack,
  Table, Badge, Spinner, Center, Flex
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { Baby, Search, TriangleAlert, Check } from 'lucide-react';
import { ReviewBadge } from '../components/ReviewBadge'
import { StatusBadge } from '../components/StatusBadge'
import { formatDate } from '../utils/dateUtils'
import { getStatusColor } from '../constants/statusColors';

// --- 型定義 ---
interface ProblemData {
  // status: 'not_submitted' | 'WA' | 'AC';
  status: string; // 'not_submitted' | 'WA' | 'AC' から変更
  deadline: string;
  release_date: string;
  reviewer?: string;
  isReviewed?: string;
  details?: any;
}

interface StudentStatus {
  student_id: string;
  name?: string;
  [key: string]: any;// C1, C2 などの動的な課題IDを許容する設定
}

export const StatusList = () => {
  const [statuses, setStatuses] = useState<StudentStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/status`)
      .then(res => {
        const filteredStatuses = res.data.filter((student: StudentStatus) => student.name !== 'B4');
        setStatuses(filteredStatuses)
      })
      .catch(err =>
        console.error("データの取得に失敗しました", err)
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Center h="100vh"><Spinner size="xl" color="blue.500" thickness="4px" /></Center>
  );

  // 最初の人のデータから課題IDのリストを抽出し、正しい順番にソートする
  const problemIds = statuses.length > 0
    ? Object.keys(statuses[0])
      .filter(key => key !== 'student_id' && key != 'name')
      .sort((a, b) => {
        // 数字の塊を抽出して比較 (C1, C2, C10_1 などに対応)
        const partsA = (a.match(/\d+/g) || []).map(Number);
        const partsB = (b.match(/\d+/g) || []).map(Number);

        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
          const numA = partsA[i] || 0;
          const numB = partsB[i] || 0;
          if (numA !== numB) return numA - numB;
        }
        return 0;
      })
    : [];

  return (
    <Container maxW="container.xl" py={12}>
      <VStack spacing={4} align="start" mb={8} bg="white" p={6} borderRadius="xl" boxShadow="sm">
        <Heading
          as="h1"
          size="2xl"
          color="gray.800"
          display="flex"
          alignItems="center"
          gap={3}
          mb={8}
        >
          <Baby size={40} />
          <span>生徒進捗一覧</span>
        </Heading>
        <Text fontSize="lg" color="gray.500">B4向けの管理画面です。各生徒の課題の提出状況を俯瞰できます。</Text>
      </VStack>

      <Box bg="white" borderRadius="xl" shadow="lg" overflow="hidden" border="1px solid" borderColor="gray.200">
        <Box overflowX="auto">
          <Table.Root variant="simple" size="md">
            <Table.Header bg="gray.800">
              <Table.Row>
                <Table.ColumnHeader color="white" textAlign="center" fontWeight="bold" py={5} fontSize="md" position="sticky" left={0} bg="gray.800" zIndex={1}>
                  課題番号
                </Table.ColumnHeader>
                {statuses.map(student => (
                  <Table.ColumnHeader key={student.name} color="white" textAlign="center" minW="140px" py={5} fontSize="md">
                    {student.name}
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {problemIds.map((probId) => (
                <Table.Row key={probId} _hover={{ bg: "gray.50" }} transition="background 0.2s">
                  {/* 課題名セル */}
                  <Table.Cell
                    position="sticky"
                    left={0}
                    bg="gray.50"
                    textAlign="center"
                    borderRight="2px solid"
                    borderColor="gray.200"
                    boxShadow="2px 0 5px rgba(0,0,0,0.02)"
                    py={4}
                  >
                    <Text fontSize="lg" fontWeight="bold" color="gray.700">{probId}</Text>
                    <Badge colorScheme="red" variant="subtle" mt={1} fontSize="2xs" borderRadius="full" px={2}>
                      期限：{formatDate(statuses[0][probId]?.deadline)}
                    </Badge>
                  </Table.Cell>

                  {/* 各生徒のセル */}
                  {statuses.map(student => {
                    const data: ProblemData | undefined = student[probId];
                    const styles = getStatusColor(data?.status);
                    const isClickable = data && data.status !== 'not_submitted';

                    {/* ACの割合を計算 */ }
                    let acCount = 0;
                    let totalCount = 0;
                    if (data?.details) {
                      try {
                        // 文字列の場合はパース、オブジェクトならそのまま使用
                        const detailsObj = typeof data.details === 'string' ? JSON.parse(data.details) : data.details;
                        const results = Object.values(detailsObj);
                        results.forEach((tc: any) => {
                          if (tc?.status) {
                            totalCount++;
                            if (tc.status === 'AC') acCount++;
                          }
                        });
                      } catch (e) {
                        console.error("Parse error in StatusList:", e);
                      }
                    }
                    const ratioText = totalCount > 0 ? ` ${acCount}/${totalCount}` : "";
                    return (
                      <Table.Cell
                        key={`${student.student_id}-${probId}`}
                        bg={styles.bg}
                        _hover={{ bg: styles.hover }}
                        transition="background-color 0.2s"
                        borderBottom="1px solid"
                        borderColor="gray.200"
                        borderRight="1px solid"
                        textAlign="center"
                        p={0}
                        height="1px"
                      >
                        {isClickable ? (
                          <Flex
                            as={RouterLink}
                            to={`/status/${probId}/${student.student_id}`}
                            direction="column"
                            align="center"
                            justify="center"
                            h="100%"
                            w="100%"
                            py={4}
                            px={2}
                            bg="transparent"
                            transition="all 0.2s"
                            textDecoration="none"
                          >
                            <Box mb={2}>
                              <StatusBadge status={data.status} ratioText={ratioText} />
                            </Box>

                            {/* ACの場合のみ確認ステータスを表示 */}
                            {data.status === 'AC' && (
                              <Box>
                                <ReviewBadge status={data.isReviewed} reviewer={data.reviewer} />
                              </Box>
                            )}
                          </Flex>
                        ) : (
                          <Center h="100%" py={4}>
                            <Text color="gray.300" fontWeight="bold">-</Text>
                          </Center>
                        )}
                      </Table.Cell>
                    );
                  })}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      </Box>
    </Container>
  );
};

export default StatusList;
