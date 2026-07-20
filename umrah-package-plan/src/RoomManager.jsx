// components/RoomManager.jsx
import React, { useState } from 'react';

// Default rooms with types
const DEFAULT_ROOMS = [
  { id: 501, bed: '4BED', type: 'Quad', capacity: 4 },
  { id: 502, bed: '4BED', type: 'Quad', capacity: 4 },
  { id: 503, bed: '4BED', type: 'Quad', capacity: 4 },
  { id: 504, bed: '4BED', type: 'Quad', capacity: 4 },
  { id: 505, bed: '4BED', type: 'Quad', capacity: 4 },
  { id: 506, bed: '5BED', type: 'Sharing', capacity: 5 },
  { id: 507, bed: '4BED', type: 'Quad', capacity: 4 },
  { id: 508, bed: '5BED', type: 'Sharing', capacity: 5 },
  { id: 401, bed: '4BED', type: 'Quad', capacity: 4 },
  { id: 402, bed: '4BED', type: 'Quad', capacity: 4 }
];

const ROOM_TYPES = {
  'Quad': { label: 'Quad', capacity: 4, icon: '🛏️', bedLabel: '4BED' },
  'Triple': { label: 'Triple', capacity: 3, icon: '🛏️', bedLabel: '3BED' },
  'Double': { label: 'Double', capacity: 2, icon: '🛏️', bedLabel: '2BED' },
  'Sharing': { label: 'Sharing', capacity: 5, icon: '🛏️', bedLabel: '5BED' }
};

const COLORS = ['#4c3fe0', '#e05c6b', '#16a37a', '#e08a1a', '#7c4fd4', '#1f9bb0', '#2563eb', '#d64545'];

const MIN_DAY_WIDTH = 32;
const MAX_DAY_WIDTH = 120;
const ROOM_COL_WIDTH = 168;
const ROW_LANE_HEIGHT = 46;
const ROW_LANE_GAP = 6;
const ROW_PADDING = 8;
const STRIP_HEIGHT = 10;

export default function RoomManager() {
  const [rooms, setRooms] = useState(DEFAULT_ROOMS);
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

  const [selectedGroupType, setSelectedGroupType] = useState('G1');
  const [selectedPhase, setSelectedPhase] = useState(1);
  const [dayWidth, setDayWidth] = useState(64);
  
  // Popup states
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isAddRoomPopupOpen, setIsAddRoomPopupOpen] = useState(false);
  
  // Hover state for date range tooltip
  const [hoveredDate, setHoveredDate] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // Add room form states
  const [newRoomId, setNewRoomId] = useState('');
  const [newRoomType, setNewRoomType] = useState('Quad');
  const [newRoomCustomCapacity, setNewRoomCustomCapacity] = useState(4);

  const zoomIn = () => setDayWidth(w => Math.min(MAX_DAY_WIDTH, w + 12));
  const zoomOut = () => setDayWidth(w => Math.max(MIN_DAY_WIDTH, w - 12));
  const zoomReset = () => setDayWidth(64);

  // Helper functions
  const dateOnly = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
  const formatDate = (d) => d ? `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}` : '';
  const formatDateFull = (d) => d ? `${d.getDate()} ${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}` : '';
  const getDaysInMonth = (m) => new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();

  // Get day of week
  const getDayOfWeek = (d) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[d.getDay()];
  };

  const getMaxPhaseForGroup = (groupType) => {
    const phases = groups.filter(g => g.groupType === groupType);
    if (phases.length === 0) return 0;
    return Math.max(...phases.map(g => g.phase));
  };

  const getMaxBeds = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    return room ? room.capacity : 0;
  };

  const getRoomType = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    return room ? room.type : 'Unknown';
  };

  // Get people count for a specific group
  const getGroupPeopleCount = (groupId) => {
    let count = 0;
    Object.values(assignments).forEach(roomAssignments => {
      roomAssignments.forEach(assignment => {
        if (assignment.groupId === groupId) {
          count++;
        }
      });
    });
    return count;
  };

  // Get people count for a group type
  const getGroupTypePeopleCount = (groupType) => {
    const groupIds = groups.filter(g => g.groupType === groupType).map(g => g.id);
    let count = 0;
    Object.values(assignments).forEach(roomAssignments => {
      roomAssignments.forEach(assignment => {
        if (groupIds.includes(assignment.groupId)) {
          count++;
        }
      });
    });
    return count;
  };

  // Get room occupancy details with group info
  const getRoomOccupancyDetails = (roomId) => {
    const roomAssignments = assignments[roomId] || [];
    const maxBeds = getMaxBeds(roomId);
    const occupied = roomAssignments.length;
    const available = maxBeds - occupied;
    
    // Group assignments by group
    const groupMap = {};
    roomAssignments.forEach(assignment => {
      const group = groups.find(g => g.id === assignment.groupId);
      if (group) {
        const key = `${group.groupType}-P${group.phase}`;
        if (!groupMap[key]) {
          groupMap[key] = { group, people: [] };
        }
        groupMap[key].people.push(assignment.person);
      }
    });
    
    return {
      occupied,
      available,
      maxBeds,
      isFull: occupied >= maxBeds,
      isEmpty: occupied === 0,
      isPartial: occupied > 0 && occupied < maxBeds,
      groups: groupMap,
      assignments: roomAssignments
    };
  };

  // Is this room free (no group booking) on this specific day?
  const isDayFree = (roomId, date) => {
    const d = dateOnly(date);
    return !groups.some(g => g.rooms.includes(roomId) && d >= dateOnly(g.start) && d <= dateOnly(g.end));
  };

  // Contiguous free-day ranges for a room within [start, end]
  const getFreeRangesForRoom = (roomId, start, end) => {
    const ranges = [];
    let rangeStart = null;
    let d = new Date(start);
    while (d <= end) {
      if (isDayFree(roomId, d)) {
        if (!rangeStart) rangeStart = new Date(d);
      } else if (rangeStart) {
        ranges.push({ start: rangeStart, end: addDays(d, -1) });
        rangeStart = null;
      }
      d = addDays(d, 1);
    }
    if (rangeStart) ranges.push({ start: rangeStart, end: new Date(end) });
    return ranges;
  };

  const formatRange = (r) => isSameDay(r.start, r.end) ? formatDate(r.start) : `${formatDate(r.start)} – ${formatDate(r.end)}`;

  // A room is available for the currently selected date range only if no
  // existing group (any type/phase) already occupies it on an overlapping date.
  const getRoomAvailability = (roomId, excludeGroupId = null) => {
    if (!tempStart || !tempEnd) return { available: true, conflict: null };
    const start = dateOnly(tempStart);
    const end = dateOnly(tempEnd);
    for (const g of groups) {
      if (excludeGroupId && g.id === excludeGroupId) continue;
      if (!g.rooms.includes(roomId)) continue;
      const gStart = dateOnly(g.start);
      const gEnd = dateOnly(g.end);
      if (start <= gEnd && end >= gStart) {
        return { available: false, conflict: g };
      }
    }
    return { available: true, conflict: null };
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
    if (occ === 0) return 'empty';
    if (occ < max) return 'partial';
    return 'full';
  };

  // Get occupancy status for a room for the selected date range
  const getRoomOccupancyStatus = (roomId) => {
    if (!tempStart || !tempEnd) return { status: 'unknown', count: 0, max: getMaxBeds(roomId) };
    
    const start = dateOnly(tempStart);
    const end = dateOnly(tempEnd);
    const max = getMaxBeds(roomId);
    
    // Check occupancy for each day in the range
    const occupancyPerDay = [];
    let d = new Date(start);
    while (d <= end) {
      const count = getOccupancyOnDate(roomId, d);
      occupancyPerDay.push(count);
      d = addDays(d, 1);
    }
    
    // Determine overall status
    const totalDays = occupancyPerDay.length;
    const emptyDays = occupancyPerDay.filter(c => c === 0).length;
    const fullDays = occupancyPerDay.filter(c => c >= max).length;
    const partialDays = occupancyPerDay.filter(c => c > 0 && c < max).length;
    
    let status = 'mixed';
    if (emptyDays === totalDays) status = 'empty';
    else if (fullDays === totalDays) status = 'full';
    else if (partialDays === totalDays) status = 'partial';
    else if (emptyDays > 0 && fullDays === 0 && partialDays > 0) status = 'partial-empty';
    else if (fullDays > 0 && partialDays === 0 && emptyDays > 0) status = 'mixed-full-empty';
    
    return { 
      status, 
      count: occupancyPerDay.reduce((a, b) => a + b, 0) / totalDays,
      max,
      emptyDays,
      fullDays,
      partialDays,
      totalDays
    };
  };

  // Add new room
  const addRoom = () => {
    if (!newRoomId.trim()) {
      alert('Please enter a room number/ID');
      return;
    }
    
    const roomId = parseInt(newRoomId.trim());
    if (isNaN(roomId)) {
      alert('Please enter a valid room number');
      return;
    }
    
    // Check if room already exists
    if (rooms.some(r => r.id === roomId)) {
      alert(`Room ${roomId} already exists!`);
      return;
    }
    
    const roomType = ROOM_TYPES[newRoomType];
    const capacity = newRoomType === 'Custom' ? newRoomCustomCapacity : roomType.capacity;
    
    const newRoom = {
      id: roomId,
      bed: roomType.bedLabel,
      type: newRoomType,
      capacity: capacity
    };
    
    setRooms([...rooms, newRoom]);
    setNewRoomId('');
    setIsAddRoomPopupOpen(false);
    alert(`✅ Room ${roomId} (${newRoomType}) added successfully!`);
  };

  // Delete room
  const deleteRoom = (roomId) => {
    // Check if room has any assignments
    if (assignments[roomId] && assignments[roomId].length > 0) {
      alert(`Cannot delete Room ${roomId} as it has people assigned. Please remove all assignments first.`);
      return;
    }
    
    // Check if room is in any group
    const inGroup = groups.some(g => g.rooms.includes(roomId));
    if (inGroup) {
      alert(`Cannot delete Room ${roomId} as it is part of a group. Please remove it from groups first.`);
      return;
    }
    
    if (confirm(`Delete Room ${roomId}?`)) {
      setRooms(rooms.filter(r => r.id !== roomId));
    }
  };

  const createGroup = () => {
    if (!tempStart || !tempEnd) { alert('Please select start and end dates first'); return; }
    if (selectedRoomIds.length === 0) { alert('Please select at least one room'); return; }
    if (!groupName.trim()) { alert('Please enter a group name'); return; }

    // Safety net: re-check every selected room is actually free for this range
    for (const roomId of selectedRoomIds) {
      const { available, conflict } = getRoomAvailability(roomId);
      if (!available) {
        alert(`Room ${roomId} is already booked by ${conflict.groupType}-P${conflict.phase} (${formatDate(conflict.start)} - ${formatDate(conflict.end)}). Please deselect it or change dates.`);
        return;
      }
    }

    const start = dateOnly(tempStart);
    const end = dateOnly(tempEnd);
    const dates = [];
    let d = new Date(start);
    while (d <= end) { dates.push(new Date(d)); d = addDays(d, 1); }

    const color = COLORS[groups.length % COLORS.length];
    const group = {
      id: Date.now(),
      name: groupName.trim(),
      groupType: selectedGroupType,
      phase: selectedPhase,
      city, start, end, dates,
      rooms: [...selectedRoomIds],
      color,
    };

    setGroups([...groups, group]);
    setGroupName('');
    setSelectedRoomIds([]);
    setTempStart(null);
    setTempEnd(null);
    setSelectionMode('start');
    setIsPopupOpen(false);

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
            newAssignments[roomId] = newAssignments[roomId].filter(a => !(a.groupId === groupId));
            if (newAssignments[roomId].length === 0) delete newAssignments[roomId];
          }
        });
        setAssignments(newAssignments);
        setGroups(groups.filter(g => g.id !== groupId));
      }
    }
  };

  const assignPerson = () => {
    if (!selectedRoomForAssign) { alert('Select a room'); return; }
    if (!personName.trim()) { alert('Enter person name'); return; }
    if (!tempStart || !tempEnd) { alert('Select date range first'); return; }

    const start = dateOnly(tempStart);
    const end = dateOnly(tempEnd);
    if (start > end) { alert('Start date must be before end date'); return; }

    // Check if room has capacity
    const max = getMaxBeds(selectedRoomForAssign);
    let hasCapacity = true;
    let d = new Date(start);
    while (d <= end) {
      const occ = getOccupancyOnDate(selectedRoomForAssign, d);
      if (occ >= max) {
        hasCapacity = false;
        break;
      }
      d = addDays(d, 1);
    }
    
    if (!hasCapacity) {
      alert(`Room ${selectedRoomForAssign} is fully occupied during the selected dates. Maximum capacity is ${max} people.`);
      return;
    }

    // Find which group this room belongs to for the selected dates
    let valid = false;
    let groupId = null;
    let groupInfo = null;
    for (const g of groups) {
      if (g.rooms.includes(selectedRoomForAssign)) {
        const gStart = dateOnly(g.start);
        const gEnd = dateOnly(g.end);
        if (start >= gStart && end <= gEnd) { 
          valid = true; 
          groupId = g.id;
          groupInfo = g;
          break; 
        }
      }
    }
    if (!valid) { 
      alert('Dates must be inside a group phase that includes this room.'); 
      return; 
    }

    const newAssignments = { ...assignments };
    if (!newAssignments[selectedRoomForAssign]) newAssignments[selectedRoomForAssign] = [];
    newAssignments[selectedRoomForAssign].push({ 
      person: personName.trim(), 
      start, 
      end, 
      groupId,
      groupType: groupInfo.groupType,
      groupPhase: groupInfo.phase
    });
    setAssignments(newAssignments);
    setPersonName('');
    alert(`✅ ${personName} assigned to Room ${selectedRoomForAssign} (${groupInfo.groupType}-P${groupInfo.phase}) from ${formatDate(start)} to ${formatDate(end)}`);
  };

  const removePerson = (roomId, index) => {
    const newAssignments = { ...assignments };
    if (newAssignments[roomId]) {
      newAssignments[roomId].splice(index, 1);
      if (newAssignments[roomId].length === 0) delete newAssignments[roomId];
      setAssignments(newAssignments);
    }
  };

  const clearAllAssignments = () => {
    if (confirm('Clear all person assignments?')) setAssignments({});
  };

  const toggleRoomSelection = (roomId) => {
    if (!tempStart || !tempEnd) {
      alert('Select a start and end date first, then choose rooms.');
      return;
    }
    const isSelected = selectedRoomIds.includes(roomId);
    if (!isSelected) {
      const { available, conflict } = getRoomAvailability(roomId);
      if (!available) {
        alert(`Room ${roomId} is already booked by ${conflict.groupType}-P${conflict.phase} (${formatDate(conflict.start)} - ${formatDate(conflict.end)}) for an overlapping date range.`);
        return;
      }
    }
    setSelectedRoomIds(prev => prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]);
  };

  const handleDayClick = (dateObj) => {
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

  // Handle date hover for tooltip - SIMPLIFIED
  const handleDateHover = (dateObj, event) => {
    if (!tempStart) return;
    
    setHoveredDate(dateObj);
    setTooltipPosition({
      x: event.clientX,
      y: event.clientY
    });
  };

  const handleDateLeave = () => {
    setHoveredDate(null);
  };

  const changeMonth = (increment) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentMonth(newDate);
  };

  const goToToday = () => setCurrentMonth(new Date());

  // ---------- Date hover tooltip - SUPER SMALL ----------
  const renderDateTooltip = () => {
    if (!hoveredDate || !tempStart) return null;
    
    const dateObj = hoveredDate;
    const dayNumber = dateObj.getDate();
    
    return (
      <div style={{
        position: 'fixed',
        left: tooltipPosition.x + 12,
        top: tooltipPosition.y - 8,
        background: '#1a2b4a',
        borderRadius: '50%',
        width: '28px',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
        zIndex: 10000,
        pointerEvents: 'none',
        transform: 'translateY(-50%)',
        border: '2px solid #ffffff',
        color: '#ffffff',
        fontSize: '11px',
        fontWeight: 800,
        transition: 'all 0.1s ease'
      }}>
        {dayNumber}
      </div>
    );
  };

  // ---------- Important notifications: arrivals, departures, rooms freeing up soon ----------
  const renderNotifications = () => {
    const today = dateOnly(new Date());
    const tomorrow = dateOnly(addDays(today, 1));
    const soonLimit = addDays(today, 3);

    const dayLabel = (d) => {
      const dd = dateOnly(d);
      if (isSameDay(dd, today)) return 'today';
      if (isSameDay(dd, tomorrow)) return 'tomorrow';
      return formatDate(dd);
    };

    const arrivals = groups
      .filter(g => dateOnly(g.start) >= today && dateOnly(g.start) <= tomorrow)
      .sort((a, b) => a.start - b.start);

    const departures = groups
      .filter(g => dateOnly(g.end) >= today && dateOnly(g.end) <= tomorrow)
      .sort((a, b) => a.end - b.end);

    const freeingRooms = [];
    rooms.forEach(room => {
      const activeGroup = groups.find(g => g.rooms.includes(room.id) && dateOnly(g.end) >= today && dateOnly(g.start) <= today);
      if (activeGroup && dateOnly(activeGroup.end) <= soonLimit) {
        freeingRooms.push({ room, group: activeGroup });
      }
    });
    freeingRooms.sort((a, b) => a.group.end - b.group.end);

    const hasAnything = arrivals.length > 0 || departures.length > 0 || freeingRooms.length > 0;

    return (
      <div className="card" style={{
        background: '#ffffff', borderRadius: '18px', boxShadow: '0 4px 6px rgba(0,0,0,0.08)',
        padding: '18px 22px', marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 800, color: '#161b22' }}>🔔 Important Notifications</h3>

        {!hasAnything && (
          <div style={{ fontSize: '13px', color: '#8a93a6' }}>Nothing arriving or leaving in the next few days.</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {arrivals.map(g => (
            <div key={`arr-${g.id}`} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
              background: '#eef4ff', border: '1px solid #d3e2ff', borderRadius: '10px'
            }}>
              <span style={{ fontSize: '18px' }}>🚐</span>
              <span style={{ fontSize: '13px', color: '#1a202c' }}>
                <strong>{g.groupType}-P{g.phase} · {g.name}</strong> ({g.city}) arrives <strong>{dayLabel(g.start)}</strong>, {formatDate(g.start)} — {g.rooms.length} room{g.rooms.length !== 1 ? 's' : ''} ({g.rooms.join(', ')})
              </span>
            </div>
          ))}

          {departures.map(g => (
            <div key={`dep-${g.id}`} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
              background: '#fff5eb', border: '1px solid #f5dfc0', borderRadius: '10px'
            }}>
              <span style={{ fontSize: '18px' }}>🚪</span>
              <span style={{ fontSize: '13px', color: '#1a202c' }}>
                <strong>{g.groupType}-P{g.phase} · {g.name}</strong> ({g.city}) departs <strong>{dayLabel(g.end)}</strong>, {formatDate(g.end)} — rooms {g.rooms.join(', ')} will become free
              </span>
            </div>
          ))}

          {freeingRooms.map(({ room, group }) => (
            <div key={`free-${room.id}`} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
              background: '#effaf3', border: '1px solid #c9ecd6', borderRadius: '10px'
            }}>
              <span style={{ fontSize: '18px' }}>🟢</span>
              <span style={{ fontSize: '13px', color: '#1a202c' }}>
                Room <strong>{room.id}</strong> ({room.type}) frees up <strong>{dayLabel(addDays(group.end, 1))}</strong>, {formatDate(addDays(group.end, 1))} — after {group.groupType}-P{group.phase} · {group.name} checks out
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ---------- Gantt-style timeline calendar ----------
  const renderGanttTimeline = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleString('default', { month: 'long' });
    const today = new Date();
    const todayIsInMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDayIndex = todayIsInMonth ? today.getDate() - 1 : -1;

    const trackWidth = daysInMonth * dayWidth;

    const dayList = Array.from({ length: daysInMonth }).map((_, i) => {
      const day = i + 1;
      const dateObj = new Date(year, month, day);
      return {
        day,
        dateObj,
        isToday: isSameDay(dateObj, today),
        isWeekend: dateObj.getDay() === 0 || dateObj.getDay() === 6,
        isStart: tempStart && isSameDay(dateObj, tempStart),
        isEnd: tempEnd && isSameDay(dateObj, tempEnd),
        inRange: tempStart && tempEnd && dateObj >= tempStart && dateObj <= tempEnd,
        weekday: dateObj.toLocaleString('default', { weekday: 'short' })[0],
        fullWeekday: getDayOfWeek(dateObj),
      };
    });

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month, daysInMonth);

    // Precompute lane-assigned bars per room
    const roomRows = rooms.map(room => {
      const roomGroups = groups
        .filter(g => g.rooms.includes(room.id) && g.end >= monthStart && g.start <= monthEnd)
        .sort((a, b) => a.start - b.start);

      const laneEnds = [];
      const bars = roomGroups.map(g => {
        const visStart = g.start < monthStart ? monthStart : g.start;
        const visEnd = g.end > monthEnd ? monthEnd : g.end;
        const startIdx = Math.round((visStart - monthStart) / 86400000);
        const endIdx = Math.round((visEnd - monthStart) / 86400000);

        let lane = 0;
        while (laneEnds[lane] !== undefined && laneEnds[lane] >= startIdx) lane++;
        laneEnds[lane] = endIdx;

        const totalBeds = g.rooms.reduce((sum, rid) => {
          const r = rooms.find(rr => rr.id === rid);
          return sum + (r ? r.capacity : 0);
        }, 0);

        return {
          group: g,
          lane,
          left: startIdx * dayWidth,
          width: (endIdx - startIdx + 1) * dayWidth,
          clippedLeft: g.start < monthStart,
          clippedRight: g.end > monthEnd,
          totalBeds,
        };
      });

      const laneCount = Math.max(1, laneEnds.length);
      const rowHeight = laneCount * ROW_LANE_HEIGHT + (laneCount - 1) * ROW_LANE_GAP + ROW_PADDING * 2 + STRIP_HEIGHT + 6;

      return { room, bars, laneCount, rowHeight };
    });

    return (
      <div className="card" style={{ background: '#ffffff', borderRadius: '18px', boxShadow: '0 4px 6px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {/* Header bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 22px', borderBottom: '1px solid #edf0f5', flexWrap: 'wrap', gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#161b22' }}>Room Occupancy Calendar</h2>
            {/* Add Room Button */}
            <button
              onClick={() => setIsAddRoomPopupOpen(true)}
              style={{
                padding: '10px 24px',
                background: 'linear-gradient(135deg, #16a37a 0%, #0d8a65 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 12px rgba(22, 163, 122, 0.3)',
                transition: 'all 0.3s ease',
                letterSpacing: '0.3px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px) scale(1.02)';
                e.target.style.boxShadow = '0 6px 20px rgba(22, 163, 122, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 4px 12px rgba(22, 163, 122, 0.3)';
              }}
            >
              <span style={{ fontSize: '20px' }}>➕</span>
              Add Room
            </button>
            <button
              onClick={() => setIsPopupOpen(true)}
              style={{
                padding: '10px 24px',
                background: 'linear-gradient(135deg, #1a2b4a 0%, #2a3d5f 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 12px rgba(26, 43, 74, 0.25)',
                transition: 'all 0.3s ease',
                letterSpacing: '0.3px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px) scale(1.02)';
                e.target.style.boxShadow = '0 6px 20px rgba(26, 43, 74, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 4px 12px rgba(26, 43, 74, 0.25)';
              }}
            >
              <span style={{ fontSize: '20px' }}>🧩</span>
              Create Group
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => changeMonth(-1)} style={navBtnStyle}>◀</button>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#161b22', minWidth: '130px', textAlign: 'center' }}>
              {monthName} {year}
            </span>
            <button onClick={() => changeMonth(1)} style={navBtnStyle}>▶</button>
            <button onClick={goToToday} style={{ ...navBtnStyle, width: 'auto', padding: '8px 14px', fontWeight: 600 }}>☀ Today</button>
            <div style={{ width: '1px', height: '24px', background: '#e2e8f0', margin: '0 4px' }} />
            <button onClick={zoomOut} style={navBtnStyle} title="Zoom out">−</button>
            <span
              onClick={zoomReset}
              style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', minWidth: '42px', textAlign: 'center', cursor: 'pointer' }}
              title="Reset zoom"
            >
              {Math.round((dayWidth / 64) * 100)}%
            </span>
            <button onClick={zoomIn} style={navBtnStyle} title="Zoom in">+</button>
          </div>
        </div>

        {/* Selection status */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap',
          padding: '10px 22px', background: '#f7f8fc', borderBottom: '1px solid #edf0f5', gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', fontSize: '13px', color: '#3a4150' }}>
            <span>🟢 {tempStart ? `Start: ${formatDate(tempStart)}` : 'Click a date to select start'}</span>
            <span>🔴 {tempEnd ? `End: ${formatDate(tempEnd)}` : 'Then click end date'}</span>
            {tempStart && tempEnd && (
              <span style={{ background: '#e8edff', color: '#3143c9', padding: '3px 12px', borderRadius: '20px', fontWeight: 700 }}>
                {Math.ceil((tempEnd - tempStart) / 86400000) + 1} days
              </span>
            )}
          </div>
          {tempStart && (
            <button onClick={() => { setTempStart(null); setTempEnd(null); setSelectionMode('start'); }}
              style={{ padding: '4px 12px', border: '1px solid #dfe3ee', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '12px' }}>
              Clear selection
            </button>
          )}
        </div>

        {/* Availability report for the selected range */}
        {tempStart && tempEnd && (() => {
          const rStart = dateOnly(tempStart);
          const rEnd = dateOnly(tempEnd);
          const totalDays = Math.round((rEnd - rStart) / 86400000) + 1;

          const getBookedRanges = (roomId, start, end) => {
            const ranges = [];
            let rangeStart = null;
            let d = new Date(start);
            while (d <= end) {
              if (!isDayFree(roomId, d)) {
                if (!rangeStart) rangeStart = new Date(d);
              } else if (rangeStart) {
                ranges.push({ start: rangeStart, end: addDays(d, -1) });
                rangeStart = null;
              }
              d = addDays(d, 1);
            }
            if (rangeStart) ranges.push({ start: rangeStart, end: new Date(end) });
            return ranges;
          };

          const report = rooms.map(room => {
            const freeRanges = getFreeRangesForRoom(room.id, rStart, rEnd);
            const bookedRanges = getBookedRanges(room.id, rStart, rEnd);
            const freeDays = freeRanges.reduce((sum, r) => sum + Math.round((r.end - r.start) / 86400000) + 1, 0);
            let status = 'occupied';
            if (freeDays === totalDays) status = 'free';
            else if (freeDays > 0) status = 'partial';
            return { room, freeRanges, bookedRanges, freeDays, status };
          });
          const freeCount = report.filter(r => r.status === 'free').length;
          const partialCount = report.filter(r => r.status === 'partial').length;
          const rangesText = (ranges) => ranges.length === 0 ? '' :
            ranges.length === 1 ? formatRange(ranges[0]) : `${formatRange(ranges[0])} +${ranges.length - 1} more`;

          return (
            <div style={{ padding: '14px 22px', background: '#fbfdff', borderBottom: '1px solid #edf0f5' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a202c', marginBottom: '10px' }}>
                📋 Availability report · {formatDate(tempStart)} – {formatDate(tempEnd)} &nbsp;
                <span style={{ fontWeight: 500, color: '#6b7280' }}>
                  ({freeCount} fully free{partialCount > 0 ? `, ${partialCount} partially free` : ''})
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {report.map(({ room, freeRanges, bookedRanges, status }) => {
                  const palette = {
                    free: { bg: '#e7f7ef', color: '#16a37a', border: '#bfe9d4', label: '✅ Free the whole range' },
                    partial: { bg: '#fff6e0', color: '#a8710a', border: '#f2dfa6', label: '' },
                    occupied: { bg: '#fdeceb', color: '#c0392b', border: '#f5c6c1', label: '' },
                  }[status];
                  return (
                    <div
                      key={room.id}
                      title={
                        status === 'partial'
                          ? `Booked: ${bookedRanges.map(formatRange).join(', ')}\nFree: ${freeRanges.map(formatRange).join(', ')}`
                          : status === 'occupied'
                            ? `Booked: ${bookedRanges.map(formatRange).join(', ')}`
                            : ''
                      }
                      style={{
                        padding: '6px 12px', borderRadius: '10px', background: palette.bg, color: palette.color,
                        border: `1px solid ${palette.border}`, fontSize: '12px', minWidth: '150px', textAlign: 'center'
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{room.id}</div>
                      <div style={{ fontSize: '9px', color: '#6b7280' }}>{room.type} · {room.capacity} beds</div>
                      {status === 'free' && (
                        <div style={{ fontSize: '10px', fontWeight: 600 }}>{palette.label}</div>
                      )}
                      {status === 'occupied' && (
                        <div style={{ fontSize: '10px', fontWeight: 600 }}>
                          🔒 Booked {rangesText(bookedRanges)}
                        </div>
                      )}
                      {status === 'partial' && (
                        <div style={{ fontSize: '10px', fontWeight: 600, lineHeight: 1.4 }}>
                          🔒 Booked {rangesText(bookedRanges)}<br />
                          ✅ Free {rangesText(freeRanges)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Scrollable Gantt grid */}
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: ROOM_COL_WIDTH + trackWidth }}>

            {/* Date header row */}
            <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 3, background: '#fff' }}>
              <div style={{
                width: ROOM_COL_WIDTH, minWidth: ROOM_COL_WIDTH, position: 'sticky', left: 0, zIndex: 4,
                background: '#fff', borderRight: '2px solid #edf0f5', borderBottom: '2px solid #edf0f5',
                display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: '12px', fontWeight: 700, color: '#8a93a6'
              }}>
                ROOM
              </div>
              <div style={{ display: 'flex', borderBottom: '2px solid #edf0f5' }}>
                {dayList.map(d => (
                  <div
                    key={d.day}
                    onClick={() => handleDayClick(d.dateObj)}
                    onMouseEnter={(e) => handleDateHover(d.dateObj, e)}
                    onMouseLeave={handleDateLeave}
                    onMouseMove={(e) => {
                      if (tempStart) {
                        setTooltipPosition({ x: e.clientX, y: e.clientY });
                      }
                    }}
                    style={{
                      width: dayWidth, minWidth: dayWidth, textAlign: 'center', cursor: 'pointer',
                      padding: '8px 0', 
                      background: d.inRange ? '#eef3ff' : (d.isToday ? '#e9f2ff' : 'transparent'),
                      borderLeft: '1px solid #f2f4f8',
                      position: 'relative',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ fontSize: '10px', color: d.isWeekend ? '#e0585f' : '#a4acbc', fontWeight: 600 }}>{d.weekday}</div>
                    <div style={{
                      margin: '2px auto 0', width: '26px', height: '26px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700,
                      background: d.isStart || d.isEnd ? '#3b5bff' : (d.isToday ? '#3b5bff' : 'transparent'),
                      color: d.isStart || d.isEnd || d.isToday ? '#fff' : (d.isWeekend ? '#e0585f' : '#2b3242'),
                      border: (d.isStart || d.isEnd) ? '2px solid #22348f' : 'none'
                    }}>
                      {d.day}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Room rows */}
            {roomRows.map(({ room, bars, rowHeight }) => {
              const details = getRoomOccupancyDetails(room.id);
              const statusColor = details.isEmpty ? '#16a37a' : (details.isFull ? '#c0392b' : '#a8710a');
              const statusText = details.isEmpty ? 'Empty' : (details.isFull ? 'Full' : `${details.occupied}/${details.maxBeds}`);
              const statusEmoji = details.isEmpty ? '🟢' : (details.isFull ? '🔴' : '🟡');
              
              return (
                <div key={room.id} style={{ display: 'flex', borderBottom: '1px solid #f2f4f8' }}>
                  {/* Left frozen room label */}
                  <div style={{
                    width: ROOM_COL_WIDTH, minWidth: ROOM_COL_WIDTH, position: 'sticky', left: 0, zIndex: 2,
                    background: '#fff', borderRight: '2px solid #edf0f5', display: 'flex', alignItems: 'center',
                    gap: '10px', padding: '0 14px', height: rowHeight
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px', background: '#eef1f8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0
                    }}>
                      🛏️
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#161b22' }}>{room.id}</div>
                      <div style={{ fontSize: '11px', color: '#8a93a6' }}>{room.type} · {room.capacity} beds</div>
                      <div style={{ 
                        fontSize: '10px', 
                        color: statusColor,
                        fontWeight: 600,
                        marginTop: '2px'
                      }}>
                        {statusEmoji} {statusText}
                        {!details.isEmpty && !details.isFull && ` (${details.available} available)`}
                      </div>
                      {!details.isEmpty && Object.keys(details.groups).length > 0 && (
                        <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '1px' }}>
                          {Object.keys(details.groups).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Track with bars */}
                  <div style={{
                    position: 'relative', width: trackWidth, minWidth: trackWidth, height: rowHeight,
                    backgroundImage: `repeating-linear-gradient(to right, transparent, transparent ${dayWidth - 1}px, #f5f6fa ${dayWidth - 1}px, #f5f6fa ${dayWidth}px)`
                  }}>
                    {todayIsInMonth && (
                      <div style={{
                        position: 'absolute', left: todayDayIndex * dayWidth, top: 0, bottom: 0, width: dayWidth,
                        background: 'rgba(59,91,255,0.07)', borderLeft: '2px solid #b6c4ff', zIndex: 0
                      }} />
                    )}
                    {tempStart && tempEnd && tempEnd >= monthStart && tempStart <= monthEnd && (() => {
                      const visStart = tempStart < monthStart ? monthStart : dateOnly(tempStart);
                      const visEnd = tempEnd > monthEnd ? monthEnd : dateOnly(tempEnd);
                      const sIdx = Math.round((visStart - monthStart) / 86400000);
                      const eIdx = Math.round((visEnd - monthStart) / 86400000);
                      return (
                        <div style={{
                          position: 'absolute', left: sIdx * dayWidth, top: 0, bottom: 0, width: (eIdx - sIdx + 1) * dayWidth,
                          background: 'rgba(255, 196, 0, 0.06)', zIndex: 0, pointerEvents: 'none'
                        }} />
                      );
                    })()}
                    {/* Per-day availability heatmap strip */}
                    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 4, display: 'flex', zIndex: 0 }}>
                      {dayList.map(d => {
                        const free = isDayFree(room.id, d.dateObj);
                        return (
                          <div
                            key={d.day}
                            title={`${room.id} · ${formatDate(d.dateObj)} · ${free ? 'Empty' : 'Occupied'}`}
                            style={{
                              width: dayWidth, height: STRIP_HEIGHT, boxSizing: 'border-box',
                              padding: '0 3px'
                            }}
                          >
                            <div style={{
                              width: '100%', height: '100%', borderRadius: '3px',
                              background: free ? '#8fe0b8' : '#f3b3ae'
                            }} />
                          </div>
                        );
                      })}
                    </div>
                    {bars.map(b => (
                      <div
                        key={b.group.id}
                        title={`${b.group.groupType}-P${b.group.phase}: ${b.group.name} (${b.group.city})`}
                        style={{
                          position: 'absolute',
                          left: b.left + 3,
                          width: b.width - 6,
                          top: ROW_PADDING + b.lane * (ROW_LANE_HEIGHT + ROW_LANE_GAP),
                          height: ROW_LANE_HEIGHT,
                          background: b.group.color,
                          borderRadius: `${b.clippedLeft ? 4 : 12}px ${b.clippedRight ? 4 : 12}px ${b.clippedRight ? 4 : 12}px ${b.clippedLeft ? 4 : 12}px`,
                          color: '#fff', padding: '5px 12px', boxSizing: 'border-box',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 1,
                          display: 'flex', flexDirection: 'column', justifyContent: 'center'
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {b.group.groupType}-P{b.group.phase} · {b.group.name}
                        </div>
                        <div style={{ fontSize: '10px', opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {b.group.city} · {b.totalBeds} beds
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', padding: '14px 22px', borderTop: '1px solid #edf0f5', fontSize: '12px', color: '#6b7280', alignItems: 'center' }}>
          <span>Click a date twice (start, then end) to select a range for creating a group or assigning a person.</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '14px', height: '8px', borderRadius: '3px', background: '#8fe0b8', display: 'inline-block' }} /> empty day
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '14px', height: '8px', borderRadius: '3px', background: '#f3b3ae', display: 'inline-block' }} /> occupied day
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#6b7280' }}>
            💡 Hover over dates to see day number
          </span>
        </div>
      </div>
    );
  };

  const navBtnStyle = {
    width: '34px', height: '34px', border: '1px solid #e2e8f0', borderRadius: '8px',
    background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#2b3242'
  };

  // Room status summary with G1 and G2 slots
  const renderRoomStatus = () => {
    const previewDates = [];
    const days = getDaysInMonth(currentMonth);
    for (let d = 1; d <= Math.min(days, 10); d++) {
      previewDates.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
    }

    const g1Groups = groups.filter(g => g.groupType === 'G1');
    const g2Groups = groups.filter(g => g.groupType === 'G2');
    const g1Rooms = new Set();
    const g2Rooms = new Set();
    g1Groups.forEach(g => g.rooms.forEach(room => g1Rooms.add(room)));
    g2Groups.forEach(g => g.rooms.forEach(room => g2Rooms.add(room)));

    // Get G1 and G2 people counts
    const g1PeopleCount = getGroupTypePeopleCount('G1');
    const g2PeopleCount = getGroupTypePeopleCount('G2');
    const totalPeople = Object.values(assignments).reduce((sum, arr) => sum + arr.length, 0);

    return (
      <div className="card" style={{ background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', color: '#1a202c' }}>
          🏠 Room Status (first 10 days)
        </h3>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px', color: '#1a2b4a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '4px', height: '16px', background: '#1a2b4a', borderRadius: '2px' }} />
            G1 Slots (Phase 1-{getMaxPhaseForGroup('G1') || 1}) · 👥 {g1PeopleCount} people
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px' }}>
            {rooms.map(room => {
              const isG1Room = g1Rooms.has(room.id);
              const isG2Room = g2Rooms.has(room.id);
              let statusCount = { empty: 0, partial: 0, full: 0 };
              previewDates.forEach(date => { statusCount[getRoomStatus(room.id, date)]++; });
              const total = previewDates.length;
              const { empty, partial, full } = statusCount;
              let bgColor = '#f8faff';
              let label = '✅ empty';
              if (empty === total) { bgColor = '#d9f0e3'; label = '✅ empty'; }
              else if (full === total) { bgColor = '#fde0e3'; label = '🔴 full'; }
              else if (partial > 0) { bgColor = '#fef1d6'; label = '🟡 partial'; }

              const details = getRoomOccupancyDetails(room.id);
              const statusEmoji = details.isEmpty ? '🟢' : (details.isFull ? '🔴' : '🟡');
              const statusText = details.isEmpty ? 'Empty' : (details.isFull ? 'Full' : `${details.occupied}/${details.maxBeds}`);

              return (
                <div key={room.id} style={{
                  background: isG1Room ? '#e8f0fe' : bgColor, borderRadius: '12px', padding: '8px', textAlign: 'center',
                  border: isG1Room ? '2px solid #1a2b4a' : (isG2Room ? '2px solid #b13a4b' : '1px solid #e2e9f5'),
                  position: 'relative', opacity: isG2Room && !isG1Room ? 0.7 : 1
                }}>
                  <div style={{ fontWeight: 'bold' }}>{room.id}</div>
                  <div style={{ fontSize: '0.65rem' }}>{room.type}</div>
                  <div style={{ fontSize: '0.6rem', marginTop: '2px' }}>
                    {isG1Room ? '🔵 G1' : (isG2Room ? '🔴 G2' : label)}
                  </div>
                  <div style={{ fontSize: '0.55rem', color: '#6b7280', marginTop: '1px' }}>
                    {statusEmoji} {statusText}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px', color: '#b13a4b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '4px', height: '16px', background: '#b13a4b', borderRadius: '2px' }} />
            G2 Slots (Phase 1-{getMaxPhaseForGroup('G2') || 1}) · 👥 {g2PeopleCount} people
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px' }}>
            {rooms.map(room => {
              const isG2Room = g2Rooms.has(room.id);
              let statusCount = { empty: 0, partial: 0, full: 0 };
              previewDates.forEach(date => { statusCount[getRoomStatus(room.id, date)]++; });
              const total = previewDates.length;
              const { empty, partial, full } = statusCount;
              let bgColor = '#f8faff';
              let label = '✅ empty';
              if (empty === total) { bgColor = '#d9f0e3'; label = '✅ empty'; }
              else if (full === total) { bgColor = '#fde0e3'; label = '🔴 full'; }
              else if (partial > 0) { bgColor = '#fef1d6'; label = '🟡 partial'; }

              const details = getRoomOccupancyDetails(room.id);
              const statusEmoji = details.isEmpty ? '🟢' : (details.isFull ? '🔴' : '🟡');
              const statusText = details.isEmpty ? 'Empty' : (details.isFull ? 'Full' : `${details.occupied}/${details.maxBeds}`);

              return (
                <div key={room.id} style={{
                  background: isG2Room ? '#fde8e8' : bgColor, borderRadius: '12px', padding: '8px', textAlign: 'center',
                  border: isG2Room ? '2px solid #b13a4b' : '1px solid #e2e9f5', position: 'relative'
                }}>
                  <div style={{ fontWeight: 'bold' }}>{room.id}</div>
                  <div style={{ fontSize: '0.65rem' }}>{room.type}</div>
                  <div style={{ fontSize: '0.6rem', marginTop: '2px' }}>{isG2Room ? '🔴 G2' : label}</div>
                  <div style={{ fontSize: '0.55rem', color: '#6b7280', marginTop: '1px' }}>
                    {statusEmoji} {statusText}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: '12px', display: 'flex', gap: '16px', fontSize: '12px', flexWrap: 'wrap' }}>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#d9f0e3', borderRadius: '4px' }}></span> empty</span>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#fef1d6', borderRadius: '4px' }}></span> partial</span>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#fde0e3', borderRadius: '4px' }}></span> full</span>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#e8f0fe', border: '2px solid #1a2b4a', borderRadius: '4px' }}></span> G1</span>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#fde8e8', border: '2px solid #b13a4b', borderRadius: '4px' }}></span> G2</span>
        </div>
      </div>
    );
  };

  // Add Room Popup
  const renderAddRoomPopup = () => {
    if (!isAddRoomPopupOpen) return null;

    const selectedType = ROOM_TYPES[newRoomType];
    const capacity = newRoomType === 'Custom' ? newRoomCustomCapacity : (selectedType ? selectedType.capacity : 4);

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
        padding: '20px'
      }} onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsAddRoomPopupOpen(false);
        }
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          maxWidth: '500px',
          width: '100%',
          padding: '30px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          position: 'relative'
        }}>
          <button
            onClick={() => setIsAddRoomPopupOpen(false)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px 8px',
              borderRadius: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            ✕
          </button>

          <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold', color: '#1a202c' }}>
            ➕ Add New Room
          </h3>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#4a5568', display: 'block', marginBottom: '4px' }}>
              Room Number / ID:
            </label>
            <input
              style={{ 
                width: '100%', 
                padding: '10px 12px', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              placeholder="e.g., 509, 601, 403"
              value={newRoomId}
              onChange={(e) => setNewRoomId(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = '#1a2b4a'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#4a5568', display: 'block', marginBottom: '4px' }}>
              Room Type:
            </label>
            <select
              style={{ 
                width: '100%', 
                padding: '10px 12px', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                fontSize: '14px', 
                background: 'white',
                outline: 'none'
              }}
              value={newRoomType}
              onChange={(e) => setNewRoomType(e.target.value)}
            >
              <option value="Quad">🛏️ Quad (4 beds)</option>
              <option value="Triple">🛏️ Triple (3 beds)</option>
              <option value="Double">🛏️ Double (2 beds)</option>
              <option value="Sharing">🛏️ Sharing (5 beds)</option>
              <option value="Custom">⚙️ Custom</option>
            </select>
          </div>

          {newRoomType === 'Custom' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '500', color: '#4a5568', display: 'block', marginBottom: '4px' }}>
                Custom Capacity (beds):
              </label>
              <input
                type="number"
                style={{ 
                  width: '100%', 
                  padding: '10px 12px', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  fontSize: '14px',
                  outline: 'none'
                }}
                min="1"
                max="20"
                value={newRoomCustomCapacity}
                onChange={(e) => setNewRoomCustomCapacity(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          )}

          <div style={{ 
            padding: '12px 16px', 
            background: '#f7f8fc', 
            borderRadius: '8px', 
            marginBottom: '16px',
            fontSize: '13px',
            color: '#4a5568'
          }}>
            <strong>Room Summary:</strong><br />
            Room {newRoomId || '___'} · {newRoomType === 'Custom' ? 'Custom' : newRoomType} · {capacity} bed{capacity !== 1 ? 's' : ''}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              style={{ 
                flex: 1, 
                padding: '12px 16px', 
                background: 'linear-gradient(135deg, #16a37a 0%, #0d8a65 100%)',
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '14px', 
                fontWeight: 'bold', 
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 2px 8px rgba(22, 163, 122, 0.2)'
              }}
              onClick={addRoom}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 12px rgba(22, 163, 122, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(22, 163, 122, 0.2)';
              }}
            >
              ✅ Add Room
            </button>
            <button
              style={{ 
                padding: '12px 16px', 
                background: 'white', 
                color: '#4a5568', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                fontSize: '14px', 
                cursor: 'pointer' 
              }}
              onClick={() => setIsAddRoomPopupOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Create Group Popup
  const renderPopup = () => {
    if (!isPopupOpen) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
        padding: '20px'
      }} onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsPopupOpen(false);
        }
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '30px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          position: 'relative'
        }}>
          <button
            onClick={() => setIsPopupOpen(false)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px 8px',
              borderRadius: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            ✕
          </button>

          <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold', color: '#1a202c' }}>
            🧩 Create Group          </h3>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: '500', color: '#4a5568', display: 'block', marginBottom: '4px' }}>Group:</label>
              <select
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', background: 'white' }}
                value={selectedGroupType}
                onChange={(e) => {
                  const newGroup = e.target.value;
                  setSelectedGroupType(newGroup);
                  const maxPhase = getMaxPhaseForGroup(newGroup);
                  setSelectedPhase(maxPhase + 1);
                  setSelectedRoomIds([]);
                }}
              >
                {['G1', 'G2', 'G3', 'G4', 'G5'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: '500', color: '#4a5568', display: 'block', marginBottom: '4px' }}>Phase:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  style={{ padding: '4px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '14px' }}
                  onClick={() => { if (selectedPhase > 1) setSelectedPhase(selectedPhase - 1); }}
                >−</button>
                <span style={{ padding: '0 8px', fontWeight: 'bold', minWidth: '30px', textAlign: 'center' }}>{selectedPhase}</span>
                <button
                  style={{ padding: '4px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '14px' }}
                  onClick={() => setSelectedPhase(selectedPhase + 1)}
                >+</button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
              placeholder="Group name" value={groupName} onChange={(e) => setGroupName(e.target.value)}
            />
            <select
              style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', background: 'white', flex: 1 }}
              value={city} onChange={(e) => setCity(e.target.value)}
            >
              <option value="Makkah">Makkah</option>
              <option value="Madina">Madina</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#4a5568' }}>
                Select rooms for {selectedGroupType}-P{selectedPhase}
                {tempStart && tempEnd ? ` (${formatDate(tempStart)} - ${formatDate(tempEnd)})` : ''}:
              </span>
              <button
                onClick={() => {
                  const availableRooms = rooms.filter(r => getRoomAvailability(r.id).available);
                  if (availableRooms.length === 0) {
                    alert('No available rooms for the selected dates.');
                    return;
                  }
                  setSelectedRoomIds(availableRooms.map(r => r.id));
                }}
                style={{
                  padding: '4px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: '#4a5568'
                }}
              >
                Select All Available
              </button>
            </div>
            {(!tempStart || !tempEnd) && (
              <div style={{ fontSize: '11px', color: '#e08a1a', marginTop: '4px', marginBottom: '8px' }}>
                ⚠️ Pick a start and end date on the calendar first — availability is checked against those dates.
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {rooms.map(r => {
                const isSelected = selectedRoomIds.includes(r.id);
                const { available, conflict } = getRoomAvailability(r.id);
                const isBlocked = !available && !isSelected;

                return (
                  <span
                    key={r.id}
                    title={isBlocked ? `Booked by ${conflict.groupType}-P${conflict.phase} (${formatDate(conflict.start)} - ${formatDate(conflict.end)})` : ''}
                    style={{
                      padding: '4px 12px', borderRadius: '20px',
                      background: isSelected ? '#1a2b4a' : (isBlocked ? '#fde0e3' : '#f0f4fe'),
                      color: isSelected ? 'white' : (isBlocked ? '#b13a4b' : '#0b1e33'),
                      cursor: isBlocked ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      border: isBlocked ? '2px solid #b13a4b' : '1px solid #d9e1ed',
                      opacity: isBlocked ? 0.65 : 1,
                    }}
                    onClick={() => {
                      if (isBlocked) {
                        alert(`Room ${r.id} is already booked by ${conflict.groupType}-P${conflict.phase} (${formatDate(conflict.start)} - ${formatDate(conflict.end)}) for an overlapping date range.`);
                        return;
                      }
                      toggleRoomSelection(r.id);
                    }}
                  >
                    {r.id} {isBlocked && '🔒'}
                  </span>
                );
              })}
            </div>
            <div style={{ fontSize: '11px', color: '#718096', marginTop: '6px' }}>
              Selected: {selectedRoomIds.length > 0 ? selectedRoomIds.join(', ') : 'None'}
              {selectedRoomIds.length > 0 && ` (${selectedRoomIds.length} rooms)`}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              style={{ flex: 1, padding: '10px 16px', background: '#1a2b4a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
              onClick={createGroup}
            >
              ➕ Create {selectedGroupType}-P{selectedPhase}
            </button>
            <button
              style={{ padding: '10px 16px', background: 'white', color: '#4a5568', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
              onClick={() => { setTempStart(null); setTempEnd(null); setSelectionMode('start'); setSelectedRoomIds([]); }}
            >
              Clear
            </button>
          </div>

          {tempStart && tempEnd && (
            <div style={{ marginTop: '12px', padding: '10px 14px', background: '#f7f8fc', borderRadius: '8px', fontSize: '12px', color: '#4a5568' }}>
              📅 Selected range: {formatDate(tempStart)} - {formatDate(tempEnd)} ({Math.ceil((tempEnd - tempStart) / 86400000) + 1} days)
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render room occupancy status in the assignment section
  const renderRoomOccupancyStatus = (roomId) => {
    if (!tempStart || !tempEnd) return null;
    
    const status = getRoomOccupancyStatus(roomId);
    const maxBeds = getMaxBeds(roomId);
    const details = getRoomOccupancyDetails(roomId);
    
    const statusConfig = {
      'empty': { label: '🟢 Empty', color: '#16a37a', bg: '#e7f7ef' },
      'partial': { label: '🟡 Partial', color: '#a8710a', bg: '#fff6e0' },
      'full': { label: '🔴 Full', color: '#c0392b', bg: '#fdeceb' },
      'partial-empty': { label: '🟡 Partial (some empty days)', color: '#a8710a', bg: '#fff6e0' },
      'mixed-full-empty': { label: '🟠 Mixed (full & empty days)', color: '#d4800a', bg: '#fff0d0' },
      'unknown': { label: '⚪ Select dates', color: '#6b7280', bg: '#f3f4f6' }
    };
    
    const config = statusConfig[status.status] || statusConfig.unknown;
    
    const detailsText = status.totalDays > 0 ? 
      `${status.emptyDays} empty, ${status.partialDays} partial, ${status.fullDays} full days` : 
      `Average occupancy: ${status.count.toFixed(1)}/${maxBeds}`;
    
    // Show group info if any
    const groupInfo = Object.keys(details.groups).length > 0 ? 
      ` · Groups: ${Object.keys(details.groups).join(', ')}` : '';
    
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        fontSize: '11px',
        marginTop: '2px',
        padding: '2px 8px',
        borderRadius: '4px',
        background: config.bg,
        color: config.color,
        flexWrap: 'wrap'
      }}>
        <span style={{ fontWeight: 600 }}>{config.label}</span>
        <span style={{ fontSize: '10px', opacity: 0.8 }}>({detailsText})</span>
        {groupInfo && <span style={{ fontSize: '10px', fontWeight: 500 }}>{groupInfo}</span>}
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', background: '#f7fafc', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Date hover tooltip - SUPER SMALL */}
      {renderDateTooltip()}
      
      {/* Important arrivals/departures notifications */}
      {renderNotifications()}

      {/* Main calendar view, full width */}
      {renderGanttTimeline()}

      {/* Popups */}
      {renderPopup()}
      {renderAddRoomPopup()}

      {/* Everything else stacked below in a responsive grid */}
      <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        <div>
          <div className="card" style={{ background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: '#1a202c' }}>
              📋 Existing Groups
            </h3>
            {groups.length === 0 ? (
              <div style={{ fontSize: '14px', color: '#718096' }}>No groups created yet</div>
            ) : (
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {groups.map(g => {
                  const peopleCount = getGroupPeopleCount(g.id);
                  return (
                    <div key={g.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px',
                      marginBottom: '4px', background: g.color ? `${g.color}15` : '#f7fafc', borderRadius: '8px',
                      borderLeft: `4px solid ${g.color || '#1a2b4a'}`
                    }}>
                      <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{g.groupType}-P{g.phase}: {g.name} ({g.city})</span>
                      <span style={{ fontSize: '11px', color: '#718096' }}>
                        {g.rooms.length} rooms • {g.dates.length} days • 👥 {peopleCount} people
                      </span>
                      <button
                        style={{ padding: '2px 8px', background: '#fc8181', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                        onClick={() => deleteGroup(g.id)}
                      >✕</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {renderRoomStatus()}
        </div>

        <div>
          <div className="card" style={{ background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: '#1a202c' }}>👤 Assign Person</h3>
            
            {/* Room selection with status indicator */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: '500', color: '#4a5568', display: 'block', marginBottom: '4px' }}>Select Room:</label>
              <select
                style={{ 
                  width: '100%', 
                  padding: '8px 12px', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  background: 'white' 
                }}
                value={selectedRoomForAssign || ''} 
                onChange={(e) => setSelectedRoomForAssign(Number(e.target.value))}
              >
                <option value="">-- Select a room --</option>
                {rooms.map(r => {
                  const status = getRoomOccupancyStatus(r.id);
                  const details = getRoomOccupancyDetails(r.id);
                  const statusEmoji = status.status === 'empty' ? '🟢' : 
                                      status.status === 'full' ? '🔴' : 
                                      status.status === 'partial' ? '🟡' : '⚪';
                  const statusLabel = status.status === 'empty' ? 'Empty' :
                                     status.status === 'full' ? 'Full' :
                                     status.status === 'partial' ? 'Partial' : 'Unknown';
                  const groupInfo = Object.keys(details.groups).length > 0 ? 
                    ` [${Object.keys(details.groups).join(', ')}]` : '';
                  return (
                    <option key={r.id} value={r.id}>
                      Room {r.id} ({r.type}) - {statusEmoji} {statusLabel}{groupInfo}
                      {status.status !== 'unknown' && ` (${details.occupied}/${details.maxBeds})`}
                    </option>
                  );
                })}
              </select>
              {selectedRoomForAssign && renderRoomOccupancyStatus(selectedRoomForAssign)}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                style={{ flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                placeholder="Person name" value={personName} onChange={(e) => setPersonName(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                style={{ flex: 1, padding: '8px 16px', background: '#48bb78', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={assignPerson}
              >
                👤 Assign Person
              </button>
              <button
                style={{ padding: '8px 16px', background: '#fc8181', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
                onClick={clearAllAssignments}
              >
                Clear All
              </button>
            </div>

            {/* Show assigned people for selected room */}
            {selectedRoomForAssign && assignments[selectedRoomForAssign] && assignments[selectedRoomForAssign].length > 0 && (
              <div style={{ marginTop: '12px', borderTop: '1px solid #edf0f5', paddingTop: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  👥 Assigned People ({assignments[selectedRoomForAssign].length}/{getMaxBeds(selectedRoomForAssign)})
                </div>
                {assignments[selectedRoomForAssign].map((a, idx) => {
                  const group = groups.find(g => g.id === a.groupId);
                  return (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      fontSize: '12px', 
                      marginBottom: '4px',
                      padding: '4px 8px',
                      background: '#f7fafc',
                      borderRadius: '6px'
                    }}>
                      <span>
                        <span style={{ fontWeight: 500 }}>{a.person}</span>
                        {group && (
                          <span style={{ 
                            marginLeft: '6px', 
                            fontSize: '10px', 
                            background: group.color || '#1a2b4a', 
                            color: 'white', 
                            padding: '1px 6px', 
                            borderRadius: '10px' 
                          }}>
                            {group.groupType}-P{group.phase}
                          </span>
                        )}
                        <span style={{ color: '#718096', marginLeft: '8px' }}>
                          {formatDate(a.start)} - {formatDate(a.end)}
                        </span>
                      </span>
                      <button
                        style={{ border: 'none', background: 'transparent', color: '#e05c6b', cursor: 'pointer', fontWeight: 'bold' }}
                        onClick={() => removePerson(selectedRoomForAssign, idx)}
                      >✕</button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div style={{ marginTop: '12px', padding: '10px', background: '#f7fafc', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>Room Status Legend:</div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '11px' }}>
                <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#e7f7ef', borderRadius: '4px', border: '1px solid #16a37a' }}></span> 🟢 Empty</span>
                <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#fff6e0', borderRadius: '4px', border: '1px solid #a8710a' }}></span> 🟡 Partial</span>
                <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#fdeceb', borderRadius: '4px', border: '1px solid #c0392b' }}></span> 🔴 Full</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: '#1a202c' }}>📊 Summary</h3>
            <div style={{ fontSize: '14px', color: '#2d3748' }}>
              <div>Rooms: <strong>{rooms.length}</strong></div>
              <div>Groups: <strong>{groups.length}</strong></div>
              <div>People assigned: <strong>{Object.values(assignments).reduce((sum, arr) => sum + arr.length, 0)}</strong></div>
              <div style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                {groups.map(g => {
                  const count = getGroupPeopleCount(g.id);
                  return count > 0 ? (
                    <span key={g.id} style={{ marginRight: '12px' }}>
                      {g.groupType}-P{g.phase}: 👥 {count}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {groups.map(g => (
                <span key={g.id} style={{ display: 'inline-block', background: g.color || '#1a2b4a', color: 'white', padding: '2px 10px', borderRadius: '20px', fontSize: '11px' }}>
                  {g.groupType}-P{g.phase} ({getGroupPeopleCount(g.id)})
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
