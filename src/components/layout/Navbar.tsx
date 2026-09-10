import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  School,
  ShieldCheck,
} from 'lucide-react';
import Logo from '@/components/common/Logo';
import { INSTITUTION_NAME, SYSTEM_NAME } from '@/data/mockData';

interface PortalLink {
  to: string;
  label: string;
  description: string;
}

const SECURITY_LINKS: PortalLink[] = [
  { to: '/security/degree', label: 'Degree Security', description: 'Verify gate passes at the gate' },
  { to: '/security/junior', label: 'Junior Security', description: 'Register juniors & record exits' },
];

const RECEPTION_LINKS: PortalLink[] = [
  { to: '/reception/degree', label: 'Degree Reception', description: 'Create degree gate passes' },
  { to: '/reception/junior', label: 'Junior Reception', description: 'Create junior gate passes' },
];

function DropdownMenu({
  id,
  label,
  icon: Icon,
  links,
  open,
  onToggle,
}: {
  id: string;
  label: string;
  icon: typeof ShieldCheck;
  links: PortalLink[];
  open: boolean;
  onToggle: () => void;
}) {
  const location = useLocation();
  const active = links.some((link) => location.pathname.startsWith(link.to));

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={onToggle}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 ${
          active ? 'bg-white/[0.07] text-white' : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden />
        {label}
        <ChevronDown aria-hidden className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            id={id}
            className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-white/10 bg-navy-800 p-1.5 shadow-pop"
          >
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2.5 transition ${
                    isActive ? 'bg-blue-500/10 text-white' : 'hover:bg-white/[0.06] text-slate-200'
                  }`
                }
              >
                <span className="block text-sm font-medium">{link.label}</span>
                <span className="mt-0.5 block text-xs text-slate-400">{link.description}</span>
              </NavLink>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState<'security' | 'reception' | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const location = useLocation();

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 ${
      isActive ? 'bg-white/[0.07] text-white' : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
    }`;

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-50 border-b border-white/[0.06] bg-navy-900/85 backdrop-blur-md"
    >
      <nav aria-label="Main navigation" className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900 rounded-lg">
          <Logo className="h-10 w-10" />
          <span className="leading-tight">
            <span className="hidden text-[13px] font-semibold text-white lg:block">{INSTITUTION_NAME}</span>
            <span className="text-[11px] text-slate-400 lg:hidden">CAIAS</span>
            <span className="block text-[11px] font-medium text-blue-300/90">{SYSTEM_NAME}</span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={desktopLinkClass}>
            Home
          </NavLink>
          <DropdownMenu
            id="security-menu"
            label="Security"
            icon={ShieldCheck}
            links={SECURITY_LINKS}
            open={openMenu === 'security'}
            onToggle={() => setOpenMenu((prev) => (prev === 'security' ? null : 'security'))}
          />
          <DropdownMenu
            id="reception-menu"
            label="Reception"
            icon={ClipboardList}
            links={RECEPTION_LINKS}
            open={openMenu === 'reception'}
            onToggle={() => setOpenMenu((prev) => (prev === 'reception' ? null : 'reception'))}
          />
          <NavLink to="/admin" className={desktopLinkClass}>
            <span className="flex items-center gap-1.5">
              <LayoutDashboard className="h-4 w-4" aria-hidden />
              Admin
            </span>
          </NavLink>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="btn-ghost -mr-2 px-3 py-2 md:hidden"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? <XIcon /> : <MenuIcon />}
        </button>
      </nav>

      {/* Mobile navigation */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden border-t border-white/[0.06] bg-navy-900/95 backdrop-blur md:hidden"
          >
            <div className="space-y-5 px-4 py-5">
              <MobileGroup label="Overview">
                <MobileLink to="/" label="Home" icon={School} />
              </MobileGroup>
              <MobileGroup label="Security">
                {SECURITY_LINKS.map((link) => (
                  <MobileLink key={link.to} to={link.to} label={link.label} icon={ShieldCheck} />
                ))}
              </MobileGroup>
              <MobileGroup label="Reception">
                {RECEPTION_LINKS.map((link) => (
                  <MobileLink key={link.to} to={link.to} label={link.label} icon={ClipboardList} />
                ))}
              </MobileGroup>
              <MobileGroup label="Administration">
                <MobileLink to="/admin" label="Admin Dashboard" icon={LayoutDashboard} />
              </MobileGroup>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function MobileGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function MobileLink({ to, label, icon: Icon }: { to: string; label: string; icon: typeof ShieldCheck }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 ${
          isActive ? 'bg-blue-500/10 text-white' : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
        }`
      }
    >
      <Icon className="h-4 w-4 text-slate-400" aria-hidden />
      {label}
    </NavLink>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}
