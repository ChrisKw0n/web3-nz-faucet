"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { sendEth } from "@/app/actions/faucet-actions"

const formSchema = z.object({
  address: z
    .string()
    .min(1, { message: "Ethereum address is required" })
    .regex(/^0x[a-fA-F0-9]{40}$/, { message: "Invalid Ethereum address format" }),
})

export function FaucetForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    setError(null)
    setTxHash(null)

    try {
      const result = await sendEth(values.address)

      if (result.success) {
        setTxHash(result.txHash!)
        toast({
          title: "ETH sent successfully!",
          description: `Transaction hash: ${result.txHash}`,
        })
        form.reset()
      } else {
        setError(result.error || "Unknown error occurred")
        toast({
          variant: "destructive",
          title: "Failed to send ETH",
          description: result.error,
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
      })
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle>Request Sepolia ETH</CardTitle>
        <CardDescription className="text-gray-400">
          Enter your Ethereum wallet address to receive testnet ETH
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ethereum Address</FormLabel>
                  <FormControl>
                    <Input placeholder="0x..." {...field} className="bg-gray-700 border-gray-600 text-white" />
                  </FormControl>
                  <FormDescription className="text-gray-400">
                    Enter a valid Ethereum address starting with 0x
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <Alert variant="destructive" className="bg-red-900/50 border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {txHash && (
              <Alert className="bg-green-900/50 border-green-800">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Transaction Sent</AlertTitle>
                <AlertDescription>
                  <div className="mt-1">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline break-all"
                    >
                      {txHash}
                    </a>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending ETH...
                </>
              ) : (
                "Request 0.05 ETH"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="text-sm text-gray-400 border-t border-gray-700 pt-4">
        Limited to one request per address every 24 hours
      </CardFooter>
    </Card>
  )
}

