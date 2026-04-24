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

  if (isLoading) return (
    <div className="p-12 text-center text-muted-foreground">
      <div className="animate-pulse text-4xl mb-4">💳</div>
      <p className="font-medium">Loading transactions...</p>
    </div>
  )
  if (error) return <div className="p-12 text-center text-destructive font-semibold">Failed to load transactions</div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading mb-1">Transactions</h1>
        <p className="text-muted-foreground text-sm">View your credit history and spending</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">Credit History</CardTitle>
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
                    <TableCell className="font-medium">{tx.description}</TableCell>
                    <TableCell className={`text-right font-bold font-mono ${tx.amount < 0 ? 'text-destructive' : 'text-green-600'}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount.toFixed(4)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                    <div className="text-3xl mb-2">📊</div>
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
