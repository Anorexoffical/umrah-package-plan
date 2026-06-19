import React, { useState } from 'react';
import './App.css';

const DatePatternGenerator = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generatedData, setGeneratedData] = useState(null);
  const [error, setError] = useState('');

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

    // Add 2 days before start and 2 days after end to ensure complete groups
    const actualStart = addDays(start, -2);
    const actualEnd = addDays(end, 2);
    
    // Calculate total days
    const totalDays = Math.floor((actualEnd - actualStart) / (1000 * 60 * 60 * 24));
    
    // Define the two patterns
    // Odd Groups (1, 3, 5): Pattern A - 6, 7, 6
    const patternA = [
      { nights: 6, label1: 'ARRIVAL MAKKAH', label2: 'ARRIVAL MEDINA' },
      { nights: 7, label1: 'ARRIVAL MEDINA', label2: 'ARRIVAL MAKKAH' },
      { nights: 6, label1: 'ARRIVAL MAKKAH', label2: 'JED AIRPORT' }
    ];

    // Even Groups (2, 4, 6): Pattern B - 7, 6, 6
    const patternB = [
      { nights: 7, label1: 'ARRIVAL MAKKAH', label2: 'ARRIVAL MEDINA' },
      { nights: 6, label1: 'ARRIVAL MEDINA', label2: 'ARRIVAL MAKKAH' },
      { nights: 6, label1: 'ARRIVAL MAKKAH', label2: 'JED AIRPORT' }
    ];

    // Calculate total nights per group
    const nightsPerGroup = 19; // 6+7+6 or 7+6+6 = 19
    
    // Calculate how many groups we can fit
    const maxGroups = Math.floor(totalDays / nightsPerGroup);
    
    if (maxGroups === 0) {
      setError('Not enough days for even one complete group (minimum 19 days)');
      return;
    }

    const groups = [];
    let groupStartDates = [];
    let currentDate = new Date(actualStart);
    
    // Generate group start dates dynamically
    for (let groupNum = 1; groupNum <= maxGroups; groupNum++) {
      if (groupNum === 1) {
        // First group starts at the beginning
        groupStartDates.push(new Date(currentDate));
      } else if (groupNum % 2 === 1) {
        // Odd group (3, 5, 7...): starts when previous even group finishes
        const prevEvenStart = groupStartDates[groupNum - 2];
        const prevEvenEnd = addDays(prevEvenStart, 7 + 6 + 6);
        groupStartDates.push(new Date(prevEvenEnd));
        currentDate = new Date(prevEvenEnd);
      } else {
        // Even group (2, 4, 6...): starts when previous odd group is at Medina (after 6 days)
        const prevOddStart = groupStartDates[groupNum - 2];
        const prevOddMedinaStart = addDays(prevOddStart, 6);
        groupStartDates.push(new Date(prevOddMedinaStart));
        currentDate = new Date(prevOddMedinaStart);
      }
    }

    // Generate the data for each group
    for (let groupNum = 1; groupNum <= maxGroups; groupNum++) {
      const pattern = groupNum % 2 === 1 ? patternA : patternB;
      const startDateForGroup = groupStartDates[groupNum - 1];
      
      const groupData = {
        groupNumber: groupNum,
        segments: []
      };

      let segmentStart = new Date(startDateForGroup);
      
      // Generate 3 segments per group
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
    }

    // Group the data by month for display
    const months = [];
    groups.forEach((group) => {
      const firstSegmentStart = group.segments[0].startDate;
      const monthKey = firstSegmentStart.getMonth() + '-' + firstSegmentStart.getFullYear();
      const monthName = firstSegmentStart.toLocaleString('default', { month: 'long' });
      
      let monthObj = months.find(m => m.key === monthKey);
      if (!monthObj) {
        monthObj = {
          key: monthKey,
          name: monthName,
          year: firstSegmentStart.getFullYear(),
          groups: []
        };
        months.push(monthObj);
      }
      monthObj.groups.push(group);
    });

    setGeneratedData({
      groups,
      totalGroups: groups.length,
      startDate: start,
      endDate: end,
      actualStart: actualStart,
      actualEnd: actualEnd,
      totalDays: totalDays,
      months: months
    });
    setError('');
  };

  const renderPatternTable = () => {
    if (!generatedData || generatedData.groups.length === 0) {
      return null;
    }

    const { groups, months, startDate, endDate, actualStart, actualEnd } = generatedData;

    return (
      <div className="pattern-table-container">
        <div className="date-info">
          <span>📅 Selected: {formatDate(startDate)} to {formatDate(endDate)}</span>
          <span>🔄 Adjusted: {formatDate(actualStart)} to {formatDate(actualEnd)} (+2 days each side)</span>
          <span>📊 Total Groups: {groups.length}</span>
        </div>

        <h3>Generated Schedule Pattern</h3>
        <div className="table-wrapper">
          <table className="pattern-table">
            <tbody>
              {/* Month headers */}
              <tr className="month-header">
                <td></td>
                {groups.map((group) => {
                  const monthName = group.segments[0].startDate.toLocaleString('default', { month: 'long' });
                  return (
                    <td key={`month-${group.groupNumber}`} colSpan="3" className="month-label">
                      {monthName} {group.segments[0].startDate.getFullYear()}
                    </td>
                  );
                })}
              </tr>

              {/* Header row with group numbers */}
              <tr>
                <td></td>
                {groups.map((group) => (
                  <td key={`header-${group.groupNumber}`} colSpan="3" className="group-header">
                    GROUP ON {group.groupNumber}
                  </td>
                ))}
              </tr>

              {/* For each segment (0, 1, 2) */}
              {[0, 1, 2].map((segIndex) => (
                <React.Fragment key={`segment-${segIndex}`}>
                  {/* Label row */}
                  <tr className="label-row">
                    <td></td>
                    {groups.map((group) => {
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
                  {/* Data row */}
                  <tr className="data-row">
                    <td></td>
                    {groups.map((group) => {
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
        <div className="pattern-info">
          <span>Pattern: Odd Groups (1,3,5...) = 6-7-6 | Even Groups (2,4,6...) = 7-6-6</span>
          <span>Months: {months.map(m => m.name).join(', ')}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <h1>📅 Date Pattern Generator</h1>
      
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
    </div>
  );
};

export default DatePatternGenerator;