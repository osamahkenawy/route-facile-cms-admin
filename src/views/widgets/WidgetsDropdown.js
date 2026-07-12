import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import '../dashboard/dashboard.css'
import { CWidgetStatsA } from '@coreui/react'
import { getStyle } from '@coreui/utils'
import { CChartBar, CChartLine } from '@coreui/react-chartjs'
import CIcon from '@coreui/icons-react'
import { cilArrowBottom, cilArrowTop, cilOptions } from '@coreui/icons'
import { Row, Col, Card } from 'react-bootstrap'

const WidgetsDropdown = (props) => {
  const widgetChartRef1 = useRef(null)
  const widgetChartRef2 = useRef(null)

  useEffect(() => {
    document.documentElement.addEventListener('ColorSchemeChange', () => {
      if (widgetChartRef1.current) {
        setTimeout(() => {
          widgetChartRef1.current.data.datasets[0].pointBackgroundColor = getStyle('--cui-primary')
          widgetChartRef1.current.update()
        })
      }

      if (widgetChartRef2.current) {
        setTimeout(() => {
          widgetChartRef2.current.data.datasets[0].pointBackgroundColor = getStyle('--cui-info')
          widgetChartRef2.current.update()
        })
      }
    })
  }, [widgetChartRef1, widgetChartRef2])

  return (
    <Row className={props.className} xs={{ gutter: 4 }} style={{backgroundColor:"#fff"}}>
      <Col sm={6} xl={4} xxl={3} className="my-2 my-lg-4">
        <Card
          className="green-color py-3"
          style={{
            backgroundImage:
              'url(' +
              'https://images.pexels.com/photos/315938/pexels-photo-315938.jpeg?auto=compress&cs=tinysrgb&w=1260&h=700&dpr=1' +
              ')',
              objectFit:"fill",
          }}
        >
          <h5 className="fs-2 text-center mb-0">17</h5>
          <p className="fs-4 text-center">Cars</p>
        </Card>
      </Col>
      <Col sm={6} xl={4} xxl={3} className="my-2 my-lg-4">
        <Card
          className="green-color py-3"
          style={{
            backgroundImage:
              'url(' +
              'https://images.pexels.com/photos/34153/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=600' +
              ')',
            
          }}
        >
          <h5 className="fs-2 text-center mb-0">601</h5>
          <p className="fs-4 text-center">All Bookings</p>
        </Card>
      </Col>
      <Col sm={6} xl={4} xxl={3} className="my-2 my-lg-4">
        <Card
          className="green-color py-3"
          style={{
            backgroundImage:
              'url(' +
              'https://images.pexels.com/photos/834897/pexels-photo-834897.jpeg?auto=compress&cs=tinysrgb&w=1260&h=250&dpr=1' +
              ')',
            
          }}
        >
          <h5 className="fs-2 text-center mb-0">0</h5>
          <p className="fs-4 text-center">Upcoming Bookings</p>
        </Card>
      </Col>
      <Col sm={6} xl={4} xxl={3} className="my-2 my-lg-4">
        <Card className="green-color py-3">
          <h5 className="fs-2 text-center mb-0">0</h5>
          <p className="fs-4 text-center">Current Bookings</p>
        </Card>
      </Col>
      <Col sm={6} xl={4} xxl={3} className="my-2 my-lg-4">
        <Card className="green-color py-3">
          <h5 className="fs-2 text-center mb-0">558</h5>
          <p className="fs-4 text-center">Past Bookings</p>
        </Card>
      </Col>
      <Col sm={6} xl={4} xxl={3} className="my-2 my-lg-4">
        <Card className="green-color py-3">
          <h5 className="fs-2 text-center mb-0">43</h5>
          <p className="fs-4 text-center">Cancelled Bookings</p>
        </Card>
      </Col>
    </Row>
  )
}

WidgetsDropdown.propTypes = {
  className: PropTypes.string,
  withCharts: PropTypes.bool,
}

export default WidgetsDropdown
