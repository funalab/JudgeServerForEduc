// frontend/src/routes/PublicStatusList.tsx
import React, { useEffect, useState } from 'react';
import {
  Box, Heading, Text, Container, VStack,
  Table, Badge, Spinner, Center, Flex
} from '@chakra-ui/react';
import axios from 'axios';
import { Users } from 'lucide-react';
import { BackLink } from '../components/BackLink';
import { ReviewBadge } from '../components/ReviewBadge'
import { StatusBadge } from '../components/StatusBadge'
import { formatDate } from '../utils/dateUtils'
import { getStatusColor } from '../constants/statusColors';

interface ProblemData {
  status: string;
  deadline: string;
  release_date: string;
  reviewer?: string;
  isReviewed?: string;
  details?: any;
}

interface StudentStatus {
  student_id: string;
  name?: string;
  [key: string]: any;
}

export const PublicStatusList = () => {
  const [statuses, setStatuses] = useState<StudentStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hiddenNames = ['B4'];
    axios.get(`/api/status`)
      .then(res => {
        const filteredStatuses = res.data.filter((student: StudentStatus) => student.name && !hiddenNames.includes(student.name));
        setStatuses(filteredStatuses);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Center h="100vh"><Spinner size="xl" color="blue.500" thickness="4px" /></Center>
  );

  const problemIds = statuses.length > 0
    ? Object.keys(statuses[0])
      .filter(key => key !== 'student_id' && key !== 'name')
      .sort((a, b) => {
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
    <Container maxW="full" px={8} py={12}>

      <BackLink to="/problems" text="課題一覧に戻る" mb={6} />

      <VStack spacing={4} align="start" mb={8} bg="white" p={6} borderRadius="xl" boxShadow="sm">
        <Heading as="h1" size="2xl" color="gray.800" display="flex" alignItems="center" gap={3} mb={2}>
          <Users size={40} />
          <span>みんなの提出状況</span>
        </Heading>
        <Text fontSize="lg" color="gray.500">みんなの課題の進捗状況です！</Text>
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
                <Table.Row key={probId} _hover={{ bg: "gray.50" }}>
                  <Table.Cell
                    position="sticky" left={0} bg="gray.50" textAlign="center"
                    borderRight="2px solid" borderColor="gray.200" py={4}
                  >
                    <Text fontSize="lg" fontWeight="bold" color="gray.700">{probId}</Text>
                    <Badge colorScheme="red" variant="subtle" mt={1} fontSize="2xs" borderRadius="full" px={2}>
                      期限：{formatDate(statuses[0][probId]?.deadline)}
                    </Badge>
                  </Table.Cell>

                  {statuses.map(student => {
                    const data: ProblemData | undefined = student[probId];
                    const styles = getStatusColor(data?.status);
                    const hasData = data && data.status !== 'not_submitted';

                    let acCount = 0;
                    let totalCount = 0;
                    if (data?.details) {
                      try {
                        const detailsObj = typeof data.details === 'string' ? JSON.parse(data.details) : data.details;
                        Object.values(detailsObj).forEach((tc: any) => {
                          if (tc?.status) {
                            totalCount++;
                            if (tc.status === 'AC') acCount++;
                          }
                        });
                      } catch (e) { }
                    }
                    const ratioText = totalCount > 0 ? ` ${acCount}/${totalCount}` : "";

                    return (
                      <Table.Cell
                        key={`${student.student_id}-${probId}`}
                        bg={styles.bg}
                        height="1px"
                        borderBottom="1px solid"
                        borderColor="gray.200"
                        borderRight="1px solid"
                        textAlign="center"
                        p={0}
                      >
                        {hasData ? (
                          <Flex direction="column" align="center" justify="center" h="100%" w="100%" py={4} px={2} bg="transparent">
                            <Box mb={2}>
                              <StatusBadge status={data.status} ratioText={ratioText} />
                            </Box>
                            {/* B3向けなので誰が採点したかは非表示にし、OKか要修正かだけを表示 */}
                            {data.status === 'AC' && (
                              <Box>
                                <ReviewBadge status={data.isReviewed} />
                              </Box>
                            )}
                          </Flex>
                        ) : (
                          <Center h="100%" py={4}><Text color="gray.300" fontWeight="bold">-</Text></Center>
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

export default PublicStatusList;
