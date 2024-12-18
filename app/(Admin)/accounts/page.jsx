'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeftIcon, ArrowRightIcon, Search, SortAsc, SortDesc, BarChart2, DollarSign, TrendingUp, CheckCircle, XCircle, Activity, Percent, Home } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useRouter } from 'next/navigation'
import { API_BASE_URL } from '../utils/constants'

export default function AccountDashboardWithOTP() {
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

  return <AccountDashboard />
}

function AccountDashboard() {
  const router = useRouter()
  const [accounts, setAccounts] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState('full_name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAccounts()
  }, [currentPage, sortBy, sortOrder, searchTerm])

  const fetchAccounts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/admin/accounts?page=${currentPage}&sortBy=${sortBy}&sortOrder=${sortOrder}&search=${searchTerm}`)
      if (!response.ok) throw new Error('Failed to fetch accounts')
      const data = await response.json()
      const processedAccounts = data.accounts.map((account) => ({
        ...account,
        growth: calculateGrowth(account.total_amount, account.balance),
        win_ratio: calculateWinRatio(account.positive_trades, account.total_trades)
      }))
      setAccounts(processedAccounts)
      setTotalPages(data.totalPages)
    } catch (error) {
      toast.error('Failed to fetch accounts', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
      console.error('Error fetching accounts:', error)
    }
    setIsLoading(false)
  }

  const calculateGrowth = (totalAmount, balance) => {
    if (balance === 0) return 0
    return ((totalAmount - balance) / balance) * 100
  }

  const calculateWinRatio = (positiveTrades, totalTrades) => {
    if (totalTrades === 0) return 0
    return (positiveTrades / totalTrades) * 100
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

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-2 sm:p-4 font-mono">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg mb-4 sm:mb-6">
          <div className="bg-gray-900 p-2 flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-2 sm:mb-0">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-2 text-base sm:text-lg text-green-400 font-bold">Account Management</span>
            </div>
            <div className='flex gap-3'>
              <button onClick={() => router.push("/")} className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
                <Home className="h-5 w-5" />
                <span>Home</span>
              </button>
              <button onClick={() => router.push("/tickets")} className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
                <Home className="h-5 w-5" />
                <span>Help Desk</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-800 p-4 rounded-lg mb-4 sm:mb-6">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by Account ID"
              className="pl-10 bg-gray-700 text-white border-gray-600 w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select onValueChange={(value) => handleSort(value)}>
              <SelectTrigger className="w-full sm:w-[180px] bg-gray-700 text-white border-gray-600">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="balance">Balance</SelectItem>
                <SelectItem value="total_amount">Total Amount</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
                <SelectItem value="positive_trades">Positive Trades</SelectItem>
                <SelectItem value="negative_trades">Negative Trades</SelectItem>
                <SelectItem value="total_trades">Total Trades</SelectItem>
                <SelectItem value="win_ratio">Win Ratio</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              variant="outline"
              size="icon"
              className="bg-gray-700 border-gray-600"
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm md:text-base">
              <thead>
                <tr className="bg-gray-700 text-gray-300">
                  <th className="py-2 px-2 sm:py-3 sm:px-4 text-left">Name</th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 text-left">ID</th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 text-right cursor-pointer" onClick={() => handleSort('balance')}>
                    Balance {getSortIcon('balance')} <DollarSign className="inline-block ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                  </th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 text-right cursor-pointer" onClick={() => handleSort('total_amount')}>
                    Total {getSortIcon('total_amount')} <BarChart2 className="inline-block ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                  </th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 text-right cursor-pointer" onClick={() => handleSort('growth')}>
                    Growth {getSortIcon('growth')} <TrendingUp className="inline-block ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                  </th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 text-center cursor-pointer" onClick={() => handleSort('positive_trades')}>
                    Pos <CheckCircle className="inline-block ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                  </th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 text-center cursor-pointer" onClick={() => handleSort('negative_trades')}>
                    Neg <XCircle className="inline-block ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                  </th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 text-center cursor-pointer" onClick={() => handleSort('total_trades')}>
                    Total <Activity className="inline-block ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                  </th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 text-center cursor-pointer" onClick={() => handleSort('win_ratio')}>
                    Win % <Percent className="inline-block ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                  </th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 text-center">Account Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-4">Loading...</td>
                  </tr>
                ) : accounts.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-4">No accounts found</td>
                  </tr>
                ) : (
                  accounts.map((account) => (
                    <tr key={account.account_id} className="border-b border-gray-700 hover:bg-gray-750">
                      <td className="py-2 px-2 sm:py-3 sm:px-4">{account.full_name}</td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4">{account.account_id}</td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-right">₹{account.balance.toFixed(2)}</td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-right">₹{account.total_amount.toFixed(2)}</td>
                      <td className={`py-2 px-2 sm:py-3 sm:px-4 text-right ${account.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {account.growth.toFixed(2)}%
                      </td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-center">{account.positive_trades}</td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-center">{account.negative_trades}</td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-center">{account.total_trades}</td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-center">{account.win_ratio.toFixed(2)}%</td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-center">
                        <button
                          disabled={true}
                          className={`px-2 py-1 rounded text-xs sm:text-sm ${
                            account.is_activate ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                          } text-white font-bold transition-colors duration-200`}
                        >
                          {account.is_activate ? 'Active' : 'Inactive'}
                        </button>
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
                  onClick={() => 
                    setCurrentPage(page => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700"
                >
                  <span className="sr-only">Next</span>
                  <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}