// Force dynamic rendering — these pages need client-side state
export const dynamic = 'force-dynamic';

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}