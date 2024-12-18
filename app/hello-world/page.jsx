"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, User, Send, Code } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ContactPage() {
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/help_message_send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, title:subject, message }),
      })

      if (response.ok) {
        toast({
          title: "Message sent",
          description: "We've received your message and will get back to you soon.",
        })
        setEmail("")
        setSubject("")
        setMessage("")
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem sending your message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gradient-to-br from-purple-100 to-blue-100 min-h-screen">
      <h1 className="text-4xl font-bold text-center mb-8 text-purple-800">Contact Us</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="bg-white shadow-lg">
          <CardHeader className="bg-purple-600 text-white">
            <CardTitle className="flex items-center"><User className="mr-2" /> Basic Details</CardTitle>
            <CardDescription className="text-purple-100">You can reach us using the following information:</CardDescription>
          </CardHeader>
          <CardContent className="mt-4">
            <p className="flex items-center mb-2"><Mail className="mr-2 text-purple-600" /> <strong>Email:</strong> developer.jay19@gmail.com</p>
            <p className="flex items-center"><User className="mr-2 text-purple-600" /> <strong>Name:</strong> Jay Patel AKA NJ </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-lg">
          <CardHeader className="bg-blue-600 text-white">
            <CardTitle className="flex items-center"><Send className="mr-2" /> Send us a message</CardTitle>
            <CardDescription className="text-blue-100">Fill out this form and we'll get back to you as soon as possible.</CardDescription>
          </CardHeader>
          <CardContent className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input 
                placeholder="Your Email" 
                type="email" 
                required 
                className="border-blue-300 focus:border-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input 
                placeholder="Subject" 
                required 
                className="border-blue-300 focus:border-blue-500"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <Textarea 
                placeholder="Your Message" 
                required 
                className="border-blue-300 focus:border-blue-500"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-8 bg-white shadow-lg">
        <CardHeader className="bg-green-600 text-white">
          <CardTitle className="flex items-center"><Code className="mr-2" /> Our APIs</CardTitle>
          <CardDescription className="text-green-100">Explore our powerful APIs to integrate with our services.</CardDescription>
          <a href={"${API_BASE_URL}/docs"} className="text-white hover:underline mt-2 inline-block">Learn more</a>
        </CardHeader>
        <CardContent className="mt-4">
          <ul className="space-y-4">
            {[
              { icon: User, title: "User Management API", description: "Manage user accounts and authentication.", link: "${API_BASE_URL}/docs" },
            ].map((api, index) => (
              <li key={index} className="bg-gray-100 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <api.icon className="mr-2 text-green-600" />
                  <strong className="text-lg text-green-800">{api.title}</strong>
                </div>
                <p className="text-gray-600 mb-2">{api.description}</p>
                <div className="bg-gray-200 p-2 rounded text-sm font-mono">
                  GET {api.link}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}