// Components of testcase results in Submission History, B4 Submission History
import React from 'react';
import { Box, Flex, VStack } from '@chakra-ui/react';

interface TestCaseResultsProps {
  details: any;
}

export const TestCaseResults: React.FC<TestCaseResultsProps> = ({ details }) => {
  if (!details) return null;

  return (
    <VStack align="start" gap={1}>
      <Flex gap={1} flexWrap="wrap">
        {Object.entries(details).map(([key, tc]: [string, any]) => {
          if (!key.startsWith('test_')) return null;

          const isAC = tc.status === 'AC';
          return (
            <Box
              key={key}
              fontSize="10px"
              fontWeight="bold"
              px={0}
              w="32px"
              textAlign="center"
              borderRadius="sm"
              bg={isAC ? 'green.100' : 'red.100'}
              color={isAC ? 'green.700' : 'red.700'}
              border="1px solid"
              borderColor={isAC ? 'green.200' : 'red.200'}
            >
              {tc.status}
            </Box>
          );
        })}
      </Flex>
    </VStack>
  );
};
