"use client"

import React, { useState, useEffect } from 'react'
import { Search, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Cookies from 'js-cookie'
import { API_BASE_URL } from '@/lib/constants'

export default function EnhancedPositionBook() {
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('default')
  const [typeFilter, setTypeFilter] = useState('All')
  const [showPositionDialog, setShowPositionDialog] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const token  = Cookies.get("access_token")

        const response = await fetch(`${API_BASE_URL}/order/all_positions`, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch positions')
        }
        const data = await response.json()
        console.log(data)
        setPositions(data)
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    fetchPositions()
  }, [])

  const filteredPositions = positions.filter(position => 
    (position.position_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
     position.stock_symbol.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (typeFilter === 'All' || position.stock_type === typeFilter)
  ).sort((a, b) => {
    if (sortBy === 'highProfit') return b.pnl_total - a.pnl_total
    if (sortBy === 'lowProfit') return a.pnl_total - b.pnl_total
    return 0
  })

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredPositions.slice(indexOfFirstItem, indexOfLastItem)

  const totalPages = Math.ceil(filteredPositions.length / itemsPerPage)

  const clearFilters = () => {
    setSearchTerm('')
    setSortBy('default')
    setTypeFilter('All')
  }

  if (loading) {
    return <div className="w-full h-screen flex items-center justify-center">Loading positions...</div>
  }

  if (error) {
    return <div className="w-full h-screen flex items-center justify-center text-red-500">Error: {error}</div>
  }

  const getOrderTypeColor = (orderType) => {
    switch (orderType) {
      case 'Exit Order':
        return 'bg-red-100'
      case 'Update Quantity Order':
        return 'bg-blue-100'
      case 'New Order':
        return 'bg-green-100'
      case 'Stoploss Order':
        return 'bg-yellow-100'

      default:
        return ''
    }
  }
  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-4">
      <Card className="shadow-lg bg-white">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Position Book</h2>
          <div className="flex flex-col space-y-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-grow">
                <Input
                  type="text"
                  placeholder="Search by Position ID or Symbol"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="highProfit">High Profit</SelectItem>
                  <SelectItem value="lowProfit">Low Profit</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="All">All Types</SelectItem>
                  <SelectItem value="Stocks">Stocks</SelectItem>
                  <SelectItem value="Option">Options</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={clearFilters} variant="outline" className="whitespace-nowrap">
                Clear Filters
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Position ID</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Buy Average</TableHead>
                  <TableHead>Sell Average</TableHead>
                  <TableHead>P&L</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((position) => (
                  <TableRow key={position.position_id}>
                    <TableCell className="font-medium">{position.position_id}</TableCell>
                    <TableCell>{position.stock_symbol}</TableCell>
                    <TableCell className={position.position_side === 'BUY' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                      {position.position_side}
                    </TableCell>
                    <TableCell>{position.buy_quantity}</TableCell>
                    <TableCell>₹{position.buy_average.toFixed(2)}</TableCell>
                    <TableCell>₹{position.sell_average.toFixed(2)}</TableCell>
                    <TableCell className={position.pnl_total > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                      ₹{position.pnl_total.toFixed(2)} (
                      {((position.sell_average - position.buy_average) * 100 / position.pnl_total).toFixed(2)}%)
                    </TableCell>

                    <TableCell>{position.position_status}</TableCell>
                    <TableCell>{position.stock_type}</TableCell>
                    <TableCell>{new Date(position.created_date).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedPosition(position)
                          setShowPositionDialog(true)
                        }}
                      >
                        <BookOpen className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPositions.length)} of {filteredPositions.length} entries
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                >
                  {page}
                </Button>
              ))}
              <Button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPositionDialog} onOpenChange={setShowPositionDialog}>
        <DialogContent className="sm:max-w-[1200px] w-[100vw] max-h-[100vh] overflow-y-auto p-4 sm:p-6 bg-white">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-semibold">Orders for {selectedPosition?.stock_symbol} [ {selectedPosition?.position_id} ]</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <Table className="border-collapse border border-gray-400">
              <TableHeader>
                <TableRow className="bg-gray-200">
                  <TableHead className="py-3 px-4 border border-gray-300 font-bold">Order ID</TableHead>
                  <TableHead className="py-3 px-4 border border-gray-300 font-bold">Order Type</TableHead>
                  <TableHead className="py-3 px-4 border border-gray-300 font-bold">Side</TableHead>
                  <TableHead className="py-3 px-4 border border-gray-300 font-bold">Quantity</TableHead>
                  <TableHead className="py-3 px-4 border border-gray-300 font-bold">Price</TableHead>
                  <TableHead className="py-3 px-4 border border-gray-300 font-bold">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedPosition?.orders.map((order) => (
                  <TableRow key={order.order_id} className={`${getOrderTypeColor(order.order_types)}`}>
                    <TableCell className="py-2 px-4 border border-gray-300 font-semibold">{order.order_id}</TableCell>
                    <TableCell className="py-2 px-4 border border-gray-300 font-semibold">{order.order_types}</TableCell>
                    <TableCell className={`py-2 px-4 border border-gray-300 font-semibold ${order.order_side === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                    {order.order_side}
                    </TableCell>
                    <TableCell className="py-2 px-4 border border-gray-300 font-semibold ">{order.quantity}</TableCell>
                    <TableCell className="py-2 px-4 border border-gray-300 font-semibold">₹{order.price?.toFixed(2) || 'N/A'}</TableCell>
                    <TableCell className="py-2 px-4 border border-gray-300 font-semibold">{new Date(order.order_datetime).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}