
'use client';

import { usePathname } from 'next/navigation';
import { SidebarProvider } from './ui/sidebar';
import MainSidebar from './main-sidebar';
import Header from './header';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';

export function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useUser();
  const router = useRouter();

  const isAuthPage = pathname === '/signup';

  if (loading) {
    // You can return a global loading spinner here
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Carregando...</p>
        </div>
    );
  }

  if (isAuthPage) {
    if (user) {
        router.push('/');
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <p>Redirecionando...</p>
            </div>
        );
    }
    return <>{children}</>;
  }
  
  if(!user && !isAuthPage) {
    if (typeof window !== 'undefined') {
        router.push('/signup');
    }
     return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Redirecionando para cadastro...</p>
        </div>
    );
  }

  return (
    <SidebarProvider>
      <MainSidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <Header />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
