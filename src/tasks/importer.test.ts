import assert from 'node:assert/strict';
import test from 'node:test';

import { parseTasksFromSpecText } from './importer.ts';

test('parseTasksFromSpecText reads PRD-style JSON payloads into drafts', () => {
  const preview = parseTasksFromSpecText(JSON.stringify({
    userStories: [
      {
        id: 'US-001',
        title: 'ログイン画面を追加する',
        acceptanceCriteria: ['メールアドレスでログインできる', '失敗時にエラーを出す'],
        notes: '認証APIと接続する',
      },
      {
        title: '通知設定を保存する',
        description: 'ユーザーごとに設定を保持する',
      },
    ],
  }));

  assert.equal(preview.format, 'json');
  assert.equal(preview.drafts.length, 2);
  assert.equal(preview.drafts[0]?.title, 'ログイン画面を追加する');
  assert.equal(preview.drafts[0]?.notes, '認証APIと接続する');
  assert.deepEqual(preview.drafts[0]?.acceptanceCriteria, [
    'メールアドレスでログインできる',
    '失敗時にエラーを出す',
  ]);
});

test('parseTasksFromSpecText extracts list items, nested acceptance criteria, and duplicate groups', () => {
  const preview = parseTasksFromSpecText(`
## 認証
- ログインAPIを追加する
  - メールアドレスとパスワードで認証できる
  - 失敗時に 401 を返す
- ログインAPIを追加する
  - 重複候補
- セッションを保持する
  JWT の有効期限を更新する
  - 失効済みトークンを拒否する
`);

  assert.equal(preview.format, 'list');
  assert.equal(preview.drafts.length, 3);
  assert.equal(preview.drafts[0]?.title, 'ログインAPIを追加する');
  assert.equal(preview.drafts[0]?.summary, '認証');
  assert.deepEqual(preview.drafts[0]?.acceptanceCriteria, [
    'メールアドレスとパスワードで認証できる',
    '失敗時に 401 を返す',
  ]);
  assert.equal(preview.duplicateGroups.length, 1);
  assert.deepEqual(preview.duplicateGroups[0]?.indexes, [0, 1]);
});

test('parseTasksFromSpecText suggests splits for long heading-style items', () => {
  const preview = parseTasksFromSpecText(`
# Ralph Loop v1

## Panel を整理する
Current task card と next-up queue と blocker card と artifact card と setup wizard を 1 画面で監督しやすくする。さらに import preview と dedupe merge と split suggestion を入れる。
`);

  assert.equal(preview.format, 'headings');
  assert.equal(preview.drafts.length, 1);
  assert.equal(preview.drafts[0]?.title, 'Panel を整理する');
  assert.ok(preview.splitSuggestions.length >= 1);
  assert.ok(preview.splitSuggestions[0]?.suggestions.length >= 2);
});
