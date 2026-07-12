import React from 'react';
import "./turncateWithToolTip.css";

const TurncateWithToolTip = ({text, characterLimit, addressLink}) => {
  if (!text) return null;
  const isTurncated = text.length > characterLimit ;
  const displayText = isTurncated ? text.slice(0, characterLimit) + "..." : text ;


  return (
    <span className='truncate-container'> 
    <span className={isTurncated ? "turncated-text " : ""}>
      <a href={addressLink} target='_blank'>
      {displayText}
      </a>
      {isTurncated &&  <span className='tooltip-text'>{text}</span> }

    </span>
     </span>
  )

  
 
}

export default TurncateWithToolTip