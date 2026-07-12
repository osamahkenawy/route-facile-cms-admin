import PropTypes from 'prop-types'
import React from 'react'
import { CCallout, CLink } from '@coreui/react'

const DocsCallout = (props) => {
  const { content, href, name } = props

  const plural = name.slice(-1) === 's' ? true : false

  const _href = `https://coreui.io/react/docs/${href}`

  return (
  <></>
  )
}

DocsCallout.propTypes = {
  content: PropTypes.string,
  href: PropTypes.string,
  name: PropTypes.string,
}

export default React.memo(DocsCallout)
