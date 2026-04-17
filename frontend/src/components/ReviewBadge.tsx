import { Box, Badge, Flex } from '@chakra-ui/react';

export const ReviewBadge = ({ status, reviewer = "surface" }: any) => {
  const config: Record<string, { color: string }> = {
    'OK': { color: 'green' },
    '要修正': { color: 'red' },
    '修正要': { color: 'red' },
    '確認中': { color: 'blue' },
    '未確認': { color: 'gray' },
  };

  const current = config[status] || config['未確認'];

  return (
    <Badge 
      colorPalette={current.color}
      bg="transparent"
      color="gray.600"
      px={1}
      py={1}
      borderRadius="full"
      fontSize="xs"
      fontWeight="bold"
    >
      <Flex align="center" gap={1.5}>
        <Box boxSize="8px" borderRadius="full" bg={`${current.color}.500`} />
        {reviewer ? `${reviewer} ${status}` : status}
      </Flex>
    </Badge>
  );
};
