// components/PackageCalculator.jsx
import React, { useState, useEffect } from 'react';

export default function PackageCalculator() {
  const [flightTicket, setFlightTicket] = useState('');
  const [rayalRate, setRayalRate] = useState('47.50');
  const [manualRayalRate, setManualRayalRate] = useState('47.50');
  const [visaRate, setVisaRate] = useState('600');
  const [hotels, setHotels] = useState([
    { id: 'makkah', name: 'Makkah', priceSar: '170', nights: '14' },
    { id: 'madina', name: 'Madina', priceSar: '180', nights: '8' }
  ]);

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/SAR');
        const data = await response.json();
        if (data.rates && data.rates.PKR) {
          const rate = data.rates.PKR.toFixed(2);
          setRayalRate(rate);
          setManualRayalRate(rate);
        }
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
      }
    };
    fetchExchangeRate();
  }, []);

  const updateHotel = (id, field, value) => {
    setHotels(prev => prev.map(hotel => 
      hotel.id === id ? { ...hotel, [field]: value } : hotel
    ));
  };

  const calculatePackageCosts = () => {
    const rate = parseFloat(manualRayalRate) || parseFloat(rayalRate) || 47.50;
    const ticketPkr = parseFloat(flightTicket) || 0;
    const visaSar = parseFloat(visaRate) || 0;
    const visaPkr = visaSar * rate;
    const totalTicketVisa = ticketPkr + visaPkr;

    const makkah = hotels.find(h => h.id === 'makkah');
    const madina = hotels.find(h => h.id === 'madina');
    
    const makkahPerNight = parseFloat(makkah?.priceSar) || 0;
    const madinaPerNight = parseFloat(madina?.priceSar) || 0;
    const makkahNts = parseInt(makkah?.nights) || 0;
    const madinaNts = parseInt(madina?.nights) || 0;

    const sharingMakkah = (makkahPerNight / 5) * makkahNts * rate;
    const sharingMadina = (madinaPerNight / 5) * madinaNts * rate;
    const sharingTotal = sharingMakkah + sharingMadina;

    const quadMakkah = (makkahPerNight / 4) * makkahNts * rate;
    const quadMadina = (madinaPerNight / 4) * madinaNts * rate;
    const quadTotal = quadMakkah + quadMadina;

    const tripleMakkah = (makkahPerNight / 3) * makkahNts * rate;
    const tripleMadina = (madinaPerNight / 3) * madinaNts * rate;
    const tripleTotal = tripleMakkah + tripleMadina;

    const doubleMakkah = (makkahPerNight / 2) * makkahNts * rate;
    const doubleMadina = (madinaPerNight / 2) * madinaNts * rate;
    const doubleTotal = doubleMakkah + doubleMadina;

    return {
      rate,
      ticketPkr,
      visaSar,
      visaPkr,
      totalTicketVisa,
      sharingMakkah,
      sharingMadina,
      sharingTotal,
      quadMakkah,
      quadMadina,
      quadTotal,
      tripleMakkah,
      tripleMadina,
      tripleTotal,
      doubleMakkah,
      doubleMadina,
      doubleTotal
    };
  };

  const costs = calculatePackageCosts();

  return (
    <div>
      <div className="flex-row">
        <div className="col">
          <div className="card">
            <div className="card-title">💰 Input Details</div>
            
            <div style={{ marginBottom: '12px' }}>
              <label className="text-sm" style={{ display: 'block', marginBottom: '4px' }}>
                1. Flight Ticket Price (PKR):
              </label>
              <input
                type="number"
                className="input-field"
                value={flightTicket}
                onChange={(e) => setFlightTicket(e.target.value)}
                placeholder="Enter flight ticket price in PKR"
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label className="text-sm" style={{ display: 'block', marginBottom: '4px' }}>
                2. Riyal Rate (SAR to PKR):
              </label>
              <div className="flex">
                <input
                  type="number"
                  className="input-field"
                  style={{ flex: 1 }}
                  value={manualRayalRate}
                  onChange={(e) => {
                    setManualRayalRate(e.target.value);
                    setRayalRate(e.target.value);
                  }}
                  placeholder="Enter riyal exchange rate"
                />
                <button
                  className="btn btn-outline"
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

            <div style={{ marginBottom: '12px' }}>
              <label className="text-sm" style={{ display: 'block', marginBottom: '4px' }}>
                3. Visa Rate (SAR):
              </label>
              <input
                type="number"
                className="input-field"
                value={visaRate}
                onChange={(e) => setVisaRate(e.target.value)}
                placeholder="Default 600 SAR"
              />
            </div>
          </div>

          <div className="card">
            <div className="card-title">📊 Summary</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>Flight Ticket:</span>
              <strong>PKR {costs.ticketPkr.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>Visa:</span>
              <strong>{costs.visaSar.toLocaleString()} SAR (PKR {costs.visaPkr.toFixed(2)})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '2px solid #e9edf4', marginTop: '4px', paddingTop: '8px' }}>
              <span style={{ fontWeight: 'bold' }}>Ticket + Visa Total:</span>
              <strong style={{ color: '#1a2b4a' }}>PKR {costs.totalTicketVisa.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>Exchange Rate:</span>
              <strong>1 SAR = PKR {costs.rate.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card">
            <div className="card-title">🏨 Hotel Details</div>
            {hotels.map(hotel => (
              <div key={hotel.id} className="flex" style={{ marginBottom: '8px' }}>
                <span style={{ minWidth: '70px', fontWeight: 'bold' }}>{hotel.name}</span>
                <input
                  type="number"
                  className="input-field"
                  style={{ width: '80px' }}
                  value={hotel.priceSar}
                  onChange={(e) => updateHotel(hotel.id, 'priceSar', e.target.value)}
                  placeholder="Price"
                />
                <span className="text-sm">SAR</span>
                <input
                  type="number"
                  className="input-field"
                  style={{ width: '70px' }}
                  value={hotel.nights}
                  onChange={(e) => updateHotel(hotel.id, 'nights', e.target.value)}
                  placeholder="Nights"
                />
                <span className="text-sm">nights</span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-title">💵 Package Breakdown</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Package Type</th>
                    <th>Sharing (5)</th>
                    <th>Quad (4)</th>
                    <th>Triple (3)</th>
                    <th>Double (2)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>Hotel Only</td>
                    <td>PKR {costs.sharingTotal.toFixed(2)}</td>
                    <td>PKR {costs.quadTotal.toFixed(2)}</td>
                    <td>PKR {costs.tripleTotal.toFixed(2)}</td>
                    <td>PKR {costs.doubleTotal.toFixed(2)}</td>
                  </tr>
                  <tr style={{ background: '#f0f7ff', fontWeight: 'bold' }}>
                    <td>Grand Total (with Ticket & Visa)</td>
                    <td style={{ color: '#127a4b' }}>PKR {(costs.sharingTotal + costs.totalTicketVisa).toFixed(2)}</td>
                    <td style={{ color: '#1a2b4a' }}>PKR {(costs.quadTotal + costs.totalTicketVisa).toFixed(2)}</td>
                    <td style={{ color: '#b07a1a' }}>PKR {(costs.tripleTotal + costs.totalTicketVisa).toFixed(2)}</td>
                    <td style={{ color: '#b13a4b' }}>PKR {(costs.doubleTotal + costs.totalTicketVisa).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="text-sm mt-8">
              <strong>📌 How it works:</strong><br />
              • Sharing (5): (Hotel Price / 5) × Nights × Exchange Rate<br />
              • Quad (4): (Hotel Price / 4) × Nights × Exchange Rate<br />
              • Triple (3): (Hotel Price / 3) × Nights × Exchange Rate<br />
              • Double (2): (Hotel Price / 2) × Nights × Exchange Rate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}