import React, { useState, useMemo } from 'react';
import { Table, Form, Spinner, InputGroup } from 'react-bootstrap';
import { LuClipboardPen } from "react-icons/lu";
import { ImBin } from "react-icons/im";
import { FaSearch, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import './GridTable.css';

/**
 * Reusable Table Component (React Bootstrap based)
 * 
 * @param {Array} columns - Array of column definitions
 * @param {Array} data - Array of data objects to display
 * @param {boolean} loading - Loading state
 * @param {Object} pagination - Pagination config { enabled: boolean, limit: number }
 * @param {boolean} search - Enable search functionality
 * @param {boolean} sort - Enable sorting
 * @param {Function} onEdit - Callback function for edit action
 * @param {Function} onDelete - Callback function for delete action
 * @param {Object} actionColumnConfig - Configuration for action column
 */
const GridTable = ({
  columns = [],
  data = [],
  loading = false,
  pagination = { enabled: true, limit: 25 },
  search = true,
  sort = true,
  onEdit = null,
  onDelete = null,
  actionColumnConfig = { showEdit: true, showDelete: false },
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [pageSize, setPageSize] = useState(pagination.limit || 25);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim() || !data) return data || [];
    
    return data.filter(row => {
      return columns.some(col => {
        const key = typeof col === 'string' ? col : (col.name || col.key || '');
        const value = row[key];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sort) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (sortConfig.direction === 'asc') {
        return aStr.localeCompare(bStr);
      }
      return bStr.localeCompare(aStr);
    });
  }, [filteredData, sortConfig, sort]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination.enabled) return sortedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, pagination.enabled]);

  const totalPages = useMemo(() => {
    if (!pagination.enabled) return 1;
    return Math.ceil(sortedData.length / pageSize);
  }, [sortedData.length, pageSize, pagination.enabled]);

  // Handle sort
  const handleSort = (key) => {
    if (!sort) return;
    
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Get sort icon
  const getSortIcon = (key) => {
    if (!sort) return null;
    if (sortConfig.key !== key) return <FaSort className="ms-1 text-muted" />;
    return sortConfig.direction === 'asc' 
      ? <FaSortUp className="ms-1 text-primary" />
      : <FaSortDown className="ms-1 text-primary" />;
  };

  // Render cell value
  const renderCell = (row, col) => {
    if (typeof col === 'string') {
      return row[col] ?? '';
    }
    
    if (col.formatter) {
      const key = col.name || col.key || '';
      const cellValue = row[key];
      const formatted = col.formatter(cellValue, row);
      
      // If formatter returns a React element, return it directly (React will handle it)
      if (React.isValidElement(formatted)) {
        return formatted;
      }
      
      // Otherwise return the formatted value as-is
      return formatted;
    }
    
    const key = col.name || col.key || '';
    const value = row[key];
    
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return value;
  };

  // Get column header
  const getColumnHeader = (col) => {
    if (typeof col === 'string') return col;
    return col.label || col.name || '';
  };

  // Get column key for sorting
  const getColumnKey = (col) => {
    if (typeof col === 'string') return col;
    return col.name || col.key || '';
  };

  // Show loading state
  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  // Show empty state
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-5">
        <p className="text-muted">No Data Found.</p>
      </div>
    );
  }

  return (
    <div className="grid-table-container py-3">
      {/* Search and Page Size Controls */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        {search && (
          <InputGroup style={{ maxWidth: '300px' }}>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </InputGroup>
        )}
        
        {pagination.enabled && (
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">Show</span>
            <Form.Select
              size="sm"
              style={{ width: 'auto' }}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </Form.Select>
            <span className="text-muted small">entries</span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="table-responsive">
        <Table striped bordered hover className="grid-table">
          <thead className="table-light">
            <tr>
              {columns.map((col, index) => (
                <th 
                  key={index}
                  onClick={() => handleSort(getColumnKey(col))}
                  style={{ cursor: sort ? 'pointer' : 'default', width: col.width }}
                  className="user-select-none"
                >
                  {getColumnHeader(col)}
                  {getSortIcon(getColumnKey(col))}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th style={{ width: '120px' }}>Action</th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="text-center">
                  No matching records found.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr key={row.id || rowIndex}>
                  {columns.map((col, colIndex) => {
                    const cellContent = renderCell(row, col);
                    return (
                      <td key={colIndex} style={{ verticalAlign: 'middle' }}>
                        {cellContent}
                      </td>
                    );
                  })}
                  {(onEdit || onDelete) && (
                    <td>
                      <div className="d-flex gap-2 align-items-center">
                        {actionColumnConfig.showEdit && onEdit && (
                          <LuClipboardPen
                            onClick={() => onEdit(row)}
                            style={{
                              cursor: 'pointer',
                              height: '1.5em',
                              width: '1.5em',
                              stroke: 'orange',
                            }}
                            title="Edit"
                          />
                        )}
                        {actionColumnConfig.showDelete && onDelete && (
                          <ImBin
                            onClick={() => onDelete(row)}
                            style={{
                              cursor: 'pointer',
                              height: '1.5em',
                              width: '1.5em',
                              fill: '#ff6b6b',
                            }}
                            title="Delete"
                          />
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.enabled && totalPages > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
          <div className="text-muted small">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
            {searchTerm && ` (filtered from ${data.length} total entries)`}
          </div>
          
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </button>
              </li>
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
              </li>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  </li>
                );
              })}
              
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </li>
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
};

export default GridTable;
