import React, { createContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../hooks/useAuth'

export const SocketContext = createContext()

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [realtimeData, setRealtimeData] = useState({})
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      // Connect to socket.io server
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
        auth: {
          token: localStorage.getItem('token')
        }
      })

      newSocket.on('connect', () => {
        console.log('Connected to socket server')
        setConnected(true)
      })

      newSocket.on('disconnect', () => {
        console.log('Disconnected from socket server')
        setConnected(false)
      })

      newSocket.on('device_data', (data) => {
        setRealtimeData(prev => ({
          ...prev,
          [data.deviceId]: {
            ...data,
            timestamp: new Date()
          }
        }))
      })

      newSocket.on('alert', (alert) => {
        // Handle real-time alerts
        console.log('Real-time alert:', alert)
        // You can add notification logic here
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
        setSocket(null)
        setConnected(false)
      }
    }
  }, [user])

  const joinDeviceRoom = (deviceId) => {
    if (socket) {
      socket.emit('join_device', deviceId)
    }
  }

  const leaveDeviceRoom = (deviceId) => {
    if (socket) {
      socket.emit('leave_device', deviceId)
    }
  }

  const getDeviceData = (deviceId) => {
    return realtimeData[deviceId] || null
  }

  const value = {
    socket,
    connected,
    realtimeData,
    joinDeviceRoom,
    leaveDeviceRoom,
    getDeviceData
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}