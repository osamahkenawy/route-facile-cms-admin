import React, { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
 
  useColorModes,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilBell,
  cilContrast,
  cilEnvelopeOpen,
  cilList,
  cilMenu,
  cilMoon,
  cilSun,
} from '@coreui/icons'

import { AppHeaderDropdown } from './header/index'
import HeaderInbox from './header/HeaderInbox'
import { TfiAngleDoubleLeft } from "react-icons/tfi";
import { TfiAngleDoubleRight } from "react-icons/tfi";
import { Button, Container, Dropdown, Nav, Navbar } from 'react-bootstrap'

const AppHeader = () => {
  const headerRef = useRef()
  const { colorMode, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')

  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.sidebarShow)

  useEffect(() => {
    document.addEventListener('scroll', () => {
      headerRef.current &&
        headerRef.current.classList.toggle('shadow-sm', document.documentElement.scrollTop > 0)
    })
  }, [])

  return (
    <Navbar
    bg="light"
    variant="light"
    fixed="top"
    className="p-0 border-bottom bg-white header-navbar"
    style={{height:"65px", zIndex: 1030}}
    ref={headerRef}
  >
    <Container fluid className="d-flex align-items-center">
        <Button
          className="border-0 bg-transparent text-dark"
        onClick={() => dispatch({ type: 'set', sidebarShow: !sidebarShow })}
        style={{ marginInlineStart: '-14px' }}
      >
        {sidebarShow ? <TfiAngleDoubleLeft /> : <TfiAngleDoubleRight />}
      </Button>

      {/* Spacer to push items to the right */}
      <div className="me-auto"></div>

      {/* Notifications + Inbox */}
      <HeaderInbox />

        <div className='header-admin-dropdown'>
      <AppHeaderDropdown />
      </div>
    </Container>
  </Navbar>
  )
}

export default AppHeader
