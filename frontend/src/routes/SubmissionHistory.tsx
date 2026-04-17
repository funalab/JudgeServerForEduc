import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box, Heading, Table,
  Button, Container, Spinner, Text,
} from '@chakra-ui/react';
import axios from 'axios';
import '../App.css'
// 一覧に戻るボタン
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

export const SubmissionHistory = () => {
  const { problem_id } = useParams<{ problem_id: string }>();
  const [history, setHistory] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/submission/${problem_id}/history`)
      .then(res => {
        setHistory(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [problem_id]);

  if (loading) return <Spinner />;

  return (
    <Container maxW="container.lg" py={10}>
      <BackLink to="/problems" text="課題一覧に戻る" />

      <Heading mb={6} color="gray.800">提出履歴: {problem_id}</Heading>

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
                {/* --- 1. テストケースごとの判定を表示 (Object.entriesを使用) --- */}
                <Table.Cell>
                  <TestCaseResults details={sub.details} />
                </Table.Cell>
                {/* --- 2. 詳細ボタン --- */}
                <Table.Cell>
                  <Button
                    as={RouterLink}
                    to={`/problems/${problem_id}?submission_id=${sub.id}`}
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
export default SubmissionHistory;
