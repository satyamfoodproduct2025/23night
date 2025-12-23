import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import './App.css'

function App() {
  const [view, setView] = useState('home') // home, admin, student
  const [location, setLocation] = useState(null)
  const [manualIP, setManualIP] = useState('')
  const [qrData, setQrData] = useState(null)
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [studentName, setStudentName] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Get real location from browser
  const getLocation = () => {
    setLoading(true)
    setError('')
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date().toISOString(),
          accuracy: position.coords.accuracy
        }
        setLocation(loc)
        generateQRCode(loc)
        setLoading(false)
      },
      (err) => {
        setError(`Location Error: ${err.message}. Please allow location access or enter IP manually.`)
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  // Manual IP entry
  const handleManualIP = () => {
    if (!manualIP.trim()) {
      setError('Please enter a valid IP address')
      return
    }
    
    const loc = {
      ip: manualIP,
      timestamp: new Date().toISOString(),
      manual: true
    }
    setLocation(loc)
    generateQRCode(loc)
    setError('')
  }

  // Generate QR Code with location data
  const generateQRCode = (loc) => {
    const qrInfo = {
      location: loc,
      generatedAt: new Date().toISOString(),
      sessionId: Math.random().toString(36).substring(7)
    }
    setQrData(JSON.stringify(qrInfo))
  }

  // Initialize QR Scanner for student
  useEffect(() => {
    let scanner = null

    if (view === 'student' && !scanResult) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const scannerDiv = document.getElementById('qr-reader')
        if (scannerDiv) {
          scanner = new Html5QrcodeScanner('qr-reader', {
            qrbox: {
              width: 250,
              height: 250,
            },
            fps: 10,
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
            defaultZoomValueIfSupported: 2,
          })

          scanner.render(
            (decodedText) => {
              try {
                const data = JSON.parse(decodedText)
                handleSuccessfulScan(data)
                scanner.clear()
              } catch (e) {
                setError('Invalid QR Code format')
              }
            },
            (error) => {
              // Ignore errors during scanning
              console.log('Scan error:', error)
            }
          )
        }
      }, 100)

      return () => {
        clearTimeout(timer)
        if (scanner) {
          scanner.clear().catch(console.error)
        }
      }
    }
  }, [view, scanResult])

  // Handle successful scan
  const handleSuccessfulScan = (data) => {
    if (!studentName.trim()) {
      setError('Please enter your name first')
      return
    }

    const record = {
      studentName,
      scannedData: data,
      timestamp: new Date().toISOString(),
      success: true
    }

    setAttendanceRecords(prev => [...prev, record])
    setScanResult(record)
    setError('')
  }

  // Reset student scan
  const resetStudentScan = () => {
    setScanResult(null)
    setStudentName('')
    setError('')
  }

  // Reset admin
  const resetAdmin = () => {
    setLocation(null)
    setQrData(null)
    setManualIP('')
    setError('')
  }

  return (
    <div className="app">
      {/* Home View */}
      {view === 'home' && (
        <div className="container">
          <div className="header">
            <h1>📚 Library Attendance System</h1>
            <p>Real Location & QR Code Based Attendance</p>
          </div>
          
          <div className="button-grid">
            <button 
              className="btn btn-admin"
              onClick={() => setView('admin')}
            >
              <i className="icon">👨‍💼</i>
              <span>Admin Panel</span>
              <small>Generate QR Code</small>
            </button>
            
            <button 
              className="btn btn-student"
              onClick={() => setView('student')}
            >
              <i className="icon">👨‍🎓</i>
              <span>Student Login</span>
              <small>Mark Attendance</small>
            </button>
          </div>

          {attendanceRecords.length > 0 && (
            <div className="records-summary">
              <h3>📊 Today's Attendance: {attendanceRecords.length}</h3>
            </div>
          )}
        </div>
      )}

      {/* Admin Panel */}
      {view === 'admin' && (
        <div className="container">
          <div className="header">
            <h1>👨‍💼 Admin Panel</h1>
            <p>Generate QR Code for Attendance</p>
          </div>

          {!qrData ? (
            <div className="location-setup">
              <div className="section">
                <h3>📍 Get Real Location</h3>
                <p>Allow location access to generate QR code</p>
                <button 
                  className="btn btn-primary"
                  onClick={getLocation}
                  disabled={loading}
                >
                  {loading ? '⏳ Getting Location...' : '📍 Get My Location'}
                </button>
              </div>

              <div className="divider">OR</div>

              <div className="section">
                <h3>🌐 Manual IP Address</h3>
                <input
                  type="text"
                  placeholder="Enter IP address (e.g., 192.168.1.1)"
                  value={manualIP}
                  onChange={(e) => setManualIP(e.target.value)}
                  className="input"
                />
                <button 
                  className="btn btn-secondary"
                  onClick={handleManualIP}
                >
                  ✓ Set IP Address
                </button>
              </div>

              {error && <div className="error">{error}</div>}
            </div>
          ) : (
            <div className="qr-display">
              <div className="qr-container">
                <QRCodeSVG 
                  value={qrData} 
                  size={300}
                  level="H"
                  includeMargin={true}
                />
              </div>
              
              <div className="location-info">
                <h3>✅ QR Code Generated</h3>
                {location && (
                  <>
                    {location.latitude ? (
                      <div className="info-box">
                        <p><strong>📍 Latitude:</strong> {location.latitude.toFixed(6)}</p>
                        <p><strong>📍 Longitude:</strong> {location.longitude.toFixed(6)}</p>
                        <p><strong>🎯 Accuracy:</strong> {location.accuracy.toFixed(2)}m</p>
                        <p><strong>⏰ Time:</strong> {new Date(location.timestamp).toLocaleString()}</p>
                      </div>
                    ) : (
                      <div className="info-box">
                        <p><strong>🌐 IP Address:</strong> {location.ip}</p>
                        <p><strong>⏰ Time:</strong> {new Date(location.timestamp).toLocaleString()}</p>
                        <p><strong>📝 Mode:</strong> Manual Entry</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <button 
                className="btn btn-secondary"
                onClick={resetAdmin}
              >
                🔄 Generate New QR
              </button>
            </div>
          )}

          {attendanceRecords.length > 0 && (
            <div className="attendance-list">
              <h3>📋 Attendance Records ({attendanceRecords.length})</h3>
              <div className="records">
                {attendanceRecords.map((record, index) => (
                  <div key={index} className="record-card">
                    <div className="record-header">
                      <span className="student-name">👤 {record.studentName}</span>
                      <span className="success-badge">✓</span>
                    </div>
                    <div className="record-time">
                      ⏰ {new Date(record.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button 
            className="btn btn-back"
            onClick={() => setView('home')}
          >
            ← Back to Home
          </button>
        </div>
      )}

      {/* Student View */}
      {view === 'student' && (
        <div className="container">
          <div className="header">
            <h1>👨‍🎓 Student Login</h1>
            <p>Scan QR Code to Mark Attendance</p>
          </div>

          {!scanResult ? (
            <>
              <div className="student-input">
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="input"
                />
              </div>

              {studentName.trim() && (
                <div className="scanner-section">
                  <h3>📷 Scan QR Code</h3>
                  <p className="scanner-info">Allow camera access to scan</p>
                  <div id="qr-reader"></div>
                </div>
              )}

              {!studentName.trim() && (
                <div className="info-message">
                  👆 Please enter your name first to enable camera
                </div>
              )}

              {error && <div className="error">{error}</div>}
            </>
          ) : (
            <div className="success-view">
              <div className="success-icon">✅</div>
              <h2>Attendance Marked Successfully!</h2>
              
              <div className="success-info">
                <p><strong>👤 Student:</strong> {scanResult.studentName}</p>
                <p><strong>⏰ Time:</strong> {new Date(scanResult.timestamp).toLocaleString()}</p>
                <p><strong>📍 Location:</strong> {
                  scanResult.scannedData.location.latitude 
                    ? `${scanResult.scannedData.location.latitude.toFixed(4)}, ${scanResult.scannedData.location.longitude.toFixed(4)}`
                    : scanResult.scannedData.location.ip
                }</p>
              </div>

              <button 
                className="btn btn-primary"
                onClick={resetStudentScan}
              >
                ✓ Mark Another Attendance
              </button>
            </div>
          )}

          <button 
            className="btn btn-back"
            onClick={() => {
              setView('home')
              resetStudentScan()
            }}
          >
            ← Back to Home
          </button>
        </div>
      )}
    </div>
  )
}

export default App
