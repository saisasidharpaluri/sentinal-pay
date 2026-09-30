import type { Metadata } from 'next';
import ConsoleWorkspace from '@/components/console/console-workspace';

export const metadata: Metadata = {
  title: 'Live demo | Sentinel Pay',
  description: 'Explore Sentinel Pay payment controls, deterministic guardrails, and human review in an interactive test-rail demo.',
};

export default function ConsolePage() {
  return <ConsoleWorkspace />;
}
