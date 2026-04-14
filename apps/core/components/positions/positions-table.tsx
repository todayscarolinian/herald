import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export type Position = {
  id: string
  name: string
  abbreviation: string
  userCount: number
  createdOn: string
}

interface Props {
  positions: Position[]
}

export function PositionsTable({ positions }: Props) {
  return (
    <div className="rounded-none border">
      <Table>
        <TableHeader>
          <TableRow className="bg-tc_grayscale-100">
            <TableHead className="text-tc_grayscale-900 px-4 py-2 text-xs font-semibold">
              Name
            </TableHead>
            <TableHead className="text-tc_grayscale-900 px-4 py-2 text-xs font-semibold">
              Abbreviation
            </TableHead>
            <TableHead className="text-tc_grayscale-900 px-4 py-2 text-xs font-semibold">
              User Count
            </TableHead>
            <TableHead className="text-tc_grayscale-900 px-4 py-2 text-xs font-semibold">
              Created On
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {positions.map((position) => (
            <TableRow
              key={position.id}
              className="hover:bg-muted/50 text-tc_grayscale-900 cursor-pointer bg-white text-base"
            >
              <TableCell className="px-4 py-[18px] font-medium">{position.name}</TableCell>

              <TableCell className="px-4 py-[18px]">{position.abbreviation}</TableCell>

              <TableCell className="px-4 py-[18px]">{position.userCount}</TableCell>

              <TableCell className="px-4 py-[18px]">{position.createdOn}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
