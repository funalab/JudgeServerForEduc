// ステータスごとの色設定（背景色、枠線色、ホバー時の色）を統一
export const STATUS_COLORS: Record<string, { bg: string; border: string; hover: string }> = {
  // 完了・AC
  AC: { bg: 'green.50', border: 'green.400', hover: 'green.100' },
  
  // 判定中
  WJ: { bg: 'blue.50', border: 'blue.400', hover: 'blue.100' },
  
  // エラー系 (WA, TLE, RE, CE など)
  WA: { bg: 'red.50', border: 'red.400', hover: 'red.100' },
  CE: { bg: 'red.50', border: 'red.400', hover: 'red.100' },
  RE: { bg: 'red.50', border: 'red.400', hover: 'red.100' },
  TLE: { bg: 'red.50', border: 'red.400', hover: 'red.100' },
  ME: { bg: 'red.50', border: 'red.400', hover: 'red.100' },
  overdue: { bg: 'red.50', border: 'red.400', hover: 'red.100' },
  
  // 未提出・未公開
  not_submitted: { bg: 'white', border: 'gray.200', hover: 'gray.50' },
  not_released: { bg: 'gray.50', border: 'gray.200', hover: 'gray.50' },
};

export const getStatusColor = (status?: string) => {
  if (!status) return STATUS_COLORS['not_submitted'];
  return STATUS_COLORS[status] || STATUS_COLORS['not_submitted'];
};
