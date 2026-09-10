import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Logo from '@/components/common/Logo';
import { INSTITUTION_NAME, SYSTEM_NAME } from '@/data/mockData';

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
};

const WORKFLOW_STEPS = [
  {
    icon: ClipboardList,
    title: 'Reception creates the pass',
    description: 'The physical teacher permission is verified, then a digital gate pass is issued.',
  },
  {
    icon: ShieldCheck,
    title: 'Security verifies at the gate',
    description: 'The watchman searches the student and checks the active pass in seconds.',
  },
  {
    icon: FileText,
    title: 'Exit recorded digitally',
    description: 'The student is marked as exited and every record stays organized.',
  },
];

const FEATURES = [
  {
    icon: ClipboardList,
    title: 'Gate Pass Management',
    description: 'Create and manage student gate passes for both degree and junior students.',
  },
  {
    icon: ShieldCheck,
    title: 'Quick Verification',
    description: 'Security can quickly find students and verify their permission to leave.',
  },
  {
    icon: Users,
    title: 'Junior Student Management',
    description: 'Manage junior student numbers and exit records with automatic numbering.',
  },
  {
    icon: FileText,
    title: 'Digital Records',
    description: 'Maintain organized gate-pass and exit records across the campus.',
  },
];

const PORTALS = [
  {
    to: '/security/degree',
    icon: ShieldCheck,
    title: 'Degree Security',
    description: 'Verify degree gate passes and record exits at the gate.',
  },
  {
    to: '/security/junior',
    icon: ShieldCheck,
    title: 'Junior Security',
    description: 'Register juniors, record exits and verify early-exit passes.',
  },
  {
    to: '/reception/degree',
    icon: ClipboardList,
    title: 'Degree Reception',
    description: 'Verify teacher permission and create degree gate passes.',
  },
  {
    to: '/reception/junior',
    icon: ClipboardList,
    title: 'Junior Reception',
    description: 'Create early-exit gate passes for junior students.',
  },
  {
    to: '/admin',
    icon: LayoutDashboard,
    title: 'Admin Dashboard',
    description: 'Campus-wide statistics and recent activity overview.',
  },
];

export default function LandingPage() {
  return (
    <div className="space-y-16 sm:space-y-20">
      {/* Hero */}
      <motion.section
        variants={container}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center pt-8 text-center sm:pt-14"
      >
        <motion.p
          variants={fadeUp}
          className="chip px-3.5 py-2 text-xs font-semibold text-blue-200"
        >
          <GraduationCap className="h-3.5 w-3.5" aria-hidden />
          {INSTITUTION_NAME}
        </motion.p>

        <motion.h1
          variants={fadeUp}
          className="mt-6 max-w-3xl font-display text-4xl font-extrabold leading-[1.12] text-white sm:text-5xl lg:text-[3.5rem]"
        >
          Student Exit{' '}
          <span className="bg-gradient-to-r from-blue-400 to-sky-300 bg-clip-text text-transparent">
            Management System
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mt-5 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg"
        >
          A simple digital system for managing student exits, gate passes and security records at{' '}
          {INSTITUTION_NAME}.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Link to="/security/degree" className="btn-primary px-6 py-3">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Security Portal
          </Link>
          <Link to="/reception/degree" className="btn-secondary px-6 py-3">
            <ClipboardList className="h-4 w-4" aria-hidden />
            Reception Portal
          </Link>
          <Link to="/admin" className="btn-ghost px-6 py-3">
            <LayoutDashboard className="h-4 w-4" aria-hidden />
            Admin Dashboard
          </Link>
        </motion.div>

        <motion.div variants={fadeUp} className="mt-6 flex flex-wrap justify-center gap-2">
          <span className="chip">No login required</span>
          <span className="chip">Role-based portals</span>
          <span className="chip">Instant digital records</span>
        </motion.div>
      </motion.section>

      {/* Workflow */}
      <motion.section
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300/90">Workflow</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold text-white sm:text-3xl">
            From permission to gate, in three steps
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-[15px]">
            The system follows the college's existing exit process — nothing changes for students and
            teachers except the paperwork.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3 sm:gap-6">
          {WORKFLOW_STEPS.map((step, index) => (
            <motion.article
              key={step.title}
              variants={fadeUp}
              className="relative rounded-xl border border-white/[0.07] bg-navy-800/60 p-6 shadow-card"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300 ring-1 ring-blue-400/20">
                  <step.icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="chip">Step {index + 1}</span>
              </div>
              <h3 className="mt-4 font-display text-base font-bold text-white">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{step.description}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>

      {/* Portals */}
      <motion.section
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300/90">Portals</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold text-white sm:text-3xl">
            Choose a portal to get started
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-[15px]">
            Each role gets a focused view — reception issues passes, security verifies exits, admin
            oversees everything.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          {PORTALS.map((portal) => (
            <motion.div key={portal.to} variants={fadeUp}>
              <Link
                to={portal.to}
                className="group flex h-full flex-col rounded-xl border border-white/[0.07] bg-navy-800/60 p-6 shadow-card transition hover:border-blue-400/30 hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300 ring-1 ring-blue-400/20">
                  <portal.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-base font-bold text-white">{portal.title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-400">{portal.description}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-300 transition group-hover:gap-2.5">
                  Open portal
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Features */}
      <motion.section
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300/90">Features</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold text-white sm:text-3xl">
            Built for the campus gate
          </h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
          {FEATURES.map((feature) => (
            <motion.article
              key={feature.title}
              variants={fadeUp}
              className="rounded-xl border border-white/[0.07] bg-navy-800/60 p-6 shadow-card transition hover:border-white/[0.12]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-500/10 text-sky-300 ring-1 ring-sky-400/20">
                <feature.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-display text-[15px] font-bold text-white">{feature.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{feature.description}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>

      {/* Brand strip */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.07] bg-navy-800/50 px-6 py-10 text-center shadow-card"
      >
        <Logo className="h-12 w-12" />
        <div>
          <p className="font-display text-lg font-bold text-white">{INSTITUTION_NAME}</p>
          <p className="mt-1 text-sm text-slate-400">{SYSTEM_NAME} · Internal campus software</p>
        </div>
        <Link to="/security/degree" className="btn-primary mt-2">
          Open the Security Portal
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </motion.section>
    </div>
  );
}
