import {
  CheckCircle2,
  FileCheck2,
  FileDiff,
  FlaskConical,
} from 'lucide-react';

import type { DashboardData, DecisionView, TaskBoardItem } from '../../../src/shared/types.ts';
import { Alert, Card, EmptyState, ToneBadge } from './PanelPrimitives.tsx';
import {
  laneLabel,
  laneTone,
  priorityLabel,
  priorityTone,
} from './mission-support.ts';

function artifactTone(value: DashboardData['artifacts'][number]['tone']): string {
  return ({
    info: 'border-slate-800 bg-slate-950/70 text-slate-100',
    success: 'border-emerald-700 bg-emerald-950/70 text-emerald-100',
    warning: 'border-amber-700 bg-amber-950/70 text-amber-100',
  } as Record<string, string>)[value] ?? 'border-slate-800 bg-slate-950/70 text-slate-100';
}

function testTone(value: DashboardData['runReport']['completion']['testsStatus']): string {
  return ({
    passed: 'border-emerald-700 bg-emerald-950/70 text-emerald-100',
    failed: 'border-rose-700 bg-rose-950/70 text-rose-100',
    not_run: 'border-slate-700 bg-slate-900 text-slate-100',
    unknown: 'border-amber-700 bg-amber-950/70 text-amber-100',
  } as Record<string, string>)[value] ?? 'border-slate-700 bg-slate-900 text-slate-100';
}

function TaskChip(props: {
  task: TaskBoardItem;
  onSelect: (taskId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => props.onSelect(props.task.id)}
      className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-left hover:border-slate-700 hover:bg-slate-900"
    >
      <div className="flex flex-wrap items-center gap-2">
        <ToneBadge label={laneLabel(props.task.displayStatus)} className={laneTone(props.task.displayStatus)} />
        <ToneBadge label={priorityLabel(props.task.priority)} className={priorityTone(props.task.priority)} />
      </div>
      <div className="mt-2 text-sm font-medium text-slate-100">{props.task.title}</div>
      {props.task.summary && <div className="mt-1 text-sm text-slate-400 line-clamp-2">{props.task.summary}</div>}
      {props.task.blockedReason && <div className="mt-2 text-xs text-amber-300">Blocked: {props.task.blockedReason}</div>}
    </button>
  );
}

function DecisionCard(props: {
  decision: DecisionView;
  value: string;
  busy: boolean;
  onChange: (value: string) => void;
  onSubmit: (decision: DecisionView, answer: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="text-sm font-semibold text-slate-100">{props.decision.title}</div>
      <div className="mt-1 text-xs text-slate-500">{props.decision.id} • 推奨: {props.decision.recommendedAnswer}</div>
      <div className="mt-4 flex flex-wrap gap-2">
        {props.decision.choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            onClick={() => props.onSubmit(props.decision, choice.answer ?? choice.label)}
            className="rounded-xl border border-slate-800 px-3 py-2 text-sm text-slate-200 hover:border-slate-700 hover:bg-slate-900"
          >
            {choice.label}
          </button>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <input
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
          className="flex-1 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
          placeholder="Custom answer"
        />
        <button
          type="button"
          onClick={() => props.onSubmit(props.decision, props.value)}
          disabled={props.busy}
          className="rounded-2xl border border-sky-700 bg-sky-950 px-4 py-3 text-sm font-medium text-sky-100 hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          回答
        </button>
      </div>
    </div>
  );
}

export function MissionView(props: {
  dashboard: DashboardData;
  errorMessage: string | null;
  decisionInputs: Record<string, string>;
  busyDecisionId?: string;
  onSelectTask: (taskId: string) => void;
  onChangeDecisionInput: (decisionId: string, value: string) => void;
  onSubmitDecision: (decision: DecisionView, answer: string) => void;
  onEditCurrentTask: () => void;
  onCompleteCurrentTask: () => void;
}) {
  const { dashboard } = props;
  const hasRunDetails =
    dashboard.blockedTasks.length > 0
    || dashboard.runReport.completion.pendingItems.length > 0
    || dashboard.blockers.length > 0
    || dashboard.runReport.changedFiles.length > 0
    || dashboard.runReport.testSummary.length > 0
    || dashboard.artifacts.length > 0
    || dashboard.runReport.recentOutputs.length > 0;

  return (
    <div className="space-y-6">
      {dashboard.setupDiagnostics.summary.error > 0 && (
        <Alert
          tone="warning"
          title="セットアップに未解決項目があります"
          message="まずは Setup を開いて path / prompt / agent command を整えてください。"
        />
      )}

      {props.errorMessage && (
        <Alert tone="error" title="dashboard refresh failed" message={props.errorMessage} />
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card
          title="今やること"
          subtitle="最初に見るべき情報だけをここに集めています。"
          actions={dashboard.currentTask && (
            <div className="flex gap-2">
              <button type="button" onClick={props.onEditCurrentTask} className="rounded-xl border border-slate-800 px-3 py-2 text-sm text-slate-300 hover:border-slate-700 hover:bg-slate-900">編集</button>
              <button type="button" onClick={props.onCompleteCurrentTask} className="rounded-xl border border-emerald-700 bg-emerald-950 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-900">完了</button>
            </div>
          )}
        >
          {dashboard.currentTask ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <ToneBadge label={laneLabel(dashboard.currentTask.displayStatus)} className={laneTone(dashboard.currentTask.displayStatus)} />
                <ToneBadge label={priorityLabel(dashboard.currentTask.priority)} className={priorityTone(dashboard.currentTask.priority)} />
                {dashboard.currentTask.agentId && (
                  <ToneBadge label={`agent: ${dashboard.currentTask.agentId}`} className="border-violet-800 bg-violet-950/70 text-violet-100" />
                )}
              </div>

              <div>
                <div className="text-lg font-semibold text-slate-100">{dashboard.currentTask.title}</div>
                {dashboard.currentTask.summary && (
                  <div className="mt-2 whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-slate-300">
                    {dashboard.currentTask.summary}
                  </div>
                )}
              </div>

              {dashboard.currentTask.acceptanceCriteria.length > 0 ? (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">完了条件</div>
                  <ul className="mt-3 space-y-2">
                    {dashboard.currentTask.acceptanceCriteria.map((criterion) => (
                      <li key={criterion} className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <span>{criterion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <Alert tone="warning" title="完了条件が空です" message="ここが空だと完了判断がぶれやすいので、できれば追加してください。" />
              )}
            </div>
          ) : (
            <EmptyState title="Current task がありません" detail="Task を追加するか、blocked task を解消してください。" />
          )}
        </Card>

        <div className="space-y-6">
          {dashboard.pendingDecisions.length > 0 ? (
            <Card title="判断待ち" subtitle="答える必要があるものだけを上に出しています。">
              <div className="space-y-3">
                {dashboard.pendingDecisions.map((decision) => (
                  <DecisionCard
                    key={decision.id}
                    decision={decision}
                    value={props.decisionInputs[decision.id] ?? ''}
                    busy={props.busyDecisionId === decision.id}
                    onChange={(value) => props.onChangeDecisionInput(decision.id, value)}
                    onSubmit={props.onSubmitDecision}
                  />
                ))}
              </div>
            </Card>
          ) : (
            <Card title="判断待ち" subtitle="今は人の判断が止めていません。">
              <EmptyState title="Pending decision はありません" detail="いまは operator judgement を待っていません。" />
            </Card>
          )}

          <Card title="次にやること" subtitle="今の task の次に並んでいるものです。">
            {dashboard.nextTasks.length > 0 ? (
              <div className="space-y-3">
                {dashboard.nextTasks.map((task) => <TaskChip key={task.id} task={task} onSelect={props.onSelectTask} />)}
              </div>
            ) : (
              <EmptyState title="次の task は空です" detail="必要になったら Task 画面で追加できます。" />
            )}
          </Card>
        </div>
      </div>

      {hasRunDetails && (
        <details className="rounded-3xl border border-slate-800 bg-slate-950/75">
          <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-slate-100">
            実行の詳細を開く
          </summary>
          <div className="border-t border-slate-800 p-5">
            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <Card title="止まる理由" subtitle="問題や pending items だけをまとめています。">
                {dashboard.blockedTasks.length > 0 || dashboard.runReport.completion.pendingItems.length > 0 || dashboard.blockers.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard.blockedTasks.map((task) => (
                      <div key={task.id} className="rounded-2xl border border-amber-800 bg-amber-950/50 px-4 py-3">
                        <div className="text-sm font-medium text-amber-100">{task.id} • {task.title}</div>
                        <div className="mt-1 text-sm text-amber-200/90">{task.blockedReason || 'blocked reason is not recorded.'}</div>
                      </div>
                    ))}
                    {dashboard.runReport.completion.pendingItems.map((item) => (
                      <div key={item} className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">{item}</div>
                    ))}
                    {dashboard.blockers.map((blocker) => (
                      <div key={blocker.id} className="rounded-2xl border border-rose-900/60 bg-rose-950/30 px-4 py-3">
                        <div className="text-sm font-medium text-rose-100">{blocker.id}</div>
                        <div className="mt-1 text-sm text-rose-200/90">{blocker.text}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="目立った blocker はありません" detail="今は詳細を確認する必要がない状態です。" />
                )}
              </Card>

              <div className="space-y-6">
                <Card title="証跡" subtitle="変更・テスト・成果物だけを残しています。">
                  <div className="space-y-5">
                    <div className="flex flex-wrap gap-2">
                      <ToneBadge label={`Tests: ${dashboard.runReport.completion.testsStatus}`} className={testTone(dashboard.runReport.completion.testsStatus)} />
                      {dashboard.runReport.lastTurn && (
                        <ToneBadge label={`Last turn: ${dashboard.runReport.lastTurn.outcome}`} className="border-slate-700 bg-slate-900 text-slate-100" />
                      )}
                      <ToneBadge label={`Retries: ${dashboard.runReport.retryCount}/${dashboard.runReport.retryBudget}`} className="border-slate-700 bg-slate-900 text-slate-100" />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        <FileDiff className="h-4 w-4" />
                        Changed Files
                      </div>
                      {dashboard.runReport.changedFiles.length > 0 ? (
                        <div className="space-y-2">
                          {dashboard.runReport.changedFiles.map((file) => (
                            <div key={file} className="rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">{file}</div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500">changed-file evidence はまだありません。</div>
                      )}
                    </div>

                    <div>
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        <FlaskConical className="h-4 w-4" />
                        Test Summary
                      </div>
                      {dashboard.runReport.testSummary.length > 0 ? (
                        <div className="space-y-2">
                          {dashboard.runReport.testSummary.map((line) => (
                            <div key={line} className="rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">{line}</div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500">test execution の痕跡はまだ観測されていません。</div>
                      )}
                    </div>

                    <div>
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        <FileCheck2 className="h-4 w-4" />
                        Artifacts
                      </div>
                      {dashboard.artifacts.length > 0 ? (
                        <div className="space-y-2">
                          {dashboard.artifacts.map((artifact) => (
                            <div key={artifact.id} className={`rounded-2xl border px-3 py-3 ${artifactTone(artifact.tone)}`}>
                              <div className="text-sm font-medium">{artifact.title}</div>
                              <div className="mt-1 text-sm opacity-90">{artifact.summary}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500">artifact はまだありません。</div>
                      )}
                    </div>
                  </div>
                </Card>

                <Card title="直近の出力" subtitle="必要なときだけ開いて確認するログです。">
                  {dashboard.runReport.recentOutputs.length > 0 ? (
                    <div className="space-y-2">
                      {dashboard.runReport.recentOutputs.map((line, index) => (
                        <div key={`${index}-${line}`} className="rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">{line}</div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="Recent output は空です" detail="まだ agent turn が実行されていないか、出力が保存されていません。" />
                  )}
                </Card>
              </div>
            </div>
          </div>
        </details>
      )}
    </div>
  );
}
