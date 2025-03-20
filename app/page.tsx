import { FaucetForm } from "@/components/faucet-form"
import { TransactionHistory } from "@/components/transaction-history"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">NZ Web3 Hackathon</h1>
          <h2 className="text-2xl font-semibold mb-2">Sepolia Testnet Faucet</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Request Sepolia ETH for testing and development during the hackathon. Each request provides 0.05 ETH and is
            limited to once per address every 24 hours.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-1">
          <FaucetForm />
          <TransactionHistory />
        </div>

        <footer className="mt-16 text-center text-gray-400 text-sm">
          <p>
            Need help? Contact the hackathon organizers or check the{" "}
            <a
              href="https://github.com/yourusername/ethereum-faucet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:underline"
            >
              GitHub repository
            </a>
          </p>
          <p className="mt-2">Powered by Next.js and Ethers.js</p>
        </footer>
      </div>
    </main>
  )
}

