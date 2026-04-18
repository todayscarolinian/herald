import { Position, UserProfile } from '@herald/types'

import { columns, CreateButton, DataTable, ImportButton, UserBreadcrumbs } from '@/components/users'

const sample1: Position[] = [
  {
    id: 'uuid-1',
    name: 'Chief Technology Officer',
    abbreviation: 'CTO',
    permissions: [],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 'uuid-2',
    name: 'Writer',
    abbreviation: 'WR',
    permissions: [],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
]

const sample2: Position[] = [
  {
    id: 'uuid-1',
    name: 'Chief Technology Officer',
    abbreviation: 'WE',
    permissions: [],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 'uuid-2',
    name: 'Writer',
    abbreviation: 'RTO',
    permissions: [],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 'uuid-3',
    name: 'Writer',
    abbreviation: 'MED',
    permissions: [],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
]

const sample3: Position[] = [
  {
    id: 'uuid-1',
    name: 'Chief Technology Officer',
    abbreviation: 'OME',
    permissions: [],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
]

function getData(): UserProfile[] {
  return [
    {
      id: '123',
      firstName: 'Test User',
      lastName: 'Doe',
      email: 'Doe@example.com',
      password: 'password',
      positions: sample1,
      emailVerified: true,
      disabled: false,
      createdAt: '01/02/26',
      updatedAt: '01/01/26',
    },
    {
      id: '123',
      firstName: 'Cliff',
      lastName: 'Doe',
      email: 'cliff@example.com',
      password: 'password',
      positions: sample2,
      emailVerified: true,
      disabled: false,
      createdAt: '01/02/26',
      updatedAt: '01/01/26',
    },
    {
      id: '123',
      firstName: 'Andrei',
      lastName: 'Doe',
      email: 'Andrei@example.com',
      password: 'password',
      positions: sample3,
      emailVerified: true,
      disabled: false,
      createdAt: '01/03/26',
      updatedAt: '01/01/26',
    },
    {
      id: '123',
      firstName: 'John Doe',
      lastName: 'Doe',
      email: 'John@example.com',
      password: 'password',
      positions: sample1,
      emailVerified: true,
      disabled: false,
      createdAt: '01/04/26',
      updatedAt: '01/01/26',
    },
    {
      id: '123',
      firstName: 'Jane Doe',
      lastName: 'Doe',
      email: 'Jane@example.com',
      password: 'password',
      positions: sample2,
      emailVerified: true,
      disabled: false,
      createdAt: '01/05/26',
      updatedAt: '01/01/26',
    },
    {
      id: '123',
      firstName: 'Jose Rizal',
      lastName: 'Doe',
      email: 'Jose@example.com',
      password: 'password',
      positions: sample3,
      emailVerified: true,
      disabled: false,
      createdAt: '01/06/26',
      updatedAt: '01/01/26',
    },
    {
      id: '123',
      firstName: 'Leonardo',
      lastName: 'Doe',
      email: 'Leonardo@example.com',
      password: 'password',
      positions: sample1,
      emailVerified: true,
      disabled: false,
      createdAt: '01/07/26',
      updatedAt: '01/01/26',
    },
    {
      id: '123',
      firstName: 'Kalmajun',
      lastName: 'Doe',
      email: 'Kalmajun@example.com',
      password: 'password',
      positions: sample2,
      emailVerified: true,
      disabled: false,
      createdAt: '01/08/26',
      updatedAt: '01/01/26',
    },
    {
      id: '123',
      firstName: 'Cassandra',
      lastName: 'Doe',
      email: 'Cassandra@example.com',
      password: 'password',
      positions: sample3,
      emailVerified: true,
      disabled: false,
      createdAt: '01/09/26',
      updatedAt: '01/01/26',
    },
    {
      id: '123',
      firstName: 'Maui',
      lastName: 'Doe',
      email: 'Maui@example.com',
      password: 'password',
      positions: sample1,
      emailVerified: true,
      disabled: false,
      createdAt: '01/10/26',
      updatedAt: '01/01/26',
    },
    {
      id: '123',
      firstName: 'Beatrix',
      lastName: 'Doe',
      email: 'Beatrix@example.com',
      password: 'password',
      positions: sample2,
      emailVerified: true,
      disabled: false,
      createdAt: '01/11/26',
      updatedAt: '01/01/26',
    },
    {
      id: '123',
      firstName: 'Go',
      lastName: 'Doe',
      email: 'Go@example.com',
      password: 'password',
      positions: sample3,
      emailVerified: true,
      disabled: false,
      createdAt: '01/12/26',
      updatedAt: '01/01/26',
    },
    {
      id: '123',
      firstName: 'Chris',
      lastName: 'Doe',
      email: 'Chris@example.com',
      password: 'password',
      positions: sample1,
      emailVerified: true,
      disabled: false,
      createdAt: '01/13/26',
      updatedAt: '01/01/26',
    },
    {
      id: '123',
      firstName: 'Martis',
      lastName: 'Doe',
      email: 'Martis@example.com',
      password: 'password',
      positions: sample2,
      emailVerified: true,
      disabled: false,
      createdAt: '01/14/26',
      updatedAt: '01/01/26',
    },
    {
      id: '123',
      firstName: 'Mathilda',
      lastName: 'Doe',
      email: 'Mathilda@example.com',
      password: 'password',
      positions: sample3,
      emailVerified: true,
      disabled: false,
      createdAt: '01/15/26',
      updatedAt: '01/01/26',
    },
    {
      id: '123',
      firstName: 'Marxa',
      lastName: 'Doe',
      email: 'Marxa@example.com',
      password: 'password',
      positions: sample1,
      emailVerified: true,
      disabled: false,
      createdAt: '01/16/26',
      updatedAt: '01/01/26',
    },
  ]
}

export default async function DemoPage() {
  const data = getData()

  return (
    <div className="flex w-full max-w-none flex-col p-6 pb-0">
      <UserBreadcrumbs />

      <div className="flex w-full items-center justify-between p-2 pl-4">
        <span className="text-2xl font-extrabold">Users</span>
        <div className="text-muted-foreground flex gap-2 text-sm">
          <ImportButton />
          <CreateButton />
        </div>
      </div>

      <div className="h-full w-full rounded-lg">
        <DataTable<UserProfile, unknown> columns={columns} data={data} />
      </div>
    </div>
  )
}
