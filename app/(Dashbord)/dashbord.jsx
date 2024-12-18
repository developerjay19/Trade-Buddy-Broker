'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from "@/hooks/use-toast"
import DashboardCount from "./dashboardCount"
import OpenPositionsTable from "./dashboardOpenPositions"
import ClosePositionsTable from "./dashboardClosePositions"
import Cookies from 'js-cookie'

export default function Dashboard() {
  const { toast } = useToast()
  const [openTrades, setOpenTrades] = useState([])
  const [closeTrades, setCloseTrades] = useState([])
  const [dashboardCount, setDashboardCount] = useState([
    { title: "Total Position", counts: 0 },
    { title: "Open/Close", counts: "0/0" },
    { title: "Positive/Negative", counts: "0/0" },
    { title: "Today's P&N", counts: 0 },
    { title: "Total P&N", counts: 0 },
    { title: "Balance", counts: 0 },
  ])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = Cookies.get("access_token")
      const response = await fetch(`${API_BASE_URL}/order/positions`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const data = await response.json()

      if (data && data.positions && data.overview) {
        const openPositionList = data.positions.filter((n) => n.position_status === "Pending")
        const closePositionList = data.positions.filter((n) => n.position_status === "Completed")
        
        setOpenTrades(openPositionList)
        setCloseTrades(closePositionList)
        
        // Update dashboard counts
        setDashboardCount([
          // { title: "Total Position", counts: Math.round(data.overview.total_positions) || 0 },
          { title: "Open/Close", counts: `${data.overview.open_positions || 0}/${data.overview.closed_positions || 0}` },
          { title: "Positive/Negative", counts: `${data.overview.positive_pnl_count || 0}/${data.overview.negative_pnl_count || 0}` },
          { title: "Currently Invested",counts: Math.round(data.overview.invested_amount) },
          { title: "Today's P&N", counts: Math.round(data.overview.pnl_todays) || 0 },
          { title: "Total P&N", counts: Math.round(data.overview.pnl_total) || 0 },
          { title: "Balance", counts: Math.round(data.overview.balance) || 0 },
        ])
      } else {
        throw new Error('Invalid data structure received from API')
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Reset to default values instead of showing an error
      setOpenTrades([])
      setCloseTrades([])
      setDashboardCount([
        // { title: "Total Position", counts: 0 },
        { title: "Open/Close", counts: "0/0" },
        { title: "Positive/Negative", counts: "0/0" },
        { title: "Currently Invested", counts: 0 },
        { title: "Today's P&N", counts: 0 },
        { title: "Total P&N", counts: 0 },
        { title: "Balance", counts: 0 },
      ])
      toast({
        title: "Data Unavailable",
        description: "Unable to fetch latest data. Displaying default values.",
        variant: "warning",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-6">
      <DashboardCount DashboardCounts={dashboardCount} />
      <OpenPositionsTable isLoading={isLoading} trades={openTrades} onDataChange={fetchData} />
      <ClosePositionsTable isLoading={isLoading} trades={closeTrades} />
      {isLoading && <div className="text-center">Loading...</div>} {/* Loading indicator */}
    </div>
  )
}
