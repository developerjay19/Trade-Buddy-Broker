'use client'
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, BookOpen, X } from "lucide-react"
import { useToast } from '@/hooks/use-toast'


export default function TradingTable({isLoading,trades}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTrade, setSelectedTrade] = useState(null)
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const { toast } = useToast()
  const tradesPerPage = 5

  const indexOfLastTrade = currentPage * tradesPerPage
  const indexOfFirstTrade = indexOfLastTrade - tradesPerPage
  const currentTrades = trades.slice(indexOfFirstTrade, indexOfLastTrade)

  const totalPages = Math.ceil(trades.length / tradesPerPage)

  const handleOpenOrders = (trade) => {
    setSelectedTrade(trade)
    setShowOrderDialog(true)
  }

  const handleExit = async (tradeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/order/create_exit_order/`, {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Failed to exit trade')
      }
      toast({
        title: "Success",
        description: "Trade exited successfully.",
      })
    } catch (error) {
      console.error('Error exiting trade:', error)
      toast({
        title: "Error",
        description: "Failed to exit trade. Please try again.",
        variant: "destructive",
      })
    }
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

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }
  return (
    <div className="w-full max-w-7xl mx-auto p-2 sm:p-4 lg:p-3">
      <Card className="shadow-lg bg-white">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Close Positions</h2>
          <div className="overflow-x-auto -mx-6 px-6">
            <Table className="border-collapse border border-gray-200">
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="py-3 px-4 border border-gray-200 font-semibold">Position ID</TableHead>
                  <TableHead className="py-3 px-4 border border-gray-200 font-semibold">Symbol</TableHead>
                  <TableHead className="py-3 px-4 border border-gray-200 font-semibold">Side</TableHead>
                  <TableHead className="py-3 px-4 border border-gray-200 font-semibold">Quantity</TableHead>
                  <TableHead className="py-3 px-4 border border-gray-200 font-semibold">Buying Price</TableHead>
                  <TableHead className="py-3 px-4 border border-gray-200 font-semibold">Selling Price</TableHead>
                  <TableHead className="py-3 px-4 border border-gray-200 font-semibold">P&L</TableHead>
                  <TableHead className="py-3 px-4 border border-gray-200 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTrades.map((trade) => (
                  <TableRow key={trade.position_id} className="">
                    <TableCell className="py-2 px-4 border border-gray-200 font-semibold">{trade.position_id}</TableCell>
                    <TableCell className="py-2 px-4 border border-gray-200 font-semibold">{trade.stock_symbol}</TableCell>
                    <TableCell className="py-2 px-4 border border-gray-200 font-semibold">
                        <span className={`px-2 py-1 rounded-full text-xs ${trade.position_side === "BUY" ? "bg-green-600" : "bg-red-600"} text-white`}>
                          {trade.position_side}
                        </span>
                    </TableCell>
                    <TableCell className="py-2 px-4 border border-gray-200 font-semibold">
                      {trade.position_side === "BUY" ? trade.buy_quantity : trade.sell_quantity}
                    </TableCell>
                    <TableCell className="py-2 px-4 border border-gray-200 font-semibold">₹{trade.buy_average.toFixed(2)}</TableCell>
                    <TableCell className="py-2 px-4 border border-gray-200 font-semibold">₹{trade.sell_average.toFixed(2)}</TableCell>
                    <TableCell className={`py-2 px-4 border border-gray-200 font-bold ${trade.pnl_total > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      ₹{trade.pnl_total.toFixed(2)} (
                      {((trade.sell_average- trade.buy_average) * 100 / trade.pnl_total).toFixed(2)}%)
                    </TableCell>
                    <TableCell className="py-2 px-4 border border-gray-200">
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleOpenOrders(trade)}
                        >
                        <BookOpen className="h-4 w-4 mr-2" />
                          Orders
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {indexOfFirstTrade + 1} to {Math.min(indexOfLastTrade, trades.length)} of {trades.length} entries
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

      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="sm:max-w-[1200px] w-[100vw] max-h-[100vh] overflow-y-auto p-4 sm:p-6 bg-white">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-semibold">Orders for {selectedTrade?.stock_symbol} [ {selectedTrade?.position_id} ]</DialogTitle>
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
                {selectedTrade?.orders.map((order) => (
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