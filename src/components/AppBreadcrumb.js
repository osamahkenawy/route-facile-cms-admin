import React from 'react'
import { useLocation } from 'react-router-dom'
import routes from '../routes'
const AppBreadcrumb = () => {
  const currentLocation = useLocation().pathname

  // const getRouteName = (pathname, routes) => {
  //   const currentRoute = routes.find((route) => route.path === pathname)
  //   return currentRoute ? currentRoute.name : false
  // }

  const getRouteName = (pathname, routes) => {
    const currentRoute = routes.find((route) => {
      // Check if route.path is dynamic (contains ':')
      if (route.path.includes(':')) {
        // Create a regular expression to match the dynamic route
        const routeRegex = new RegExp(`^${route.path.replace(/:\w+/g, '\\w+')}$`);
        return routeRegex.test(pathname);
      }
      // Otherwise, match exactly
      return route.path === pathname;
    });
    return currentRoute ? currentRoute.name : false;
  };

  const getBreadcrumbs = (location) => {
    const breadcrumbs = []
    location.split('/').reduce((prev, curr, index, array) => {
      const currentPathname = `${prev}/${curr}`
      const routeName = getRouteName(currentPathname, routes)
      routeName &&
        breadcrumbs.push({
          pathname: currentPathname,
          name: routeName,
          active: index + 1 === array.length ? true : false,
        })
      return currentPathname
    })
    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs(currentLocation)

  return (
    <div className="my-0">
      {breadcrumbs.map((breadcrumb, index) => {
        return (
          <h2 className='ms-3 fs-4 my-auto'
            key={index}
          >
            {breadcrumb.name}
          </h2>
        )
      })}
    </div>
  )
}

export default React.memo(AppBreadcrumb)
