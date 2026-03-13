export async function runMockAgent(prompt: string, iteration: number): Promise<string> {
  const lines: string[] = [];

  if (iteration === 1) {
    lines.push('[[STATUS]] demo mode: supervisor と panel の初期実装を進めています');
    lines.push('[[QUESTION]] staging と production のどちらを優先すべきですか？未回答でも Web panel 実装は続行します。');
    lines.push('[[STATUS]] 質問を投げましたが、回答待ちで停止せず panel 実装を継続します');
    return `${lines.join('\n')}\n`;
  }

  if (prompt.includes('Q-001:') || prompt.includes('staging を優先')) {
    lines.push('[[STATUS]] 回答を受領したため設定優先度を更新します');
    lines.push('[[DONE]] demo mode: 質問回答の prompt 注入を確認できたので完了します');
    return `${lines.join('\n')}\n`;
  }

  lines.push('[[STATUS]] まだ回答は届いていません。返答待ちにせず、実装とテストを続行しています');
  if (iteration === 2) {
    lines.push('[[BLOCKER]] Discord token が未設定なら通知確認は Web panel と logs で代替してください');
  }

  return `${lines.join('\n')}\n`;
}
