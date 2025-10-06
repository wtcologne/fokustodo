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

export default function SpeedTest() {
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<string | null>(null)
  const [results, setResults] = useState<SpeedTestResult | null>(null)
  const [progress, setProgress] = useState(0)

  const runSpeedTest = async () => {
    setIsRunning(true)
    setResults(null)
    setProgress(0)

    // Simuliere verschiedene Testphasen
    const tests = [
      { name: 'Ping Test', duration: 2000 },
      { name: 'Download Test', duration: 5000 },
      { name: 'Upload Test', duration: 3000 },
      { name: 'Jitter Test', duration: 1000 }
    ]

    let totalDuration = tests.reduce((sum, test) => sum + test.duration, 0)
    let elapsed = 0

    for (const test of tests) {
      setCurrentTest(test.name)
      
      // Simuliere Fortschritt für diesen Test
      const testStart = elapsed
      const testEnd = elapsed + test.duration
      
      const progressInterval = setInterval(() => {
        elapsed += 100
        const testProgress = Math.min((elapsed - testStart) / test.duration, 1)
        const overallProgress = (testStart + testProgress * test.duration) / totalDuration
        setProgress(overallProgress * 100)
        
        if (elapsed >= testEnd) {
          clearInterval(progressInterval)
        }
      }, 100)

      await new Promise(resolve => setTimeout(resolve, test.duration))
      clearInterval(progressInterval)
    }

    // Simuliere realistische Ergebnisse
    const mockResults: SpeedTestResult = {
      download: Math.random() * 200 + 50, // 50-250 Mbps
      upload: Math.random() * 100 + 20,   // 20-120 Mbps
      ping: Math.random() * 20 + 5,       // 5-25 ms
      jitter: Math.random() * 5 + 1       // 1-6 ms
    }

    setResults(mockResults)
    setIsRunning(false)
    setCurrentTest(null)
    setProgress(100)
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