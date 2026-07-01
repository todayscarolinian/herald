'use client'

import type { AuditLogDTO, DashboardStatsDTO } from '@herald/types'
import {
  AlertCircle,
  ArrowRight,
  ChevronRight,
  FileText,
  LogIn,
  LogOut,
  type LucideIcon,
  Mail,
  Plus,
  RefreshCw,
  Shield,
  TrendingUp,
  UserMinus,
  UserPlus,
  UserRound,
  UsersRound,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/shared'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardStats } from '@/lib/api/queries/dashboardQueries'
import { useSession } from '@/lib/auth-client'
import { formatRelativeTime } from '@/lib/utils'

type AccessRow = {
  title: string
  description: string
  href: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  count: string
  unit: string
}

function buildAccessRows(stats: DashboardStatsDTO | undefined): AccessRow[] {
  return [
    {
      title: 'Users',
      description: 'Manage accounts, invites, and access',
      href: '/users',
      icon: UsersRound,
      iconBg: 'bg-tc_primary-500/10',
      iconColor: 'text-tc_primary-600 dark:text-tc_primary-400',
      count: stats ? stats.totalUsers.toLocaleString('en-US') : '—',
      unit: 'accounts',
    },
    {
      title: 'Positions',
      description: 'Editorial roles and assignments',
      href: '/positions',
      icon: UserRound,
      iconBg: 'bg-tc_info-500/10',
      iconColor: 'text-tc_info-600 dark:text-tc_info-400',
      count: stats ? stats.totalPositions.toLocaleString('en-US') : '—',
      unit: 'roles',
    },
    {
      title: 'Permissions',
      description: 'Groups and access policies',
      href: '/permissions',
      icon: Shield,
      iconBg: 'bg-tc_success-500/10',
      iconColor: 'text-tc_success-600 dark:text-tc_success-400',
      count: stats ? stats.totalPermissions.toLocaleString('en-US') : '—',
      unit: 'groups',
    },
    {
      title: 'Audit Logs',
      description: 'Full record of system activity',
      href: '/audit-logs',
      icon: FileText,
      iconBg: 'bg-tc_warning-500/10',
      iconColor: 'text-tc_warning-600 dark:text-tc_warning-400',
      count: stats ? stats.totalAuditLogs.toLocaleString('en-US') : '—',
      unit: 'events',
    },
  ]
}

type ActivityDisplay = {
  icon: LucideIcon
  iconBg: string
  iconColor: string
  message: string
  badge: string
}

function getActorName(log: AuditLogDTO): string {
  if (log.target?.type === 'user') {
    return `${log.target.data.firstName} ${log.target.data.lastName}`
  }
  if (log.performer) {
    return `${log.performer.firstName} ${log.performer.lastName}`
  }
  return 'Unknown user'
}

function getPositionName(log: AuditLogDTO): string {
  return log.target?.type === 'position' ? log.target.data.name : 'a position'
}

function getActivityDisplay(log: AuditLogDTO): ActivityDisplay {
  const actor = getActorName(log)

  switch (log.action) {
    case 'USER_CREATED':
      return {
        icon: UserPlus,
        iconBg: 'bg-tc_success-500/10',
        iconColor: 'text-tc_success-600 dark:text-tc_success-400',
        message: `Account created for ${actor}`,
        badge: 'User created',
      }
    case 'USER_UPDATED':
      return {
        icon: UserRound,
        iconBg: 'bg-tc_info-500/10',
        iconColor: 'text-tc_info-600 dark:text-tc_info-400',
        message: `${actor} profile was updated`,
        badge: 'User updated',
      }
    case 'USER_POSITIONS_CHANGED':
      return {
        icon: UserRound,
        iconBg: 'bg-tc_info-500/10',
        iconColor: 'text-tc_info-600 dark:text-tc_info-400',
        message: `${actor} positions were updated`,
        badge: 'Role change',
      }
    case 'USER_DISABLED':
      return {
        icon: UserMinus,
        iconBg: 'bg-tc_error-500/10',
        iconColor: 'text-tc_error-600 dark:text-tc_error-400',
        message: `${actor} was deactivated`,
        badge: 'User removed',
      }
    case 'USER_DELETED':
      return {
        icon: UserMinus,
        iconBg: 'bg-tc_error-500/10',
        iconColor: 'text-tc_error-600 dark:text-tc_error-400',
        message: `${actor} was removed`,
        badge: 'User removed',
      }
    case 'USER_LOGIN_SUCCESS':
      return {
        icon: LogIn,
        iconBg: 'bg-tc_info-500/10',
        iconColor: 'text-tc_info-600 dark:text-tc_info-400',
        message: `${actor} signed in`,
        badge: 'Login',
      }
    case 'USER_LOGIN_FAILED':
      return {
        icon: AlertCircle,
        iconBg: 'bg-tc_error-500/10',
        iconColor: 'text-tc_error-600 dark:text-tc_error-400',
        message: `Failed login attempt · ${actor}`,
        badge: 'Security',
      }
    case 'USER_LOGOUT':
      return {
        icon: LogOut,
        iconBg: 'bg-tc_info-500/10',
        iconColor: 'text-tc_info-600 dark:text-tc_info-400',
        message: `${actor} signed out`,
        badge: 'Logout',
      }
    case 'USER_PASSWORD_RESET_REQUESTED':
      return {
        icon: Mail,
        iconBg: 'bg-tc_warning-500/10',
        iconColor: 'text-tc_warning-600 dark:text-tc_warning-400',
        message: `${actor} requested a password reset`,
        badge: 'Security',
      }
    case 'USER_PASSWORD_RESET_COMPLETED':
      return {
        icon: Shield,
        iconBg: 'bg-tc_success-500/10',
        iconColor: 'text-tc_success-600 dark:text-tc_success-400',
        message: `${actor} completed a password reset`,
        badge: 'Security',
      }
    case 'USER_SESSION_REVOKED':
      return {
        icon: AlertCircle,
        iconBg: 'bg-tc_warning-500/10',
        iconColor: 'text-tc_warning-600 dark:text-tc_warning-400',
        message: `${actor}'s session was revoked`,
        badge: 'Security',
      }
    case 'POSITION_CREATED':
      return {
        icon: Shield,
        iconBg: 'bg-tc_info-500/10',
        iconColor: 'text-tc_info-600 dark:text-tc_info-400',
        message: `Position "${getPositionName(log)}" was created`,
        badge: 'Position',
      }
    case 'POSITION_UPDATED':
      return {
        icon: Shield,
        iconBg: 'bg-tc_info-500/10',
        iconColor: 'text-tc_info-600 dark:text-tc_info-400',
        message: `Position "${getPositionName(log)}" was updated`,
        badge: 'Position',
      }
    case 'POSITION_DELETED':
      return {
        icon: UserMinus,
        iconBg: 'bg-tc_error-500/10',
        iconColor: 'text-tc_error-600 dark:text-tc_error-400',
        message: `Position "${getPositionName(log)}" was deleted`,
        badge: 'Position',
      }
    case 'POSITION_PERMISSIONS_CHANGED':
      return {
        icon: Shield,
        iconBg: 'bg-tc_info-500/10',
        iconColor: 'text-tc_info-600 dark:text-tc_info-400',
        message: `Permissions updated for "${getPositionName(log)}"`,
        badge: 'Position',
      }
    default:
      return {
        icon: FileText,
        iconBg: 'bg-tc_grayscale-200 dark:bg-white/10',
        iconColor: 'text-tc_grayscale-600 dark:text-tc_grayscale-400',
        message: actor,
        badge: log.action,
      }
  }
}

function formatSignedDelta(value: number): string {
  return value > 0 ? `+${value}` : `${value}`
}

export default function Home() {
  const { data: session } = useSession()
  const { data: stats, isFetching, isError, error, refetch, dataUpdatedAt } = useDashboardStats()

  useEffect(() => {
    if (isError && error) {
      toast.error(error.message)
    }
  }, [isError, error])

  const user = session?.user
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  const now = new Date()
  const hours = now.getHours()
  const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const accessRows = buildAccessRows(stats)
  const failedLoginsDelta = stats ? stats.failedLogins24h - stats.failedLoginsPrevious24h : 0
  const deltaColorClasses =
    failedLoginsDelta > 0
      ? 'bg-tc_error-500/10 text-tc_error-600 dark:text-tc_error-400'
      : 'bg-tc_success-500/10 text-tc_success-600 dark:text-tc_success-400'

  return (
    <main className="text-tc_black dark:text-tc_white flex min-h-screen w-full min-w-0 flex-col">
      <PageHeader title="Dashboard" />

      {/* Content */}
      <div className="flex flex-1 flex-col gap-7 p-8 pb-10">
        {/* Welcome */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-tc_black dark:text-tc_white text-[26px] font-bold tracking-tight">
              {greeting}, {firstName}
            </span>
            <span className="text-tc_grayscale-600 dark:text-tc_grayscale-400 font-roboto-condensed text-[14px] font-semibold tracking-[0.04em] uppercase">
              {dateStr}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-tc_grayscale-700 dark:text-tc_grayscale-400 flex items-center gap-2 text-[12.5px]">
              {stats && (
                <span>Updated {formatRelativeTime(new Date(dataUpdatedAt).toISOString())}</span>
              )}
              <button
                type="button"
                onClick={() => void refetch()}
                disabled={isFetching}
                aria-label="Refresh dashboard data"
                className="border-tc_grayscale-300 text-tc_grayscale-800 dark:text-tc_grayscale-400 hover:bg-tc_grayscale-100 inline-flex size-8 flex-none items-center justify-center rounded-lg border transition-colors disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/10"
              >
                <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <Link
              href="/positions"
              className="border-tc_grayscale-300 bg-tc_white text-tc_black dark:text-tc_white hover:bg-tc_grayscale-100 inline-flex h-9 items-center gap-2 rounded-lg border px-4 text-sm font-medium dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <Plus className="size-4" />
              New position
            </Link>
            <Link
              href="/users"
              className="bg-tc_primary-500 hover:bg-tc_primary-600 inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium text-white transition-colors"
            >
              <UserPlus className="size-4" />
              Create user
            </Link>
          </div>
        </div>

        {/* Notice strip */}
        {stats && stats.unverifiedUsersCount > 0 && (
          <div className="border-tc_grayscale-200 bg-tc_warning-500/5 dark:bg-tc_warning-500/10 border-l-tc_primary-500 flex items-center gap-3.5 rounded-[10px] border border-l-4 px-[18px] py-3.5 shadow-sm dark:border-white/10">
            <span className="text-tc_primary-600 dark:text-tc_primary-400 font-roboto-condensed flex-none text-[12px] font-bold tracking-[0.12em] uppercase">
              Notice
            </span>
            <p className="text-tc_grayscale-800 dark:text-tc_grayscale-200 flex-1 text-[14.5px]">
              <strong className="text-tc_black dark:text-tc_white">
                {stats.unverifiedUsersCount} account{stats.unverifiedUsersCount === 1 ? '' : 's'}
              </strong>{' '}
              {stats.unverifiedUsersCount === 1 ? 'has' : 'have'} not verified their email address.
            </p>
            <Link
              href="/users"
              className="text-tc_primary-600 dark:text-tc_primary-400 flex-none text-[13px] font-semibold hover:underline"
            >
              Review →
            </Link>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
          {/* Total users */}
          <div className="border-tc_grayscale-200 bg-tc_white flex flex-col gap-3.5 rounded-[14px] border p-[22px] shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-tc_grayscale-600 dark:text-tc_grayscale-400 font-roboto-condensed text-[12px] font-bold tracking-[0.12em] uppercase">
                Total users
              </span>
              <span className="bg-tc_primary-500/10 text-tc_primary-600 dark:text-tc_primary-400 flex size-[34px] flex-none items-center justify-center rounded-[9px]">
                <UsersRound className="size-[19px]" />
              </span>
            </div>
            {!stats ? (
              <Skeleton className="h-[42px] w-20" />
            ) : (
              <span className="text-tc_black dark:text-tc_white text-[42px] leading-none font-extrabold tracking-tight">
                {stats.totalUsers.toLocaleString('en-US')}
              </span>
            )}
            {stats && (
              <div className="flex items-center gap-2">
                <span className="bg-tc_success-500/10 text-tc_success-600 dark:text-tc_success-400 inline-flex h-[22px] items-center gap-1 rounded-full px-2 text-[12px] font-bold">
                  {formatSignedDelta(stats.newUsersThisMonth)}
                </span>
                <span className="text-tc_grayscale-600 dark:text-tc_grayscale-400 text-[12.5px]">
                  new this month
                </span>
              </div>
            )}
          </div>

          {/* Logins (30 days) */}
          <div className="border-tc_grayscale-200 bg-tc_white flex flex-col gap-3.5 rounded-[14px] border p-[22px] shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-tc_grayscale-600 dark:text-tc_grayscale-400 font-roboto-condensed text-[12px] font-bold tracking-[0.12em] uppercase">
                Logins (30 days)
              </span>
              <span className="bg-tc_success-500/10 text-tc_success-600 dark:text-tc_success-400 flex size-[34px] flex-none items-center justify-center rounded-[9px]">
                <TrendingUp className="size-[19px]" />
              </span>
            </div>
            {!stats ? (
              <Skeleton className="h-[42px] w-20" />
            ) : (
              <span className="text-tc_black dark:text-tc_white text-[42px] leading-none font-extrabold tracking-tight">
                {stats.logins30Days.toLocaleString('en-US')}
              </span>
            )}
            {stats && (
              <span className="text-tc_grayscale-600 dark:text-tc_grayscale-400 text-[12.5px]">
                successful logins in the last 30 days
              </span>
            )}
          </div>

          {/* Unverified accounts */}
          <div className="border-tc_grayscale-200 bg-tc_white flex flex-col gap-3.5 rounded-[14px] border p-[22px] shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-tc_grayscale-600 dark:text-tc_grayscale-400 font-roboto-condensed text-[12px] font-bold tracking-[0.12em] uppercase">
                Unverified accounts
              </span>
              <span className="bg-tc_warning-500/10 text-tc_warning-600 dark:text-tc_warning-400 flex size-[34px] flex-none items-center justify-center rounded-[9px]">
                <Mail className="size-[19px]" />
              </span>
            </div>
            {!stats ? (
              <Skeleton className="h-[42px] w-20" />
            ) : (
              <span className="text-tc_black dark:text-tc_white text-[42px] leading-none font-extrabold tracking-tight">
                {stats.unverifiedUsersCount.toLocaleString('en-US')}
              </span>
            )}
            {stats && (
              <span className="text-tc_grayscale-600 dark:text-tc_grayscale-400 text-[12.5px]">
                awaiting email verification
              </span>
            )}
          </div>

          {/* Failed logins */}
          <div className="border-tc_grayscale-200 bg-tc_white flex flex-col gap-3.5 rounded-[14px] border p-[22px] shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-tc_grayscale-600 dark:text-tc_grayscale-400 font-roboto-condensed text-[12px] font-bold tracking-[0.12em] uppercase">
                Failed logins (24h)
              </span>
              <span className="bg-tc_error-500/10 text-tc_error-600 dark:text-tc_error-400 flex size-[34px] flex-none items-center justify-center rounded-[9px]">
                <AlertCircle className="size-[19px]" />
              </span>
            </div>
            {!stats ? (
              <Skeleton className="h-[42px] w-20" />
            ) : (
              <span className="text-tc_black dark:text-tc_white text-[42px] leading-none font-extrabold tracking-tight">
                {stats.failedLogins24h.toLocaleString('en-US')}
              </span>
            )}
            {stats && (
              <div className="flex items-center gap-2">
                <span
                  className={`${deltaColorClasses} inline-flex h-[22px] items-center gap-1 rounded-full px-2 text-[12px] font-bold`}
                >
                  {formatSignedDelta(failedLoginsDelta)}
                </span>
                <span className="text-tc_grayscale-600 dark:text-tc_grayscale-400 text-[12.5px]">
                  vs yesterday
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Two-column: Access management + Activity */}
        <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
          {/* Access management */}
          <div className="border-tc_grayscale-200 bg-tc_white overflow-hidden rounded-[14px] border shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="border-tc_grayscale-200 flex flex-col gap-0.5 border-b px-6 py-5 dark:border-white/10">
              <span className="text-tc_primary-600 dark:text-tc_primary-400 font-roboto-condensed text-[11px] font-bold tracking-[0.14em] uppercase">
                Quick access
              </span>
              <span className="text-tc_black dark:text-tc_white text-[19px] font-bold tracking-tight">
                Access management
              </span>
            </div>

            {accessRows.map((row, i) => {
              const Icon = row.icon
              return (
                <Link
                  key={row.href}
                  href={row.href}
                  className={`group hover:bg-tc_grayscale-100 flex items-center gap-4 px-6 py-[18px] transition-colors dark:hover:bg-white/5${i < accessRows.length - 1 ? 'border-tc_grayscale-200 border-b dark:border-white/10' : ''}`}
                >
                  <span
                    className={`${row.iconBg} ${row.iconColor} flex size-[42px] flex-none items-center justify-center rounded-[10px]`}
                  >
                    <Icon className="size-[22px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-tc_black dark:text-tc_white text-[15.5px] font-semibold">
                      {row.title}
                    </p>
                    <p className="text-tc_grayscale-600 dark:text-tc_grayscale-400 text-[13px]">
                      {row.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-tc_black dark:text-tc_white text-[17px] font-bold">
                      {row.count}
                    </p>
                    <p className="text-tc_grayscale-600 dark:text-tc_grayscale-400 font-roboto-condensed text-[11px] font-semibold tracking-[0.06em] uppercase">
                      {row.unit}
                    </p>
                  </div>
                  <ChevronRight className="text-tc_grayscale-400 dark:text-tc_grayscale-600 size-5 flex-none" />
                </Link>
              )
            })}
          </div>

          {/* Recent activity */}
          <div className="border-tc_grayscale-200 bg-tc_white flex flex-col overflow-hidden rounded-[14px] border shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="border-tc_grayscale-200 flex items-center justify-between border-b px-6 py-5 dark:border-white/10">
              <div className="flex flex-col gap-0.5">
                <span className="text-tc_primary-600 dark:text-tc_primary-400 font-roboto-condensed text-[11px] font-bold tracking-[0.14em] uppercase">
                  Operations
                </span>
                <span className="text-tc_black dark:text-tc_white text-[19px] font-bold tracking-tight">
                  Recent activity
                </span>
              </div>
            </div>

            <div className="flex flex-col">
              {!stats &&
                Array.from({ length: 5 }, (_, i) => `activity-skeleton-${i}`).map((key) => (
                  <div key={key} className="flex gap-[13px] px-6 py-[15px]">
                    <Skeleton className="size-8 flex-none rounded-[9px]" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}

              {stats && stats.recentActivity.length === 0 && (
                <p className="text-tc_grayscale-600 dark:text-tc_grayscale-400 px-6 py-[15px] text-[13.5px]">
                  No recent activity.
                </p>
              )}

              {stats &&
                stats.recentActivity.map((log, i) => {
                  const display = getActivityDisplay(log)
                  const Icon = display.icon
                  return (
                    <div key={log.id}>
                      <div className="flex gap-[13px] px-6 py-[15px]">
                        <span
                          className={`${display.iconBg} ${display.iconColor} flex size-8 flex-none items-center justify-center rounded-[9px]`}
                        >
                          <Icon className="size-[18px]" />
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <p className="text-tc_grayscale-800 dark:text-tc_grayscale-200 text-[13.5px] leading-snug">
                            {display.message}
                          </p>
                          <div className="flex items-center gap-2">
                            <span
                              className={`${display.iconBg} text-tc_grayscale-700 dark:text-tc_grayscale-400 font-roboto-condensed rounded px-1.5 py-0.5 text-[10.5px] font-bold tracking-[0.08em] uppercase dark:bg-white/10`}
                            >
                              {display.badge}
                            </span>
                            <span className="text-tc_grayscale-500 font-roboto-condensed text-[12px] font-semibold tracking-[0.04em]">
                              {formatRelativeTime(log.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {i < stats.recentActivity.length - 1 && <Separator />}
                    </div>
                  )
                })}
            </div>

            <Link
              href="/audit-logs"
              className="border-tc_grayscale-200 text-tc_primary-600 dark:text-tc_primary-400 hover:bg-tc_grayscale-100 mt-auto flex items-center justify-center gap-1.5 border-t px-4 py-[15px] text-[13px] font-semibold transition-colors dark:border-white/10 dark:hover:bg-white/5"
            >
              View all activity
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
