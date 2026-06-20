import React, { useState, useEffect } from 'react';
import './App.css';

const DatePatternGenerator = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generatedData, setGeneratedData] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pattern');

  // Calculator state
  const [flightTicket, setFlightTicket] = useState('');
  const [rayalRate, setRayalRate] = useState('');
  const [makkahHotelRate, setMakkahHotelRate] = useState('');
  const [makkahNights, setMakkahNights] = useState(14);
  const [madinaHotelRate, setMadinaHotelRate] = useState('');
  const [madinaNights, setMadinaNights] = useState(6);
  const [visaRate, setVisaRate] = useState('');
  const [sharingType, setSharingType] = useState('quad'); // quad, triple, double
  const [manualRayalRate, setManualRayalRate] = useState('');

  // Fetch real-time exchange rate
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/SAR');
        const data = await response.json();
        if (data.rates && data.rates.PKR) {
          const rate = data.rates.PKR;
          setRayalRate(rate.toFixed(2));
          setManualRayalRate(rate.toFixed(2));
        }
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
        // Set default rate if API fails
        setRayalRate('47.50');
        setManualRayalRate('47.50');
      }
    };
    fetchExchangeRate();
  }, []);

  // Helper function to add days to a date
  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  // Format date as DD-MMM (e.g., 03-Jul)
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    return `${day}-${month}`;
  };

  // Parse input date (YYYY-MM-DD)
  const parseDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const generatePattern = () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    let start = parseDate(startDate);
    let end = parseDate(endDate);
    
    if (start >= end) {
      setError('End date must be after start date');
      return;
    }

    // Define the two patterns
    const patternA = [
      { nights: 6, label1: 'ARRIVAL MAKKAH', label2: 'ARRIVAL MEDINA' },
      { nights: 7, label1: 'ARRIVAL MEDINA', label2: 'ARRIVAL MAKKAH' },
      { nights: 6, label1: 'ARRIVAL MAKKAH', label2: 'JED AIRPORT' }
    ];

    const patternB = [
      { nights: 7, label1: 'ARRIVAL MAKKAH', label2: 'ARRIVAL MEDINA' },
      { nights: 6, label1: 'ARRIVAL MEDINA', label2: 'ARRIVAL MAKKAH' },
      { nights: 6, label1: 'ARRIVAL MAKKAH', label2: 'JED AIRPORT' }
    ];

    const groups = [];
    let currentDate = new Date(start);
    let groupNum = 1;
    let maxAttempts = 100;
    
    while (groupNum <= maxAttempts) {
      if (currentDate >= end) {
        break;
      }
      
      const pattern = groupNum % 2 === 1 ? patternA : patternB;
      
      let groupEnd = new Date(currentDate);
      pattern.forEach(p => {
        groupEnd = addDays(groupEnd, p.nights);
      });
      
      if (groupEnd > end) {
        break;
      }
      
      const groupData = {
        groupNumber: groupNum,
        segments: []
      };
      
      let segmentStart = new Date(currentDate);
      pattern.forEach((patternItem, index) => {
        const segmentEnd = addDays(segmentStart, patternItem.nights);
        const segment = {
          startDate: new Date(segmentStart),
          endDate: new Date(segmentEnd),
          nights: patternItem.nights,
          label1: patternItem.label1,
          label2: patternItem.label2,
          formattedStart: formatDate(segmentStart),
          formattedEnd: formatDate(segmentEnd)
        };
        
        groupData.segments.push(segment);
        segmentStart = new Date(segmentEnd);
      });
      
      groups.push(groupData);
      
      if (groupNum % 2 === 1) {
        currentDate = addDays(currentDate, 6);
      } else {
        currentDate = addDays(currentDate, 19);
      }
      
      groupNum++;
    }

    if (groups.length === 0) {
      setError('No complete groups fit within the selected date range');
      return;
    }

    setGeneratedData({
      groups,
      totalGroups: groups.length,
      startDate: start,
      endDate: end
    });
    setError('');
  };

  // Calculate package
  const calculatePackage = () => {
    const flight = parseFloat(flightTicket) || 0;
    const rate = parseFloat(manualRayalRate) || parseFloat(rayalRate) || 47.50;
    const makkahRate = parseFloat(makkahHotelRate) || 0;
    const madinaRate = parseFloat(madinaHotelRate) || 0;
    const visa = parseFloat(visaRate) || 0;
    const makkahNightsTotal = parseInt(makkahNights) || 14;
    const madinaNightsTotal = parseInt(madinaNights) || 6;

    // Calculate sharing divisor
    let sharingDivisor = 5; // quad default
    if (sharingType === 'quad') sharingDivisor = 5;
    else if (sharingType === 'triple') sharingDivisor = 3;
    else if (sharingType === 'double') sharingDivisor = 2;

    // Calculate hotel costs in Riyal
    const makkahHotelTotalRyal = makkahRate * makkahNightsTotal;
    const madinaHotelTotalRyal = madinaRate * madinaNightsTotal;
    const hotelTotalRyal = makkahHotelTotalRyal + madinaHotelTotalRyal;
    
    // Per person hotel cost in Riyal (sharing)
    const hotelPerPersonRyal = hotelTotalRyal / sharingDivisor;
    
    // Visa in Riyal
    const visaRyal = visa;
    
    // Total in Riyal (hotel per person + visa)
    const totalRyal = hotelPerPersonRyal + visaRyal;
    
    // Convert to PKR
    const totalPKR = totalRyal * rate;
    
    // Add flight ticket
    const packageTotalPKR = totalPKR + flight;

    return {
      flightTicket: flight,
      exchangeRate: rate,
      makkahHotelRate: makkahRate,
      makkahNights: makkahNightsTotal,
      makkahHotelTotalRyal: makkahHotelTotalRyal,
      madinaHotelRate: madinaRate,
      madinaNights: madinaNightsTotal,
      madinaHotelTotalRyal: madinaHotelTotalRyal,
      hotelTotalRyal: hotelTotalRyal,
      sharingDivisor: sharingDivisor,
      hotelPerPersonRyal: hotelPerPersonRyal,
      visaRyal: visaRyal,
      totalRyal: totalRyal,
      totalPKR: totalPKR,
      packageTotalPKR: packageTotalPKR
    };
  };

  const renderPatternTable = () => {
    if (!generatedData || generatedData.groups.length === 0) {
      return null;
    }

    const { groups, startDate, endDate, totalGroups } = generatedData;
    const groupRows = [];
    for (let i = 0; i < groups.length; i += 2) {
      groupRows.push(groups.slice(i, i + 2));
    }

    return (
      <div className="pattern-table-container">
        <div className="date-info">
          <span>📅 Selected: {formatDate(startDate)} to {formatDate(endDate)}</span>
          <span>📊 Total Groups: {totalGroups}</span>
        </div>

        <h3>Generated Schedule Pattern</h3>
        
        {groupRows.map((rowGroups, rowIndex) => (
          <div key={rowIndex} className="table-row-wrapper">
            <div className="row-label">Row {rowIndex + 1}</div>
            <div className="table-wrapper">
              <table className="pattern-table">
                <tbody>
                  <tr className="month-header">
                    <td></td>
                    {rowGroups.map((group) => {
                      const monthName = group.segments[0].startDate.toLocaleString('default', { month: 'long' });
                      return (
                        <td key={`month-${group.groupNumber}`} colSpan="3" className="month-label">
                          {monthName} {group.segments[0].startDate.getFullYear()}
                        </td>
                      );
                    })}
                  </tr>

                  <tr>
                    <td></td>
                    {rowGroups.map((group) => (
                      <td key={`header-${group.groupNumber}`} colSpan="3" className="group-header">
                        GROUP ON {group.groupNumber}
                      </td>
                    ))}
                  </tr>

                  {[0, 1, 2].map((segIndex) => (
                    <React.Fragment key={`segment-${rowIndex}-${segIndex}`}>
                      <tr className="label-row">
                        <td></td>
                        {rowGroups.map((group) => {
                          const seg = group.segments[segIndex];
                          return (
                            <React.Fragment key={`label-${group.groupNumber}-${segIndex}`}>
                              <td>{seg.label1}</td>
                              <td>{seg.label2}</td>
                              <td>{segIndex === 2 ? 'NIGHT' : 'NIGHTS'}</td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                      <tr className="data-row">
                        <td></td>
                        {rowGroups.map((group) => {
                          const seg = group.segments[segIndex];
                          return (
                            <React.Fragment key={`data-${group.groupNumber}-${segIndex}`}>
                              <td>{seg.formattedStart}</td>
                              <td>{seg.formattedEnd}</td>
                              <td>{seg.nights}</td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        <div className="pattern-info">
          <span>Pattern: Odd Groups (1,3,5...) = 6-7-6 | Even Groups (2,4,6...) = 7-6-6</span>
          <span>Total Groups: {groups.length}</span>
        </div>
      </div>
    );
  };

  const renderCalculator = () => {
    const result = calculatePackage();

    return (
      <div className="calculator-container">
        <h3>💰 Package Calculator</h3>
        
        <div className="calculator-grid">
          <div className="calculator-inputs">
            <h4>Input Details</h4>
            
            <div className="input-group">
              <label>Flight Ticket (PKR):</label>
              <input
                type="number"
                value={flightTicket}
                onChange={(e) => setFlightTicket(e.target.value)}
                placeholder="Enter flight ticket price"
              />
            </div>

            <div className="input-group">
              <label>Exchange Rate (SAR to PKR):</label>
              <div className="rate-input">
                <input
                  type="number"
                  value={manualRayalRate}
                  onChange={(e) => {
                    setManualRayalRate(e.target.value);
                    setRayalRate(e.target.value);
                  }}
                  placeholder="Exchange rate"
                />
                <button 
                  className="fetch-rate-btn"
                  onClick={async () => {
                    try {
                      const response = await fetch('https://api.exchangerate-api.com/v4/latest/SAR');
                      const data = await response.json();
                      if (data.rates && data.rates.PKR) {
                        const rate = data.rates.PKR.toFixed(2);
                        setRayalRate(rate);
                        setManualRayalRate(rate);
                      }
                    } catch (error) {
                      alert('Error fetching exchange rate. Please enter manually.');
                    }
                  }}
                >
                  📊 Fetch Live
                </button>
              </div>
            </div>

            <div className="input-group">
              <label>Makkah Hotel Rate (SAR per night):</label>
              <input
                type="number"
                value={makkahHotelRate}
                onChange={(e) => setMakkahHotelRate(e.target.value)}
                placeholder="Enter Makkah hotel rate"
              />
            </div>

            <div className="input-group">
              <label>Makkah Nights:</label>
              <input
                type="number"
                value={makkahNights}
                onChange={(e) => setMakkahNights(e.target.value)}
                placeholder="Enter Makkah nights"
              />
            </div>

            <div className="input-group">
              <label>Madina Hotel Rate (SAR per night):</label>
              <input
                type="number"
                value={madinaHotelRate}
                onChange={(e) => setMadinaHotelRate(e.target.value)}
                placeholder="Enter Madina hotel rate"
              />
            </div>

            <div className="input-group">
              <label>Madina Nights:</label>
              <input
                type="number"
                value={madinaNights}
                onChange={(e) => setMadinaNights(e.target.value)}
                placeholder="Enter Madina nights"
              />
            </div>

            <div className="input-group">
              <label>Visa Rate (SAR):</label>
              <input
                type="number"
                value={visaRate}
                onChange={(e) => setVisaRate(e.target.value)}
                placeholder="Enter visa rate"
              />
            </div>

            <div className="input-group">
              <label>Sharing Type:</label>
              <select value={sharingType} onChange={(e) => setSharingType(e.target.value)}>
                <option value="quad">Quad (5 persons)</option>
                <option value="triple">Triple (3 persons)</option>
                <option value="double">Double (2 persons)</option>
              </select>
            </div>
          </div>

          <div className="calculator-results">
            <h4>Calculation Results</h4>
            
            <div className="result-item">
              <span className="result-label">Flight Ticket:</span>
              <span className="result-value">PKR {result.flightTicket.toLocaleString()}</span>
            </div>

            <div className="result-item">
              <span className="result-label">Exchange Rate:</span>
              <span className="result-value">1 SAR = PKR {result.exchangeRate.toFixed(2)}</span>
            </div>

            <div className="result-section">
              <h5>Hotel Costs (SAR)</h5>
              <div className="result-item">
                <span className="result-label">Makkah Hotel ({result.makkahNights} nights × {result.makkahHotelRate}):</span>
                <span className="result-value">{result.makkahHotelTotalRyal.toLocaleString()} SAR</span>
              </div>
              <div className="result-item">
                <span className="result-label">Madina Hotel ({result.madinaNights} nights × {result.madinaHotelRate}):</span>
                <span className="result-value">{result.madinaHotelTotalRyal.toLocaleString()} SAR</span>
              </div>
              <div className="result-item total">
                <span className="result-label">Total Hotel:</span>
                <span className="result-value">{result.hotelTotalRyal.toLocaleString()} SAR</span>
              </div>
            </div>

            <div className="result-section">
              <h5>Per Person (Sharing - {result.sharingDivisor} persons)</h5>
              <div className="result-item">
                <span className="result-label">Hotel per person:</span>
                <span className="result-value">{result.hotelPerPersonRyal.toFixed(2)} SAR</span>
              </div>
              <div className="result-item">
                <span className="result-label">Visa:</span>
                <span className="result-value">{result.visaRyal} SAR</span>
              </div>
              <div className="result-item total">
                <span className="result-label">Total per person (SAR):</span>
                <span className="result-value">{result.totalRyal.toFixed(2)} SAR</span>
              </div>
            </div>

            <div className="result-section final">
              <h5>Final Package (PKR)</h5>
              <div className="result-item">
                <span className="result-label">Total per person (PKR):</span>
                <span className="result-value">{result.totalPKR.toFixed(2)} PKR</span>
              </div>
              <div className="result-item total-final">
                <span className="result-label">Package Total (with flight):</span>
                <span className="result-value">{result.packageTotalPKR.toFixed(2)} PKR</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <h1>📅 Date Pattern Generator</h1>
      
      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'pattern' ? 'active' : ''}`}
          onClick={() => setActiveTab('pattern')}
        >
          📋 Pattern Generator
        </button>
        <button 
          className={`tab-btn ${activeTab === 'calculator' ? 'active' : ''}`}
          onClick={() => setActiveTab('calculator')}
        >
          💰 Package Calculator
        </button>
      </div>

      {activeTab === 'pattern' ? (
        <>
          <div className="input-container">
            <div className="input-group">
              <label>Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div className="input-group">
              <label>End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <button onClick={generatePattern}>Generate Pattern</button>
          </div>

          {error && <div className="error">{error}</div>}

          {generatedData && renderPatternTable()}
        </>
      ) : (
        renderCalculator()
      )}
    </div>
  );
};

export default DatePatternGenerator;