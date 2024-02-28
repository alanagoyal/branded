import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

export function NamesTable({ names }: { names: string[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-center">Names</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {names.map((name, index) => (
          <TableRow key={index}>
            <TableCell>{name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
