// Force dynamic rendering — these pages need client-side socket connections
export const dynamic = 'force-dynamic';

export default function MatchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}