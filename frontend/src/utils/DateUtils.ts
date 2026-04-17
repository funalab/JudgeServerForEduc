// YYYY/MM/DD/HH/mm (in SubmissionHistory, B4SubmissionHistory)
export const formatSubmitTime = (isoString?: string) => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}/${m}/${d} ${h}:${min}`;
};

// MM/DD (in StatusList, PublicStatusList, ProblemList)
export const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${m}/${d}`;
};
