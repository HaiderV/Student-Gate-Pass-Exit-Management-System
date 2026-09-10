import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

/** Fixed decorative background — deep navy with soft blue glows and a faint grid. */
function BackgroundDecor() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden bg-navy-900">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 15% 0%, rgba(37, 99, 235, 0.16), transparent 60%), radial-gradient(50% 40% at 85% 8%, rgba(56, 189, 248, 0.1), transparent 65%), radial-gradient(45% 40% at 50% 100%, rgba(30, 64, 175, 0.12), transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148, 163, 184, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.05) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(75% 55% at 50% 0%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(75% 55% at 50% 0%, black, transparent)',
        }}
      />
    </div>
  );
}

export default function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="relative flex min-h-screen flex-col">
      <BackgroundDecor />
      <Navbar />
      <main className="relative z-10 flex-1">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
        >
          <Outlet />
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
