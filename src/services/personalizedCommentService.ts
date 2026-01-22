import type { CommunicationType, CommunicationAxisScores, CommunicationScores } from '@/types/analysis';

export async function generatePersonalizedComment(
  type: CommunicationType,
  axisScores: CommunicationAxisScores,
  detailScores: CommunicationScores
): Promise<string> {
  const response = await fetch('/api/personalized-comment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type, axisScores, detailScores }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'コメント生成に失敗しました');
  }

  const data = await response.json();
  return data.comment;
}
