'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, TrendingUp, TrendingDown, DollarSign, BarChart2, Activity, X, ShoppingCart, Banknote } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'


export default function StockSearchApp() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedStock, setSelectedStock] = useState(null)
  const [showBuyDialog, setShowBuyDialog] = useState(false)
  const [showSellDialog, setShowSellDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isStockSelected, setIsStockSelected] = useState(false)
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)
  const { toast } = useToast()

  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && !inputRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.length >= 3 && !isStockSelected) {
        fetchSearchResults()
      } else {
        setSearchResults([])
        setShowDropdown(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, isStockSelected])

  const fetchSearchResults = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/live_data/search?q=${searchTerm}`)
      const data = await response.json() 
      setSearchResults(data)
      setShowDropdown(true)
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  const handleStockSelect = async (stock) => {
    setSearchTerm(stock.title)
    setShowDropdown(false)
    setIsStockSelected(true)

    try {
      const symbolId = stock.nse_scrip_code || stock.bse_scrip_code || stock.id;
      const response = await fetch(`${API_BASE_URL}/live_data/find?type_of_symbol=${stock.entity_type}&symbol_id=${symbolId}`)
      const detailData = await response.json()
      setSelectedStock(detailData)
    } catch (error) {
    }
  }

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value)
    setIsStockSelected(false)
  }

  const addOrder = async (orderDetails) => {
    const bodydata = {
      stock_symbol: orderDetails.stock.name,
      order_side: orderDetails.type,
      stock_type : orderDetails.stock.type,
      price: +orderDetails.stockPrice || 0,  // Ensure it defaults to 0 if undefined
      stoploss_price: +orderDetails.stoplossPrice || 0, // Ensure it defaults to 0 if undefined
      target_price: +orderDetails.targetPrice || 0, // Ensure it defaults to 0 if undefined
      quantity: +orderDetails.quantity || 0, // Ensure it defaults to 0 if undefined
      created_by: "Menual"
    };
    
    try {
      const token = Cookies.get("access_token");
      const response = await fetch(`${API_BASE_URL}/order/new_order/`, {
        method: 'POST',
        body: JSON.stringify(bodydata),
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' // Ensure Content-Type is set
        },
      });
    
      console.log("Order Created response:", response);
    
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Order Created Successfully",
          description: data?.message,
          duration: 5000,
        });
        setSelectedStock(data);
        router.push("/")
      } else {
        const errorData = await response.json(); // Attempt to get error message from server
        console.error("Error creating order:", errorData);
        toast({
          title: "Order Creation Failed",
          description: errorData?.message || "An error occurred while creating the order.",
          duration: 5000,
        });
      }
    
    } catch (error) {
      console.error("Fetch error:", error);
      toast({
        title: "Request Error",
        description: "An error occurred while sending the order request.",
        duration: 5000,
      });
    } finally {
      // This will run regardless of success or failure
      setShowBuyDialog(false);
      setShowSellDialog(false);
    }
    
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="relative mb-4">
        <div className="relative bg-white">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search for a stock..."
            value={searchTerm}
            onChange={handleSearchInputChange}
            className="pl-10 pr-4 py-2 w-full"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        {isLoading && <div className="mt-2 text-center">Loading...</div>}
        {showDropdown && searchResults.length > 0 && (
          <div 
            ref={dropdownRef}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg overflow-hidden"
            style={{
              maxHeight: '60vh',
              overflowY: 'auto'
            }}
          >
            {searchResults.map((result) => (
              <div
                key={result.search_id}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleStockSelect(result)}
              >
                <div className="font-medium">{result.title}</div>
                <div className="text-sm text-gray-500">{result.entity_type}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <section className="mb-8">
        {selectedStock ? (
          <Card className="bg-white relative">
            <CardContent className="p-6">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => {
                  setSelectedStock(null)
                  setSearchTerm('')
                  setIsStockSelected(false)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="col-span-1 md:col-span-2 lg:col-span-3">
                  <h2 className="text-3xl font-bold mb-2">{selectedStock.name}</h2>
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl font-semibold"> ₹{selectedStock.ltp?.toFixed(2)}</span>
                    <span className={`text-lg font-medium ${selectedStock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedStock.change >= 0 ? <TrendingUp className="inline mr-1" /> : <TrendingDown className="inline mr-1" />}
                      {selectedStock.change?.toFixed(2)} ({selectedStock.changePercent?.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                <StockDataCard title="Market Data" icon={<BarChart2 className="h-5 w-5" />}>
                  <DataItem label="Open" value={selectedStock.open?.toFixed(2)} />
                  <DataItem label="High" value={selectedStock.high?.toFixed(2)} />
                  <DataItem label="Low" value={selectedStock.low?.toFixed(2)} />
                  <DataItem label="Volume" value={selectedStock?.volume?.toLocaleString()} />
                </StockDataCard>
                {/* Uncomment and adjust these cards if you have the data available */}
                {/* <StockDataCard title="Financial Metrics" icon={<DollarSign className="h-5 w-5" />}>
                  <DataItem label="Market Cap" value={`$${(selectedStock.marketCap / 1e9)?.toFixed(2)}B`} />
                  <DataItem label="P/E Ratio" value={selectedStock.pe?.toFixed(2)} />
                  <DataItem label="Dividend" value={selectedStock.dividend?.toFixed(2)} />
                  <DataItem label="Yield" value={`${selectedStock.yield?.toFixed(2)}%`} />
                </StockDataCard>
                <StockDataCard title="Technical Indicators" icon={<Activity className="h-5 w-5" />}>
                  <DataItem label="EMA" value={selectedStock.ema?.toFixed(2)} />
                  <DataItem label="RSI" value={selectedStock.rsi?.toFixed(2)} />
                </StockDataCard> */}
              </div>
              <div className="flex space-x-4 mt-6">
                <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Buy
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-blue-50 max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold text-blue-800">
                        Buy {selectedStock.name}
                      </DialogTitle>
                    </DialogHeader>
                    <TradeForm stock={selectedStock} type="BUY" onSubmit={addOrder} />
                  </DialogContent>
                </Dialog>
                <Dialog open={showSellDialog} onOpenChange={setShowSellDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-red-500 hover:bg-red-600 text-white">
                      <Banknote className="mr-2 h-4 w-4" />
                      Sell
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-red-50 max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold text-red-800">
                        Sell {selectedStock.name}
                      </DialogTitle>
                    </DialogHeader>
                    <TradeForm stock={selectedStock} type="SELL" onSubmit={addOrder} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white">
            <CardContent className="p-6">
              <p className="text-center text-gray-500">Search and select a stock to view details</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}

function StockDataCard({ title, icon, children }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        {icon}
        <span className="ml-2">{title}</span>
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {children}
      </div>
    </div>
  )
}

function DataItem({ label, value }) {
  const isNegative = typeof value === 'string' && value.startsWith('-')
  return (
    <div>
      <span className="text-sm text-gray-500">{label}:</span>
      <span className={`ml-1 font-medium ${isNegative ? 'text-red-600' : 'text-green-600'}`}>{value}</span>
    </div>
  )
}

function TradeForm({ stock, type, onSubmit }) {
  const [quantity, setQuantity] = useState(0)
  const [stockPrice, setStockPrice] = useState(stock.ltp?.toFixed(2))
  const [stoplossPrice, setStoplossPrice] = useState(type === 'BUY' ? (stock.ltp*0.9).toFixed(2) : (stock.ltp*1.1).toFixed(2))
  const [targetPrice, setTargetPrice] = useState(type === 'BUY' ? (stock.ltp*1.2).toFixed(2) : (stock.ltp*0.8).toFixed(2))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      stock,
      type,
      quantity,
      stockPrice,
      stoplossPrice,
      targetPrice
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Live Price</label>
        <Input type="text" value={stock.ltp?.toFixed(2)} readOnly className="bg-gray-200" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 ">Margin</label>
        <Input type="number"  className="bg-gray-200" value={stock.ltp?.toFixed(2)*quantity} readOnly  step="0.01" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Quantity</label>
        <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Limit Price</label>
        <Input type="number"  value={stockPrice} placeholder={stock.ltp?.toFixed(2)} onChange={(e) => setStockPrice(e.target.value)} step="0.01" />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Stoploss Price <span className='text-xs text-red-700'>(-10%)</span></label>
        <Input type="number" className="bg-red-300" value= {stoplossPrice}  step="0.01" onChange={(e) => setStoplossPrice(e.target.value)} />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Target Price <span className='text-xs text-green-700'>(+20%)</span></label>
        <Input type="number" className="bg-green-300" value={targetPrice} step="0.01" onChange={(e) => setTargetPrice(e.target.value)} />
      </div>
      
      
      <div className="sm:col-span-2">
        <Button type="submit" className={`w-full ${type === 'BUY' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'} text-white`}>
          {type === 'BUY' ? <ShoppingCart className="mr-2 h-4 w-4" /> : <Banknote className="mr-2 h-4 w-4" />}
          {type === 'BUY' ? 'Buy' : 'Sell'} Stock
        </Button>
      </div>
    </form>
  )
}