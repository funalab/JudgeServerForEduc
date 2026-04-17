import { Badge, Flex } from '@chakra-ui/react';

export const StatusBadge = ({ status, labelOverride, ratioText = "" }: any) => {
  const config: Record<string, { color: string, label: string }> = {
    AC: { color: 'green', label: 'AC' },
    WA: { color: 'red', label: 'WA' },
    CE: { color: 'red', label: 'CE' },
    TLE: { color: 'red', label: 'TLE' },
    RE: { color: 'red', label: 'RE' },
    ME: { color: 'red', label: 'ME' },
    WJ: { color: 'blue', label: 'WJ' },
    overdue: { color: 'red', label: '期限切れ' },
    not_submitted: { color: 'gray', label: '未提出' },
    not_released: { color: 'gray', label: '未公開' },
  };

  const current = config[status] || config.not_submitted;
  
  const isError = ['WA', 'CE', 'TLE', 'RE', 'ME'].includes(status);

  let displayLabel = labelOverride || current.label;
  let displayRatio = ratioText;

  if (isError && ratioText) {
    // bracketやspaceを削除
    displayLabel = ratioText.replace(/[ ()]/g, '');
    displayRatio = ""; // 元のratioTextは非表示
  }

if (status === 'AC') {
    displayRatio = "";
  }
  return (
    <Badge 
      colorPalette={current.color} 
      variant="surface"
      px={2.5} 
      py={1} 
      borderRadius="full"
      fontSize="xs"
      fontWeight="bold"
    >
      <Flex align="center" gap={1}>
        {displayLabel} {displayRatio}
      </Flex>
    </Badge>
  );
};
