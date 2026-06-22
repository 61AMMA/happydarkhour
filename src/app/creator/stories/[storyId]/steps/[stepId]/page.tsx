'use client';

// KAN-21 shell — Editor step completo (implementazione in KAN-25 + KAN-26)
import { use } from 'react';
import dynamic from 'next/dynamic';

const StepEditor = dynamic(() => import('@/components/creator/StepEditor'), {
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <div
        className="w-6 h-6 border-2 rounded-full animate-spin"
        style={{ borderColor: '#CC0000', borderTopColor: 'transparent' }}
      />
    </div>
  ),
});

export default function StepEditorPage({
  params,
}: {
  params: Promise<{ storyId: string; stepId: string }>;
}) {
  const { storyId, stepId } = use(params);
  return <StepEditor storyId={storyId} stepId={stepId} />;
}
