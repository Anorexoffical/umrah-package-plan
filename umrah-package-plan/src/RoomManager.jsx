// components/RoomManager.jsx
import React, { useState, useMemo } from 'react';

const ROOMS = [
  { id: 501, bed: '4BED' }, { id: 502, bed: '4BED' }, { id: 503, bed: '4BED' }, 
  { id: 504, bed: '4BED' }, { id: 505, bed: '4BED' }, { id: 506, bed: '5BED' },
  { id: 507, bed: '4BED' }, { id: 508, bed: '5BED' }, { id: 401, bed: '4BED' },
  { id: 402, bed: '4BED' }
];

const COLORS = ['#1a2b4a', '#b13a4b', '#127a4b', '#b07a1a', '#6d3b8a', '#1f7a7a', '#2563eb', '#dc2626'];

export default function RoomManager() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [groups, setGroups] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [tempStart, setTempStart] = useState(null);
  const [tempEnd, setTempEnd] = useState(null);
  const [selectionMode, setSelectionMode] = useState('start');
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [city, setCity] = useState('Makkah');
  const [personName, setPersonName] = useState('');
  const [selectedRoomForAssign, setSelectedRoomForAssign] = useState(null);
  
  // Phase management
  const [selectedGroupType, setSelectedGroupType] = useState('G1');
  const [selectedPhase, setSelectedPhase] = useState(1);

  // Helper functions
  const dateOnly = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
  const formatDate = (d) => d ? `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}` : '';
  const getDaysInMonth = (m) => new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const getFirstDay = (m) => new Date(m.getFullYear(), m.getMonth(), 1).getDay();

  // Get max phase for a group
  const getMaxPhaseForGroup = (groupType) => {
    const phases = groups.filter(g => g.groupType === groupType);
    if (phases.length === 0) return 0;
    return Math.max(...phases.map(g => g.phase));
  };

  // Get rooms used by previous phases of this group
  const getUsedRoomsForGroup = (groupType, currentPhase) => {
    const previousPhases = groups.filter(g => g.groupType === groupType && g.phase < currentPhase);
    const usedRooms = new Set();
    previousPhases.forEach(g => {
      g.rooms.forEach(room => usedRooms.add(room));
    });
    return usedRooms;
  };

  const getMaxBeds = (roomId) => {
    const room = ROOMS.find(r => r.id === roomId);
    return room ? parseInt(room.bed) : 0;
  };

  const getOccupancyOnDate = (roomId, date) => {
    const assigns = assignments[roomId] || [];
    let count = 0;
    const d = dateOnly(date);
    for (const a of assigns) {
      const start = dateOnly(a.start);
      const end = dateOnly(a.end);
      if (d >= start && d <= end) count++;
    }
    return count;
  };

  const getRoomStatus = (roomId, date) => {
    const occ = getOccupancyOnDate(roomId, date);
    const max = getMaxBeds(roomId);
    if (occ === 0) return 'available';
    if (occ < max) return 'partial';
    return 'full';
  };

  const createGroup = () => {
    if (!tempStart || !tempEnd) {
      alert('Please select start and end dates first');
      return;
    }
    if (selectedRoomIds.length === 0) {
      alert('Please select at least one room');
      return;
    }
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    const start = dateOnly(tempStart);
    const end = dateOnly(tempEnd);
    const dates = [];
    let d = new Date(start);
    while (d <= end) {
      dates.push(new Date(d));
      d = addDays(d, 1);
    }

    const color = COLORS[groups.length % COLORS.length];
    const group = {
      id: Date.now(),
      name: groupName.trim(),
      groupType: selectedGroupType,
      phase: selectedPhase,
      city,
      start,
      end,
      dates,
      rooms: [...selectedRoomIds],
      color,
    };

    setGroups([...groups, group]);
    setGroupName('');
    setSelectedRoomIds([]);
    setTempStart(null);
    setTempEnd(null);
    setSelectionMode('start');
    
    // Auto-increment phase for next creation
    const maxPhase = getMaxPhaseForGroup(selectedGroupType);
    setSelectedPhase(maxPhase + 1);
  };

  const deleteGroup = (groupId) => {
    if (confirm('Delete this group and all its assignments?')) {
      const groupToDelete = groups.find(g => g.id === groupId);
      if (groupToDelete) {
        const newAssignments = { ...assignments };
        groupToDelete.rooms.forEach(roomId => {
          if (newAssignments[roomId]) {
            newAssignments[roomId] = newAssignments[roomId].filter(a => 
              !(a.groupId === groupId)
            );
            if (newAssignments[roomId].length === 0) {
              delete newAssignments[roomId];
            }
          }
        });
        setAssignments(newAssignments);
        setGroups(groups.filter(g => g.id !== groupId));
      }
    }
  };

  const assignPerson = () => {
    if (!selectedRoomForAssign) {
      alert('Select a room');
      return;
    }
    if (!personName.trim()) {
      alert('Enter person name');
      return;
    }

    const start = dateOnly(tempStart);
    const end = dateOnly(tempEnd);
    if (!tempStart || !tempEnd) {
      alert('Select date range first');
      return;
    }
    if (start > end) {
      alert('Start date must be before end date');
      return;
    }

    let valid = false;
    let groupId = null;
    for (const g of groups) {
      if (g.rooms.includes(selectedRoomForAssign)) {
        const gStart = dateOnly(g.start);
        const gEnd = dateOnly(g.end);
        if (start >= gStart && end <= gEnd) {
          valid = true;
          groupId = g.id;
          break;
        }
      }
    }
    if (!valid) {
      alert('Dates must be inside a group phase that includes this room.');
      return;
    }

    const newAssignments = { ...assignments };
    if (!newAssignments[selectedRoomForAssign]) {
      newAssignments[selectedRoomForAssign] = [];
    }
    newAssignments[selectedRoomForAssign].push({
      person: personName.trim(),
      start: start,
      end: end,
      groupId: groupId,
    });
    setAssignments(newAssignments);
    setPersonName('');
  };

  const removePerson = (roomId, index) => {
    const newAssignments = { ...assignments };
    if (newAssignments[roomId]) {
      newAssignments[roomId].splice(index, 1);
      if (newAssignments[roomId].length === 0) {
        delete newAssignments[roomId];
      }
      setAssignments(newAssignments);
    }
  };

  const clearAllAssignments = () => {
    if (confirm('Clear all person assignments?')) {
      setAssignments({});
    }
  };

  const toggleRoomSelection = (roomId) => {
    const usedRooms = getUsedRoomsForGroup(selectedGroupType, selectedPhase);
    if (usedRooms.has(roomId) && !selectedRoomIds.includes(roomId)) {
      alert(`Room ${roomId} is already used in previous phases of ${selectedGroupType}`);
      return;
    }
    setSelectedRoomIds(prev => {
      if (prev.includes(roomId)) {
        return prev.filter(id => id !== roomId);
      }
      return [...prev, roomId];
    });
  };

  const handleDayClick = (day) => {
    const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (selectionMode === 'start') {
      setTempStart(dateObj);
      setTempEnd(null);
      setSelectionMode('end');
    } else if (selectionMode === 'end') {
      if (tempStart && dateObj >= tempStart) {
        setTempEnd(dateObj);
        setSelectionMode('start');
      } else {
        alert('End date must be after start date');
        setTempStart(null);
        setTempEnd(null);
        setSelectionMode('start');
      }
    }
  };

  const changeMonth = (increment) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentMonth(newDate);
  };

  // Auto-populate rooms when group type or phase changes
  React.useEffect(() => {
    if (selectedGroupType && selectedPhase > 1) {
      const usedRooms = getUsedRoomsForGroup(selectedGroupType, selectedPhase);
      const autoSelected = [];
      usedRooms.forEach(roomId => {
        if (!selectedRoomIds.includes(roomId)) {
          autoSelected.push(roomId);
        }
      });
      if (autoSelected.length > 0) {
        setSelectedRoomIds(prev => [...prev, ...autoSelected]);
      }
    }
  }, [selectedGroupType, selectedPhase]);

  // Calendar rendering with group bars below
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDay(currentMonth);
    const today = new Date();
    const monthName = currentMonth.toLocaleString('default', { month: 'long' });

    // Get all groups that have dates in this month
    const groupsInMonth = groups.filter(g => 
      g.dates.some(d => d.getMonth() === month && d.getFullYear() === year)
    );

    return (
      <div className="card">
        <div className="card-title">📆 {monthName} {year}</div>
        <div className="month-nav">
          <button onClick={() => changeMonth(-1)}>◀</button>
          <span>{monthName} {year}</span>
          <button onClick={() => changeMonth(1)}>▶</button>
        </div>

        <div className="date-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontWeight: 'bold', padding: '4px', fontSize: '0.7rem' }}>{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} style={{ padding: '4px' }} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateObj = new Date(year, month, day);
            const isToday = isSameDay(dateObj, today);
            const inRange = tempStart && tempEnd && dateObj >= tempStart && dateObj <= tempEnd;
            const isStart = tempStart && isSameDay(dateObj, tempStart);
            const isEnd = tempEnd && isSameDay(dateObj, tempEnd);

            let style = {
              padding: '8px 2px',
              textAlign: 'center',
              cursor: 'pointer',
              borderRadius: '8px',
              border: '1px solid transparent',
              position: 'relative',
              minHeight: '40px',
            };
            if (isToday) style.borderColor = '#1a2b4a';
            if (inRange) style.background = '#d9e3f5';
            if (isStart || isEnd) {
              style.borderColor = '#1a2b4a';
              style.borderWidth = '3px';
            }

            return (
              <div key={day} style={style} onClick={() => handleDayClick(day)}>
                <div>{day}</div>
                {isStart && <div style={{ fontSize: '0.4rem' }}>🟢</div>}
                {isEnd && <div style={{ fontSize: '0.4rem' }}>🔴</div>}
              </div>
            );
          })}
        </div>

        {/* Group bars below calendar */}
        {groupsInMonth.length > 0 && (
          <div style={{ marginTop: '12px', borderTop: '1px solid #e9edf4', paddingTop: '12px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px' }}>📋 Groups in this month:</div>
            {groupsInMonth.map((group, idx) => {
              // Get the date range for this group within the current month
              const monthStart = new Date(year, month, 1);
              const monthEnd = new Date(year, month, daysInMonth);
              
              // Filter dates that are in this month
              const datesInMonth = group.dates.filter(d => 
                d.getMonth() === month && d.getFullYear() === year
              );
              
              if (datesInMonth.length === 0) return null;
              
              const firstDate = datesInMonth[0];
              const lastDate = datesInMonth[datesInMonth.length - 1];
              
              // Calculate bar position
              const startDay = firstDate.getDate();
              const endDay = lastDate.getDate();
              const barWidth = ((endDay - startDay + 1) / daysInMonth) * 100;
              const barLeft = ((startDay - 1) / daysInMonth) * 100;
              
              return (
                <div key={group.id} style={{ 
                  marginBottom: '6px',
                  position: 'relative',
                  paddingLeft: '60px',
                }}>
                  <span style={{ 
                    position: 'absolute', 
                    left: 0, 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    color: group.color || '#1a2b4a',
                    width: '55px',
                    textAlign: 'right',
                    paddingRight: '8px',
                  }}>
                    {group.groupType}-P{group.phase}
                  </span>
                  <div style={{
                    position: 'relative',
                    height: '24px',
                    background: '#f3f4f6',
                    borderRadius: '12px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute',
                      left: `${barLeft}%`,
                      width: `${barWidth}%`,
                      height: '100%',
                      background: group.color || '#1a2b4a',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      padding: '0 8px',
                    }}>
                      {group.name} ({formatDate(firstDate)} - {formatDate(lastDate)})
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="status-banner" style={{ marginTop: '12px', padding: '8px 12px', background: '#f0f7ff', borderRadius: '12px' }}>
          {tempStart ? `🟢 Start: ${formatDate(tempStart)}` : 'Select start date'}
          {tempEnd && ` 🔴 End: ${formatDate(tempEnd)}`}
          {tempStart && tempEnd && ` 📅 ${Math.ceil((tempEnd - tempStart) / (1000 * 60 * 60 * 24)) + 1} days`}
        </div>
      </div>
    );
  };

  // Room status summary
  const renderRoomStatus = () => {
    const previewDates = [];
    const days = getDaysInMonth(currentMonth);
    for (let d = 1; d <= Math.min(days, 10); d++) {
      previewDates.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
    }

    return (
      <div className="card">
        <div className="card-title">🏠 Room Status (first 10 days)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px' }}>
          {ROOMS.map(room => {
            let statusCount = { available: 0, partial: 0, full: 0 };
            previewDates.forEach(date => {
              const s = getRoomStatus(room.id, date);
              statusCount[s]++;
            });
            const total = previewDates.length;
            const { available, partial, full } = statusCount;
            let bgColor = '#f8faff';
            let label = '✅ free';
            if (available === total) { bgColor = '#d9f0e3'; label = '✅ free'; }
            else if (full === total) { bgColor = '#fde0e3'; label = '🔴 full'; }
            else if (partial > 0) { bgColor = '#fef1d6'; label = '🟡 partial'; }

            const usedInPrevPhases = getUsedRoomsForGroup(selectedGroupType, selectedPhase);
            const isUsedBefore = usedInPrevPhases.has(room.id);

            return (
              <div key={room.id} style={{ 
                background: bgColor, 
                borderRadius: '12px', 
                padding: '8px', 
                textAlign: 'center', 
                border: isUsedBefore ? '2px solid #b13a4b' : '1px solid #e2e9f5',
                position: 'relative'
              }}>
                <div style={{ fontWeight: 'bold' }}>{room.id}</div>
                <div style={{ fontSize: '0.65rem' }}>{room.bed}</div>
                <div style={{ fontSize: '0.6rem' }}>{label}</div>
                {isUsedBefore && (
                  <div style={{ fontSize: '0.5rem', color: '#b13a4b', fontWeight: 'bold' }}>🔒 Used</div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: '8px', display: 'flex', gap: '16px', fontSize: '0.8rem' }}>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#d9f0e3', borderRadius: '4px' }}></span> available</span>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#fef1d6', borderRadius: '4px' }}></span> partial</span>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#fde0e3', borderRadius: '4px' }}></span> full</span>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #b13a4b', borderRadius: '4px' }}></span> used in prev phase</span>
        </div>
      </div>
    );
  };

  // Room schedule overview
  const renderRoomSchedule = () => {
    if (groups.length === 0) {
      return (
        <div className="card">
          <div className="card-title">📅 Room Schedule</div>
          <div className="text-sm">Create groups to see room schedule</div>
        </div>
      );
    }

    const allDates = [];
    groups.forEach(g => {
      g.dates.forEach(d => {
        if (!allDates.some(dd => isSameDay(dd, d))) {
          allDates.push(d);
        }
      });
    });
    allDates.sort((a, b) => a - b);

    if (allDates.length === 0) return null;

    // Only show first 20 days to avoid horizontal scroll
    const displayDates = allDates.slice(0, 20);

    return (
      <div className="card">
        <div className="card-title">📅 Room Schedule Overview</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Room</th>
                {displayDates.map((date, idx) => (
                  <th key={idx} style={{ fontSize: '0.7rem' }}>
                    {date.getDate()}<br />
                    <span style={{ fontWeight: 'normal' }}>{date.toLocaleString('default', { month: 'short' })}</span>
                  </th>
                ))}
                {allDates.length > 20 && (
                  <th style={{ fontSize: '0.7rem' }}>...</th>
                )}
              </tr>
            </thead>
            <tbody>
              {ROOMS.map(room => {
                const maxBeds = getMaxBeds(room.id);
                return (
                  <tr key={room.id}>
                    <td style={{ fontWeight: 'bold' }}>{room.id}</td>
                    {displayDates.map((date, idx) => {
                      let groupInfo = null;
                      for (const g of groups) {
                        if (g.rooms.includes(room.id) && g.dates.some(d => isSameDay(d, date))) {
                          groupInfo = g;
                          break;
                        }
                      }
                      const occupancy = getOccupancyOnDate(room.id, date);
                      const isFull = occupancy >= maxBeds;
                      let bgColor = '#f3f4f6';
                      let label = '—';
                      let textColor = '#9ca3af';

                      if (groupInfo) {
                        if (isFull) {
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
                          label = 'Avail';
                        }
                      }

                      return (
                        <td key={idx} style={{ background: bgColor, color: textColor, fontSize: '0.7rem', textAlign: 'center' }}>
                          {groupInfo ? (
                            <>
                              <div>{groupInfo.groupType}-P{groupInfo.phase}</div>
                              <div style={{ fontSize: '0.6rem' }}>{label}</div>
                            </>
                          ) : '—'}
                        </td>
                      );
                    })}
                    {allDates.length > 20 && (
                      <td style={{ fontSize: '0.7rem', textAlign: 'center' }}>...</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex-row">
        <div className="col">
          {renderCalendar()}
          {renderRoomSchedule()}
        </div>
        <div className="col">
          <div className="card">
            <div className="card-title">🧩 Create Group</div>
            
            <div className="flex" style={{ marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <label className="text-sm" style={{ display: 'block', marginBottom: '2px' }}>Group:</label>
                <select
                  className="input-field"
                  value={selectedGroupType}
                  onChange={(e) => {
                    const newGroup = e.target.value;
                    setSelectedGroupType(newGroup);
                    const maxPhase = getMaxPhaseForGroup(newGroup);
                    setSelectedPhase(maxPhase + 1);
                    setSelectedRoomIds([]);
                  }}
                >
                  {['G1', 'G2', 'G3', 'G4', 'G5'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="text-sm" style={{ display: 'block', marginBottom: '2px' }}>Phase:</label>
                <div className="flex">
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '4px 12px' }}
                    onClick={() => {
                      if (selectedPhase > 1) {
                        setSelectedPhase(selectedPhase - 1);
                        const phaseGroups = groups.filter(g => g.groupType === selectedGroupType && g.phase === selectedPhase - 1);
                        if (phaseGroups.length > 0) {
                          setSelectedRoomIds(phaseGroups[0].rooms);
                        }
                      }
                    }}
                  >
                    −
                  </button>
                  <span style={{ padding: '0 12px', fontWeight: 'bold', minWidth: '30px', textAlign: 'center' }}>
                    {selectedPhase}
                  </span>
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '4px 12px' }}
                    onClick={() => {
                      setSelectedPhase(selectedPhase + 1);
                      const usedRooms = getUsedRoomsForGroup(selectedGroupType, selectedPhase + 1);
                      const prevRoomIds = [];
                      usedRooms.forEach(roomId => {
                        if (!selectedRoomIds.includes(roomId)) {
                          prevRoomIds.push(roomId);
                        }
                      });
                      if (prevRoomIds.length > 0) {
                        setSelectedRoomIds(prev => [...prev, ...prevRoomIds]);
                      }
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="flex">
              <input
                className="input-field"
                placeholder="Group name (e.g. Group A)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
              <select
                className="input-field"
                style={{ width: 'auto', flex: 1 }}
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
                <option value="Makkah">Makkah</option>
                <option value="Madina">Madina</option>
              </select>
            </div>

            <div className="mt-8">
              <span className="text-sm">
                Select rooms for {selectedGroupType}-P{selectedPhase}:
                {selectedPhase > 1 && ' (🔒 rooms from previous phases are auto-selected)'}
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                {ROOMS.map(r => {
                  const usedInPrevPhases = getUsedRoomsForGroup(selectedGroupType, selectedPhase);
                  const isUsedBefore = usedInPrevPhases.has(r.id);
                  const isSelected = selectedRoomIds.includes(r.id);
                  
                  return (
                    <span
                      key={r.id}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        background: isSelected ? '#1a2b4a' : (isUsedBefore ? '#fde0e3' : '#f0f4fe'),
                        color: isSelected ? 'white' : (isUsedBefore ? '#b13a4b' : '#0b1e33'),
                        cursor: isUsedBefore && !isSelected ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem',
                        border: isUsedBefore ? '2px solid #b13a4b' : '1px solid #d9e1ed',
                        opacity: isUsedBefore && !isSelected ? 0.6 : 1,
                      }}
                      onClick={() => {
                        if (isUsedBefore && !isSelected) {
                          alert(`Room ${r.id} is already used in previous phases of ${selectedGroupType}`);
                          return;
                        }
                        toggleRoomSelection(r.id);
                      }}
                    >
                      {r.id} {isUsedBefore && !isSelected && '🔒'}
                    </span>
                  );
                })}
              </div>
              <div className="text-sm mt-8" style={{ fontSize: '0.75rem', color: '#6b7a8f' }}>
                Selected: {selectedRoomIds.length > 0 ? selectedRoomIds.join(', ') : 'None'}
                {selectedRoomIds.length > 0 && ` (${selectedRoomIds.length} rooms)`}
              </div>
            </div>

            <div className="flex mt-8">
              <button className="btn" onClick={createGroup}>
                ➕ Create {selectedGroupType}-P{selectedPhase}
              </button>
              <button className="btn btn-outline" onClick={() => {
                setTempStart(null);
                setTempEnd(null);
                setSelectionMode('start');
                setSelectedRoomIds([]);
              }}>Clear</button>
            </div>
          </div>

          <div className="card">
            <div className="card-title">📋 Existing Groups</div>
            {groups.length === 0 ? (
              <div className="text-sm">No groups created yet</div>
            ) : (
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {groups.map(g => (
                  <div key={g.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '4px 8px',
                    marginBottom: '4px',
                    background: g.color || '#f0f4fe',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${g.color || '#1a2b4a'}`
                  }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                      {g.groupType}-P{g.phase}: {g.name} ({g.city})
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#40546b' }}>
                      {g.rooms.length} rooms • {g.dates.length} days
                    </span>
                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '2px 10px', fontSize: '0.7rem' }}
                      onClick={() => deleteGroup(g.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {renderRoomStatus()}

          <div className="card">
            <div className="card-title">👤 Assign Person</div>
            <div className="flex">
              <input
                className="input-field"
                placeholder="Person name"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
              />
              <select
                className="input-field"
                style={{ width: 'auto', flex: 1 }}
                value={selectedRoomForAssign || ''}
                onChange={(e) => setSelectedRoomForAssign(Number(e.target.value))}
              >
                <option value="">Select Room</option>
                {ROOMS.map(r => (
                  <option key={r.id} value={r.id}>{r.id} ({r.bed})</option>
                ))}
              </select>
            </div>
            <button className="btn btn-success mt-8" onClick={assignPerson}>Assign Person</button>
            <button className="btn btn-danger mt-8" style={{ marginLeft: '8px' }} onClick={clearAllAssignments}>Clear All</button>
          </div>

          <div className="card">
            <div className="card-title">📊 Summary</div>
            <div>Groups: {groups.length}</div>
            <div>People assigned: {Object.values(assignments).reduce((sum, arr) => sum + arr.length, 0)}</div>
            <div>Rooms: {ROOMS.length}</div>
            <div style={{ marginTop: '8px' }}>
              {groups.map(g => (
                <span key={g.id} style={{ 
                  display: 'inline-block', 
                  background: g.color || '#1a2b4a', 
                  color: 'white', 
                  padding: '2px 10px', 
                  borderRadius: '20px', 
                  fontSize: '0.7rem', 
                  margin: '2px' 
                }}>
                  {g.groupType}-P{g.phase}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}