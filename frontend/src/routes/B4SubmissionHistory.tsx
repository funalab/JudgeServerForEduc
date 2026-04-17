// frontend/src/routes/B4SubmissionHistory.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box, Heading, Table,
  Button, Container, Spinner, VStack, Flex
} from '@chakra-ui/react';
import axios from 'axios';
import '../App.css'
import { BackLink } from '../components/BackLink';
import { TestCaseResults } from '../components/TestCaseResults';
import { formatSubmitTime } from '../utils/dateUtils';

interface Submission {
  id: number;
  status: string;
  code: string;
  details: any;
  submit_time?: string,
}

export const B4SubmissionHistory = () => {
  const { problem_id, student_id } = useParams<{ problem_id: string, student_id: string }>();
  const [history, setHistory] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/status/${problem_id}/${student_id}/history`)
      .then(res => {
        setHistory(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
    ;
  }, [problem_id, student_id]);

  if (loading) return <Spinner />;

  return (
    <Container maxW="container.lg" py={10}>
      <BackLink to={`/status/${problem_id}/${student_id}`} text="生徒の詳細画面に戻る" />

      <Heading mb={6} color="gray.800">提出履歴: {student_id} - {problem_id}</Heading>

      <Box bg="white" p={6} borderRadius="xl" boxShadow="md" overflowX="auto">
        <Table.Root variant="line">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>提出時間</Table.ColumnHeader>
              <Table.ColumnHeader>各テストケースの判定結果</Table.ColumnHeader>
              <Table.ColumnHeader>詳細</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {history.map((sub) => (
              <Table.Row key={sub.id}>
                <Table.Cell color="gray.800">{formatSubmitTime(sub.submit_time)}</Table.Cell>
                <Table.Cell>
                  <TestCaseResults details={sub.details} />
                </Table.Cell>
                <Table.Cell>
                  <Button
                    as={RouterLink}
                    to={`/status/${problem_id}/${student_id}?submission_id=${sub.id}`}
                    size="sm"
                    variant="outline"
                    colorPalette="blue"
                  >
                    表示
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
    </Container>
  );
};
export default B4SubmissionHistory;
