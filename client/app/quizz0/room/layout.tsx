// Force dynamic rendering — these pages need client-side socket connections
export const dynamic = 'force-dynamic';

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}