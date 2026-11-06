// RoomManager.jsx
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
  'Quad': { capacity: 4 },
  'Triple': { capacity: 3 },
  'Double': { capacity: 2 },
  'Sharing': { capacity: 5 }
};

const COLORS = ['#1f4fcf', '#cf3e5a', '#0d9e6e', '#d98c1a', '#7c4fd4', '#1d8f9e', '#2563eb', '#b83b3b'];

export default function RoomManager() {
  const [rooms, setRooms] = useState(DEFAULT_ROOMS);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [groups, setGroups] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [tempStart, setTempStart] = useState(null);
  const [tempEnd, setTempEnd] = useState(null);
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [city, setCity] = useState('Makkah');
  const [selectedGroupType, setSelectedGroupType] = useState('G1');
  const [selectedPhase, setSelectedPhase] = useState(1);
  const [popupCreate, setPopupCreate] = useState(false);
  const [popupAddRoom, setPopupAddRoom] = useState(false);
  const [popupPeople, setPopupPeople] = useState(false);
  const [selectedRoomForPeople, setSelectedRoomForPeople] = useState(null);
  const [selectedGroupForPeople, setSelectedGroupForPeople] = useState(null);
  const [peopleList, setPeopleList] = useState([]);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonVoucher, setNewPersonVoucher] = useState('');
  const [newRoomId, setNewRoomId] = useState('');
  const [newRoomType, setNewRoomType] = useState('Quad');
  const [searchRoom, setSearchRoom] = useState('');
  const [searchGroup, setSearchGroup] = useState('');
  const [searchPerson, setSearchPerson] = useState('');
  const [searchVoucher, setSearchVoucher] = useState('');
  const [activeTab, setActiveTab] = useState('groups');
  const [toast, setToast] = useState(null);
  const [dayWidth, setDayWidth] = useState(44);

  const dateOnly = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
  const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const formatDate = (d) => d ? `${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}` : '';
  const formatFull = (d) => d ? `${d.getDate()} ${d.toLocaleString('en', { month: 'long' })} ${d.getFullYear()}` : '';

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type, id: Date.now() });
    setTimeout(() => setToast(null), 2600);
  };

  const getMaxBeds = (roomId) => rooms.find(r => r.id === roomId)?.capacity || 0;
  const getOccupancyOnDate = (roomId, date) => {
    const assigns = assignments[roomId] || [];
    const d = dateOnly(date);
    let count = 0;
    for (const a of assigns) {
      const s = dateOnly(a.start);
      const e = dateOnly(a.end);
      if (d >= s && d <= e) count++;
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

  const getRoomAvailability = (roomId, excludeGroupId = null) => {
    if (!tempStart || !tempEnd) return { available: true, conflict: null };
    const start = dateOnly(tempStart);
    const end = dateOnly(tempEnd);
    for (const g of groups) {
      if (excludeGroupId && g.id === excludeGroupId) continue;
      if (!g.rooms.includes(roomId)) continue;
      const gs = dateOnly(g.start);
      const ge = dateOnly(g.end);
      if (start <= ge && end >= gs) return { available: false, conflict: g };
    }
    return { available: true, conflict: null };
  };

  const getGroupPeopleCount = (groupId) => {
    let count = 0;
    for (const roomAssign of Object.values(assignments)) {
      for (const a of roomAssign) {
        if (a.groupId === groupId) count++;
      }
    }
    return count;
  };

  const getGroupPeopleForRoom = (roomId, groupId) => {
    const arr = assignments[roomId] || [];
    return arr.filter(a => a.groupId === groupId);
  };

  const totalPeople = Object.values(assignments).reduce((sum, arr) => sum + arr.length, 0);
  const totalBeds = rooms.reduce((sum, r) => sum + r.capacity, 0);

  const changeMonth = (increment) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentMonth(newDate);
  };

  const goToToday = () => setCurrentMonth(new Date());

  const handleDayClick = (d) => {
    if (!tempStart) {
      setTempStart(d);
      setTempEnd(null);
    } else if (!tempEnd) {
      if (d >= tempStart) {
        setTempEnd(d);
      } else {
        setTempStart(d);
        setTempEnd(null);
      }
    } else {
      setTempStart(d);
      setTempEnd(null);
    }
    setSelectedRoomIds([]);
  };

  const clearDateSelection = () => {
    setTempStart(null);
    setTempEnd(null);
    setSelectedRoomIds([]);
  };

  const toggleRoomSelection = (roomId) => {
    if (!tempStart || !tempEnd) {
      showToast('Select dates first', 'warn');
      return;
    }
    if (selectedRoomIds.includes(roomId)) {
      setSelectedRoomIds(prev => prev.filter(id => id !== roomId));
      return;
    }
    const { available, conflict } = getRoomAvailability(roomId);
    if (!available) {
      showToast(`Room ${roomId} booked by ${conflict.groupType}-P${conflict.phase}`, 'warn');
      return;
    }
    setSelectedRoomIds(prev => [...prev, roomId]);
  };

  const selectAllFree = () => {
    if (!tempStart || !tempEnd) {
      showToast('Select dates first', 'warn');
      return;
    }
    const free = rooms.filter(r => getRoomAvailability(r.id).available).map(r => r.id);
    setSelectedRoomIds(free);
    showToast(`${free.length} free room(s) selected`);
  };

  const createGroup = () => {
    if (!tempStart || !tempEnd) {
      showToast('Select dates', 'warn');
      return;
    }
    if (selectedRoomIds.length === 0) {
      showToast('Select at least one room', 'warn');
      return;
    }
    if (!groupName.trim()) {
      showToast('Enter group name', 'warn');
      return;
    }
    for (const roomId of selectedRoomIds) {
      const { available, conflict } = getRoomAvailability(roomId);
      if (!available) {
        showToast(`Room ${roomId} conflict with ${conflict.groupType}-P${conflict.phase}`, 'warn');
        return;
      }
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
    setPopupCreate(false);

    if (selectedRoomIds.length > 0) {
      setSelectedRoomForPeople(selectedRoomIds[0]);
      setSelectedGroupForPeople(group);
      setPeopleList(getGroupPeopleForRoom(selectedRoomIds[0], group.id));
      setPopupPeople(true);
    }
    showToast(`Booking ${group.groupType}-P${group.phase} created`);
  };

  const deleteGroup = (groupId) => {
    if (!confirm('Delete this booking?')) return;
    const g = groups.find(gr => gr.id === groupId);
    if (!g) return;
    const newAssign = { ...assignments };
    g.rooms.forEach(roomId => {
      if (newAssign[roomId]) {
        newAssign[roomId] = newAssign[roomId].filter(a => a.groupId !== groupId);
        if (newAssign[roomId].length === 0) delete newAssign[roomId];
      }
    });
    setAssignments(newAssign);
    setGroups(groups.filter(gr => gr.id !== groupId));
    showToast('Booking deleted');
  };

  const addPersonToRoom = () => {
    if (!selectedRoomForPeople) {
      showToast('Select room', 'warn');
      return;
    }
    if (!newPersonName.trim()) {
      showToast('Enter name', 'warn');
      return;
    }
    if (!newPersonVoucher.trim()) {
      showToast('Enter voucher', 'warn');
      return;
    }
    const group = selectedGroupForPeople || groups.find(g => g.rooms.includes(selectedRoomForPeople));
    if (!group) {
      showToast('No group for this room', 'warn');
      return;
    }
    const max = getMaxBeds(selectedRoomForPeople);
    const current = getGroupPeopleForRoom(selectedRoomForPeople, group.id);
    if (current.length >= max) {
      showToast('Room full', 'warn');
      return;
    }
    if (current.some(p => p.person.toLowerCase() === newPersonName.toLowerCase())) {
      showToast('Duplicate name', 'warn');
      return;
    }
    if (current.some(p => p.voucher === newPersonVoucher)) {
      showToast('Duplicate voucher', 'warn');
      return;
    }

    const newAssign = { ...assignments };
    if (!newAssign[selectedRoomForPeople]) newAssign[selectedRoomForPeople] = [];
    newAssign[selectedRoomForPeople].push({
      person: newPersonName.trim(),
      voucher: newPersonVoucher.trim(),
      start: group.start,
      end: group.end,
      groupId: group.id,
      groupType: group.groupType,
      groupPhase: group.phase
    });
    setAssignments(newAssign);
    setNewPersonName('');
    setNewPersonVoucher('');
    loadPeopleForRoom(selectedRoomForPeople, group.id);
    showToast(`${newPersonName} added`);
  };

  const removePerson = (roomId, index) => {
    if (!confirm('Remove person?')) return;
    const newAssign = { ...assignments };
    if (newAssign[roomId]) {
      newAssign[roomId].splice(index, 1);
      if (newAssign[roomId].length === 0) delete newAssign[roomId];
      setAssignments(newAssign);
      const group = selectedGroupForPeople || groups.find(g => g.rooms.includes(roomId));
      loadPeopleForRoom(roomId, group?.id);
      showToast('Removed');
    }
  };

  const loadPeopleForRoom = (roomId, groupId) => {
    const arr = assignments[roomId] || [];
    const filtered = groupId ? arr.filter(a => a.groupId === groupId) : arr;
    setPeopleList(filtered);
  };

  const deleteRoom = (roomId) => {
    if (assignments[roomId]?.length) {
      showToast('Room has assignments', 'warn');
      return;
    }
    if (groups.some(g => g.rooms.includes(roomId))) {
      showToast('Room is in a booking', 'warn');
      return;
    }
    if (!confirm(`Delete room ${roomId}?`)) return;
    setRooms(rooms.filter(r => r.id !== roomId));
    showToast('Room deleted');
  };

  const addRoom = () => {
    if (!newRoomId.trim()) {
      showToast('Enter room number', 'warn');
      return;
    }
    const id = parseInt(newRoomId.trim());
    if (isNaN(id)) {
      showToast('Invalid number', 'warn');
      return;
    }
    if (rooms.some(r => r.id === id)) {
      showToast('Room exists', 'warn');
      return;
    }
    const type = ROOM_TYPES[newRoomType];
    const newRoom = {
      id,
      bed: `${type.capacity}BED`,
      type: newRoomType,
      capacity: type.capacity
    };
    setRooms([...rooms, newRoom]);
    setNewRoomId('');
    setPopupAddRoom(false);
    showToast(`Room ${id} added`);
  };

  // Gantt data
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), daysInMonth);
  const dayList = Array.from({ length: daysInMonth }).map((_, i) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
    return {
      d,
      day: i + 1,
      dow: d.toLocaleString('en', { weekday: 'short' }),
      isToday: isSameDay(d, new Date()),
      isWeekend: d.getDay() === 5 || d.getDay() === 6
    };
  });

  const filteredRooms = rooms.filter(r => !searchRoom || String(r.id).includes(searchRoom.trim()));
  const filteredGroups = groups.filter(g => {
    if (!searchGroup) return true;
    const q = searchGroup.toLowerCase();
    return g.name.toLowerCase().includes(q) ||
      g.groupType.toLowerCase().includes(q) ||
      (`p${g.phase}`).includes(q);
  });

  const roomRows = filteredRooms.map(room => {
    const roomAssign = assignments[room.id] || [];
    const relevant = filteredGroups.filter(g => g.rooms.includes(room.id));
    const bars = relevant.map(g => {
      const gStart = dateOnly(g.start);
      const gEnd = dateOnly(g.end);
      if (gEnd < monthStart || gStart > monthEnd) return null;
      let people = roomAssign.filter(a => a.groupId === g.id);
      if (searchPerson) people = people.filter(p => p.person.toLowerCase().includes(searchPerson.toLowerCase()));
      if (searchVoucher) people = people.filter(p => p.voucher.includes(searchVoucher));
      if ((searchPerson || searchVoucher) && people.length === 0) return null;
      const clipStart = gStart < monthStart ? monthStart : gStart;
      const clipEnd = gEnd > monthEnd ? monthEnd : gEnd;
      const left = (clipStart.getDate() - 1) * dayWidth;
      const width = (clipEnd.getDate() - clipStart.getDate() + 1) * dayWidth;
      return { g, left, width, people, occupied: people.length, maxBeds: room.capacity };
    }).filter(Boolean);

    bars.sort((a, b) => a.left - b.left);

    const lanes = [];
    bars.forEach(bar => {
      let lane = 0;
      let placed = false;
      while (!placed) {
        const existingInLane = lanes[lane] || [];
        const overlap = existingInLane.some(existingBar => {
          return bar.left < existingBar.left + existingBar.width && 
                 bar.left + bar.width > existingBar.left;
        });
        if (!overlap) {
          if (!lanes[lane]) lanes[lane] = [];
          lanes[lane].push(bar);
          bar.lane = lane;
          placed = true;
        } else {
          lane++;
        }
      }
    });

    const rowHeight = bars.length > 0 ? Math.max(1, lanes.length) * 28 + 8 : 36;
    return { room, bars, rowHeight, lanes: lanes.length };
  }).filter(row => {
    if (!(searchGroup || searchPerson || searchVoucher)) return true;
    return row.bars.length > 0;
  });

  const isInSelection = (d) => {
    if (!tempStart) return false;
    const end = tempEnd || tempStart;
    const a = dateOnly(tempStart);
    const b = dateOnly(end);
    const x = dateOnly(d);
    const lo = a <= b ? a : b;
    const hi = a <= b ? b : a;
    return x >= lo && x <= hi;
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      padding: '10px 14px',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      color: '#0b1a33',
      background: '#f0f4fc',
      minHeight: '100vh',
      boxSizing: 'border-box',
      overflowX: 'hidden'
    }}>
      {toast && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 2000,
          background: toast.type === 'warn' ? '#d98c1a' : '#0d9e6e',
          color: 'white',
          padding: '10px 16px',
          borderRadius: '12px',
          fontWeight: 600,
          fontSize: 13,
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span>{toast.type === 'warn' ? '⚠️' : '✅'}</span>
          {toast.msg}
        </div>
      )}

      {/* Compact Top Bar with Stats */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #e6edf4',
        padding: '10px 16px',
        marginBottom: '10px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        width: '100%',
        boxSizing: 'border-box',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #1f4fcf, #3b7bff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            color: 'white'
          }}>🏨</div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.02em', color: '#0b1a33' }}>Room Manager</div>
            <div style={{ color: '#5e6f8c', fontSize: '11px' }}>Book, assign & manage guests</div>
          </div>
        </div>
        
        {/* Stats in top bar */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '14px' }}>🛏️</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#1f4fcf', lineHeight: 1.2 }}>{rooms.length}</div>
              <div style={{ color: '#5e6f8c', fontSize: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Rooms</div>
            </div>
          </div>
          <div style={{ width: '1px', height: '24px', background: '#e6edf4' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '14px' }}>👤</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0d9e6e', lineHeight: 1.2 }}>{totalPeople}</div>
              <div style={{ color: '#5e6f8c', fontSize: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Guests</div>
            </div>
          </div>
          <div style={{ width: '1px', height: '24px', background: '#e6edf4' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '14px' }}>📅</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#cf3e5a', lineHeight: 1.2 }}>{groups.length}</div>
              <div style={{ color: '#5e6f8c', fontSize: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Bookings</div>
            </div>
          </div>
          <div style={{ width: '1px', height: '24px', background: '#e6edf4' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '14px' }}>🛌</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#7c4fd4', lineHeight: 1.2 }}>{totalBeds}</div>
              <div style={{ color: '#5e6f8c', fontSize: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Beds</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="🔍 Search..."
            value={searchRoom}
            onChange={e => setSearchRoom(e.target.value)}
            style={{
              border: '1px solid #d9e2ed',
              borderRadius: '8px',
              padding: '5px 10px',
              fontSize: '11px',
              width: '120px',
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          />
          <button
            style={{
              border: 'none',
              borderRadius: '8px',
              padding: '5px 12px',
              fontWeight: 600,
              fontSize: '11px',
              cursor: 'pointer',
              background: 'white',
              border: '1px solid #d9e2ed',
              color: '#1f2a44',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}
            onClick={() => setPopupAddRoom(true)}
          >
            <span>+</span> Add
          </button>
          <button
            style={{
              border: 'none',
              borderRadius: '8px',
              padding: '5px 14px',
              fontWeight: 600,
              fontSize: '11px',
              cursor: 'pointer',
              background: '#1f4fcf',
              color: 'white',
              boxShadow: '0 4px 12px rgba(31,79,207,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}
            onClick={() => {
              if (!tempStart || !tempEnd) {
                showToast('Select dates first', 'warn');
                return;
              }
              if (!selectedRoomIds.length) {
                showToast('Select rooms', 'warn');
                return;
              }
              setPopupCreate(true);
            }}
          >
            <span>📋</span> New
          </button>
          {/* Clear button */}
          {(tempStart || tempEnd || selectedRoomIds.length > 0) && (
            <button
              style={{
                border: 'none',
                borderRadius: '8px',
                padding: '5px 10px',
                fontWeight: 600,
                fontSize: '11px',
                cursor: 'pointer',
                background: '#fee9e7',
                color: '#b81c1c',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap'
              }}
              onClick={clearDateSelection}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Gantt Timeline - Removed Session bar entirely */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #e6edf4',
        overflow: 'hidden',
        marginBottom: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{
          padding: '6px 12px',
          borderBottom: '1px solid #edf2f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '4px',
          background: '#fafcff'
        }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button style={{ border: 'none', borderRadius: '4px', padding: '2px 8px', fontWeight: 600, fontSize: '12px', cursor: 'pointer', background: 'transparent', color: '#1f4fcf' }} onClick={() => changeMonth(-1)}>◀</button>
            <span style={{ fontWeight: 700, fontSize: '12px', minWidth: '100px', textAlign: 'center' }}>
              {currentMonth.toLocaleString('en', { month: 'short', year: 'numeric' })}
            </span>
            <button style={{ border: 'none', borderRadius: '4px', padding: '2px 8px', fontWeight: 600, fontSize: '12px', cursor: 'pointer', background: 'transparent', color: '#1f4fcf' }} onClick={() => changeMonth(1)}>▶</button>
            <button style={{ border: 'none', borderRadius: '4px', padding: '2px 8px', fontWeight: 600, fontSize: '10px', cursor: 'pointer', background: '#e8f0fe', color: '#1f4fcf' }} onClick={goToToday}>Today</button>
            {tempStart && tempEnd && (
              <span style={{
                background: '#dbeafe',
                color: '#1f4fcf',
                borderRadius: '40px',
                padding: '2px 10px',
                fontSize: '10px',
                fontWeight: 600
              }}>
                {formatDate(tempStart)} → {formatDate(tempEnd)} · {Math.round((dateOnly(tempEnd) - dateOnly(tempStart)) / 86400000)} nights
              </span>
            )}
            {selectedRoomIds.length > 0 && (
              <span style={{
                background: '#e6f7f0',
                color: '#0d9e6e',
                borderRadius: '40px',
                padding: '1px 8px',
                fontSize: '9px',
                fontWeight: 600
              }}>
                {selectedRoomIds.length} room{selectedRoomIds.length > 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '9px', color: '#5e6f8c' }}>Click day → select</span>
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center', padding: '1px 4px', background: '#f8fafe', borderRadius: '4px', fontSize: '8px' }}>
              <span style={{ color: '#5e6f8c' }}>Legend:</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '1px', background: '#b8e0c8' }}></span>
                <span style={{ color: '#5e6f8c' }}>Free</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '1px', background: '#f7d98a' }}></span>
                <span style={{ color: '#5e6f8c' }}>Partial</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '1px', background: '#f9b5b0' }}></span>
                <span style={{ color: '#5e6f8c' }}>Full</span>
              </span>
            </div>
          </div>
        </div>

        <div style={{ overflow: 'auto', maxHeight: '400px', width: '100%' }}>
          <div style={{ display: 'inline-block', minWidth: '100%' }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              position: 'sticky',
              top: 0,
              background: 'white',
              zIndex: 5,
              borderBottom: '1px solid #e6edf4',
              width: '100%'
            }}>
              <div style={{
                width: '100px',
                minWidth: '100px',
                padding: '4px 8px',
                fontWeight: 700,
                fontSize: '10px',
                color: '#5e6f8c',
                background: 'white',
                borderRight: '1px solid #edf2f9',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0
              }}>
                <span>🛏️</span> Room
              </div>
              <div style={{ display: 'flex', flex: 1, minWidth: daysInMonth * dayWidth }}>
                {dayList.map(({ d, day, dow, isToday }) => (
                  <div
                    key={day}
                    style={{
                      width: dayWidth,
                      minWidth: dayWidth,
                      textAlign: 'center',
                      padding: '2px 0 1px',
                      cursor: 'pointer',
                      background: isToday ? '#e8f0fe' : 'white',
                      borderRight: '1px solid #f0f4fa',
                      transition: 'all 0.1s',
                      flexShrink: 0
                    }}
                    onClick={() => handleDayClick(d)}
                  >
                    <div style={{ fontSize: '7px', color: '#6f7f9a', fontWeight: 600 }}>{dow}</div>
                    <div style={{
                      fontWeight: 700,
                      fontSize: '10px',
                      color: isToday ? '#1f4fcf' : '#0b1a33',
                      width: '20px',
                      height: '20px',
                      lineHeight: '20px',
                      borderRadius: '50%',
                      margin: '0 auto',
                      background: isToday ? '#dbeafe' : 'transparent'
                    }}>{day}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rows */}
            {roomRows.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#8899b4', width: '100%' }}>
                <div style={{ fontSize: '28px', marginBottom: '4px' }}>🔍</div>
                <div style={{ fontWeight: 600, fontSize: '12px' }}>No rooms match</div>
              </div>
            ) : (
              roomRows.map(({ room, bars, rowHeight }) => {
                const selected = selectedRoomIds.includes(room.id);
                const isFree = tempStart && tempEnd ? getRoomAvailability(room.id).available : true;
                return (
                  <div
                    key={room.id}
                    style={{
                      display: 'flex',
                      borderBottom: '1px solid #edf2f9',
                      minHeight: rowHeight,
                      transition: 'background 0.1s',
                      width: '100%'
                    }}
                  >
                    <div
                      style={{
                        width: '100px',
                        minWidth: '100px',
                        padding: '4px 8px',
                        background: selected ? '#e8f0fe' : 'white',
                        position: 'sticky',
                        left: 0,
                        zIndex: 3,
                        borderRight: '1px solid #e6edf4',
                        cursor: 'pointer',
                        borderLeft: selected ? '3px solid #1f4fcf' : '3px solid transparent',
                        transition: 'all 0.15s',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                      onClick={() => toggleRoomSelection(room.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '11px' }}>#{room.id}</span>
                        {selected && (
                          <span style={{
                            background: '#1f4fcf',
                            color: 'white',
                            borderRadius: '40px',
                            padding: '0px 4px',
                            fontSize: '8px',
                            fontWeight: 600
                          }}>✓</span>
                        )}
                      </div>
                      <div style={{ color: '#5e6f8c', fontSize: '8px' }}>
                        {room.type} · {room.capacity}b
                      </div>
                      {tempStart && tempEnd && (
                        <div style={{
                          fontSize: '8px',
                          fontWeight: 600,
                          color: isFree ? '#0d9e6e' : '#cf3e5a',
                          marginTop: '1px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          <span style={{
                            display: 'inline-block',
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            background: isFree ? '#0d9e6e' : '#cf3e5a'
                          }}></span>
                          {isFree ? 'Free' : 'Booked'}
                        </div>
                      )}
                    </div>

                    <div style={{
                      flex: 1,
                      position: 'relative',
                      background: selected ? 'rgba(31,79,207,0.02)' : '#fafcff',
                      minHeight: rowHeight,
                      minWidth: daysInMonth * dayWidth
                    }}>
                      {/* Heatmap */}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        display: 'flex',
                        zIndex: 1,
                        pointerEvents: 'none'
                      }}>
                        {dayList.map(({ d, day }) => {
                          const status = getRoomStatus(room.id, d);
                          const bg = status === 'full' ? '#f9b5b0' : status === 'partial' ? '#f7d98a' : '#b8e0c8';
                          return (
                            <div
                              key={day}
                              style={{
                                width: dayWidth,
                                minWidth: dayWidth,
                                background: bg,
                                opacity: 0.8,
                                flexShrink: 0
                              }}
                            />
                          );
                        })}
                      </div>

                      {/* Selection overlay */}
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        pointerEvents: 'none'
                      }}>
                        {dayList.map(({ d, day }) => (
                          <div
                            key={day}
                            style={{
                              width: dayWidth,
                              minWidth: dayWidth,
                              background: isInSelection(d) ? 'rgba(31,79,207,0.08)' : 'transparent',
                              flexShrink: 0
                            }}
                          />
                        ))}
                      </div>

                      {/* Click layer */}
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        zIndex: 1
                      }}>
                        {dayList.map(({ d, day }) => (
                          <div
                            key={day}
                            style={{
                              width: dayWidth,
                              minWidth: dayWidth,
                              height: '100%',
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                            onClick={() => handleDayClick(d)}
                          />
                        ))}
                      </div>

                      {/* Bars */}
                      {bars.map((bar, idx) => {
                        const laneHeight = 22;
                        const top = 3 + (bar.lane || 0) * laneHeight;
                        return (
                          <div
                            key={bar.g.id + '-' + idx}
                            style={{
                              position: 'absolute',
                              left: bar.left + 2,
                              width: Math.max(14, bar.width - 4),
                              top: top,
                              height: '18px',
                              borderRadius: '4px',
                              padding: '1px 4px',
                              fontSize: '7px',
                              fontWeight: 700,
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                              cursor: 'pointer',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              background: bar.g.color || '#1f4fcf',
                              transition: 'transform 0.1s, box-shadow 0.1s',
                              zIndex: 2
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRoomForPeople(room.id);
                              setSelectedGroupForPeople(bar.g);
                              setPeopleList(getGroupPeopleForRoom(room.id, bar.g.id));
                              setPopupPeople(true);
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                              <span>{bar.g.groupType}</span>
                              <span style={{ opacity: 0.7 }}>P{bar.g.phase}</span>
                            </span>
                            <span style={{
                              background: 'rgba(255,255,255,0.2)',
                              padding: '0px 3px',
                              borderRadius: '2px',
                              fontSize: '6px',
                              fontWeight: 600
                            }}>
                              {bar.occupied}/{bar.maxBeds}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Panels */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #e6edf4',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #edf2f9',
          background: '#fafcff'
        }}>
          {[
            { id: 'groups', label: '📋 Bookings', count: groups.length },
            { id: 'rooms', label: '🛏️ Rooms', count: rooms.length },
            { id: 'stats', label: '📊 Stats', count: null }
          ].map(tab => (
            <button
              key={tab.id}
              style={{
                flex: 1,
                border: 'none',
                borderRadius: 0,
                padding: '8px 6px',
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'pointer',
                background: activeTab === tab.id ? 'white' : 'transparent',
                borderBottom: activeTab === tab.id ? '2px solid #1f4fcf' : '2px solid transparent',
                color: activeTab === tab.id ? '#1f4fcf' : '#5e6f8c',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.count !== null && (
                <span style={{
                  background: activeTab === tab.id ? '#dbeafe' : '#e6edf4',
                  color: activeTab === tab.id ? '#1f4fcf' : '#5e6f8c',
                  borderRadius: '40px',
                  padding: '0px 5px',
                  fontSize: '9px',
                  fontWeight: 600
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{
          maxHeight: '280px',
          overflowY: 'auto',
          padding: '10px 14px'
        }}>
          {activeTab === 'groups' && (
            groups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 10px' }}>
                <div style={{ fontSize: '32px', marginBottom: '4px' }}>📭</div>
                <div style={{ fontWeight: 600, fontSize: '12px', color: '#0b1a33' }}>No bookings yet</div>
                <div style={{ color: '#8899b4', fontSize: '10px' }}>Create one from the calendar</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '6px' }}>
                {groups.slice().reverse().map(g => {
                  const count = getGroupPeopleCount(g.id);
                  const totalBedsInGroup = g.rooms.reduce((sum, id) => sum + getMaxBeds(id), 0);
                  return (
                    <div
                      key={g.id}
                      style={{
                        border: '1px solid #e6edf4',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        borderLeft: `3px solid ${g.color || '#1f4fcf'}`,
                        background: 'white'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '4px'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: '12px' }}>{g.name}</span>
                            <span style={{
                              background: '#dbeafe',
                              color: '#1f4fcf',
                              borderRadius: '40px',
                              padding: '0px 6px',
                              fontSize: '9px',
                              fontWeight: 600
                            }}>
                              {g.groupType}-P{g.phase}
                            </span>
                            <span style={{
                              background: '#f0f4fc',
                              color: '#5e6f8c',
                              borderRadius: '40px',
                              padding: '0px 5px',
                              fontSize: '8px'
                            }}>
                              {g.city}
                            </span>
                          </div>
                          <div style={{ color: '#5e6f8c', fontSize: '9px', marginTop: '1px' }}>
                            {formatDate(g.start)} → {formatDate(g.end)} · {g.rooms.length} rooms
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            padding: '1px 6px',
                            background: '#f8fafe',
                            borderRadius: '4px',
                            fontSize: '10px'
                          }}>
                            <span style={{ fontWeight: 600 }}>{count}/{totalBedsInGroup}</span>
                            <span style={{ color: '#5e6f8c' }}>guests</span>
                          </div>
                          <button
                            style={{
                              border: 'none',
                              borderRadius: '6px',
                              padding: '2px 8px',
                              fontWeight: 600,
                              fontSize: '10px',
                              cursor: 'pointer',
                              background: 'transparent',
                              border: '1px solid #d9e2ed',
                              color: '#1f2a44'
                            }}
                            onClick={() => {
                              setSelectedRoomForPeople(g.rooms[0]);
                              setSelectedGroupForPeople(g);
                              setPeopleList(getGroupPeopleForRoom(g.rooms[0], g.id));
                              setPopupPeople(true);
                            }}
                          >
                            👥
                          </button>
                          <button
                            style={{
                              border: 'none',
                              borderRadius: '6px',
                              padding: '2px 6px',
                              fontWeight: 600,
                              fontSize: '10px',
                              cursor: 'pointer',
                              background: '#fee9e7',
                              color: '#b81c1c'
                            }}
                            onClick={() => deleteGroup(g.id)}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {activeTab === 'rooms' && (
            <div>
              {rooms.map(r => {
                const occ = assignments[r.id]?.length || 0;
                const isBooked = groups.some(g => g.rooms.includes(r.id));
                return (
                  <div
                    key={r.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid #edf2f9',
                      padding: '6px 0',
                      flexWrap: 'wrap',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: isBooked ? '#e8f0fe' : '#f0f4fc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '9px',
                        color: isBooked ? '#1f4fcf' : '#5e6f8c'
                      }}>#{r.id}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '11px' }}>{r.type}</div>
                        <div style={{ color: '#5e6f8c', fontSize: '9px' }}>{r.capacity}b · {occ} guest{occ !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        style={{
                          border: 'none',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontWeight: 600,
                          fontSize: '10px',
                          cursor: 'pointer',
                          background: 'transparent',
                          border: '1px solid #d9e2ed',
                          color: '#1f2a44'
                        }}
                        onClick={() => {
                          setSelectedRoomForPeople(r.id);
                          const g = groups.find(gr => gr.rooms.includes(r.id));
                          setSelectedGroupForPeople(g);
                          setPeopleList(g ? getGroupPeopleForRoom(r.id, g.id) : []);
                          setPopupPeople(true);
                        }}
                      >
                        {occ > 0 ? '👥' : '➕'}
                      </button>
                      <button
                        style={{
                          border: 'none',
                          borderRadius: '6px',
                          padding: '2px 6px',
                          fontWeight: 600,
                          fontSize: '10px',
                          cursor: 'pointer',
                          background: '#fee9e7',
                          color: '#b81c1c'
                        }}
                        onClick={() => deleteRoom(r.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                gap: '6px',
                marginBottom: '10px'
              }}>
                {[
                  { label: 'Rooms', value: rooms.length, color: '#1f4fcf', icon: '🛏️' },
                  { label: 'Beds', value: totalBeds, color: '#7c4fd4', icon: '🛌' },
                  { label: 'Bookings', value: groups.length, color: '#cf3e5a', icon: '📅' },
                  { label: 'Guests', value: totalPeople, color: '#0d9e6e', icon: '👤' }
                ].map(stat => (
                  <div key={stat.label} style={{
                    background: '#f8fafe',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    border: '1px solid #e6edf4'
                  }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                    <div style={{ color: '#5e6f8c', fontSize: '9px', marginTop: '1px' }}>{stat.icon} {stat.label}</div>
                  </div>
                ))}
              </div>

              {groups.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: '11px', marginBottom: '6px' }}>Bookings</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {groups.map(g => (
                      <div
                        key={g.id}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: g.color + '22',
                          border: `1px solid ${g.color}44`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '10px'
                        }}
                      >
                        <span style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: g.color || '#1f4fcf'
                        }}></span>
                        <span style={{ fontWeight: 600 }}>{g.groupType}-P{g.phase}</span>
                        <span style={{ color: '#5e6f8c' }}>({getGroupPeopleCount(g.id)})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Popups - Compact versions */}
      {popupCreate && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10,20,40,0.5)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }} onClick={() => setPopupCreate(false)}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            maxWidth: 480,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #e6edf4',
            boxShadow: '0 40px 80px rgba(0,0,0,0.15)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #edf2f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontWeight: 800, fontSize: '16px' }}>📋 New Booking</span>
                <div style={{ color: '#5e6f8c', fontSize: '10px', marginTop: '1px' }}>Confirm details and add guests</div>
              </div>
              <button style={{ border: 'none', borderRadius: '6px', padding: '4px 8px', fontWeight: 600, fontSize: '11px', cursor: 'pointer', background: 'transparent', border: '1px solid #d9e2ed', color: '#1f2a44' }} onClick={() => setPopupCreate(false)}>✕</button>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                background: '#f8fafe',
                borderRadius: '8px',
                padding: '8px 12px',
                border: '1px solid #e6edf4',
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap',
                alignItems: 'center',
                fontSize: '11px'
              }}>
                {tempStart && tempEnd && (
                  <>
                    <span style={{ fontWeight: 600 }}>{formatFull(tempStart)} → {formatFull(tempEnd)}</span>
                    <span style={{ background: '#dbeafe', color: '#1f4fcf', borderRadius: '40px', padding: '1px 6px', fontSize: '9px', fontWeight: 600 }}>
                      {Math.round((dateOnly(tempEnd) - dateOnly(tempStart)) / 86400000)} nights
                    </span>
                  </>
                )}
                <span style={{ background: '#e6f7f0', color: '#0d9e6e', borderRadius: '40px', padding: '1px 6px', fontSize: '9px', fontWeight: 600 }}>
                  {selectedRoomIds.length} rooms
                </span>
              </div>

              <input
                placeholder="Booking name"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                style={{
                  border: '1.5px solid #d9e2ed',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  fontSize: '11px',
                  width: '100%',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <select
                  value={selectedGroupType}
                  onChange={e => { setSelectedGroupType(e.target.value); setSelectedPhase(1); }}
                  style={{ border: '1.5px solid #d9e2ed', borderRadius: '8px', padding: '8px 8px', fontSize: '11px', background: 'white', fontFamily: 'inherit', cursor: 'pointer', width: '100%', boxSizing: 'border-box' }}
                >
                  {['G1', 'G2', 'G3', 'G4', 'G5'].map(g => <option key={g}>{g}</option>)}
                </select>
                <input
                  type="number"
                  min="1"
                  value={selectedPhase}
                  onChange={e => setSelectedPhase(parseInt(e.target.value) || 1)}
                  style={{ border: '1.5px solid #d9e2ed', borderRadius: '8px', padding: '8px 8px', fontSize: '11px', width: '100%', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                style={{ border: '1.5px solid #d9e2ed', borderRadius: '8px', padding: '8px 8px', fontSize: '11px', background: 'white', fontFamily: 'inherit', cursor: 'pointer', width: '100%', boxSizing: 'border-box' }}
              >
                <option value="Makkah">🕋 Makkah</option>
                <option value="Madinah">🕌 Madinah</option>
              </select>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #edf2f9', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
              <button style={{ border: 'none', borderRadius: '8px', padding: '6px 14px', fontWeight: 600, fontSize: '11px', cursor: 'pointer', background: 'transparent', border: '1.5px solid #d9e2ed', color: '#1f2a44' }} onClick={() => setPopupCreate(false)}>Cancel</button>
              <button style={{ border: 'none', borderRadius: '8px', padding: '6px 18px', fontWeight: 600, fontSize: '11px', cursor: 'pointer', background: '#1f4fcf', color: 'white', boxShadow: '0 4px 12px rgba(31,79,207,0.25)' }} onClick={createGroup}>Create →</button>
            </div>
          </div>
        </div>
      )}

      {popupAddRoom && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10,20,40,0.5)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }} onClick={() => setPopupAddRoom(false)}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            maxWidth: 440,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #e6edf4',
            boxShadow: '0 40px 80px rgba(0,0,0,0.15)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #edf2f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><span style={{ fontWeight: 800, fontSize: '16px' }}>➕ Add Room</span><div style={{ color: '#5e6f8c', fontSize: '10px', marginTop: '1px' }}>Add a new room</div></div>
              <button style={{ border: 'none', borderRadius: '6px', padding: '4px 8px', fontWeight: 600, fontSize: '11px', cursor: 'pointer', background: 'transparent', border: '1px solid #d9e2ed', color: '#1f2a44' }} onClick={() => setPopupAddRoom(false)}>✕</button>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input placeholder="Room number" value={newRoomId} onChange={e => setNewRoomId(e.target.value)} style={{ border: '1.5px solid #d9e2ed', borderRadius: '8px', padding: '8px 10px', fontSize: '11px', width: '100%', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#5e6f8c', marginBottom: '4px' }}>Room Type</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  {Object.keys(ROOM_TYPES).map(t => (
                    <button key={t} style={{ border: 'none', borderRadius: '6px', padding: '6px', fontWeight: 600, fontSize: '10px', cursor: 'pointer', background: newRoomType === t ? '#1f4fcf' : '#f8fafe', color: newRoomType === t ? 'white' : '#1f2a44', border: newRoomType === t ? '2px solid #1f4fcf' : '2px solid transparent', fontFamily: 'inherit' }} onClick={() => setNewRoomType(t)}>
                      {t} <span style={{ fontSize: '8px', opacity: 0.7 }}>({ROOM_TYPES[t].capacity})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #edf2f9', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
              <button style={{ border: 'none', borderRadius: '8px', padding: '6px 14px', fontWeight: 600, fontSize: '11px', cursor: 'pointer', background: 'transparent', border: '1.5px solid #d9e2ed', color: '#1f2a44' }} onClick={() => setPopupAddRoom(false)}>Cancel</button>
              <button style={{ border: 'none', borderRadius: '8px', padding: '6px 18px', fontWeight: 600, fontSize: '11px', cursor: 'pointer', background: '#1f4fcf', color: 'white', boxShadow: '0 4px 12px rgba(31,79,207,0.25)' }} onClick={addRoom}>Add →</button>
            </div>
          </div>
        </div>
      )}

      {popupPeople && selectedRoomForPeople && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10,20,40,0.5)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }} onClick={() => setPopupPeople(false)}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            maxWidth: 520,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #e6edf4',
            boxShadow: '0 40px 80px rgba(0,0,0,0.15)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #edf2f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: '16px' }}>👤 Room {selectedRoomForPeople}</span>
                  {selectedGroupForPeople && <span style={{ background: '#dbeafe', color: '#1f4fcf', borderRadius: '40px', padding: '1px 8px', fontSize: '10px', fontWeight: 600 }}>{selectedGroupForPeople.groupType}-P{selectedGroupForPeople.phase}</span>}
                </div>
                {selectedGroupForPeople && <div style={{ color: '#5e6f8c', fontSize: '10px', marginTop: '1px' }}>{formatDate(selectedGroupForPeople.start)} → {formatDate(selectedGroupForPeople.end)}</div>}
              </div>
              <button style={{ border: 'none', borderRadius: '6px', padding: '4px 8px', fontWeight: 600, fontSize: '11px', cursor: 'pointer', background: 'transparent', border: '1px solid #d9e2ed', color: '#1f2a44' }} onClick={() => setPopupPeople(false)}>✕</button>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <input placeholder="Guest name" value={newPersonName} onChange={e => setNewPersonName(e.target.value)} style={{ flex: 1, border: '1.5px solid #d9e2ed', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', outline: 'none', minWidth: '80px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                <input placeholder="Voucher" value={newPersonVoucher} onChange={e => setNewPersonVoucher(e.target.value)} style={{ flex: 1, border: '1.5px solid #d9e2ed', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', outline: 'none', minWidth: '80px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                <button style={{ border: 'none', borderRadius: '8px', padding: '6px 14px', fontWeight: 600, fontSize: '11px', cursor: 'pointer', background: '#1f4fcf', color: 'white', boxShadow: '0 4px 12px rgba(31,79,207,0.25)', whiteSpace: 'nowrap' }} onClick={addPersonToRoom}>+ Add</button>
              </div>

              {peopleList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 10px', background: '#f8fafe', borderRadius: '8px', border: '2px dashed #d9e2ed' }}>
                  <div style={{ fontSize: '24px', marginBottom: '2px' }}>👤</div>
                  <div style={{ fontWeight: 600, color: '#0b1a33', fontSize: '11px' }}>No guests yet</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {peopleList.map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#fafcff', borderRadius: '6px', border: '1px solid #e6edf4' }}>
                      <div><div style={{ fontWeight: 600, fontSize: '11px' }}>{p.person}</div><div style={{ color: '#5e6f8c', fontSize: '9px' }}>Voucher: {p.voucher}</div></div>
                      <button style={{ border: 'none', borderRadius: '4px', padding: '1px 6px', fontWeight: 600, fontSize: '10px', cursor: 'pointer', background: '#fee9e7', color: '#b81c1c' }} onClick={() => removePerson(selectedRoomForPeople, i)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}