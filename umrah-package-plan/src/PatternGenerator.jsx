// components/PatternGenerator.jsx
import React, { useState } from 'react';

export default function PatternGenerator() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generatedData, setGeneratedData] = useState(null);
  const [error, setError] = useState('');

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
      <div className="card">
        <div className="card-title">📊 Generated Schedule Pattern</div>
        <div className="text-sm mb-8">
          📅 Selected: {formatDate(startDate)} to {formatDate(endDate)} | Total Groups: {totalGroups}
        </div>

        <div className="table-wrap">
          {groupRows.map((rowGroups, rowIndex) => (
            <div key={rowIndex} style={{ marginBottom: '24px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Row {rowIndex + 1}</div>
              <table>
                <tbody>
                  <tr>
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
                        GROUP {group.groupNumber}
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
          ))}
        </div>

        <div className="pattern-info">
          <span>Pattern: Odd Groups (1,3,5...) = 6-7-6 | Even Groups (2,4,6...) = 7-6-6</span>
          <span style={{ marginLeft: '16px' }}>Total Groups: {groups.length}</span>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">📅 Date Pattern Generator</div>
        <div className="flex">
          <div style={{ flex: 1 }}>
            <label className="text-sm" style={{ display: 'block', marginBottom: '4px' }}>Start Date:</label>
            <input
              type="date"
              className="input-field"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="text-sm" style={{ display: 'block', marginBottom: '4px' }}>End Date:</label>
            <input
              type="date"
              className="input-field"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <button className="btn mt-8" onClick={generatePattern}>Generate Pattern</button>
      </div>

      {error && <div className="error">{error}</div>}
      {generatedData && renderPatternTable()}
    </div>
  );
}