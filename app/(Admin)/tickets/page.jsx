'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeftIcon, ArrowRightIcon, Search, SortAsc, SortDesc, MessageCircle, Mail, Calendar, CheckCircle, XCircle, Home } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useRouter } from 'next/navigation'
import { API_BASE_URL } from '@/lib/constants'

export default function TicketDashboardWithOTP() {
  const [isVerified, setIsVerified] = useState(false)
  const [otp, setOtp] = useState('')

  const handleOtpSubmit = (e) => {
    e.preventDefault()
    if (otp === '242425') {
      setIsVerified(true)
      toast.success('OTP verified successfully!')
    } else {
      toast.error('Invalid OTP. Please try again.')
    }
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold mb-6 text-center">Enter Admin Password</h2>
          <form onSubmit={handleOtpSubmit}>
            <Input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit Password"
              className="mb-4 bg-gray-700 text-white border-gray-600"
              maxLength={6}
            />
            <Button type="submit" className="w-full bg-white text-black hover:bg-slate-400 hover:text-gray-900">
              Admin Password
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return <TicketDashboard />
}

function TicketDashboard() {
  const router = useRouter()
  const [tickets, setTickets] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState('id')
  const [sortOrder, setSortOrder] = useState('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterReplied, setFilterReplied] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isTicketOpen, setIsTicketOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [replyMessage, setReplyMessage] = useState('')

  useEffect(() => {
    fetchTickets()
  }, [currentPage, sortBy, sortOrder, searchTerm, filterReplied])

  const fetchTickets = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_HOST}/admin/tickets?page=${currentPage}&sort_by=${sortBy}&sort_order=${sortOrder}&search=${searchTerm}&filter_replied=${filterReplied}&limit=10`)
      if (!response.ok) throw new Error('Failed to fetch tickets')
      const data = await response.json()
      setTickets(data.tickets)
      setTotalPages(data.totalPages)
    } catch (error) {
      toast.error('Failed to fetch tickets')
      console.error('Error fetching tickets:', error)
    }
    setIsLoading(false)
  }

  const handleSort = (field) => {
    if (field === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  const getSortIcon = (field) => {
    if (sortBy === field) {
      return sortOrder === 'asc' ? <SortAsc className="inline-block ml-1 h-4 w-4" /> : <SortDesc className="inline-block ml-1 h-4 w-4" />
    }
    return null
  }

  const openTicket = async (ticket) => {
    try {
      const response = await fetch(`${API_HOST}/admin/tickets/${ticket.id}`)
      if (!response.ok) throw new Error('Failed to fetch ticket details')
      const data = await response.json()
      setSelectedTicket(data)
      setIsTicketOpen(true)
    } catch (error) {
      toast.error('Failed to open ticket')
    }
  }

  const submitReply = async () => {
    if (!selectedTicket) return

    try {
      const response = await fetch(`${API_BASE_URL}/admin/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage })
      })

      if (!response.ok) throw new Error('Failed to submit reply')

      const updatedTicket = await response.json()
      setSelectedTicket(updatedTicket)
      setReplyMessage('')
      toast.success(`Reply submitted for ticket ${selectedTicket.id}`)
      fetchTickets()
      setIsTicketOpen(false)
    } catch (error) {
      toast.error('Failed to submit reply')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-2 sm:p-4 font-mono">
      <ToastContainer position="top-right" theme="dark" />
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg mb-4 sm:mb-6">
          <div className="bg-gray-900 p-2 flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-2 sm:mb-0">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-2 text-base sm:text-lg text-green-400 font-bold">Ticket Management</span>
            </div>
            <div className='flex gap-3'>
              <button onClick={() => router.push("/")} className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
                <Home className="h-5 w-5" />
                <span>Home</span>
              </button>
              <button onClick={() => router.push("/accounts")} className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
                <Home className="h-5 w-5" />
                <span>Account Management</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-800 p-4 rounded-lg mb-4 sm:mb-6">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by ID, Email, or Title"
              className="pl-10 bg-gray-700 text-white border-gray-600 w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={filterReplied} onValueChange={(value) => {
              setFilterReplied(value)
              setCurrentPage(1)
            }}>
              <SelectTrigger className="w-full sm:w-[180px] bg-gray-700 text-white border-gray-600">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickets</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="unreplied">Unreplied</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm md:text-base">
              <thead>
                <tr className="bg-gray-700 text-gray-300">
                  <th className="py-2 px-2 sm:py-3 sm:px-4 text-left cursor-pointer" onClick={() => handleSort('id')}>
                    Ticket ID {getSortIcon('id')}
                  </th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 text-left cursor-pointer" onClick={() => handleSort('email')}>
                    Email {getSortIcon('email')} <Mail className="inline-block ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                  </th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 text-left cursor-pointer" onClick={() => handleSort('title')}>
                    Title {getSortIcon('title')} <MessageCircle className="inline-block ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                  </th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 text-center cursor-pointer" onClick={() => handleSort('datetime')}>
                    Date {getSortIcon('datetime')} <Calendar className="inline-block ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                  </th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 text-center cursor-pointer" onClick={() => handleSort('replied')}>
                    Status {getSortIcon('replied')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">Loading...</td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">No tickets found</td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b border-gray-700 hover:bg-gray-750 cursor-pointer" onClick={() => openTicket(ticket)}>
                      <td className="py-2 px-2 sm:py-3 sm:px-4">{ticket.id}</td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4">{ticket.email}</td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4">{ticket.title}</td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-center">{new Date(ticket.datetime).toLocaleDateString()}</td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-center">
                        {ticket.replied ? (
                          <CheckCircle className="inline-block text-green-500 h-5 w-5" />
                        ) : (
                          <XCircle className="inline-block text-red-500 h-5 w-5" />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-700 px-4 py-3 flex flex-col sm:flex-row items-center justify-between">
            <div className="mb-4 sm:mb-0">
              <p className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700"
                >
                  <span className="sr-only">Previous</span>
                  <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-600 bg-gray-800 text-sm font-medium ${
                      page === currentPage
                        ? 'z-10 bg-green-500 border-green-500 text-white'
                        : 'text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-600  bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700"
                >
                  <span className="sr-only">Next</span>
                  <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isTicketOpen} onOpenChange={setIsTicketOpen}>
        <DialogContent className="bg-gray-800 text-gray-100 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-green-400">Ticket Details</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="mt-4 space-y-4">
              <div>
                <span className="font-bold">Ticket ID:</span> {selectedTicket.id}
              </div>
              <div>
                <span className="font-bold">Email:</span> {selectedTicket.email}
              </div>
              <div>
                <span className="font-bold">Title:</span> {selectedTicket.title}
              </div>
              <div>
                <span className="font-bold">Message:</span>
                <p className="mt-1 bg-gray-700 p-2 rounded">{selectedTicket.message}</p>
              </div>
              <div>
                <span className="font-bold">Submitted:</span> {new Date(selectedTicket.datetime).toLocaleString()}
              </div>
              <div>
                <span className="font-bold">Reply History:</span>
                {selectedTicket.replies && selectedTicket.replies.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {selectedTicket.replies.map((reply) => (
                      <div key={reply.id} className="bg-gray-700 p-2 rounded">
                        <p>{reply.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(reply.datetime).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-gray-400">No replies yet.</p>
                )}
              </div>
              <div>
                <span className="font-bold">New Reply:</span>
                <Textarea
                  className="mt-1 bg-gray-700 text-white border-gray-600"
                  rows={4}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply here..."
                />
              </div>
              <Button onClick={submitReply} className="w-full bg-green-500 hover:bg-green-600">
                Submit Reply
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}