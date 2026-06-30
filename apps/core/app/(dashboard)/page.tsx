'use client'

import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  Shield,
  UserRound,
  UsersRound,
} from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAuthHealth } from '@/lib/api/queries/authQueries'

const linkButtonBase =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

const primaryLinkButton = `${linkButtonBase} bg-tc_primary-500 text-tc_white shadow-lg shadow-tc_primary-500/20 hover:bg-tc_primary-600`
const secondaryLinkButton = `${linkButtonBase} border border-tc_grayscale-300 bg-tc_white text-tc_black hover:bg-tc_grayscale-100 dark:border-white/10 dark:bg-white/5 dark:text-tc_white dark:hover:bg-white/10`
const ghostLinkButton = `${linkButtonBase} px-0 text-tc_primary-600 hover:bg-transparent hover:text-tc_primary-700 dark:text-tc_primary-300 dark:hover:text-tc_primary-200`

const summaryCards = [
  {
    label: 'Users under management',
    value: '148',
    detail: '12 added in the last 30 days',
    icon: UserRound,
  },
  {
    label: 'Active positions',
    value: '18',
    detail: '6 positions can manage Herald',
    icon: UsersRound,
  },
  {
    label: 'Permission groups',
    value: '26',
    detail: 'Across Herald, TC Official Website, and USC Days',
    icon: Shield,
  },
  {
    label: 'Audit events today',
    value: '31',
    detail: 'Most activity involves user and role updates',
    icon: FileText,
  },
]

const accessCards = [
  {
    title: 'Users',
    description: 'Manage accounts, invite new people, and keep credentials in sync.',
    href: '/users',
    icon: UserRound,
    accent: 'from-tc_primary-500/20 via-tc_warning-500/10 to-transparent',
    points: ['Create and update accounts', 'Bulk import changes', 'Inspect user details'],
  },
  {
    title: 'Positions',
    description: 'Organize access by role and align each position with the right permissions.',
    href: '/positions',
    icon: UsersRound,
    accent: 'from-tc_success-500/20 via-tc_secondary-300 to-transparent',
    points: ['Define role scopes', 'Review assigned users', 'Import role updates'],
  },
  {
    title: 'Permissions',
    description:
      'Browse the permission catalog and understand which domains each capability covers.',
    href: '/permissions',
    icon: Shield,
    accent: 'from-tc_info-500/20 via-tc_secondary-300 to-transparent',
    points: ['Inspect capability domains', 'Map permissions to roles', 'Audit access coverage'],
  },
  {
    title: 'Audit Logs',
    description: 'Track recent changes and review who changed what, when, and why.',
    href: '/audit-logs',
    icon: FileText,
    accent: 'from-tc_error-500/20 via-tc_secondary-300 to-transparent',
    points: ['Review recent actions', 'Trace account changes', 'Spot unusual activity'],
  },
]

const activityItems = [
  {
    title: 'Position updated',
    detail: 'Managing Editor for Administration received a new permission bundle.',
    time: '2 minutes ago',
    tone: 'bg-tc_success-500/15 text-tc_success-700 dark:text-tc_success-400',
  },
  {
    title: 'New user imported',
    detail: '4 accounts were added from CSV and assigned starter positions.',
    time: '18 minutes ago',
    tone: 'bg-tc_info-500/15 text-tc_info-700 dark:text-tc_info-400',
  },
  {
    title: 'Permission catalog reviewed',
    detail: 'Herald permissions were checked against the TC Official Website set.',
    time: '1 hour ago',
    tone: 'bg-tc_warning-500/15 text-tc_warning-700 dark:text-tc_warning-400',
  },
]

export default function Home() {
  const { data: healthData } = useAuthHealth()

  const health = healthData?.data
  const isHealthy = healthData?.success && health?.status === 'ok'
  const serviceLabel = health?.service ?? 'Auth service'
  const serviceVersion = health?.version ?? 'unknown'
  const lastChecked = health?.timestamp
    ? new Date(health.timestamp).toLocaleString()
    : 'Waiting for health check'

  return (
    <main className="text-tc_black dark:text-tc_white flex w-full min-w-0 flex-col gap-8 py-6 pr-6">
      <div className="border-tc_grayscale-300 bg-[linear-gradient(135deg,theme(colors.tc_secondary-300),theme(colors.tc_white),theme(colors.tc_grayscale-100))] relative overflow-hidden rounded-3xl border p-6 shadow-sm sm:p-8 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02),rgba(255,255,255,0.06))]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(192,45,45,0.12),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(3,151,254,0.1),transparent_30%)]" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8">
          <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            <Card className="border-tc_grayscale-300 bg-tc_white/90 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
              <CardHeader className="space-y-4 pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={isHealthy ? 'secondary' : 'destructive'} className="gap-1.5 px-3">
                    {isHealthy ? (
                      <CheckCircle2 className="size-3.5" />
                    ) : (
                      <CircleAlert className="size-3.5" />
                    )}
                    {isHealthy ? 'All systems ready' : 'Health check needs attention'}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-tc_grayscale-300 px-3 dark:border-white/10"
                  >
                    {serviceLabel} v{serviceVersion}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <p className="text-tc_primary-600 dark:text-tc_primary-300 font-[family-name:var(--font-roboto-condensed)] text-sm font-semibold tracking-[0.28em] uppercase">
                    Herald Dashboard
                  </p>
                  <CardTitle className="max-w-2xl text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
                    Identity control center for users, roles, permissions, and audit history.
                  </CardTitle>
                  <CardDescription className="text-tc_grayscale-800 dark:text-tc_grayscale-300 max-w-2xl text-base leading-7">
                    Start here to understand account health, jump into the main management areas,
                    and keep access changes traceable across the Herald system.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="pt-8">
                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/users" className={primaryLinkButton}>
                    Manage users
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link href="/audit-logs" className={secondaryLinkButton}>
                    Review audit logs
                  </Link>
                  <p className="text-tc_grayscale-700 dark:text-tc_grayscale-400 text-sm">
                    Last checked: {lastChecked}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-tc_grayscale-300 bg-tc_white/90 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle>System snapshot</CardTitle>
                <CardDescription>
                  Quick operational context for the current session.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="border-tc_grayscale-300 bg-tc_grayscale-100 rounded-xl border p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-tc_grayscale-700 dark:text-tc_grayscale-400 text-sm">
                      Service status
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {isHealthy ? 'Healthy' : 'Attention needed'}
                    </p>
                    <p className="text-tc_grayscale-800 dark:text-tc_grayscale-300 mt-1 text-sm">
                      {serviceLabel}
                    </p>
                  </div>
                  <div className="border-tc_grayscale-300 bg-tc_grayscale-100 rounded-xl border p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-tc_grayscale-700 dark:text-tc_grayscale-400 text-sm">
                      Version
                    </p>
                    <p className="mt-1 text-lg font-semibold">{serviceVersion}</p>
                    <p className="text-tc_grayscale-800 dark:text-tc_grayscale-300 mt-1 text-sm">
                      Shared SSO session across TC apps
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="text-tc_grayscale-800 dark:text-tc_grayscale-200 flex items-center gap-2 text-sm font-medium">
                    <Clock3 className="text-tc_primary-600 dark:text-tc_primary-300 size-4" />
                    Recent check-in
                  </div>
                  <p className="text-tc_grayscale-800 dark:text-tc_grayscale-300 text-sm leading-6">
                    Use this dashboard to verify access changes, spot stale roles, and jump directly
                    into the management surface that needs attention.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => {
              const Icon = card.icon

              return (
                <Card
                  key={card.label}
                  className="border-tc_grayscale-300 bg-tc_white/90 backdrop-blur-sm dark:border-white/10 dark:bg-white/5"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-3">
                      <CardDescription className="text-tc_grayscale-700 dark:text-tc_grayscale-400 text-sm font-medium">
                        {card.label}
                      </CardDescription>
                      <div className="bg-tc_primary-500/10 text-tc_primary-600 dark:text-tc_primary-300 rounded-full p-2">
                        <Icon className="size-4" />
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-semibold tracking-tight">
                      {card.value}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-tc_grayscale-800 dark:text-tc_grayscale-300 text-sm leading-6">
                      {card.detail}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-tc_grayscale-300 bg-tc_white/90 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle>Access management</CardTitle>
                <CardDescription>
                  Fast entry points to the parts of Herald people use most often.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-2">
                {accessCards.map((item) => {
                  const Icon = item.icon

                  return (
                    <Card
                      key={item.title}
                      size="sm"
                      className="border-tc_grayscale-300 bg-tc_grayscale-100 shadow-none dark:border-white/10 dark:bg-white/5"
                    >
                      <CardHeader className="pb-3">
                        <div className={`w-fit rounded-xl bg-gradient-to-br ${item.accent} p-3`}>
                          <Icon className="text-tc_black dark:text-tc_white size-5" />
                        </div>
                        <CardTitle className="pt-2 text-xl">{item.title}</CardTitle>
                        <CardDescription className="leading-6">{item.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ul className="text-tc_grayscale-800 dark:text-tc_grayscale-300 space-y-2 text-sm">
                          {item.points.map((point) => (
                            <li key={point} className="flex items-start gap-2">
                              <span className="bg-tc_primary-500 mt-2 size-1.5 rounded-full" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                        <Link href={item.href} className={`${secondaryLinkButton  } w-fit`}>
                          Open {item.title}
                          <ArrowRight className="size-4" />
                        </Link>
                      </CardContent>
                    </Card>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="border-tc_grayscale-300 bg-tc_white/90 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>
                  Latest changes surfaced as a simple operational feed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activityItems.map((item, index) => (
                  <div key={item.title} className="space-y-4">
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${item.tone}`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-tc_black dark:text-tc_white font-medium">
                            {item.title}
                          </p>
                          <span className="text-tc_grayscale-700 dark:text-tc_grayscale-400 text-xs">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-tc_grayscale-800 dark:text-tc_grayscale-300 text-sm leading-6">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                    {index < activityItems.length - 1 ? <Separator /> : null}
                  </div>
                ))}

                <div className="border-tc_grayscale-300 bg-tc_grayscale-100 rounded-xl border border-dashed p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-tc_black dark:text-tc_white font-medium">
                    Need deeper investigation?
                  </p>
                  <p className="text-tc_grayscale-800 dark:text-tc_grayscale-300 mt-1 text-sm leading-6">
                    Open the audit log page to trace account changes and confirm which role or
                    permission update triggered the event.
                  </p>
                  <Link href="/audit-logs" className={`${ghostLinkButton  } mt-3`}>
                    Go to audit logs
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  )
}
