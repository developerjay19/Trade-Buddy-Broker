"use client"

import Cookies from 'js-cookie'
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import axios from 'axios'
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { API_BASE_URL } from '@/lib/constants'
export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [verificationEmail, setVerificationEmail] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          user_id: email,
          password: password
        })
      });
    
      if (response.ok) {
        const data = await response.json();
        Cookies.set("access_token", data.payload.access_token);
        Cookies.set("full_name", data.payload.full_name);
        toast({
          title: data?.message,
          description: "Successfully Logged In",
          duration: 5000,
        });
        router.push("/");
      } else {
        const errorData = await response.json();
        toast({
          title: errorData?.message,
          description: errorData?.resolution || "An error occurred",
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: "An error occurred",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
    


  }

  const handleVerifyEmail = async (e) => {
    e.preventDefault()
    setIsVerifying(true)

    try {
      const response = await axios.get(`${API_BASE_URL}/auth/verify_email/send_token/${verificationEmail}`)
      if (response.ok){
        router.push("/")
        toast({
          title: "Email Verification Success",
          description: "Verification email sent successfully",
          duration: 5000,
          })
          setIsVerifying(false)
        }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: error.response?.data?.message || "An error occurred",
        duration: 5000,
      })
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="flex items-center justify-center p-4">
      <Card className="w-full bg-white max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Login to Trade Buddy</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email_id">User Id</Label>
              <Input
                id="email_id"
                type="text"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-blue-900 text-white hover:text-black" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm">
              Don't have an account?{" "}
              <Link href="/registration" className="text-primary hover:underline">
                Register here
              </Link>
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="link" className="text-sm text-primary hover:underline">
                  Verify Email
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-white">
                <DialogHeader>
                  <DialogTitle>Verify Your Email</DialogTitle>
                  <DialogDescription>
                    Enter your email address to receive a verification link.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleVerifyEmail} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="verification_email">Email</Label>
                    <Input
                      id="verification_email"
                      type="email"
                      placeholder="Enter your email"
                      value={verificationEmail}
                      onChange={(e) => setVerificationEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-900 text-white hover:text-black" disabled={isVerifying}>
                    {isVerifying ? "Verifying..." : "Verify Email"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}