"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, BookOpen, X, Edit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Cookies from "js-cookie";
import { API_BASE_URL } from '@/lib/constants'

export default function OpenPositionsTable({
  isLoading,
  trades,
  onDataChange,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [orderType, setOrderType] = useState("BUY");
  const [price, setPrice] = useState('')
  const { toast } = useToast();
  const tradesPerPage = 5;

  const indexOfLastTrade = currentPage * tradesPerPage;
  const indexOfFirstTrade = indexOfLastTrade - tradesPerPage;
  const currentTrades = trades.slice(indexOfFirstTrade, indexOfLastTrade);

  const totalPages = Math.ceil(trades.length / tradesPerPage);

  const handleOpenOrders = (trade) => {
    setSelectedTrade(trade);
    setShowOrderDialog(true);
  };

  const handleOpenUpdateDialog = (trade) => {
    setSelectedTrade(trade);
    setShowUpdateDialog(true);
  };

  const handleExit = async (trade) => {
    try {
      const liveprice = await fetchPrice(trade)
      const sendBody = {
        position_id: trade.position_id,
        order_side: trade.position_side,
        quantity:
          trade.position_status === "PENDING"
            ? trade.sell_quantity
            : trade.buy_quantity,
        price: parseFloat(liveprice),
        created_by: "Menual",
      };
      const token = Cookies.get("access_token");
      const response = await fetch(
        `${API_BASE_URL}/order/create_exit_all_order/`,
        {
          method: "POST",
          body: JSON.stringify(sendBody),
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Order Created Successfully",
          description: data.message,
          duration: 5000,
        });
        onDataChange(); // Trigger dashboard data refresh
      } else {
        const errorData = await response.json();
        console.error("Error creating order:", errorData);
        toast({
          title: "Order Creation Failed",
          description:
            errorData.detail || "An error occurred while exiting the order.",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast({
        title: "Request Error",
        description: "An error occurred while sending the exit request.",
        duration: 5000,
      });
    }
  };

  const handleUpdateOrder = async (data) => {
    try {
      const bodySend = {
        position_id: data.position_id,
        stoploss_price: data.stoploss,
        target_price: data.target,
        quantity: data.quantity,
        created_by: "Menual",
      };
      const token = Cookies.get("access_token");
      const response = await fetch(
        `${API_BASE_URL}/order/stoploss_order/`,
        {
          method: "POST",
          body: JSON.stringify(bodySend),
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const responseData = await response.json();
        toast({
          title: "Order Updated Successfully",
          description: responseData.message,
          duration: 5000,
        });
        setShowUpdateDialog(false);
        onDataChange(); // Trigger dashboard data refresh
      } else {
        const errorData = await response.json();
        setShowUpdateDialog(false);
        toast({
          title: errorData.message,
          description:
            errorData.resolution ||
            "An error occurred while updating the order.",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Update error:", error);
      setShowUpdateDialog(false);
      toast({
        title: "Update Error",
        description: error,
        duration: 5000,
      });
    }
  };

  const handleAddQuantity = async (data) => {
    try {
      const bodySend = {
        position_id: data.position_id,
        order_side: orderType,
        quantity: data.quantity,
        price: data.price,
        created_by: "Menual",
      };
      const token = Cookies.get("access_token");
      const response = await fetch(
        `${API_BASE_URL}/order/update_quantity_order/`,
        {
          method: "POST",
          body: JSON.stringify(bodySend),
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const responseData = await response.json();
        toast({
          title: "Quantity Added Successfully",
          description: responseData.message,
          duration: 5000,
        });
        setShowUpdateDialog(false);
        onDataChange(); // Trigger dashboard data refresh
      } else {
        const errorData = await response.json();
        setShowUpdateDialog(false);

        toast({
          title: errorData?.message,
          description:
            errorData.resolution || "An error occurred while adding quantity.",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Add quantity error:", error);
      setShowUpdateDialog(false);

      toast({
        title: "Add Quantity Error",
        description:
          "An error occurred while sending the add quantity request.",
        duration: 5000,
      });
    }
  };

  const getOrderTypeColor = (orderType) => {
    switch (orderType) {
      case "Exit Order":
        return "bg-red-100";
      case "Update Quantity Order":
        return "bg-blue-100";
      case "New Order":
        return "bg-green-100";
      case "Stoploss Order":
        return "bg-yellow-100";
      default:
        return "";
    }
  };

  const fetchPrice = async (selectedTrade) => {
    try {
      const response = await fetch(`${API_BASE_URL}/live_data/find?type_of_symbol=${selectedTrade?.stock_type}&symbol_id=${selectedTrade?.stock_symbol}`)
      const detailData = await response.json()
      setPrice(detailData?.ltp)
      return detailData?.ltp
    } catch (error) {
      toast({
        title: "Error fetching price:",
        description: responseData.message,
        duration: 5000,
      });
      setPrice(0)
      return 0
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-2 sm:p-4 lg:p-3">
      <Card className="shadow-lg bg-white">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Open Positions
          </h2>
          <div className="overflow-x-auto -mx-6 px-6">
            <Table className="border-collapse border border-gray-200">
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="py-3 px-4 border border-gray-200 font-semibold">
                    Position ID
                  </TableHead>
                  <TableHead className="py-3 px-4 border border-gray-200 font-semibold">
                    Symbol
                  </TableHead>
                  <TableHead className="py-3 px-4 border border-gray-200 font-semibold">
                    Side
                  </TableHead>
                  <TableHead className="py-3 px-4 border border-gray-200 font-semibold">
                    Price
                  </TableHead>
                  <TableHead className="py-3 px-4 border border-gray-200 font-semibold">
                    Quantity
                  </TableHead>
                  <TableHead className="py-3 px-4 border border-gray-200 font-semibold">
                    Stoploss
                  </TableHead>
                  <TableHead className="py-3 px-4 border border-gray-200 font-semibold">
                    Target
                  </TableHead>
                  <TableHead className="py-3 px-4 border border-gray-200 font-semibold">
                    Margin
                  </TableHead>
                  <TableHead className="py-3 px-4 border border-gray-200 font-semibold">
                    Date
                  </TableHead>
                  <TableHead className="py-3 px-4 border border-gray-200 font-semibold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTrades.map((trade) => (
                  <TableRow key={trade.position_id} className="">
                    <TableCell className="py-2 px-4 border border-gray-200 font-semibold">
                      {trade.position_id}
                    </TableCell>
                    <TableCell className="py-2 px-4 border border-gray-200 font-semibold">
                      {trade.stock_symbol}
                    </TableCell>
                    <TableCell className="py-2 px-4 border border-gray-200 font-semibold">
                      <span className={`px-2 py-1 rounded-full text-xs ${trade.position_side === "BUY" ? "bg-green-600" : "bg-red-600"
                        } text-white`}
                      >
                        {trade.position_side}
                      </span>

                    </TableCell>
                    <TableCell className="py-2 px-4 border border-gray-200 font-semibold">
                      ₹
                      {trade.position_side === "BUY"
                        ? trade.buy_average
                        : trade.position_side === "SELL"
                          ? trade.sell_average
                          : null}
                    </TableCell>
                    <TableCell className={`py-2 px-4 border border-gray-200 font-semibold ${trade.buy_quantity - trade.sell_quantity <= 0 ? "text-red-600" : "text-green-600"}`}>
                      {trade.buy_quantity - trade.sell_quantity}
                    </TableCell>
                    <TableCell className="py-2 px-4 border border-gray-200 font-semibold text-red-500">
                      ₹{trade.stoploss_price.toFixed(2)}
                    </TableCell>
                    <TableCell className="py-2 px-4 border border-gray-200 font-semibold text-green-500">
                      ₹{trade.target_price.toFixed(2)}
                    </TableCell>
                    <TableCell className={`py-2 px-4 border border-gray-200 font-semibold ${trade.buy_margin - trade.sell_margin <= 0 ? "text-red-600" : "text-green-600"}`}>
                      ₹{(trade.buy_margin - trade.sell_margin).toFixed(2)}
                    </TableCell>
                    <TableCell className="py-2 px-4 border border-gray-200 font-semibold">
                      {new Date(trade.created_date).toLocaleString()}
                    </TableCell>
                    <TableCell className="py-2 px-4 border border-gray-200">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-gray-100 text-black hover:bg-gray-200"
                          onClick={() => handleOpenOrders(trade)}
                        >
                          <BookOpen className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenUpdateDialog(trade)}
                          className="bg-blue-100 text-blue-700 hover:bg-blue-200"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExit(trade)}
                          className="bg-red-100 text-red-900 hover:bg-red-200"
                        >
                          <X className="h-4 w-4" />
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
              Showing {indexOfFirstTrade + 1} to{" "}
              {Math.min(indexOfLastTrade, trades.length)} of {trades.length}{" "}
              entries
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                  >
                    {page}
                  </Button>
                )
              )}
              <Button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
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
            <DialogTitle className="text-xl font-semibold">
              Orders for {selectedTrade?.stock_symbol} [{" "}
              {selectedTrade?.position_id} ]
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <Table className="border-collapse border border-gray-400">
              <TableHeader>
                <TableRow className="bg-gray-200">
                  <TableHead className="py-3 px-4 border border-gray-300 font-bold">
                    Order ID
                  </TableHead>
                  <TableHead className="py-3 px-4 border border-gray-300 font-bold">
                    Order Type
                  </TableHead>
                  <TableHead className="py-3 px-4 border border-gray-300 font-bold">
                    Side
                  </TableHead>
                  <TableHead className="py-3 px-4 border border-gray-300 font-bold">
                    Quantity
                  </TableHead>
                  <TableHead className="py-3 px-4 border border-gray-300 font-bold">
                    Price
                  </TableHead>
                  <TableHead className="py-3 px-4 border border-gray-300 font-bold">
                    Date
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedTrade?.orders.map((order) => (
                  <TableRow
                    key={order.order_id}
                    className={`${getOrderTypeColor(order.order_types)}`}
                  >
                    <TableCell className="py-2 px-4 border border-gray-300 font-semibold">
                      {order.order_id}
                    </TableCell>
                    <TableCell className="py-2 px-4 border border-gray-300 font-semibold">
                      {order.order_types}
                    </TableCell>
                    <TableCell
                      className={`py-2 px-4 border border-gray-300 font-semibold ${order.order_side === "BUY"
                          ? "text-green-600"
                          : "text-red-600"
                        }`}
                    >
                      {order.order_side}
                    </TableCell>
                    <TableCell className="py-2 px-4 border border-gray-300 font-semibold ">
                      {order.quantity}
                    </TableCell>
                    <TableCell className="py-2 px-4 border border-gray-300 font-semibold">
                      ₹{order.price?.toFixed(2) || "N/A"}
                    </TableCell>
                    <TableCell className="py-2 px-4 border border-gray-300 font-semibold">
                      {new Date(order.order_datetime).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="sm:max-w-[425px] bg-gradient-to-r from-blue-50 to-purple-50">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-indigo-800">
              Update Order
            </DialogTitle>
            <DialogTitle className="text-xl font-semibold text-green-800">
              Entry Price ₹
              {selectedTrade?.position_side === "BUY"
                ? selectedTrade?.buy_average
                : selectedTrade?.position_side === "SELL"
                  ? selectedTrade?.sell_average
                  : null}
            </DialogTitle>
          </DialogHeader>

          {/* Order Update Popup */}
          <Tabs defaultValue="update" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-indigo-100">
              <TabsTrigger
                value="update"
                className="data-[state=active]:bg-white"
              >
                Update Sl-Tg
              </TabsTrigger>
              <TabsTrigger value="add" className="data-[state=active]:bg-white">
                Update Quantity
              </TabsTrigger>
            </TabsList>

            {/* Update Tab */}
            <TabsContent value="update" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stoploss" className="text-indigo-700">
                  Stoploss ({selectedTrade?.stoploss_price})
                </Label>
                <Input
                  id="stoploss"
                  className="border-indigo-200 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target" className="text-indigo-700">
                  Target ({selectedTrade?.target_price})
                </Label>
                <Input
                  id="target"
                  className="border-indigo-200 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-indigo-700">
                  Quantity ({selectedTrade?.buy_quantity})
                </Label>
                <Input
                  id="quantity"
                  className="border-indigo-200 focus:border-indigo-500"
                />
              </div>
              <Button
                onClick={() =>
                  handleUpdateOrder({
                    position_id: selectedTrade?.position_id,
                    stoploss: parseFloat(
                      document.getElementById("stoploss").value
                    ),
                    target: parseFloat(document.getElementById("target").value),
                    quantity: parseInt(
                      document.getElementById("quantity").value
                    ),
                  })
                }
                className="w-full bg-indigo-500 text-white hover:bg-indigo-600"
              >
                Update
              </Button>
            </TabsContent>

            {/* Quantity Tab */}
            <TabsContent value="add" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="addOrderType" className="text-primary">
                  Order Type
                </Label>
                <Select
                  onValueChange={(value) => setOrderType(value)}
                  defaultValue={orderType}
                >
                  <SelectTrigger
                    id="addOrderType"
                    className="border-primary/20 focus:ring-primary"
                  >
                    <SelectValue placeholder="Select order type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="BUY">BUY</SelectItem>
                    <SelectItem value="SELL">SELL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="addPrice" className="text-indigo-700">
                  Price
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="addPrice"
                    value={`₹${price}`}
                    disabled
                    onChange={(e) => setPrice(e.target.value)}
                    className="border-indigo-200 focus:border-indigo-500 font-bold"
                  />
                  <Button
                    onClick={() => fetchPrice(selectedTrade)}
                    disabled={isLoading}
                    className="bg-indigo-500 text-white hover:bg-indigo-600"
                  >
                    {isLoading ? "Fetching..." : "Fetch"}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="addQuantity" className="text-indigo-700">
                  Quantity{" "}
                </Label>
                <Input
                  id="addQuantity"
                  className="border-indigo-200 focus:border-indigo-500"
                />
              </div>
              <Button
                onClick={() =>
                  handleAddQuantity({
                    position_id: selectedTrade?.position_id,
                    price: price,
                    quantity: parseInt(
                      document.getElementById("addQuantity").value
                    ),
                  })
                }
                className="w-full bg-indigo-500 text-white hover:bg-indigo-600"
              >
                Submit
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
