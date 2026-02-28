import { Card, CardHeader } from "@/components/ui/Card";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { AUDIT_LOGS, getStaff } from "@/lib/mock-data";

export default async function AuditPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-white">Audit log</h1>
      <Card>
        <CardHeader>Schedule change history</CardHeader>
        <Table>
          <TableHead>
            <TableRow>
              <Th>Timestamp</Th>
              <Th>User</Th>
              <Th>Action</Th>
              <Th>Entity</Th>
              <Th>Details</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {AUDIT_LOGS.map((a) => {
              const user = getStaff(a.userId);
              return (
                <TableRow key={a.id}>
                  <Td>{new Date(a.timestamp).toLocaleString()}</Td>
                  <Td>{user?.name ?? a.userId}</Td>
                  <Td>{a.action}</Td>
                  <Td>{a.entityType} {a.entityId}</Td>
                  <Td className="text-muted text-xs">
                    {a.after && `after: ${a.after}`}
                    {a.before && ` before: ${a.before}`}
                  </Td>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="mt-4">
          <Button variant="secondary">Export (date range)</Button>
        </div>
      </Card>
    </>
  );
}
