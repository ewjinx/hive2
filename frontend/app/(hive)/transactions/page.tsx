"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import api from "@/lib/api"
import { format } from "date-fns"

const fetcher = (url: string) => api.get(url).then((res) => res.data)

interface Transaction {
  id: number
  amount: number
  description: string
  timestamp: string
}

export default function TransactionsPage() {
  const { data: transactions, error, isLoading } = useSWR<Transaction[]>("/api/users/me/transactions", fetcher)

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading transactions...</div>
  if (error) return <div className="p-8 text-center text-destructive">Failed to load transactions</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credit History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions && transactions.length > 0 ? (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {format(new Date(tx.timestamp), "MMM dd, yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell className={`text-right font-medium ${tx.amount < 0 ? 'text-destructive' : 'text-green-500'}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount.toFixed(4)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    No transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
