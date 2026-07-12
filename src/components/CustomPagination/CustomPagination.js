import React, { useState, useEffect } from "react";
import Pagination from "react-bootstrap/Pagination";
// import "bootstrap/dist/css/bootstrap.min.css";
import "./CustomPagination.css"

const CustomPagination = ({
  totalRecords,
  recordsPerPage,
  onPageChange,
  currentPage,
}) => {
  // const [currentPage, setCurrentPage] = useState(1); // Default active page
  const [totalPages, setTotalPages] = useState(
    Math.ceil(totalRecords / recordsPerPage)
  );

  useEffect(() => {
    setTotalPages(Math.ceil(totalRecords / recordsPerPage));
  }, [totalRecords, recordsPerPage]);

  

  const handlePageClick = (pageNumber) => {
    if (onPageChange) {
      onPageChange(pageNumber); // Call the callback function with the new page number
    }
  };

  const renderPageItems = () => {
    let items = [];
   


    if (totalPages <= 10) {
      // Render all pages if totalPages is 10 or less
      for (let number = 1; number <= totalPages; number++) {
        items.push(
          <Pagination.Item
            key={number}
            className="mx-2-"
            active={currentPage === number}
            onClick={() => handlePageClick(number)}
          >
            {number}
          </Pagination.Item>
        );
      }
    } else {
      // Handle the case where totalPages > 10
      const startPage = Math.max(2, currentPage - 2);
      const endPage = Math.min(totalPages - 1, currentPage + 2);

      // Always show the first page
      items.push(
        <Pagination.Item
          key={1}
          className="mx-2-"
          active={currentPage === 1}
          onClick={() => handlePageClick(1)}
        >
          1
        </Pagination.Item>
      );

      // Show ellipsis if the current page range doesn't start with the second page
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="start-ellipsis" />);
      }

      // Show middle pages
      for (let number = startPage; number <= endPage; number++) {
        items.push(
          <Pagination.Item
            key={number}
            className="mx-2-"
            active={currentPage === number}
            onClick={() => handlePageClick(number)}
          >
            {number}
          </Pagination.Item>
        );
      }

      // Show ellipsis if the current page range doesn't end with the last page
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="end-ellipsis" />);
      }

      // Always show the last page
      items.push(
        <Pagination.Item
          key={totalPages}
          className="mx-2-"
          active={currentPage === totalPages}
          onClick={() => handlePageClick(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }

    return items;
  
  };

  return (
    <div className="d-flex justify-content-start">
      <Pagination className="pagination">
        <Pagination.Prev
          className="mx-2-"
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Pagination.Prev>
        {renderPageItems()}
        <Pagination.Next
          className="mx-2-"
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Pagination.Next>
      </Pagination>
    </div>
  );
};

export default CustomPagination;
