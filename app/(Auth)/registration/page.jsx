"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { API_BASE_URL } from '@/lib/constants'

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const  router = useRouter()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.target)
    const data = Object.fromEntries(formData.entries())

    // Convert checkbox value to boolean
    data.trailing_status = formData.get('trailing_status') === 'on'

    console.log(data)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (response.ok) {
        router.push("/login")
        toast({
          title: "Registration successful",
          description: `Check Email and Verifiy the email id and Try to login using Account Id or Email`,
          duration: 5000,
        }) 
      } else {
        toast({
          title: "Registration failed",
          description: `Something went to wrong!`,
          duration: 5000,
        }) 
        console.error('Registration failed')

      }
    } catch (error) {
      console.error('Error during registration:', error)
      // Handle network errors or other exceptions
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center p-4">
      <Card className="w-full bg-white max-w-4xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Register for Trade Buddy</CardTitle>
          <CardDescription className="text-center">Create your account to start trading</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" name="full_name" type="text" placeholder="Enter your Full Name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email_id">Email</Label>
                <Input id="email_id" name="email_id" type="email" placeholder="Enter your email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" placeholder="Enter your password" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_trad_per_day">Max Trades Per Day</Label>
                <Input id="max_trad_per_day" name="max_trad_per_day" type="number" value={5} placeholder="Enter max trades" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base_stoploss">Base Stoploss (%)</Label>
                <Input id="base_stoploss" name="base_stoploss" type="number" value={5} placeholder="Enter base stoploss" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base_target">Base Target (%)</Label>
                <Input id="base_target" name="base_target" type="number" value={10} placeholder="Enter base target" required />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="trailing_status" name="trailing_status" value={true}/>
                <Label htmlFor="trailing_status">Trailing Status</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="trailing_stoploss">Trailing Stoploss (%)</Label>
                <Input id="trailing_stoploss" name="trailing_stoploss" type="number" value={10} placeholder="Enter trailing stoploss" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trailing_target">Trailing Target (%)</Label>
                <Input id="trailing_target" name="trailing_target" type="number" value={10} placeholder="Enter trailing target" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" value={"You are Awsome"} placeholder="Enter description" />
            </div>
            <Button type="submit" className="w-full bg-blue-900 text-white hover:text-black" disabled={isLoading}>
              {isLoading ? "Registering..." : "Register"}
            </Button>
          </form>
          <p className="text-center mt-4 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Login here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}