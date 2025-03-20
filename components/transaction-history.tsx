"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getRecentTransactions } from "@/app/actions/faucet-actions"
import { formatDistanceToNow } from "date-fns"

type Transaction = {
  id: string
  address: string
  txHash: string
  amount: string
  timestamp: number
}

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTransactions() {
      try {
        const recentTxs = await getRecentTransactions()
        setTransactions(recentTxs)
      } catch (error) {
        console.error("Failed to load transactions:", error)
      } finally {
        setLoading(false)
      }
    }

    loadTransactions()

    // Refresh every 30 seconds
    const interval = setInterval(loadTransactions, 30000)
    return () => clearInterval(interval)
  }, [])

  function truncateAddress(address: string) {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  function truncateTxHash(hash: string) {
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription className="text-gray-400">Latest Sepolia ETH distributions from the faucet</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-gray-400">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-4 text-gray-400">No transactions yet</div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div key={tx.id} className="border-b border-gray-700 pb-3 last:border-0">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <a
                      href={`https://sepolia.etherscan.io/address/${tx.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 font-medium"
                    >
                      {truncateAddress(tx.address)}
                    </a>
                  </div>
                  <div className="text-sm text-gray-400">{formatDistanceToNow(tx.timestamp, { addSuffix: true })}</div>
                </div>
                <div className="flex justify-between items-center">
                  <a
                    href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-400 hover:text-gray-300"
                  >
                    {truncateTxHash(tx.txHash)}
                  </a>
                  <div className="text-green-400 font-medium">{tx.amount} ETH</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

