// src/components/JudgeResultAccordion.tsx
import React, { useState } from 'react';
import { Box, Text, VStack, Accordion, Button, Flex, Icon } from '@chakra-ui/react';
import axios from 'axios';
import { Download, FileDiff } from 'lucide-react';
import { StatusBadge } from './StatusBadge'

interface JudgeData {
  args: string;
  input: string;
  expected: string;
  output: string;
  status: string;
}

interface JudgeResultResponse {
  status?: string;
  code?: string;
  details: Record<string, JudgeData>;
}

interface Props {
  results: JudgeResultResponse;
  problemId: string;
}

const DiffViewer = ({ expected, output }: { expected: string; output: string }) => {
  const expLines = (expected || "").split('\n');
  const outLines = (output || "").split('\n');
  const maxLines = Math.max(expLines.length, outLines.length);

  return (
    <Box bg="#1E1E1E" p={4} borderRadius="md" overflowX="auto" fontFamily="monospace" fontSize="sm" border="1px solid #333">
      <Text fontSize="xs" fontWeight="bold" color="gray.400" mb={2} borderBottom="1px solid #444" pb={1}>
        <span style={{ color: '#FFA4A4' }}>- 期待される出力 (Expected)</span> / <span style={{ color: '#A4FFA4' }}>+ 実際の出力 (Output)</span>
      </Text>
      {Array.from({ length: maxLines }).map((_, i) => {
        const expLine = expLines[i];
        const outLine = outLines[i];

        if (expLine === outLine) {
          return <Box key={i} px={2} color="gray.500">  {expLine}</Box>;
        }

        return (
          <Box key={i}>
            {expLine !== undefined && (
              <Box bg="rgba(244, 63, 94, 0.15)" color="#FFA4A4" px={2}>- {expLine}</Box>
            )}
            {outLine !== undefined && (
              <Box bg="rgba(16, 185, 129, 0.15)" color="#A4FFA4" px={2}>+ {outLine}</Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};
const TestCaseItem = ({ testName, data, problemId, handleDownload }: any) => {
  const [showDiff, setShowDiff] = useState(false);

  const isAC = data.status === 'AC';
  const isWJ = data.status === 'WJ';
  const bgColor = isAC ? 'green.50' : isWJ ? 'gray.50' : 'red.50';
  const hoverBgColor = isAC ? 'green.100' : isWJ ? 'gray.100' : 'red.100';

  return (
    <Accordion.Item
      value={testName}
      bg="white"
      mb={2}
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      transition="border-color 0.2s"
      color="gray.600"
    >
      <h2>
        <Accordion.ItemTrigger
          bg={bgColor}
          _hover={{ bg: hoverBgColor }}
          _expanded={{ bg: hoverBgColor }}
          borderRadius="md"
          p={4}
          display="flex"
          alignItems="center"
        >
          <Box flex="1" textAlign="left" fontWeight="bold">
            {testName}
          </Box>
          <Box mr={2}>
            <StatusBadge status={data.status} labelOverride={data.status} />
          </Box>
          <Accordion.ItemIndicator />
        </Accordion.ItemTrigger>
      </h2>
      <Accordion.ItemContent pb={4} px={4}>
        <VStack align="stretch" spacing={4} mt={3}>

          {data.args && data.args.trim() !== '' && (
            <Box bg="gray.50" p={2} borderRadius="sm">
              <Text fontSize="xs" fontWeight="bold" color="gray.500">Args</Text>
              <Text fontFamily="monospace" whiteSpace="pre-wrap">{data.args}</Text>
            </Box>
          )}

          <Box bg="gray.50" p={2} borderRadius="sm">
            <Flex justify="space-between" align="center" mb={1}>
              <Text fontSize="xs" fontWeight="bold" color="gray.500">Input</Text>
              <Button
                size="xs"
                px={3}
                bg="gray.50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(testName, problemId, 'input');
                }}
              >
                <Icon as={Download} color="gray.800" boxSize={4} />
              </Button>
            </Flex>
            <Text fontFamily="monospace" whiteSpace="pre-wrap">{data.input}</Text>
          </Box>

          <Flex justify="flex-end" mt={2}>
            <Button
              size="sm"
              variant="outline"
              bg="gray.50"
              colorScheme={showDiff ? "gray" : "blue"}
              onClick={() => setShowDiff(!showDiff)}
            >
              <Icon as={FileDiff} mr={2} boxSize={4} />
              {showDiff ? "通常表示に戻す" : "Expected と Output の Diff を表示"}
            </Button>
          </Flex>

          {showDiff ? (
            <DiffViewer expected={data.expected} output={data.output} />
          ) : (
            <>
              <Box bg="gray.50" p={2} borderRadius="sm">
                <Flex justify="space-between" align="center" mb={1}>
                  <Text fontSize="xs" fontWeight="bold" color="gray.500">Expected</Text>
                  <Button
                    size="xs"
                    px={3}
                    bg="gray.50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(testName, problemId, 'expected');
                    }}
                  >
                    <Icon as={Download} color="gray.800" boxSize={4} />
                  </Button>
                </Flex>
                <Text fontFamily="monospace" whiteSpace="pre-wrap">{data.expected}</Text>
              </Box>
              <Box bg={isAC ? 'green.50' : isWJ ? 'gray.50' : 'red.50'} p={2} borderRadius="sm">
                <Text fontSize="xs" fontWeight="bold" color={isAC ? 'green.600' : isWJ ? 'gray.600' : 'red.600'}>
                  Output
                </Text>
                <Text fontFamily="monospace" whiteSpace="pre-wrap">{data.output}</Text>
              </Box>
            </>
          )}

        </VStack>
      </Accordion.ItemContent>
    </Accordion.Item>
  );
};

// ------------------------------------------------------------------
// メインコンポーネント
// ------------------------------------------------------------------
export const JudgeResultAccordion: React.FC<Props> = ({ results, problemId }) => {
  const details = results?.details || {};

  const handleDownload = async (testName: string, probId: string, type: 'input' | 'expected') => {
    try {
      const res = await axios.get(
        `/api/problems/testcases/${probId}/${testName}/${type}`
      );

      const blob = new Blob([res.data.content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${testName}_${type}.txt`;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`Download failed (${type}):`, error.response?.data || error.message);
      }
      alert(`${type} のダウンロードに失敗しました。`);
    }
  };

  return (
    <Accordion.Root multiple>
      {Object.entries(details).map(([testName, data]) => (
        <TestCaseItem
          key={testName}
          testName={testName}
          data={data}
          problemId={problemId}
          handleDownload={handleDownload}
        />
      ))}
    </Accordion.Root>
  );
};
