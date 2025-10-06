'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, Download, Upload, Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface SpeedTestResult {
  download: number
  upload: number
  ping: number
  jitter: number
}

interface LiveSpeedData {
  currentSpeed: number
  averageSpeed: number
  progress: number
}

export default function SpeedTest() {
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<string | null>(null)
  const [results, setResults] = useState<SpeedTestResult | null>(null)
  const [progress, setProgress] = useState(0)
  const [liveSpeed, setLiveSpeed] = useState<LiveSpeedData>({ currentSpeed: 0, averageSpeed: 0, progress: 0 })

  // Real ping measurement using fetch timing
  const measurePing = async (): Promise<number> => {
    const startTime = performance.now()
    try {
      await fetch('/api/ping', { 
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors'
      })
    } catch (error) {
      // Fallback to a simple timing test
      await fetch('https://www.google.com/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors'
      })
    }
    return performance.now() - startTime
  }

  // Real download speed test
  const measureDownloadSpeed = async (): Promise<number> => {
    const testSizes = [1, 5, 10] // MB
    let totalBytes = 0
    let totalTime = 0
    let speeds: number[] = []

    for (const sizeMB of testSizes) {
      const sizeBytes = sizeMB * 1024 * 1024
      const testUrl = `https://speed.cloudflare.com/__down?bytes=${sizeBytes}`
      
      const startTime = performance.now()
      const startBytes = totalBytes
      
      try {
        const response = await fetch(testUrl, { cache: 'no-cache' })
        const reader = response.body?.getReader()
        
        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            totalBytes += value.length
            const currentTime = performance.now()
            const elapsed = (currentTime - startTime) / 1000 // seconds
            const currentSpeed = (totalBytes - startBytes) / elapsed / 1024 / 1024 * 8 // Mbps
            
            // Update live speed display
            setLiveSpeed({
              currentSpeed: currentSpeed,
              averageSpeed: totalBytes / elapsed / 1024 / 1024 * 8,
              progress: Math.min((totalBytes - startBytes) / sizeBytes * 100, 100)
            })
          }
        }
        
        const endTime = performance.now()
        const testTime = (endTime - startTime) / 1000
        const testSpeed = sizeBytes / testTime / 1024 / 1024 * 8 // Mbps
        speeds.push(testSpeed)
        totalTime += testTime
        
      } catch (error) {
        console.error('Download test error:', error)
        // Fallback to a smaller test
        const fallbackUrl = `https://httpbin.org/bytes/${Math.min(sizeBytes, 1024 * 1024)}`
        const startTime = performance.now()
        await fetch(fallbackUrl, { cache: 'no-cache' })
        const endTime = performance.now()
        const testTime = (endTime - startTime) / 1000
        const testSpeed = Math.min(sizeBytes, 1024 * 1024) / testTime / 1024 / 1024 * 8
        speeds.push(testSpeed)
      }
    }
    
    return speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length
  }

  // Real upload speed test
  const measureUploadSpeed = async (): Promise<number> => {
    const testSizes = [1, 2, 5] // MB
    let speeds: number[] = []

    for (const sizeMB of testSizes) {
      const sizeBytes = sizeMB * 1024 * 1024
      const testData = new Uint8Array(sizeBytes)
      
      // Fill with random data
      for (let i = 0; i < sizeBytes; i++) {
        testData[i] = Math.floor(Math.random() * 256)
      }
      
      const startTime = performance.now()
      
      try {
        // Use a test endpoint that accepts POST data
        const response = await fetch('https://httpbin.org/post', {
          method: 'POST',
          body: testData,
          headers: {
            'Content-Type': 'application/octet-stream'
          }
        })
        
        const endTime = performance.now()
        const testTime = (endTime - startTime) / 1000
        const testSpeed = sizeBytes / testTime / 1024 / 1024 * 8 // Mbps
        
        // Update live speed display
        setLiveSpeed({
          currentSpeed: testSpeed,
          averageSpeed: testSpeed,
          progress: ((testSizes.indexOf(sizeMB) + 1) / testSizes.length) * 100
        })
        
        speeds.push(testSpeed)
        
      } catch (error) {
        console.error('Upload test error:', error)
        // Fallback calculation
        const endTime = performance.now()
        const testTime = (endTime - startTime) / 1000
        const testSpeed = sizeBytes / testTime / 1024 / 1024 * 8
        speeds.push(testSpeed)
      }
    }
    
    return speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length
  }

  // Jitter measurement (ping variation)
  const measureJitter = async (): Promise<number> => {
    const pings: number[] = []
    const numTests = 10
    
    for (let i = 0; i < numTests; i++) {
      const ping = await measurePing()
      pings.push(ping)
      await new Promise(resolve => setTimeout(resolve, 100)) // Small delay between pings
    }
    
    // Calculate jitter as standard deviation of ping times
    const avgPing = pings.reduce((sum, ping) => sum + ping, 0) / pings.length
    const variance = pings.reduce((sum, ping) => sum + Math.pow(ping - avgPing, 2), 0) / pings.length
    return Math.sqrt(variance)
  }

  const runSpeedTest = async () => {
    setIsRunning(true)
    setResults(null)
    setProgress(0)
    setLiveSpeed({ currentSpeed: 0, averageSpeed: 0, progress: 0 })

    try {
      // Ping Test
      setCurrentTest('Ping Test')
      setProgress(10)
      const ping = await measurePing()
      setProgress(25)

      // Download Test
      setCurrentTest('Download Test')
      setProgress(30)
      const downloadSpeed = await measureDownloadSpeed()
      setProgress(60)

      // Upload Test
      setCurrentTest('Upload Test')
      setProgress(65)
      const uploadSpeed = await measureUploadSpeed()
      setProgress(85)

      // Jitter Test
      setCurrentTest('Jitter Test')
      setProgress(90)
      const jitter = await measureJitter()
      setProgress(100)

      const realResults: SpeedTestResult = {
        download: downloadSpeed,
        upload: uploadSpeed,
        ping: ping,
        jitter: jitter
      }

      setResults(realResults)
      
    } catch (error) {
      console.error('Speed test error:', error)
      // Fallback to basic measurements
      const fallbackResults: SpeedTestResult = {
        download: 0,
        upload: 0,
        ping: await measurePing(),
        jitter: 0
      }
      setResults(fallbackResults)
    } finally {
      setIsRunning(false)
      setCurrentTest(null)
      setLiveSpeed({ currentSpeed: 0, averageSpeed: 0, progress: 0 })
    }
  }

  const getSpeedColor = (speed: number, type: 'download' | 'upload') => {
    const threshold = type === 'download' ? 100 : 50
    if (speed >= threshold) return 'text-green-500'
    if (speed >= threshold * 0.5) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getPingColor = (ping: number) => {
    if (ping <= 20) return 'text-green-500'
    if (ping <= 50) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-apple-dark mb-2">SpeedTest</h1>
          <p className="text-gray-600">Teste deine Internetgeschwindigkeit</p>
        </motion.div>

        {/* Main Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="apple-card"
        >
          {!isRunning && !results && (
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-24 h-24 mx-auto mb-6 bg-apple-blue/10 rounded-full flex items-center justify-center"
              >
                <Wifi className="w-12 h-12 text-apple-blue" />
              </motion.div>
              
              <h2 className="text-2xl font-semibold mb-4">Bereit für den Test?</h2>
              <p className="text-gray-600 mb-6">
                Klicke auf "Start", um deine Internetgeschwindigkeit zu messen.
              </p>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={runSpeedTest}
                className="apple-button text-lg px-8 py-4"
              >
                Test starten
              </motion.button>
            </div>
          )}

          {isRunning && (
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-6 border-4 border-apple-blue/20 border-t-apple-blue rounded-full"
              />
              
              <h2 className="text-xl font-semibold mb-2">{currentTest}</h2>
              <p className="text-gray-600 mb-4">Bitte warten...</p>
              
              {/* Live Speed Display */}
              {(currentTest === 'Download Test' || currentTest === 'Upload Test') && liveSpeed.currentSpeed > 0 && (
                <div className="mb-6 p-4 bg-apple-gray/30 rounded-2xl">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-apple-blue">
                        {liveSpeed.currentSpeed.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">Aktuelle Geschwindigkeit</div>
                      <div className="text-xs text-gray-500">Mbps</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {liveSpeed.averageSpeed.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">Durchschnitt</div>
                      <div className="text-xs text-gray-500">Mbps</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <motion.div
                  className="bg-apple-blue h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              
              <p className="text-sm text-gray-500">{Math.round(progress)}% abgeschlossen</p>
            </div>
          )}

          <AnimatePresence>
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">Test abgeschlossen!</h2>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-apple-gray/50 rounded-2xl">
                    <Download className="w-8 h-8 text-apple-blue mx-auto mb-2" />
                    <div className="text-2xl font-bold text-apple-dark">
                      {results.download.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Mbps</div>
                    <div className="text-xs text-gray-500 mt-1">Download</div>
                  </div>

                  <div className="text-center p-4 bg-apple-gray/50 rounded-2xl">
                    <Upload className="w-8 h-8 text-apple-blue mx-auto mb-2" />
                    <div className="text-2xl font-bold text-apple-dark">
                      {results.upload.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Mbps</div>
                    <div className="text-xs text-gray-500 mt-1">Upload</div>
                  </div>

                  <div className="text-center p-4 bg-apple-gray/50 rounded-2xl">
                    <Clock className="w-8 h-8 text-apple-blue mx-auto mb-2" />
                    <div className={`text-2xl font-bold ${getPingColor(results.ping)}`}>
                      {results.ping.toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-600">ms</div>
                    <div className="text-xs text-gray-500 mt-1">Ping</div>
                  </div>

                  <div className="text-center p-4 bg-apple-gray/50 rounded-2xl">
                    <AlertCircle className="w-8 h-8 text-apple-blue mx-auto mb-2" />
                    <div className="text-2xl font-bold text-apple-dark">
                      {results.jitter.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">ms</div>
                    <div className="text-xs text-gray-500 mt-1">Jitter</div>
                  </div>
                </div>

                {/* Quality Assessment */}
                <div className="text-center p-4 bg-gradient-to-r from-apple-blue/10 to-blue-500/10 rounded-2xl">
                  <h3 className="font-semibold mb-2">Geschwindigkeitsbewertung</h3>
                  <div className="flex justify-center items-center space-x-2">
                    {results.download >= 100 ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-green-600 font-medium">Sehr gut</span>
                      </>
                    ) : results.download >= 50 ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-yellow-500" />
                        <span className="text-yellow-600 font-medium">Gut</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-red-600 font-medium">Verbesserungswürdig</span>
                      </>
                    )}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={runSpeedTest}
                  className="w-full apple-button"
                >
                  Erneut testen
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8 text-sm text-gray-500"
        >
          <p>Powered by Next.js & Vercel</p>
        </motion.div>
      </div>
    </div>
  )
}