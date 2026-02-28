import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { SWAP_REQUESTS, getShift, getStaff, getShiftsForStaff } from "@/lib/mock-data";

interface PageProps {
  searchParams: Promise<{ role?: string; userId?: string }>;
}

export default async function SwapRequestsPage({ searchParams }: PageProps) {
  const { role, userId } = await searchParams;
  const isManager = role === "manager";
  const myRequests = userId
    ? SWAP_REQUESTS.filter((r) => r.requesterId === userId)
    : [];
  const pendingForManager = isManager ? SWAP_REQUESTS.filter((r) => r.status === "pending") : [];

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-white">Swap / Drop requests</h1>
      {isManager ? (
        <Card>
          <CardHeader>Pending approval</CardHeader>
          <Table>
            <TableHead>
              <TableRow>
                <Th>Type</Th>
                <Th>Shift</Th>
                <Th>Requester</Th>
                <Th>Target</Th>
                <Th>Status</Th>
                <Th className="w-32">Action</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingForManager.map((r) => {
                const shift = getShift(r.shiftId);
                const requester = getStaff(r.requesterId);
                const target = r.targetStaffId ? getStaff(r.targetStaffId) : null;
                return (
                  <TableRow key={r.id}>
                    <Td>{r.type}</Td>
                    <Td>{shift ? `${shift.date} ${shift.startTime}–${shift.endTime}` : r.shiftId}</Td>
                    <Td>{requester?.name ?? r.requesterId}</Td>
                    <Td>{target?.name ?? (r.type === "drop" ? "—" : "—")}</Td>
                    <Td><Badge variant="warning">{r.status}</Badge></Td>
                    <Td>
                      <Button size="sm" className="mr-2">Approve</Button>
                      <Button variant="secondary" size="sm">Reject</Button>
                    </Td>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>My requests</CardHeader>
            <Table>
              <TableHead>
                <TableRow>
                  <Th>Type</Th>
                  <Th>Shift</Th>
                  <Th>Status</Th>
                  <Th className="w-24">Action</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {myRequests.map((r) => {
                  const shift = getShift(r.shiftId);
                  return (
                    <TableRow key={r.id}>
                      <Td>{r.type}</Td>
                      <Td>{shift ? `${shift.date} ${shift.startTime}–${shift.endTime}` : r.shiftId}</Td>
                      <Td><Badge variant={r.status === "pending" ? "warning" : "muted"}>{r.status}</Badge></Td>
                      <Td>{r.status === "pending" && <Button variant="ghost" size="sm">Cancel</Button>}</Td>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
          <div className="mt-4">
            <Button>Request swap / Drop shift</Button>
          </div>
        </>
      )}
    </>
  );
}
