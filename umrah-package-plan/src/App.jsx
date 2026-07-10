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
  const [manualRayalRate, setManualRayalRate] = useState('');
  const [visaRate, setVisaRate] = useState('600');
  
  // Hotel details
  const [hotels, setHotels] = useState([
    { id: 'makkah', name: 'Makkah', priceSar: '170', nights: '14' },
    { id: 'madina', name: 'Madina', priceSar: '180', nights: '8' }
  ]);

  // Room Calculator state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState([]);
  const [roomSelection, setRoomSelection] = useState({
    sharing: false,
    quad: false,
    triple: false,
    double: false
  });
  const [roomNotes, setRoomNotes] = useState('');

  // Room Assignment state - each room now has assignments with date ranges
  const [rooms] = useState([
    { id: 501, bed: '4BED', assigned: [] },
    { id: 502, bed: '4BED', assigned: [] },
    { id: 503, bed: '4BED', assigned: [] },
    { id: 504, bed: '4BED', assigned: [] },
    { id: 505, bed: '4BED', assigned: [] },
    { id: 506, bed: '5BED', assigned: [] },
    { id: 507, bed: '4BED', assigned: [] },
    { id: 508, bed: '5BED', assigned: [] },
    { id: 401, bed: '4BED', assigned: [] },
    { id: 402, bed: '4BED', assigned: [] }
  ]);
  
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [personName, setPersonName] = useState('');
  const [roomAssignments, setRoomAssignments] = useState({});
  
  // Flight-style date selection
  const [selectionMode, setSelectionMode] = useState('start');
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);
  const [showGroupPopup, setShowGroupPopup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [phaseNumber, setPhaseNumber] = useState(1);
  const [selectedCity, setSelectedCity] = useState('Makkah');
  const [selectedRoomsForGroup, setSelectedRoomsForGroup] = useState([]);

  // Predefined colors for groups
  const groupColors = [
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#22c55e', // Green
    '#eab308', // Yellow
    '#a855f7', // Purple
    '#ec4899', // Pink
    '#14b8a6', // Teal
    '#f97316', // Orange
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
  ];

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
        setRayalRate('47.50');
        setManualRayalRate('47.50');
      }
    };
    fetchExchangeRate();
  }, []);

  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    return `${day}-${month}`;
  };

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
      if (currentDate >= end) break;

      const pattern = groupNum % 2 === 1 ? patternA : patternB;

      let groupEnd = new Date(currentDate);
      pattern.forEach(p => {
        groupEnd = addDays(groupEnd, p.nights);
      });

      if (groupEnd > end) break;

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

  const updateHotel = (id, field, value) => {
    setHotels(prev => prev.map(hotel => 
      hotel.id === id ? { ...hotel, [field]: value } : hotel
    ));
  };

  const calculatePackageCosts = () => {
    const rate = parseFloat(manualRayalRate) || parseFloat(rayalRate) || 0;
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

    const makkahTotalSar = makkahPerNight * makkahNts;
    const madinaTotalSar = madinaPerNight * madinaNts;
    const totalHotelSar = makkahTotalSar + madinaTotalSar;
    const totalHotelPkr = totalHotelSar * rate;

    return {
      rate,
      ticketPkr,
      visaSar,
      visaPkr,
      totalTicketVisa,
      makkahPerNight,
      madinaPerNight,
      makkahNts,
      madinaNts,
      makkahTotalSar,
      madinaTotalSar,
      totalHotelSar,
      totalHotelPkr,
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

  const getMaxBeds = (bedType) => {
    return parseInt(bedType);
  };

  // Check if a room is occupied on a specific date
  const isRoomOccupiedOnDate = (roomId, date) => {
    const assignments = roomAssignments[roomId] || [];
    for (const assignment of assignments) {
      const start = new Date(assignment.startDate);
      const end = new Date(assignment.endDate);
      if (date >= start && date <= end) {
        return true;
      }
    }
    return false;
  };

  // Get room occupancy for a specific date
  const getRoomOccupancyOnDate = (roomId, date) => {
    const assignments = roomAssignments[roomId] || [];
    let count = 0;
    for (const assignment of assignments) {
      const start = new Date(assignment.startDate);
      const end = new Date(assignment.endDate);
      if (date >= start && date <= end) {
        count += assignment.persons?.length || 0;
      }
    }
    return count;
  };

  const getRoomOccupancy = (roomId) => {
    return roomAssignments[roomId]?.length || 0;
  };

  const getAvailableBeds = (room) => {
    const maxBeds = getMaxBeds(room.bed);
    const occupied = getRoomOccupancy(room.id);
    return maxBeds - occupied;
  };

  const assignPersonToRoom = (roomId, person, groupId, startDate, endDate) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const maxBeds = getMaxBeds(room.bed);
    
    // Check if room has available beds for the entire date range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const occupancy = getRoomOccupancyOnDate(roomId, currentDate);
      if (occupancy >= maxBeds) {
        alert(`Room ${roomId} is fully occupied on ${currentDate.toLocaleDateString()}!`);
        return false;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const newAssignment = {
      person,
      groupId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      persons: [person]
    };

    setRoomAssignments(prev => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), newAssignment]
    }));
    setPersonName('');
    return true;
  };

  const removePersonFromRoom = (roomId, assignmentIndex) => {
    setRoomAssignments(prev => {
      const updated = [...(prev[roomId] || [])];
      updated.splice(assignmentIndex, 1);
      return {
        ...prev,
        [roomId]: updated
      };
    });
  };

  const getRoomColor = (room, isSelected) => {
    const available = getAvailableBeds(room);
    const totalBeds = getMaxBeds(room.bed);
    const occupancy = getRoomOccupancy(room.id);
    
    if (isSelected) return '#dbeafe';
    if (occupancy === 0) return '#f3f4f6';
    if (available === 0) return '#fca5a5';
    if (available <= totalBeds / 2) return '#fde68a';
    return '#86efac';
  };

  const handleDateClick = (day) => {
    const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    if (selectionMode === 'start') {
      setTempStartDate(dateObj);
      setTempEndDate(null);
      setSelectionMode('end');
      setSelectedRoomsForGroup([]);
    } else if (selectionMode === 'end') {
      if (tempStartDate && dateObj >= tempStartDate) {
        setTempEndDate(dateObj);
        setShowGroupPopup(true);
      } else {
        alert('End date must be after start date');
        setSelectionMode('start');
        setTempStartDate(null);
      }
    }
  };

  // Toggle room selection for group
  const toggleRoomForGroup = (roomId) => {
    setSelectedRoomsForGroup(prev => {
      if (prev.includes(roomId)) {
        return prev.filter(id => id !== roomId);
      } else {
        return [...prev, roomId];
      }
    });
  };

  const confirmGroup = () => {
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    if (selectedRoomsForGroup.length === 0) {
      alert('Please select at least one room for this group');
      return;
    }

    const start = new Date(tempStartDate);
    const end = new Date(tempEndDate);
    const dates = [];
    let currentDate = new Date(start);
    
    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Create group
    const newGroup = {
      id: Date.now(),
      name: groupName.trim(),
      shortName: groupName.trim(),
      phase: phaseNumber,
      city: selectedCity,
      startDate: start,
      endDate: end,
      dates: dates,
      rooms: selectedRoomsForGroup,
      color: selectedColor
    };

    setGroups(prev => [...prev, newGroup]);
    setSelectedDates(prev => [...prev, ...dates]);

    // Reset
    setGroupName('');
    setShowGroupPopup(false);
    setSelectionMode('start');
    setTempStartDate(null);
    setTempEndDate(null);
    setSelectedRoomsForGroup([]);
    setPhaseNumber(prev => prev + 1);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const changeMonth = (increment) => {
    const newDate = new Date(currentMonth);
    newDate.setDate(1);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentMonth(newDate);
  };

  const toggleRoomType = (type) => {
    setRoomSelection(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const monthName = currentMonth.toLocaleString('default', { month: 'long' });
    const year = currentMonth.getFullYear();

    const isDateSelected = (day) => {
      const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      return selectedDates.some(d => d.toDateString() === dateObj.toDateString());
    };

    const isToday = (day) => {
      const today = new Date();
      return today.getDate() === day && 
             today.getMonth() === currentMonth.getMonth() && 
             today.getFullYear() === currentMonth.getFullYear();
    };

    const isInRange = (day) => {
      const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      if (tempStartDate && tempEndDate) {
        return dateObj >= tempStartDate && dateObj <= tempEndDate;
      }
      return false;
    };

    return (
      <div style={{ marginBottom: '24px' }}>
        <div className="calendar-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <button 
            onClick={() => changeMonth(-1)}
            style={{ padding: '8px 16px', cursor: 'pointer', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px' }}
          >
            ◀ Previous
          </button>
          <h4 style={{ margin: 0 }}>{monthName} {year}</h4>
          <button 
            onClick={() => changeMonth(1)}
            style={{ padding: '8px 16px', cursor: 'pointer', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px' }}
          >
            Next ▶
          </button>
        </div>

        <div className="calendar-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '8px',
          background: 'white'
        }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={{
              textAlign: 'center',
              fontWeight: 'bold',
              padding: '8px',
              background: '#f3f4f6',
              borderRadius: '4px'
            }}>
              {day}
            </div>
          ))}

          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} style={{ padding: '8px' }}></div>
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const selected = isDateSelected(day);
            const today = isToday(day);
            const inRange = isInRange(day);
            const isStart = tempStartDate && tempStartDate.getDate() === day && 
                           tempStartDate.getMonth() === currentMonth.getMonth() &&
                           tempStartDate.getFullYear() === currentMonth.getFullYear();
            const isEnd = tempEndDate && tempEndDate.getDate() === day && 
                         tempEndDate.getMonth() === currentMonth.getMonth() &&
                         tempEndDate.getFullYear() === currentMonth.getFullYear();
            
            let bgColor = 'white';
            let borderColor = '#e5e7eb';
            let textColor = 'black';
            let fontWeight = 'normal';
            let borderWidth = '1px';
            
            // Check if date belongs to any group
            let groupInfo = null;
            for (const group of groups) {
              if (group.dates.some(d => d.toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString())) {
                groupInfo = group;
                break;
              }
            }
            
            if (selected && groupInfo) {
              bgColor = groupInfo.color || '#3b82f6';
              textColor = 'white';
              fontWeight = 'bold';
            } else if (inRange && !selected) {
              bgColor = '#dbeafe';
              textColor = '#1e40af';
            } else if (today && !selected) {
              bgColor = '#eff6ff';
              textColor = '#1e40af';
              borderColor = '#3b82f6';
              borderWidth = '2px';
            }
            
            if (isStart || isEnd) {
              borderColor = '#3b82f6';
              borderWidth = '3px';
            }
            
            return (
              <div
                key={day}
                onClick={() => handleDateClick(day)}
                style={{
                  padding: '12px 4px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  background: bgColor,
                  color: textColor,
                  border: `${borderWidth} solid ${borderColor}`,
                  fontWeight: fontWeight,
                  transition: 'all 0.2s',
                  position: 'relative',
                  minHeight: '45px'
                }}
                onMouseEnter={(e) => {
                  if (!selected && !inRange && !groupInfo) {
                    e.target.style.background = '#eff6ff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selected && !inRange && !groupInfo) {
                    e.target.style.background = bgColor;
                  }
                }}
              >
                <div>{day}</div>
                {isStart && <div style={{ fontSize: '7px', color: '#3b82f6' }}>Start</div>}
                {isEnd && <div style={{ fontSize: '7px', color: '#3b82f6' }}>End</div>}
                {selected && <div style={{ fontSize: '8px', color: 'white' }}>✓</div>}
                {groupInfo && !selected && (
                  <div style={{ 
                    fontSize: '7px', 
                    color: textColor,
                    fontWeight: 'bold',
                    marginTop: '2px',
                    background: 'rgba(255,255,255,0.8)',
                    padding: '1px 4px',
                    borderRadius: '2px'
                  }}>
                    P{groupInfo.phase}-{groupInfo.shortName} ({groupInfo.city})
                  </div>
                )}
                {selected && groupInfo && (
                  <div style={{ 
                    fontSize: '7px', 
                    color: 'white',
                    fontWeight: 'bold',
                    marginTop: '2px'
                  }}>
                    P{groupInfo.phase}-{groupInfo.shortName}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '4px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#4b5563' }}>
            Selected Dates: <strong>{selectedDates.length}</strong> days
            {groups.length > 0 && (
              <span style={{ marginLeft: '12px' }}>
                | Groups: <strong>{groups.map(g => `P${g.phase}-${g.name}`).join(', ')}</strong>
              </span>
            )}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
            Next Phase: <strong>Phase {phaseNumber}</strong> | Next City: <strong>{selectedCity}</strong>
          </p>
          {selectionMode === 'start' && (
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
              💡 Click a start date
            </p>
          )}
          {selectionMode === 'end' && tempStartDate && (
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
              💡 Click an end date (must be after {tempStartDate.toLocaleDateString()})
            </p>
          )}
        </div>

        {groups.length > 0 && (
          <div style={{ 
            marginTop: '12px', 
            padding: '12px', 
            background: 'white', 
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
              🎨 Group Colors:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {groups.map((group, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  fontSize: '12px'
                }}>
                  <span style={{ 
                    display: 'inline-block', 
                    width: '20px', 
                    height: '20px', 
                    background: group.color || '#3b82f6',
                    borderRadius: '4px'
                  }}></span>
                  <span>P{group.phase}-{group.name} ({group.city}) - Rooms: {group.rooms.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRoomAssignment = () => {
    return (
      <div className="room-assignment-container">
        <h3>🏨 Room Assignment Manager</h3>
        
        <div style={{ 
          marginBottom: '24px', 
          padding: '20px', 
          background: 'white', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h4 style={{ marginTop: 0 }}>✈️ Select Date Range (Flight Style)</h4>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ 
                padding: '12px', 
                background: selectionMode === 'start' ? '#dbeafe' : '#f3f4f6',
                borderRadius: '4px',
                border: selectionMode === 'start' ? '2px solid #3b82f6' : '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Start Date</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {tempStartDate ? tempStartDate.toLocaleDateString() : 'Click a date below'}
                </div>
              </div>
            </div>
            
            <div style={{ fontSize: '24px', color: '#6b7280' }}>→</div>
            
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ 
                padding: '12px', 
                background: selectionMode === 'end' ? '#dbeafe' : '#f3f4f6',
                borderRadius: '4px',
                border: selectionMode === 'end' ? '2px solid #3b82f6' : '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>End Date</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {tempEndDate ? tempEndDate.toLocaleDateString() : 'Click a date below'}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => {
                setSelectionMode('start');
                setTempStartDate(null);
                setTempEndDate(null);
                setSelectedDates([]);
                setGroups([]);
                setPhaseNumber(1);
                setRoomAssignments({});
                setSelectedRoomsForGroup([]);
              }}
              style={{
                padding: '8px 16px',
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '4px',
                color: '#dc2626',
                cursor: 'pointer'
              }}
            >
              Clear All
            </button>
          </div>
          
          <div style={{ marginTop: '12px', fontSize: '13px', color: '#6b7280' }}>
            {selectionMode === 'start' ? '💡 Click a start date on the calendar below' : '💡 Click an end date on the calendar below'}
          </div>
          <div style={{ marginTop: '8px', fontSize: '13px', background: '#fef3c7', padding: '8px', borderRadius: '4px' }}>
            ℹ️ Each group gets a Phase number (P1, P2, P3...) and you select which rooms to assign
          </div>
        </div>

        {renderCalendar()}

        {showGroupPopup && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '32px',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
              <h3 style={{ marginTop: 0 }}>🏷️ Create Group - Phase {phaseNumber}</h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Group Name:
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., G1, Family, Friends"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      confirmGroup();
                    }
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Select City:
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setSelectedCity('Makkah')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: selectedCity === 'Makkah' ? '#3b82f6' : '#f3f4f6',
                      color: selectedCity === 'Makkah' ? 'white' : 'black',
                      border: selectedCity === 'Makkah' ? '2px solid #1e40af' : '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    🕋 Makkah
                  </button>
                  <button
                    onClick={() => setSelectedCity('Madina')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: selectedCity === 'Madina' ? '#3b82f6' : '#f3f4f6',
                      color: selectedCity === 'Madina' ? 'white' : 'black',
                      border: selectedCity === 'Madina' ? '2px solid #1e40af' : '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    🕌 Madina
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Select Color:
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {groupColors.map((color, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedColor(color)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: color,
                        cursor: 'pointer',
                        border: selectedColor === color ? '3px solid #1e293b' : '3px solid transparent',
                        transition: 'all 0.2s'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Select Rooms for this Group:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {rooms.map(room => {
                    const isSelected = selectedRoomsForGroup.includes(room.id);
                    return (
                      <div
                        key={room.id}
                        onClick={() => toggleRoomForGroup(room.id)}
                        style={{
                          padding: '8px 16px',
                          border: `2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
                          borderRadius: '6px',
                          background: isSelected ? '#dbeafe' : 'white',
                          cursor: 'pointer',
                          fontWeight: isSelected ? 'bold' : 'normal'
                        }}
                      >
                        Room {room.id} ({room.bed})
                        {isSelected && ' ✓'}
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  Selected: {selectedRoomsForGroup.length > 0 ? selectedRoomsForGroup.join(', ') : 'None selected'}
                </div>
              </div>
              
              <div style={{ 
                padding: '12px', 
                background: '#f3f4f6', 
                borderRadius: '4px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                <div>📅 Date Range:</div>
                <div style={{ fontWeight: 'bold' }}>
                  {tempStartDate?.toLocaleDateString()} → {tempEndDate?.toLocaleDateString()}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  Total days: {tempStartDate && tempEndDate ? 
                    Math.ceil((tempEndDate - tempStartDate) / (1000 * 60 * 60 * 24)) + 1 : 0}
                </div>
                <div style={{ fontSize: '12px', color: '#2563eb', marginTop: '8px', background: '#dbeafe', padding: '6px', borderRadius: '4px' }}>
                  ✨ Phase: <strong>{phaseNumber}</strong> | City: <strong>{selectedCity}</strong> | Rooms: <strong>{selectedRoomsForGroup.length > 0 ? selectedRoomsForGroup.join(', ') : 'None'}</strong>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={confirmGroup}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Create Group ✅
                </button>
                <button
                  onClick={() => {
                    setShowGroupPopup(false);
                    setGroupName('');
                    setSelectionMode('start');
                    setTempStartDate(null);
                    setTempEndDate(null);
                    setSelectedRoomsForGroup([]);
                  }}
                  style={{
                    padding: '10px 20px',
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {renderRoomSchedule()}

        <div id="room-selection-panel" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: '2', minWidth: '400px' }}>
              <h4>Available Rooms</h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '12px'
              }}>
                {rooms.map(room => {
                  const isSelected = selectedRoom === room.id;
                  const available = getAvailableBeds(room);
                  const totalBeds = getMaxBeds(room.bed);
                  const occupancy = getRoomOccupancy(room.id);
                  
                  return (
                    <div
                      key={room.id}
                      onClick={() => setSelectedRoom(room.id)}
                      style={{
                        border: `2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
                        borderRadius: '8px',
                        padding: '12px',
                        background: getRoomColor(room, isSelected),
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '16px' }}>Room {room.id}</strong>
                        <span style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: '#3b82f6',
                          color: 'white'
                        }}>
                          {room.bed}
                        </span>
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '13px', color: '#4b5563' }}>
                        <div>👥 {occupancy}/{totalBeds} occupied</div>
                        <div>🟢 {available} beds available</div>
                      </div>
                      {occupancy > 0 && (
                        <div style={{ marginTop: '8px', fontSize: '12px' }}>
                          {roomAssignments[room.id]?.map((assignment, idx) => (
                            <div key={idx} style={{
                              display: 'inline-block',
                              margin: '2px',
                              padding: '2px 8px',
                              background: '#3b82f6',
                              color: 'white',
                              borderRadius: '12px',
                              fontSize: '11px'
                            }}>
                              {assignment.person}
                              <span 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removePersonFromRoom(room.id, idx);
                                }}
                                style={{ marginLeft: '4px', cursor: 'pointer' }}
                              >
                                ✕
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ flex: '1', minWidth: '300px' }}>
              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px',
                background: 'white'
              }}>
                <h4 style={{ marginTop: 0 }}>Assign Person to Room</h4>
                
                {selectedRoom ? (
                  <>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                        Selected Room:
                      </label>
                      <div style={{
                        padding: '8px 12px',
                        background: '#dbeafe',
                        borderRadius: '4px',
                        fontWeight: 'bold'
                      }}>
                        Room {selectedRoom} - {rooms.find(r => r.id === selectedRoom)?.bed}
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                        Person Name:
                      </label>
                      <input
                        type="text"
                        value={personName}
                        onChange={(e) => setPersonName(e.target.value)}
                        placeholder="Enter person's name"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px'
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && personName.trim() && selectedRoom) {
                            // Find the group this room is assigned to
                            let groupId = null;
                            for (const group of groups) {
                              if (group.rooms.includes(selectedRoom)) {
                                groupId = group.id;
                                break;
                              }
                            }
                            if (groupId) {
                              assignPersonToRoom(selectedRoom, personName.trim(), groupId, tempStartDate || new Date(), tempEndDate || new Date());
                            } else {
                              alert('This room is not assigned to any group. Please assign the room to a group first.');
                            }
                          }
                        }}
                      />
                    </div>

                    <button
                      onClick={() => {
                        if (personName.trim() && selectedRoom) {
                          let groupId = null;
                          for (const group of groups) {
                            if (group.rooms.includes(selectedRoom)) {
                              groupId = group.id;
                              break;
                            }
                          }
                          if (groupId) {
                            assignPersonToRoom(selectedRoom, personName.trim(), groupId, tempStartDate || new Date(), tempEndDate || new Date());
                          } else {
                            alert('This room is not assigned to any group. Please assign the room to a group first.');
                          }
                        } else if (!personName.trim()) {
                          alert('Please enter a person name');
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      Assign Person 🏠
                    </button>

                    <button
                      onClick={() => setSelectedRoom(null)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        marginTop: '8px',
                        background: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Clear Selection
                    </button>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                    <p>Click on a room above to select it</p>
                    <p style={{ fontSize: '14px' }}>Then assign people to that room</p>
                  </div>
                )}
              </div>

              <div style={{
                marginTop: '16px',
                padding: '16px',
                background: '#f0fdf4',
                borderRadius: '8px',
                border: '1px solid #bbf7d0'
              }}>
                <h5 style={{ margin: '0 0 8px 0', color: '#16a34a' }}>📊 Assignment Summary</h5>
                <div style={{ fontSize: '14px', color: '#4b5563' }}>
                  <div>• Total Rooms: <strong>{rooms.length}</strong></div>
                  <div>• Total People Assigned: <strong>
                    {Object.values(roomAssignments).reduce((sum, arr) => sum + arr.length, 0)}
                  </strong></div>
                  <div>• Total Groups: <strong>{groups.length}</strong></div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (Object.keys(roomAssignments).length === 0) {
                    alert('No assignments to clear');
                    return;
                  }
                  if (window.confirm('Are you sure you want to clear all assignments?')) {
                    setRoomAssignments({});
                  }
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '8px',
                  background: '#fee2e2',
                  border: '1px solid #fca5a5',
                  borderRadius: '4px',
                  color: '#dc2626',
                  cursor: 'pointer'
                }}
              >
                Clear All Assignments
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRoomSchedule = () => {
    if (selectedDates.length < 2) {
      return (
        <div style={{ padding: '20px', background: '#fef3c7', borderRadius: '8px', textAlign: 'center' }}>
          <p>Please select dates using the flight-style selector above.</p>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>
            Click a start date, then an end date, and enter a group name.
          </p>
        </div>
      );
    }

    const sortedDates = [...selectedDates].sort((a, b) => a - b);
    const allDates = sortedDates;

    return (
      <div className="room-schedule-container">
        <h4>📅 Room Schedule Overview</h4>
        
        <div style={{ 
          marginBottom: '20px', 
          padding: '16px', 
          background: '#f0fdf4', 
          borderRadius: '8px', 
          border: '1px solid #bbf7d0' 
        }}>
          <h5 style={{ margin: '0 0 8px 0', color: '#16a34a' }}>📊 Groups</h5>
          {groups.map((group, idx) => {
            const dateRange = `${group.startDate.getDate()} ${group.startDate.toLocaleString('default', { month: 'short' })} - ${group.endDate.getDate()} ${group.endDate.toLocaleString('default', { month: 'short' })}`;
            
            return (
              <div key={group.id} style={{
                display: 'inline-block',
                margin: '4px 8px 4px 0',
                padding: '8px 16px',
                background: group.color || '#dbeafe',
                borderRadius: '6px',
                border: `2px solid ${group.color || '#3b82f6'}`,
                color: 'white'
              }}>
                <strong>P{group.phase}-{group.name} ({group.city})</strong>
                <span style={{ marginLeft: '8px', fontSize: '14px' }}>
                  {dateRange} 
                  <span style={{ marginLeft: '8px', background: 'rgba(255,255,255,0.3)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                    {group.dates.length} days
                  </span>
                </span>
                <span style={{ marginLeft: '8px', fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                  Rooms: {group.rooms.join(', ')}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ 
          overflowX: 'auto',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '12px',
          background: 'white'
        }}>
          <table style={{ 
            borderCollapse: 'collapse', 
            width: '100%', 
            fontSize: '13px',
            minWidth: '600px'
          }}>
            <thead>
              <tr>
                <th style={{ 
                  padding: '8px 12px', 
                  border: '1px solid #d1d5db', 
                  background: '#f3f4f6',
                  textAlign: 'center',
                  minWidth: '80px'
                }}>
                  Room
                </th>
                {allDates.map((date, idx) => (
                  <th key={idx} style={{ 
                    padding: '8px 4px', 
                    border: '1px solid #d1d5db', 
                    background: '#f3f4f6',
                    textAlign: 'center',
                    fontSize: '11px',
                    minWidth: '40px'
                  }}>
                    {date.getDate()}
                    <br />
                    <span style={{ fontSize: '9px', color: '#6b7280' }}>
                      {date.toLocaleString('default', { month: 'short' })}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => {
                const maxBeds = getMaxBeds(room.bed);
                
                return (
                  <tr key={room.id}>
                    <td style={{ 
                      padding: '6px 8px', 
                      border: '1px solid #d1d5db',
                      fontWeight: 'bold',
                      background: '#f9fafb'
                    }}>
                      {room.id}
                      <br />
                      <span style={{ fontSize: '10px', color: '#6b7280' }}>
                        {room.bed}
                      </span>
                    </td>
                    {allDates.map((date, idx) => {
                      // Check which group owns this room on this date
                      let groupInfo = null;
                      for (const group of groups) {
                        if (group.rooms.includes(room.id) && 
                            group.dates.some(d => d.toDateString() === date.toDateString())) {
                          groupInfo = group;
                          break;
                        }
                      }
                      
                      const occupancy = getRoomOccupancyOnDate(room.id, date);
                      const isFullyOccupied = occupancy >= maxBeds;
                      
                      let bgColor = '#f3f4f6';
                      let textColor = '#9ca3af';
                      let label = '';
                      
                      if (groupInfo) {
                        if (isFullyOccupied) {
                          bgColor = '#fca5a5';
                          textColor = '#991b1b';
                          label = 'Full';
                        } else if (occupancy > 0) {
                          bgColor = '#fde68a';
                          textColor = '#92400e';
                          label = `${occupancy}/${maxBeds}`;
                        } else {
                          bgColor = groupInfo.color || '#86efac';
                          textColor = 'white';
                          label = 'Available';
                        }
                      }
                      
                      return (
                        <td key={idx} style={{ 
                          padding: '4px', 
                          border: '1px solid #d1d5db',
                          textAlign: 'center',
                          background: bgColor,
                          color: textColor,
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}
                        title={groupInfo ? `P${groupInfo.phase}-${groupInfo.name} (${groupInfo.city}) - ${label}` : 'No booking'}
                        >
                          {groupInfo ? (
                            <>
                              <div>P{groupInfo.phase}-{groupInfo.shortName}</div>
                              <div style={{ fontSize: '8px', marginTop: '2px' }}>
                                {label}
                              </div>
                            </>
                          ) : (
                            <span style={{ fontSize: '8px', color: '#d1d5db' }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          background: '#f9fafb', 
          borderRadius: '8px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center'
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '13px' }}>Legend:</span>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ display: 'inline-block', width: '20px', height: '20px', background: '#86efac', borderRadius: '4px' }}></span>
              <span style={{ fontSize: '12px' }}>Available</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ display: 'inline-block', width: '20px', height: '20px', background: '#fde68a', borderRadius: '4px' }}></span>
              <span style={{ fontSize: '12px' }}>Partially Occupied</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ display: 'inline-block', width: '20px', height: '20px', background: '#fca5a5', borderRadius: '4px' }}></span>
              <span style={{ fontSize: '12px' }}>Full</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ display: 'inline-block', width: '20px', height: '20px', background: '#f3f4f6', borderRadius: '4px' }}></span>
              <span style={{ fontSize: '12px' }}>No Booking</span>
            </div>
          </div>
        </div>

        <div style={{ 
          marginTop: '16px',
          padding: '16px',
          background: '#eff6ff',
          borderRadius: '8px',
          border: '1px solid #bfdbfe',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          <div>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Total Rooms</span>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>{rooms.length}</div>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Total People</span>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>
              {Object.values(roomAssignments).reduce((sum, arr) => sum + arr.length, 0)}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Total Groups</span>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>{groups.length}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderRoomCalculator = () => {
    return (
      <div className="room-calculator-container">
        <h3>🏠 Room Calculator</h3>
        
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '400px' }}>
            {renderCalendar()}

            <button
              onClick={() => {
                if (selectedDates.length === 0) {
                  alert('Please select at least one date first');
                  return;
                }
                setActiveTab('room-assignment');
              }}
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '12px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#059669'}
              onMouseLeave={(e) => e.target.style.background = '#10b981'}
            >
              Go to Room Assignment 🏨
            </button>
          </div>

          <div style={{ flex: '1', minWidth: '300px' }}>
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px',
              background: 'white'
            }}>
              <h4 style={{ marginTop: 0 }}>Room Type Selection</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { key: 'sharing', label: 'Sharing (5 persons)', color: '#16a34a', icon: '👥' },
                  { key: 'quad', label: 'Quad (4 persons)', color: '#2563eb', icon: '👤👤👤👤' },
                  { key: 'triple', label: 'Triple (3 persons)', color: '#9333ea', icon: '👤👤👤' },
                  { key: 'double', label: 'Double (2 persons)', color: '#dc2626', icon: '👤👤' }
                ].map(room => (
                  <div
                    key={room.key}
                    onClick={() => toggleRoomType(room.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 16px',
                      border: `2px solid ${roomSelection[room.key] ? room.color : '#e5e7eb'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: roomSelection[room.key] ? `${room.color}10` : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ fontSize: '20px', marginRight: '12px' }}>{room.icon}</span>
                    <span style={{ flex: 1, fontWeight: roomSelection[room.key] ? 'bold' : 'normal' }}>
                      {room.label}
                    </span>
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: roomSelection[room.key] ? room.color : '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '14px'
                    }}>
                      {roomSelection[room.key] ? '✓' : ''}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Notes:
                </label>
                <textarea
                  value={roomNotes}
                  onChange={(e) => setRoomNotes(e.target.value)}
                  placeholder="Add any special requests or notes..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button
                onClick={() => {
                  const selectedRoomTypes = Object.keys(roomSelection).filter(key => roomSelection[key]);
                  if (selectedRoomTypes.length === 0) {
                    alert('Please select at least one room type');
                    return;
                  }
                  if (selectedDates.length === 0) {
                    alert('Please select at least one date');
                    return;
                  }
                  alert(
                    `Room Booking Summary:\n\n` +
                    `Selected Dates: ${selectedDates.length} days\n` +
                    `Room Types: ${selectedRoomTypes.join(', ')}\n` +
                    `Notes: ${roomNotes || 'None'}\n\n` +
                    `Booking request submitted!`
                  );
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginTop: '16px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
              >
                Book Selected Rooms 🏠
              </button>
            </div>

            <div style={{
              marginTop: '16px',
              padding: '16px',
              background: '#f0fdf4',
              borderRadius: '8px',
              border: '1px solid #bbf7d0'
            }}>
              <h5 style={{ margin: '0 0 8px 0', color: '#16a34a' }}>📊 Quick Summary</h5>
              <div style={{ fontSize: '14px', color: '#4b5563' }}>
                <div>• Total Days Selected: <strong>{selectedDates.length}</strong></div>
                <div>• Room Types Selected: <strong>{Object.keys(roomSelection).filter(k => roomSelection[k]).length}</strong></div>
                {Object.keys(roomSelection).filter(k => roomSelection[k]).length > 0 && (
                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                    {Object.keys(roomSelection).filter(k => roomSelection[k]).join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCalculator = () => {
    const costs = calculatePackageCosts();

    return (
      <div className="calculator-container">
        <h3>💰 Package Calculator</h3>

        <div className="calculator-grid">
          <div className="calculator-inputs">
            <h4>Input Details</h4>

            <div className="input-group">
              <label>1. Flight Ticket Price (PKR):</label>
              <input
                type="number"
                value={flightTicket}
                onChange={(e) => setFlightTicket(e.target.value)}
                placeholder="Enter flight ticket price in PKR"
              />
            </div>

            <div className="input-group">
              <label>2. Riyal Rate (SAR to PKR):</label>
              <div className="rate-input">
                <input
                  type="number"
                  value={manualRayalRate}
                  onChange={(e) => {
                    setManualRayalRate(e.target.value);
                    setRayalRate(e.target.value);
                  }}
                  placeholder="Enter riyal exchange rate"
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
              <label>3. Visa Rate (SAR):</label>
              <input
                type="number"
                value={visaRate}
                onChange={(e) => setVisaRate(e.target.value)}
                placeholder="Default 600 SAR"
              />
            </div>
          </div>

          <div className="calculator-results">
            <h4>Summary</h4>

            <div className="result-item">
              <span className="result-label">Flight Ticket:</span>
              <span className="result-value">PKR {costs.ticketPkr.toLocaleString()}</span>
            </div>

            <div className="result-item">
              <span className="result-label">Visa (SAR):</span>
              <span className="result-value">{costs.visaSar.toLocaleString()} SAR</span>
            </div>

            <div className="result-item">
              <span className="result-label">Visa (PKR):</span>
              <span className="result-value">PKR {costs.visaPkr.toFixed(2)}</span>
            </div>

            <div className="result-item total-final">
              <span className="result-label">Ticket + Visa Total:</span>
              <span className="result-value">PKR {costs.totalTicketVisa.toFixed(2)}</span>
            </div>

            <div className="result-item">
              <span className="result-label">Exchange Rate:</span>
              <span className="result-value">1 SAR = PKR {costs.rate.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="hotel-sharing-table" style={{ marginTop: '24px' }}>
          <h4>Complete Package Breakdown (Including Ticket & Visa)</h4>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
            ✏️ Click on any price or nights value in the table to edit them directly
          </p>
          
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '14px' }}>
            <thead>
              <tr>
                {['Package Type', 'Hotel', 'Price (SAR/night)', 'Nights', 'Sharing (5)', 'Quad (4)', 'Triple (3)', 'Double (2)'].map((h) => (
                  <th
                    key={h}
                    style={{
                      border: '1px solid #d1d5db',
                      padding: '8px 12px',
                      textAlign: 'center',
                      color: '#1d4ed8',
                      background: '#f9fafb',
                      fontWeight: 'bold'
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', fontWeight: 'bold', background: '#f0f7ff' }} rowSpan="2">
                  Without Ticket & Visa
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', color: '#1d4ed8' }}>Makkah</td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', textAlign: 'center' }}>
                  <input
                    type="number"
                    value={hotels.find(h => h.id === 'makkah')?.priceSar || ''}
                    onChange={(e) => updateHotel('makkah', 'priceSar', e.target.value)}
                    style={{
                      width: '70px',
                      padding: '4px 6px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}
                  />
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', textAlign: 'center' }}>
                  <input
                    type="number"
                    value={hotels.find(h => h.id === 'makkah')?.nights || ''}
                    onChange={(e) => updateHotel('makkah', 'nights', e.target.value)}
                    style={{
                      width: '60px',
                      padding: '4px 6px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}
                  />
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', textAlign: 'center', background: '#f0fdf4' }}>
                  {(costs.sharingMakkah).toFixed(2)}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', textAlign: 'center', background: '#eff6ff' }}>
                  {(costs.quadMakkah).toFixed(2)}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', textAlign: 'center', background: '#faf5ff' }}>
                  {(costs.tripleMakkah).toFixed(2)}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', textAlign: 'center', background: '#fef2f2' }}>
                  {(costs.doubleMakkah).toFixed(2)}
                </td>
              </tr>

              <tr>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', color: '#1d4ed8' }}>Madina</td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', textAlign: 'center' }}>
                  <input
                    type="number"
                    value={hotels.find(h => h.id === 'madina')?.priceSar || ''}
                    onChange={(e) => updateHotel('madina', 'priceSar', e.target.value)}
                    style={{
                      width: '70px',
                      padding: '4px 6px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}
                  />
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', textAlign: 'center' }}>
                  <input
                    type="number"
                    value={hotels.find(h => h.id === 'madina')?.nights || ''}
                    onChange={(e) => updateHotel('madina', 'nights', e.target.value)}
                    style={{
                      width: '60px',
                      padding: '4px 6px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}
                  />
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', textAlign: 'center', background: '#f0fdf4' }}>
                  {(costs.sharingMadina).toFixed(2)}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', textAlign: 'center', background: '#eff6ff' }}>
                  {(costs.quadMadina).toFixed(2)}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', textAlign: 'center', background: '#faf5ff' }}>
                  {(costs.tripleMadina).toFixed(2)}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', textAlign: 'center', background: '#fef2f2' }}>
                  {(costs.doubleMadina).toFixed(2)}
                </td>
              </tr>

              <tr>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', fontWeight: 'bold', background: '#fef3c7' }} colSpan="2">
                  Total (Without Ticket & Visa)
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', textAlign: 'center' }} colSpan="2">
                  Both Hotels
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', textAlign: 'center', fontWeight: 'bold', background: '#bbf7d0' }}>
                  {(costs.sharingTotal).toFixed(2)}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', textAlign: 'center', fontWeight: 'bold', background: '#93c5fd' }}>
                  {(costs.quadTotal).toFixed(2)}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', textAlign: 'center', fontWeight: 'bold', background: '#d8b4fe' }}>
                  {(costs.tripleTotal).toFixed(2)}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', textAlign: 'center', fontWeight: 'bold', background: '#fca5a5' }}>
                  {(costs.doubleTotal).toFixed(2)}
                </td>
              </tr>

              <tr>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', fontWeight: 'bold', background: '#dbeafe' }} colSpan="2">
                  Grand Total (With Ticket & Visa)
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', textAlign: 'center' }} colSpan="2">
                  Both Hotels
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', textAlign: 'center', fontWeight: 'bold', background: '#86efac', fontSize: '16px' }}>
                  {(costs.sharingTotal + costs.totalTicketVisa).toFixed(2)}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', textAlign: 'center', fontWeight: 'bold', background: '#60a5fa', fontSize: '16px' }}>
                  {(costs.quadTotal + costs.totalTicketVisa).toFixed(2)}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', textAlign: 'center', fontWeight: 'bold', background: '#c084fc', fontSize: '16px' }}>
                  {(costs.tripleTotal + costs.totalTicketVisa).toFixed(2)}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', textAlign: 'center', fontWeight: 'bold', background: '#f87171', fontSize: '16px' }}>
                  {(costs.doubleTotal + costs.totalTicketVisa).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: '16px', padding: '12px', background: '#f0f7ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#1e40af' }}>
              <strong>📌 How it works:</strong>
              <br />
              • <strong>Sharing (5):</strong> (Hotel Price / 5) × Nights × Exchange Rate
              <br />
              • <strong>Quad (4):</strong> (Hotel Price / 4) × Nights × Exchange Rate
              <br />
              • <strong>Triple (3):</strong> (Hotel Price / 3) × Nights × Exchange Rate
              <br />
              • <strong>Double (2):</strong> (Hotel Price / 2) × Nights × Exchange Rate
              <br />
              • <strong>Grand Total:</strong> Adds Ticket (PKR {costs.ticketPkr.toFixed(2)}) + Visa (PKR {costs.visaPkr.toFixed(2)}) to the hotel total
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container" style={{ maxWidth: '1400px', width: '95%', margin: '0 auto' }}>
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
        <button
          className={`tab-btn ${activeTab === 'room' ? 'active' : ''}`}
          onClick={() => setActiveTab('room')}
        >
          🏠 Room Calculator
        </button>
        <button
          className={`tab-btn ${activeTab === 'room-assignment' ? 'active' : ''}`}
          onClick={() => setActiveTab('room-assignment')}
        >
          🏨 Room Assignment
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
      ) : activeTab === 'calculator' ? (
        renderCalculator()
      ) : activeTab === 'room' ? (
        renderRoomCalculator()
      ) : (
        renderRoomAssignment()
      )}
    </div>
  );
};

export default DatePatternGenerator;