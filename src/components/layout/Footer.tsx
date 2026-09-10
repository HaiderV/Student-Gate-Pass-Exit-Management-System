import { Link } from 'react-router-dom';
import Logo from '@/components/common/Logo';
import { INSTITUTION_NAME, SYSTEM_NAME } from '@/data/mockData';

const FOOTER_LINKS = [
  { to: '/security/degree', label: 'Degree Security' },
  { to: '/security/junior', label: 'Junior Security' },
  { to: '/reception/degree', label: 'Degree Reception' },
  { to: '/reception/junior', label: 'Junior Reception' },
  { to: '/admin', label: 'Admin' },
];

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/[0.06] bg-navy-950/50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Logo className="h-10 w-10" />
            <div className="leading-tight">
              <p className="text-[13px] font-semibold text-white">{INSTITUTION_NAME}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">{SYSTEM_NAME}</p>
            </div>
          </div>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-xs font-medium text-slate-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 rounded"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-6 flex flex-col gap-2 border-t border-white/[0.05] pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {INSTITUTION_NAME}. Internal campus management software.</p>
          <p>Demo build · Mock data · No login required</p>
        </div>
      </div>
    </footer>
  );
}
