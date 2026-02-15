'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para login
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Redirecionando...</p>
    </div>
  );
}
